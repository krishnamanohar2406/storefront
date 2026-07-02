import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createReview, fetchProduct, fetchReviews } from '../api/products'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import PriceTag from '../components/PriceTag'
import StarRating from '../components/StarRating'
import Loader from '../components/Loader'
import './ProductDetailPage.css'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { addItem } = useCart()

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [activeImage, setActiveImage] = useState(0)
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addState, setAddState] = useState('idle') // idle | adding | added | error
  const [reviewForm, setReviewForm] = useState({ rating: 5, description: '' })
  const [reviewError, setReviewError] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    Promise.all([fetchProduct(id), fetchReviews(id)])
      .then(([productData, reviewsData]) => {
        if (!active) return
        setProduct(productData)
        setReviews(reviewsData)
        setSize(productData.sizes?.[0] || '')
        setColor(productData.colors?.[0] || '')
      })
      .catch(() => active && setError('This product could not be found.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  async function handleAddToCart() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } })
      return
    }
    setAddState('adding')
    try {
      await addItem(Number(id), quantity)
      setAddState('added')
      setTimeout(() => setAddState('idle'), 2000)
    } catch {
      setAddState('error')
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault()
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } })
      return
    }
    setReviewSubmitting(true)
    setReviewError('')
    try {
      const created = await createReview(id, reviewForm)
      setReviews((prev) => [created, ...prev])
      setReviewForm({ rating: 5, description: '' })
    } catch (err) {
      setReviewError(
        err.response?.data?.non_field_errors?.[0] ||
          err.response?.data?.detail ||
          'Could not submit your review — you may have already reviewed this product.'
      )
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading) return <Loader label="Loading product…" />
  if (error) {
    return (
      <div className="center-state">
        <h2>{error}</h2>
      </div>
    )
  }
  if (!product) return null

  const images = product.images?.length ? product.images : [null]
  const outOfStock = product.inventory <= 0

  return (
    <div className="page container product-detail">
      <div className="product-detail-gallery">
        <div className="product-detail-main-image">
          {images[activeImage]?.image_url ? (
            <img src={images[activeImage].image_url} alt={product.title} />
          ) : (
            <div className="product-card-placeholder">
              <span>{product.title?.[0]}</span>
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="product-detail-thumbs">
            {images.map((img, i) => (
              <button
                key={img?.id ?? i}
                className={i === activeImage ? 'is-active' : ''}
                onClick={() => setActiveImage(i)}
                aria-label={`View image ${i + 1}`}
              >
                {img?.image_url ? <img src={img.image_url} alt="" /> : <span>{i + 1}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="product-detail-info">
        {product.brand && <span className="eyebrow">{product.brand}</span>}
        <h1>{product.title}</h1>
        {Boolean(product.num_ratings) && <StarRating value={product.avg_rating} count={product.num_ratings} />}
        <PriceTag
          price={product.unit_price}
          originalPrice={product.original_price}
          discountPercent={product.discount_percent}
          size="lg"
        />

        {product.description && <p className="product-detail-description">{product.description}</p>}

        {product.sizes?.length > 0 && (
          <div className="option-group">
            <span className="option-label">Size</span>
            <div className="option-pills">
              {product.sizes.map((s) => (
                <button key={s} className={s === size ? 'is-active' : ''} onClick={() => setSize(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {product.colors?.length > 0 && (
          <div className="option-group">
            <span className="option-label">Color</span>
            <div className="option-pills">
              {product.colors.map((c) => (
                <button key={c} className={c === color ? 'is-active' : ''} onClick={() => setColor(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="option-group">
          <span className="option-label">Quantity</span>
          <div className="quantity-stepper">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
              &minus;
            </button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity((q) => q + 1)} aria-label="Increase quantity">
              +
            </button>
          </div>
        </div>

        <button
          className="btn btn-accent btn-block product-detail-cta"
          onClick={handleAddToCart}
          disabled={outOfStock || addState === 'adding'}
        >
          {outOfStock
            ? 'Out of stock'
            : addState === 'adding'
              ? 'Adding…'
              : addState === 'added'
                ? 'Added to bag ✓'
                : 'Add to bag'}
        </button>
        {addState === 'error' && <p className="form-error">Could not add this to your bag. Please try again.</p>}

        {product.material && (
          <p className="product-detail-material">
            <strong>Material:</strong> {product.material}
          </p>
        )}
      </div>

      <div className="product-detail-reviews">
        <h2>Reviews {reviews.length > 0 && `(${reviews.length})`}</h2>

        <form className="review-form" onSubmit={handleReviewSubmit}>
          <div className="field">
            <label htmlFor="rating">Your rating</label>
            <select
              id="rating"
              value={reviewForm.rating}
              onChange={(e) => setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))}
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} star{r > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="review-text">Your review</label>
            <textarea
              id="review-text"
              rows={3}
              placeholder="How did this fit? Would you recommend it?"
              value={reviewForm.description}
              onChange={(e) => setReviewForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          {reviewError && <p className="form-error">{reviewError}</p>}
          <button type="submit" className="btn btn-outline btn-sm" disabled={reviewSubmitting}>
            {reviewSubmitting ? 'Submitting…' : isAuthenticated ? 'Submit review' : 'Log in to review'}
          </button>
        </form>

        {reviews.length === 0 ? (
          <p className="no-reviews">No reviews yet — be the first to share your fit.</p>
        ) : (
          <ul className="review-list">
            {reviews.map((r) => (
              <li key={r.id}>
                <StarRating value={r.rating} />
                {r.description && <p>{r.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
