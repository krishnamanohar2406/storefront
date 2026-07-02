import api from './client'

export function fetchCollections() {
  return api.get('/store/collections/').then((res) => res.data)
}

export function fetchProducts({ search, collection_id, ordering, page, unit_price__lt, unit_price__gt } = {}) {
  const params = {}
  if (search) params.search = search
  if (collection_id) params.collection_id = collection_id
  if (ordering) params.ordering = ordering
  if (page) params.page = page
  if (unit_price__lt) params.unit_price__lt = unit_price__lt
  if (unit_price__gt) params.unit_price__gt = unit_price__gt
  return api.get('/store/products/', { params }).then((res) => res.data)
}

export function fetchProduct(id) {
  return api.get(`/store/products/${id}/`).then((res) => res.data)
}

export function fetchReviews(productId) {
  return api.get(`/store/products/${productId}/reviews/`).then((res) => res.data)
}

export function createReview(productId, { rating, description }) {
  return api.post(`/store/products/${productId}/reviews/`, { rating, description }).then((res) => res.data)
}
