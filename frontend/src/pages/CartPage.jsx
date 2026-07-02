import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import PriceTag from '../components/PriceTag'
import Loader from '../components/Loader'
import './CartPage.css'

export default function CartPage() {
  const { isAuthenticated } = useAuth()
  const { cart, loading, updateItemQuantity, removeItem } = useCart()
  const navigate = useNavigate()

  const items = cart?.items ?? []

  if (!isAuthenticated) {
    return (
      <div className="page container cart-page">
        <h1>Your bag</h1>
        <div className="center-state">
          <h2>Log in to see your bag</h2>
          <p>Your bag is tied to your account, so we can save it between visits.</p>
          <Link to="/login" state={{ from: '/cart' }} className="btn btn-accent">
            Log in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page container cart-page">
      <h1>Your bag</h1>

      {loading && items.length === 0 && <Loader />}

      {!loading && items.length === 0 && (
        <div className="center-state">
          <h2>Your bag is empty</h2>
          <p>Find something you love and it'll show up here.</p>
          <Link to="/products" className="btn btn-accent">
            Start shopping
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="cart-layout">
          <ul className="cart-list">
            {items.map((item) => (
              <li key={item.id} className="cart-item">
                <div className="cart-item-thumb">{item.product.title?.[0]}</div>
                <div className="cart-item-info">
                  <Link to={`/products/${item.product.id}`} className="cart-item-title">
                    {item.product.title}
                  </Link>
                  <PriceTag price={item.product.unit_price} />
                </div>
                <div className="quantity-stepper">
                  <button
                    onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                    aria-label="Decrease quantity"
                    disabled={item.quantity <= 1}
                  >
                    &minus;
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <span className="cart-item-total">₹{Number(item.total_price).toLocaleString('en-IN')}</span>
                <button className="cart-item-remove" onClick={() => removeItem(item.id)} aria-label="Remove item">
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <aside className="cart-summary">
            <h3>Order summary</h3>
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>₹{Number(cart.total_bill).toLocaleString('en-IN')}</span>
            </div>
            <div className="cart-summary-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="cart-summary-row cart-summary-total">
              <span>Total</span>
              <span>₹{Number(cart.total_bill).toLocaleString('en-IN')}</span>
            </div>
            <button className="btn btn-accent btn-block" onClick={() => navigate('/checkout')}>
              Proceed to checkout
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}
