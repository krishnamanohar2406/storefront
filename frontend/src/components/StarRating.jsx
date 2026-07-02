export default function StarRating({ value = 0, count, size = 14 }) {
  const rounded = Math.round(value * 2) / 2
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ display: 'inline-flex', color: 'var(--gold)', fontSize: size }} aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} style={{ position: 'relative', width: '1em', display: 'inline-block' }}>
            <span style={{ opacity: 0.3 }}>★</span>
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                overflow: 'hidden',
                width: `${Math.max(0, Math.min(1, rounded - (i - 1))) * 100}%`,
              }}
            >
              ★
            </span>
          </span>
        ))}
      </span>
      {count !== undefined && (
        <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
          {value.toFixed(1)} ({count})
        </span>
      )}
    </span>
  )
}
