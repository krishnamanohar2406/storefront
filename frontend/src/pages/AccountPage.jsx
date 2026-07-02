import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateCustomerProfile } from '../api/auth'
import { createAddress, deleteAddress, fetchAddresses } from '../api/addresses'
import Loader from '../components/Loader'
import './AccountPage.css'

const MEMBERSHIP_LABEL = { B: 'Bronze', S: 'Silver', G: 'Gold' }
const emptyAddress = { street: '', city: '', state: '', country: 'India' }

export default function AccountPage() {
  const { user, customer, refreshCustomer } = useAuth()
  const [profileForm, setProfileForm] = useState({ phone: '', birth_date: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const [addresses, setAddresses] = useState([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAddress, setNewAddress] = useState(emptyAddress)

  useEffect(() => {
    if (customer) {
      setProfileForm({ phone: customer.phone || '', birth_date: customer.birth_date || '' })
    }
  }, [customer])

  useEffect(() => {
    fetchAddresses()
      .then(setAddresses)
      .finally(() => setAddressesLoading(false))
  }, [])

  async function handleProfileSubmit(e) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileSaved(false)
    try {
      await updateCustomerProfile({
        phone: profileForm.phone,
        birth_date: profileForm.birth_date || null,
        membership: customer.membership,
      })
      await refreshCustomer()
      setProfileSaved(true)
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleAddAddress(e) {
    e.preventDefault()
    const created = await createAddress(newAddress)
    setAddresses((prev) => [created, ...prev])
    setNewAddress(emptyAddress)
    setShowAddForm(false)
  }

  async function handleDeleteAddress(id) {
    await deleteAddress(id)
    setAddresses((prev) => prev.filter((a) => a.id !== id))
  }

  if (!customer) return <Loader />

  return (
    <div className="page container account-page">
      <h1>My account</h1>

      <div className="account-layout">
        <section className="account-section">
          <h3>Profile</h3>
          <p className="account-meta">
            {user?.first_name} {user?.last_name} &middot; {user?.email} &middot;{' '}
            <span className="membership-pill">{MEMBERSHIP_LABEL[customer.membership]} member</span>
          </p>

          <form onSubmit={handleProfileSubmit}>
            <div className="field-row">
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="birth_date">Date of birth</label>
                <input
                  id="birth_date"
                  type="date"
                  value={profileForm.birth_date || ''}
                  onChange={(e) => setProfileForm((f) => ({ ...f, birth_date: e.target.value }))}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
            {profileSaved && <span className="save-confirm">Saved ✓</span>}
          </form>
        </section>

        <section className="account-section">
          <div className="section-heading-row">
            <h3>Address book</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAddForm((v) => !v)}>
              {showAddForm ? 'Cancel' : '+ Add address'}
            </button>
          </div>

          {showAddForm && (
            <form className="address-form" onSubmit={handleAddAddress} style={{ marginBottom: 'var(--space-4)' }}>
              <div className="field">
                <label htmlFor="acc-street">Street address</label>
                <input
                  id="acc-street"
                  required
                  value={newAddress.street}
                  onChange={(e) => setNewAddress((a) => ({ ...a, street: e.target.value }))}
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="acc-city">City</label>
                  <input
                    id="acc-city"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="acc-state">State</label>
                  <input
                    id="acc-state"
                    required
                    value={newAddress.state}
                    onChange={(e) => setNewAddress((a) => ({ ...a, state: e.target.value }))}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="acc-country">Country</label>
                <input
                  id="acc-country"
                  required
                  value={newAddress.country}
                  onChange={(e) => setNewAddress((a) => ({ ...a, country: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm">
                Save address
              </button>
            </form>
          )}

          {addressesLoading && <Loader />}
          {!addressesLoading && addresses.length === 0 && !showAddForm && (
            <p className="account-meta">No saved addresses yet.</p>
          )}

          <ul className="account-address-list">
            {addresses.map((a) => (
              <li key={a.id}>
                <span>
                  {a.street}, {a.city}, {a.state}, {a.country}
                </span>
                <button className="cart-item-remove" onClick={() => handleDeleteAddress(a.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
