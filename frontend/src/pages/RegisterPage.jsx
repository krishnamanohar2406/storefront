import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function flattenErrors(data) {
  if (!data || typeof data !== 'object') return null
  return Object.entries(data)
    .map(([field, messages]) => {
      const text = Array.isArray(messages) ? messages.join(' ') : String(messages)
      return field === 'non_field_errors' ? text : `${field}: ${text}`
    })
    .join(' ')
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (err) {
      setError(flattenErrors(err.response?.data) || 'Could not create your account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page container">
      <form className="form-card" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 'var(--space-5)' }}>Create your account</h1>
        {error && <p className="form-error">{error}</p>}

        <div className="field-row">
          <div className="field">
            <label htmlFor="first_name">First name</label>
            <input id="first_name" required value={form.first_name} onChange={update('first_name')} />
          </div>
          <div className="field">
            <label htmlFor="last_name">Last name</label>
            <input id="last_name" required value={form.last_name} onChange={update('last_name')} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="username">Username</label>
          <input id="username" required autoComplete="username" value={form.username} onChange={update('username')} />
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
          />
        </div>

        <button type="submit" className="btn btn-accent btn-block" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p style={{ marginTop: 'var(--space-5)', fontSize: '0.85rem', textAlign: 'center', color: 'var(--ink-soft)' }}>
          Already shopping with us? <Link to="/login" style={{ color: 'var(--berry-deep)', fontWeight: 600 }}>Log in</Link>
        </p>
      </form>
    </div>
  )
}
