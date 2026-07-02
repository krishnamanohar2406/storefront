import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchCollections } from '../api/products'
import Loader from '../components/Loader'
import './CollectionsPage.css'

export default function CollectionsPage() {
  const [searchParams] = useSearchParams()
  const gender = searchParams.get('gender')
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchCollections()
      .then((data) => active && setCollections(data))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const visible = gender ? collections.filter((c) => c.gender === gender) : collections

  return (
    <div className="page container collections-page">
      <span className="eyebrow">Categories</span>
      <h1>{gender ? `${gender.charAt(0).toUpperCase()}${gender.slice(1)}'s edit` : 'All categories'}</h1>

      {loading && <Loader />}

      {!loading && visible.length === 0 && (
        <div className="center-state">
          <h2>No categories yet</h2>
          <p>Add a collection from the Django admin to see it here.</p>
        </div>
      )}

      <div className="collections-grid">
        {visible.map((c) => (
          <Link key={c.id} to={`/products?collection_id=${c.id}`} className="collection-card">
            <h3>{c.name}</h3>
            <span>{c.products_count} {c.products_count === 1 ? 'piece' : 'pieces'}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
