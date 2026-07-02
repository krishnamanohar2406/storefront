import './PriceTag.css'

function formatINR(value) {
  const n = Number(value)
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export default function PriceTag({ price, originalPrice, discountPercent, size = 'md' }) {
  const hasDiscount = discountPercent > 0 && originalPrice
  return (
    <div className={`price-tag price-tag-${size}`}>
      <span className="price-tag-now">{formatINR(price)}</span>
      {hasDiscount && (
        <>
          <span className="price-tag-mrp">{formatINR(originalPrice)}</span>
          <span className="price-tag-stub" aria-label={`${discountPercent} percent off`}>
            {discountPercent}% off
          </span>
        </>
      )}
    </div>
  )
}
