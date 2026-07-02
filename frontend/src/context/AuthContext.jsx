import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as authApi from '../api/auth'
import { clearTokens, getAccessToken, setTokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadCurrentUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null)
      setCustomer(null)
      setLoading(false)
      return
    }
    try {
      const [userData, customerData] = await Promise.all([
        authApi.fetchCurrentUser(),
        authApi.fetchCustomerProfile(),
      ])
      setUser(userData)
      setCustomer(customerData)
    } catch {
      clearTokens()
      setUser(null)
      setCustomer(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCurrentUser()
    const onExpire = () => {
      setUser(null)
      setCustomer(null)
    }
    window.addEventListener('mr-session-expired', onExpire)
    return () => window.removeEventListener('mr-session-expired', onExpire)
  }, [loadCurrentUser])

  const login = useCallback(
    async (username, password) => {
      const tokens = await authApi.login({ username, password })
      setTokens(tokens)
      await loadCurrentUser()
    },
    [loadCurrentUser]
  )

  const register = useCallback(
    async (payload) => {
      await authApi.register(payload)
      await login(payload.username, payload.password)
    },
    [login]
  )

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    setCustomer(null)
  }, [])

  const refreshCustomer = useCallback(async () => {
    const customerData = await authApi.fetchCustomerProfile()
    setCustomer(customerData)
    return customerData
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        customer,
        isAuthenticated: Boolean(user),
        loading,
        login,
        register,
        logout,
        refreshCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
