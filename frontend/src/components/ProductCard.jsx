import { Link } from 'react-router-dom'
import PriceTag from './PriceTag'
import StarRating from './StarRating'
import './ProductCard.css'

export default function ProductCard({ product }) {
  const image = product.images?.[0]?.image_url

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-card-media">
        {image ? (
          <img src={image} alt={product.title} loading="lazy" />
        ) : (
          <div className="product-card-placeholder">
            <span>{product.title?.[0] ?? '?'}</span>
          </div>
        )}
        {product.discount_percent > 0 && (
          <span className="product-card-discount">-{product.discount_percent}%</span>
        )}
      </div>
      <div className="product-card-body">
        {product.brand && <span className="product-card-brand">{product.brand}</span>}
        <h3 className="product-card-title">{product.title}</h3>
        {Boolean(product.num_ratings) && <StarRating value={product.avg_rating} count={product.num_ratings} />}
        <PriceTag
          price={product.unit_price}
          originalPrice={product.original_price}
          discountPercent={product.discount_percent}
        />
      </div>
    </Link>
  )
}
