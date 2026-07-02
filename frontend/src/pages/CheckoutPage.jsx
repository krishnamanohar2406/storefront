import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { createAddress, fetchAddresses } from '../api/addresses'
import { checkout as checkoutCart } from '../api/cart'
import { makePayment, verifyPayment } from '../api/orders'
import Loader from '../components/Loader'
import './CheckoutPage.css'

const emptyAddress = { street: '', city: '', state: '', country: 'India' }

export default function CheckoutPage() {
  const { cart, loading: cartLoading, clearCartAfterCheckout } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAddress, setNewAddress] = useState(emptyAddress)
  const [addressLoading, setAddressLoading] = useState(true)
  const [error, setError] = useState('')
  const [stage, setStage] = useState('idle') // idle | placing | paying | verifying | done

  useEffect(() => {
    fetchAddresses()
      .then((data) => {
        setAddresses(data)
        if (data.length > 0) setSelectedAddressId(data[0].id)
        else setShowAddForm(true)
      })
      .finally(() => setAddressLoading(false))
  }, [])

  useEffect(() => {
    if (!cartLoading && (!cart || cart.items.length === 0) && stage === 'idle') {
      navigate('/cart', { replace: true })
    }
  }, [cart, cartLoading, stage, navigate])

  async function handleAddAddress(e) {
    e.preventDefault()
    setError('')
    try {
      const created = await createAddress(newAddress)
      setAddresses((prev) => [created, ...prev])
      setSelectedAddressId(created.id)
      setShowAddForm(false)
      setNewAddress(emptyAddress)
    } catch {
      setError('Could not save that address. Please check the fields and try again.')
    }
  }

  async function handlePlaceOrder() {
    if (!selectedAddressId) {
      setError('Please select or add a delivery address first.')
      return
    }
    if (!window.Razorpay) {
      setError('Payments could not load. Please check your connection and refresh the page.')
      return
    }

    setError('')
    setStage('placing')
    try {
      const order = await checkoutCart(cart.id, selectedAddressId)
      clearCartAfterCheckout()

      setStage('paying')
      const payment = await makePayment(order.id)

      const razorpay = new window.Razorpay({
        key: payment.razorpay_key_id,
        order_id: payment.razorpay_order_id,
        amount: payment.amount,
        currency: payment.currency,
        name: 'Maison Rosé',
        description: `Order #${order.id.slice(0, 8)}`,
        prefill: {
          name: [user?.first_name, user?.last_name].filter(Boolean).join(' '),
          email: user?.email,
        },
        theme: { color: '#c81e5c' },
        handler: async (response) => {
          setStage('verifying')
          try {
            await verifyPayment(order.id, response)
            setStage('done')
            navigate(`/orders/${order.id}`, { replace: true })
          } catch {
            setError('Payment succeeded but we could not confirm it. Check your order status, or contact support.')
            setStage('idle')
          }
        },
        modal: {
          ondismiss: () => {
            setStage('idle')
            setError('Payment was cancelled. You can try paying again from your orders page.')
            navigate(`/orders/${order.id}`)
          },
        },
      })
      razorpay.open()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not start checkout. Please try again.')
      setStage('idle')
    }
  }

  if (cartLoading || addressLoading) return <Loader />
  if (!cart) return null

  return (
    <div className="page container checkout-page">
      <h1>Checkout</h1>

      <div className="checkout-layout">
        <div className="checkout-main">
          <section className="checkout-section">
            <h3>Deliver to</h3>

            {addresses.length > 0 && !showAddForm && (
              <div className="address-list">
                {addresses.map((a) => (
                  <label key={a.id} className={`address-option ${selectedAddressId === a.id ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === a.id}
                      onChange={() => setSelectedAddressId(a.id)}
                    />
                    <span>
                      {a.street}, {a.city}, {a.state}, {a.country}
                    </span>
                  </label>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddForm(true)}>
                  + Add a new address
                </button>
              </div>
            )}

            {showAddForm && (
              <form className="address-form" onSubmit={handleAddAddress}>
                <div className="field">
                  <label htmlFor="street">Street address</label>
                  <input
                    id="street"
                    required
                    value={newAddress.street}
                    onChange={(e) => setNewAddress((a) => ({ ...a, street: e.target.value }))}
                  />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="city">City</label>
                    <input
                      id="city"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="state">State</label>
                    <input
                      id="state"
                      required
                      value={newAddress.state}
                      onChange={(e) => setNewAddress((a) => ({ ...a, state: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="country">Country</label>
                  <input
                    id="country"
                    required
                    value={newAddress.country}
                    onChange={(e) => setNewAddress((a) => ({ ...a, country: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Save address
                  </button>
                  {addresses.length > 0 && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </section>

          <section className="checkout-section">
            <h3>Payment</h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
              Cards, UPI and netbanking via Razorpay. You'll get a secure payment window after placing your order.
            </p>
          </section>
        </div>

        <aside className="cart-summary checkout-summary">
          <h3>Order summary</h3>
          <ul className="checkout-items">
            {cart.items.map((item) => (
              <li key={item.id}>
                <span>
                  {item.product.title} &times; {item.quantity}
                </span>
                <span>₹{Number(item.total_price).toLocaleString('en-IN')}</span>
              </li>
            ))}
          </ul>
          <div className="cart-summary-row cart-summary-total">
            <span>Total</span>
            <span>₹{Number(cart.total_bill).toLocaleString('en-IN')}</span>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            className="btn btn-accent btn-block"
            onClick={handlePlaceOrder}
            disabled={stage !== 'idle' || !selectedAddressId}
          >
            {stage === 'idle' && 'Place order & pay'}
            {stage === 'placing' && 'Placing order…'}
            {stage === 'paying' && 'Opening payment…'}
            {stage === 'verifying' && 'Confirming payment…'}
            {stage === 'done' && 'Done ✓'}
          </button>
        </aside>
      </div>
    </div>
  )
}
