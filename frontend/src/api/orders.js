import api from './client'

export function fetchOrders() {
  return api.get('/store/orders/').then((res) => res.data)
}

export function fetchOrder(orderId) {
  return api.get(`/store/orders/${orderId}/`).then((res) => res.data)
}

export function makePayment(orderId) {
  return api.post(`/store/orders/${orderId}/makepayment/`).then((res) => res.data)
}

export function verifyPayment(orderId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  return api
    .post(`/store/orders/${orderId}/verify-payment/`, { razorpay_order_id, razorpay_payment_id, razorpay_signature })
    .then((res) => res.data)
}
