import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchProducts } from '../api/products'
import ProductCard from '../components/ProductCard'
import Loader from '../components/Loader'
import './ProductsPage.css'

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState({ results: [], count: 0, next: null, previous: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const search = searchParams.get('search') || ''
  const collectionId = searchParams.get('collection_id') || ''
  const ordering = searchParams.get('ordering') || ''
  const minPrice = searchParams.get('unit_price__gt') || ''
  const maxPrice = searchParams.get('unit_price__lt') || ''
  const page = searchParams.get('page') || '1'

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    fetchProducts({
      search: search || undefined,
      collection_id: collectionId || undefined,
      ordering: ordering || undefined,
      unit_price__gt: minPrice || undefined,
      unit_price__lt: maxPrice || undefined,
      page,
    })
      .then((res) => active && setData(res))
      .catch(() => active && setError('Could not load products right now.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [search, collectionId, ordering, minPrice, maxPrice, page])

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  function goToPage(delta) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(Number(page) + delta))
    setSearchParams(next)
  }

  const products = data.results ?? data

  return (
    <div className="page container products-page">
      <div className="products-header">
        <div>
          <span className="eyebrow">{search ? `Results for "${search}"` : 'The Edit'}</span>
          <h1>All products</h1>
        </div>
        <select value={ordering} onChange={(e) => updateParam('ordering', e.target.value)} className="sort-select">
          <option value="">Sort: Recommended</option>
          <option value="unit_price">Price: Low to High</option>
          <option value="-unit_price">Price: High to Low</option>
          <option value="-last_update">Newest</option>
        </select>
      </div>

      <div className="products-layout">
        <aside className="products-filters">
          <h4>Price range</h4>
          <div className="price-filter-row">
            <input
              type="number"
              placeholder="Min ₹"
              defaultValue={minPrice}
              onBlur={(e) => updateParam('unit_price__gt', e.target.value)}
            />
            <span>&ndash;</span>
            <input
              type="number"
              placeholder="Max ₹"
              defaultValue={maxPrice}
              onBlur={(e) => updateParam('unit_price__lt', e.target.value)}
            />
          </div>

          {(search || collectionId || minPrice || maxPrice) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setSearchParams({})}>
              Clear all filters
            </button>
          )}
        </aside>

        <div className="products-results">
          {loading && <Loader label="Finding your fit…" />}
          {error && <p className="form-error">{error}</p>}

          {!loading && !error && products.length === 0 && (
            <div className="center-state">
              <h2>No products matched</h2>
              <p>Try a wider price range or clear your filters.</p>
            </div>
          )}

          {!loading && products.length > 0 && (
            <>
              <div className="product-grid">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {(data.next || data.previous) && (
                <div className="pagination">
                  <button className="btn btn-outline btn-sm" disabled={!data.previous} onClick={() => goToPage(-1)}>
                    &larr; Previous
                  </button>
                  <span>Page {page}</span>
                  <button className="btn btn-outline btn-sm" disabled={!data.next} onClick={() => goToPage(1)}>
                    Next &rarr;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
