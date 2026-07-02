import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const from = location.state?.from || '/'

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await login(form.username, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Could not log you in - check your username and password and try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page container">
      <form className="form-card" onSubmit={handleSubmit}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 'var(--space-5)' }}>Welcome back</h1>
        {error && <p className="form-error">{error}</p>}
        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            required
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
        </div>
        <button type="submit" className="btn btn-accent btn-block" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
        <p style={{ marginTop: 'var(--space-5)', fontSize: '0.85rem', textAlign: 'center', color: 'var(--ink-soft)' }}>
          New here? <Link to="/register" style={{ color: 'var(--berry-deep)', fontWeight: 600 }}>Create an account</Link>
        </p>
      </form>
    </div>
  )
}
