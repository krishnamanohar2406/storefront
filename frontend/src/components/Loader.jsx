export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="center-state" role="status" aria-live="polite">
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>{label}</span>
    </div>
  )
}
