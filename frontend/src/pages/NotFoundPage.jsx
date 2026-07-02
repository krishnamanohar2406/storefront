import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="center-state">
      <span className="eyebrow">404</span>
      <h2>This page wandered off the rack</h2>
      <Link to="/" className="btn btn-accent">
        Back to shopping
      </Link>
    </div>
  )
}
