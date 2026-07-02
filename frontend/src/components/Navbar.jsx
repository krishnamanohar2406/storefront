import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import './Navbar.css'

const CATEGORY_LINKS = [
  { label: 'Women', gender: 'female' },
  { label: 'Men', gender: 'male' },
  { label: 'Kids', gender: 'kids' },
  { label: 'Unisex', gender: 'unisex' },
]

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  function handleSearch(e) {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query.trim())}`)
      setMenuOpen(false)
    }
  }

  return (
    <header className="nav-shell">
      <div className="nav-top container">
        <button
          className="nav-burger"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <Link to="/" className="nav-logo">
          Maison Ros&eacute;
        </Link>

        <form className="nav-search" onSubmit={handleSearch} role="search">
          <input
            type="search"
            placeholder="Search dresses, brands, styles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
          />
          <button type="submit" aria-label="Search">
            ⌕
          </button>
        </form>

        <div className="nav-actions">
          {isAuthenticated ? (
            <div className="nav-account">
              <Link to="/account" className="nav-icon-link">
                <span className="nav-icon">⛁</span>
                <span className="nav-icon-label">{user?.first_name || user?.username}</span>
              </Link>
              <button className="btn-ghost btn-sm" onClick={logout}>
                Log out
              </button>
            </div>
          ) : (
            <Link to="/login" className="nav-icon-link">
              <span className="nav-icon">⛁</span>
              <span className="nav-icon-label">Account</span>
            </Link>
          )}

          <Link to="/cart" className="nav-icon-link nav-cart">
            <span className="nav-icon">⛃</span>
            <span className="nav-icon-label">Bag</span>
            {itemCount > 0 && <span className="nav-cart-count">{itemCount}</span>}
          </Link>
        </div>
      </div>

      <nav className={`nav-categories ${menuOpen ? 'is-open' : ''}`}>
        <div className="container nav-categories-inner">
          {CATEGORY_LINKS.map((c) => (
            <Link key={c.gender} to={`/collections?gender=${c.gender}`} onClick={() => setMenuOpen(false)}>
              {c.label}
            </Link>
          ))}
          <Link to="/products" onClick={() => setMenuOpen(false)}>
            All Products
          </Link>
          {isAuthenticated && (
            <Link to="/orders" onClick={() => setMenuOpen(false)}>
              My Orders
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
