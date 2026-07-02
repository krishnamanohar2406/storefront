import api from './client'

export function fetchAddresses() {
  return api.get('/store/addresses/').then((res) => res.data)
}

export function createAddress({ street, city, state, country }) {
  return api.post('/store/addresses/', { street, city, state, country }).then((res) => res.data)
}

export function deleteAddress(id) {
  return api.delete(`/store/addresses/${id}/`)
}
