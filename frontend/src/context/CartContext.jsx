import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as cartApi from '../api/cart'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)
const CART_ID_KEY = 'mr_cart_id'

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)

  // Whenever auth state flips (login/logout), reconcile the cart we're holding.
  useEffect(() => {
    if (!isAuthenticated) {
      setCart(null)
      return
    }
    const storedId = localStorage.getItem(CART_ID_KEY)
    if (!storedId) return
    setLoading(true)
    cartApi
      .fetchCart(storedId)
      .then(setCart)
      .catch(() => {
        // Cart was checked out, expired, or never belonged to this customer
        localStorage.removeItem(CART_ID_KEY)
        setCart(null)
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  const ensureCart = useCallback(async () => {
    const storedId = localStorage.getItem(CART_ID_KEY)
    if (storedId) {
      try {
        const existing = await cartApi.fetchCart(storedId)
        setCart(existing)
        return existing
      } catch {
        localStorage.removeItem(CART_ID_KEY)
      }
    }
    const created = await cartApi.createCart()
    localStorage.setItem(CART_ID_KEY, created.id)
    setCart(created)
    return created
  }, [])

  const addItem = useCallback(
    async (productId, quantity = 1) => {
      setLoading(true)
      try {
        const current = await ensureCart()
        await cartApi.addCartItem(current.id, { product_id: productId, quantity })
        const refreshed = await cartApi.fetchCart(current.id)
        setCart(refreshed)
        return refreshed
      } finally {
        setLoading(false)
      }
    },
    [ensureCart]
  )

  const updateItemQuantity = useCallback(
    async (itemId, quantity) => {
      if (!cart) return
      setLoading(true)
      try {
        await cartApi.updateCartItemQuantity(cart.id, itemId, quantity)
        const refreshed = await cartApi.fetchCart(cart.id)
        setCart(refreshed)
      } finally {
        setLoading(false)
      }
    },
    [cart]
  )

  const removeItem = useCallback(
    async (itemId) => {
      if (!cart) return
      setLoading(true)
      try {
        await cartApi.removeCartItem(cart.id, itemId)
        const refreshed = await cartApi.fetchCart(cart.id)
        setCart(refreshed)
      } finally {
        setLoading(false)
      }
    },
    [cart]
  )

  // Call this right after a successful checkout - the backend deletes the
  // cart as part of placing the order, so there's nothing left to fetch.
  const clearCartAfterCheckout = useCallback(() => {
    localStorage.removeItem(CART_ID_KEY)
    setCart(null)
  }, [])

  const itemCount = useMemo(
    () => (cart?.items ?? []).reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  )

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        ensureCart,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCartAfterCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
