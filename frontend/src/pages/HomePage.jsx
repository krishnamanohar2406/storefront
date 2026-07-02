import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCollections, fetchProducts } from '../api/products'
import ProductCard from '../components/ProductCard'
import Loader from '../components/Loader'
import './HomePage.css'

const GENDER_GRADIENTS = {
  women: 'linear-gradient(160deg, #f6d6c9 0%, #c81e5c 100%)',
  men: 'linear-gradient(160deg, #cfd6c9 0%, #2f3b2f 100%)',
  kids: 'linear-gradient(160deg, #ffe8a3 0%, #b68d40 100%)',
  unisex: 'linear-gradient(160deg, #d8d3e8 0%, #4a3b6e 100%)',
}

export default function HomePage() {
  const [collections, setCollections] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([fetchCollections(), fetchProducts({ ordering: '-id' })])
      .then(([collectionsData, productsData]) => {
        if (!active) return
        setCollections(collectionsData)
        setProducts((productsData.results ?? productsData).slice(0, 8))
      })
      .catch(() => active && setError('Could not load the storefront right now.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const genders = [...new Set(collections.map((c) => c.gender).filter(Boolean))]

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero-inner">
          <span className="eyebrow">New Season Edit</span>
          <h1>
            Fashion, <em>edited</em> &mdash; not endless.
          </h1>
          <p className="hero-sub">
            A tightly curated drop of dresses, separates and accessories. No infinite scroll, no noise —
            just the pieces worth your cart.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-accent">
              Shop the edit
            </Link>
            <Link to="/collections" className="btn btn-outline hero-outline">
              Browse categories
            </Link>
          </div>
        </div>
      </section>

      {genders.length > 0 && (
        <section className="container category-strip">
          <h2 className="section-title">Shop by category</h2>
          <div className="category-row">
            {genders.map((gender) => (
              <Link
                key={gender}
                to={`/collections?gender=${gender}`}
                className="category-pill"
                style={{ background: GENDER_GRADIENTS[gender] || 'var(--sand)' }}
              >
                <span>{gender}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container featured-section">
        <div className="section-heading-row">
          <h2 className="section-title">New arrivals</h2>
          <Link to="/products" className="section-link">
            View all &rarr;
          </Link>
        </div>

        {loading && <Loader label="Curating your edit…" />}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && products.length === 0 && (
          <div className="center-state">
            <h2>Nothing here yet</h2>
            <p>Add some products from the Django admin to see them appear here.</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
