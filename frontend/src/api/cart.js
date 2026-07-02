import api from './client'

export function createCart() {
  return api.post('/store/carts/', {}).then((res) => res.data)
}

export function fetchCart(cartId) {
  return api.get(`/store/carts/${cartId}/`).then((res) => res.data)
}

export function addCartItem(cartId, { product_id, quantity }) {
  return api.post(`/store/carts/${cartId}/items/`, { product_id, quantity }).then((res) => res.data)
}

export function updateCartItemQuantity(cartId, itemId, quantity) {
  return api.patch(`/store/carts/${cartId}/items/${itemId}/`, { quantity }).then((res) => res.data)
}

export function removeCartItem(cartId, itemId) {
  return api.delete(`/store/carts/${cartId}/items/${itemId}/`)
}

export function checkout(cartId, addressId) {
  return api.post(`/store/carts/${cartId}/checkout/`, { address_id: addressId }).then((res) => res.data)
}
