import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchOrder, makePayment, verifyPayment } from '../api/orders'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import './OrderDetailPage.css'

const STATUS_LABEL = { P: 'Pending payment', C: 'Paid', F: 'Payment failed' }
const STATUS_CLASS = { P: 'badge-pending', C: 'badge-complete', F: 'badge-failed' }

export default function OrderDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  function loadOrder() {
    return fetchOrder(id).then(setOrder)
  }

  useEffect(() => {
    loadOrder().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handlePayNow() {
    if (!window.Razorpay) {
      setError('Payments could not load. Please check your connection and refresh the page.')
      return
    }
    setError('')
    setPaying(true)
    try {
      const payment = await makePayment(order.id)
      const razorpay = new window.Razorpay({
        key: payment.razorpay_key_id,
        order_id: payment.razorpay_order_id,
        amount: payment.amount,
        currency: payment.currency,
        name: 'Maison Rosé',
        description: `Order #${order.id.slice(0, 8)}`,
        prefill: { name: [user?.first_name, user?.last_name].filter(Boolean).join(' '), email: user?.email },
        theme: { color: '#c81e5c' },
        handler: async (response) => {
          try {
            await verifyPayment(order.id, response)
            await loadOrder()
          } catch {
            setError('Payment succeeded but we could not confirm it yet. Refresh in a moment.')
          } finally {
            setPaying(false)
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      })
      razorpay.open()
    } catch {
      setError('Could not start payment. Please try again.')
      setPaying(false)
    }
  }

  if (loading) return <Loader />
  if (!order) return <div className="center-state"><h2>Order not found</h2></div>

  const total = order.items.reduce((sum, item) => sum + Number(item.total_price), 0)

  return (
    <div className="page container order-detail-page">
      <div className="order-detail-header">
        <div>
          <span className="eyebrow">Order #{order.id.slice(0, 8)}</span>
          <h1>
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </h1>
        </div>
        <div className="order-detail-badges">
          <span className={`badge ${STATUS_CLASS[order.payment_status]}`}>{STATUS_LABEL[order.payment_status]}</span>
          <span className={`badge ${order.delivered ? 'badge-complete' : 'badge-pending'}`}>
            {order.delivered ? 'Delivered' : 'Not yet delivered'}
          </span>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      {order.payment_status !== 'C' && (
        <div className="order-pay-banner">
          <p>This order hasn't been paid for yet.</p>
          <button className="btn btn-accent btn-sm" onClick={handlePayNow} disabled={paying}>
            {paying ? 'Opening payment…' : 'Pay now'}
          </button>
        </div>
      )}

      <div className="order-detail-layout">
        <ul className="order-detail-items">
          {order.items.map((item) => (
            <li key={item.id}>
              <span>
                {item.product.title} &times; {item.quantity}
              </span>
              <span>₹{Number(item.total_price).toLocaleString('en-IN')}</span>
            </li>
          ))}
        </ul>

        <div className="order-detail-side">
          <div className="cart-summary-row cart-summary-total">
            <span>Total</span>
            <span>₹{total.toLocaleString('en-IN')}</span>
          </div>

          {order.shipping_address && (
            <div className="order-address">
              <h4>Shipping to</h4>
              <p>
                {order.shipping_address.street}, {order.shipping_address.city}, {order.shipping_address.state},{' '}
                {order.shipping_address.country}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
