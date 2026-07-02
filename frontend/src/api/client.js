import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const ACCESS_TOKEN_KEY = 'mr_access_token'
export const REFRESH_TOKEN_KEY = 'mr_refresh_token'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

const api = axios.create({
  baseURL: API_BASE_URL,
})

// Attach the JWT to every outgoing request, if we have one.
// Note: this backend's SIMPLE_JWT AUTH_HEADER_TYPES is ('JWT',), so the
// header must be "JWT <token>", not the more common "Bearer <token>".
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `JWT ${token}`
  }
  return config
})

let refreshPromise = null

async function refreshAccessToken() {
  const refresh = getRefreshToken()
  if (!refresh) throw new Error('No refresh token available')

  // De-dupe concurrent refresh attempts (several requests can 401 at once).
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/jwt/refresh/`, { refresh })
      .then((res) => {
        setTokens({ access: res.data.access })
        return res.data.access
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/jwt/')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint && getRefreshToken()) {
      originalRequest._retry = true
      try {
        const newAccess = await refreshAccessToken()
        originalRequest.headers.Authorization = `JWT ${newAccess}`
        return api(originalRequest)
      } catch (refreshError) {
        clearTokens()
        window.dispatchEvent(new Event('mr-session-expired'))
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
