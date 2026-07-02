import api from './client'

export function register({ username, email, first_name, last_name, password }) {
  return api.post('/auth/users/', { username, email, first_name, last_name, password })
}

export async function login({ username, password }) {
  const { data } = await api.post('/auth/jwt/create/', { username, password })
  return data // { access, refresh }
}

export function fetchCurrentUser() {
  return api.get('/auth/users/me/').then((res) => res.data)
}

export function fetchCustomerProfile() {
  return api.get('/store/customers/me/').then((res) => res.data)
}

export function updateCustomerProfile(payload) {
  return api.put('/store/customers/me/', payload).then((res) => res.data)
}
