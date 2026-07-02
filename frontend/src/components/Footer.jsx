import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-trust container">
        <div className="footer-trust-item">
          <span className="footer-trust-icon">↺</span>
          <div>
            <strong>Easy 7-day returns</strong>
            <p>Change of mind? We've got you.</p>
          </div>
        </div>
        <div className="footer-trust-item">
          <span className="footer-trust-icon">⛁</span>
          <div>
            <strong>Secure payments</strong>
            <p>Cards, UPI &amp; netbanking via Razorpay.</p>
          </div>
        </div>
        <div className="footer-trust-item">
          <span className="footer-trust-icon">✦</span>
          <div>
            <strong>Curated edit</strong>
            <p>Independent brands, hand-picked weekly.</p>
          </div>
        </div>
      </div>

      <div className="footer-main container">
        <div className="footer-col footer-brand">
          <span className="nav-logo footer-logo">Maison Ros&eacute;</span>
          <p>An edited fashion storefront for the way you actually shop.</p>
        </div>
        <div className="footer-col">
          <h4>Shop</h4>
          <Link to="/collections?gender=female">Women</Link>
          <Link to="/collections?gender=male">Men</Link>
          <Link to="/collections?gender=kids">Kids</Link>
          <Link to="/products">All Products</Link>
        </div>
        <div className="footer-col">
          <h4>Account</h4>
          <Link to="/account">My Account</Link>
          <Link to="/orders">Order History</Link>
          <Link to="/cart">Bag</Link>
        </div>
        <div className="footer-col">
          <h4>Help</h4>
          <span>Shipping &amp; Returns</span>
          <span>Contact Us</span>
          <span>FAQs</span>
        </div>
      </div>

      <div className="footer-bottom container">
        <span>&copy; {new Date().getFullYear()} Maison Ros&eacute;. All rights reserved.</span>
      </div>
    </footer>
  )
}
