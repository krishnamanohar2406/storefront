import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOrders } from '../api/orders'
import Loader from '../components/Loader'
import './OrdersPage.css'

const STATUS_LABEL = { P: 'Pending payment', C: 'Paid', F: 'Payment failed' }
const STATUS_CLASS = { P: 'badge-pending', C: 'badge-complete', F: 'badge-failed' }

function orderTotal(order) {
  return order.items.reduce((sum, item) => sum + Number(item.total_price), 0)
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
      .then((data) => setOrders(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />

  return (
    <div className="page container orders-page">
      <h1>Your orders</h1>

      {orders.length === 0 && (
        <div className="center-state">
          <h2>No orders yet</h2>
          <p>Once you place an order, it'll show up here.</p>
          <Link to="/products" className="btn btn-accent">
            Start shopping
          </Link>
        </div>
      )}

      <ul className="orders-list">
        {orders.map((order) => (
          <li key={order.id}>
            <Link to={`/orders/${order.id}`} className="order-row">
              <div>
                <span className="order-id">Order #{order.id.slice(0, 8)}</span>
                <span className="order-date">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <span className="order-items-count">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
              <span className="order-total">₹{orderTotal(order).toLocaleString('en-IN')}</span>
              <span className={`badge ${STATUS_CLASS[order.payment_status]}`}>{STATUS_LABEL[order.payment_status]}</span>
              {order.delivered && <span className="badge badge-complete">Delivered</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
