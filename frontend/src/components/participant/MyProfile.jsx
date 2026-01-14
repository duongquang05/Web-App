import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../utils/api'

// Helper function to format sex display
function formatSex(sex) {
  if (!sex) return 'N/A'
  const sexMap = {
    M: 'Male',
    F: 'Female',
    Male: 'Male',
    Female: 'Female',
    Other: 'Other',
  }
  return sexMap[sex] || sex
}

// Helper to get nice initials for avatar
function getInitials(nameOrEmail) {
  if (!nameOrEmail) return 'P'
  const name = nameOrEmail.split('@')[0]
  const parts = name.trim().split(' ').filter(Boolean)

  if (!parts.length) return name[0]?.toUpperCase() || 'P'

  const initials = parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('')
  return initials || 'P'
}

function MyProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/me')
      setProfile(response.data.data)
      setFormData(response.data.data.profile || {})
      setLoading(false)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    // Mobile: only digits, max 10 characters
    if (name === 'Mobile') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10)
      setFormData({
        ...formData,
        [name]: digitsOnly,
      })
      return
    }

    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    const mobileValue = (formData.Mobile || '').toString()
    if (!mobileValue || mobileValue.length !== 10) {
      setMessage('Mobile number must be exactly 10 digits')
      return
    }

    try {
      await api.put('/me', formData)
      setMessage('Profile updated successfully')
      setEditing(false)
      fetchProfile()
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update profile')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  const profileDetails = profile?.profile || {}

  const displayFullName =
    profile?.fullName || formData.FullName || profileDetails.fullName || user?.email || 'N/A'
  const displayEmail = profile?.email || user?.email || 'N/A'
  const nationality = profileDetails.nationality ?? formData.Nationality ?? 'N/A'
  const sex = formatSex(profileDetails.sex ?? formData.Sex)
  const birthYear =
    profileDetails.birthYear ??
    formData.BirthYear ??
    (profileDetails.birth_year ?? 'N/A') // fallback if backend uses different casing
  const passportNo = profileDetails.passportNo ?? formData.PassportNo ?? 'N/A'
  const mobile = profileDetails.mobile ?? formData.Mobile ?? 'N/A'
  const currentAddress = profileDetails.currentAddress ?? formData.CurrentAddress ?? 'N/A'

  return (
    <div className="card profile-card">
      <div className="profile-header">
        <div className="profile-avatar">
          {getInitials(displayFullName)}
        </div>
        <div className="profile-header-main">
          <h3>My Profile</h3>
          <p className="profile-email">{displayEmail}</p>
          <span className="badge badge-active">Participant</span>
        </div>
      </div>

      {message && (
        <div className={`profile-message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {!editing ? (
        <div className="profile-sections">
          <div className="profile-section">
            <div className="profile-section-title">Personal information</div>
            <div className="profile-grid">
              <div className="profile-field">
                <span className="profile-label">Full name</span>
                <span className="profile-value">{displayFullName}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Email</span>
                <span className="profile-value">{displayEmail}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Nationality</span>
                <span className="profile-value">{nationality}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Sex</span>
                <span className="profile-value">{sex}</span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-section-title">Contact & ID</div>
            <div className="profile-grid">
              <div className="profile-field">
                <span className="profile-label">Birth year</span>
                <span className="profile-value">{birthYear || 'N/A'}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Passport / ID No.</span>
                <span className="profile-value">{passportNo}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Mobile</span>
                <span className="profile-value">{mobile}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Current address</span>
                <span className="profile-value">{currentAddress}</span>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button
              className="btn btn-primary"
              onClick={() => setEditing(true)}
            >
              Edit profile
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="profile-section-title">Update your information</div>

          <div className="profile-form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="FullName"
                value={formData.FullName || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Nationality</label>
              <input
                type="text"
                name="Nationality"
                value={formData.Nationality || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Sex</label>
              <select name="Sex" value={formData.Sex || ''} onChange={handleChange}>
                <option value="">Select</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Birth Year</label>
              <input
                type="number"
                name="BirthYear"
                value={formData.BirthYear || ''}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div className="form-group">
              <label>Passport No</label>
              <input
                type="text"
                name="PassportNo"
                value={formData.PassportNo || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Mobile</label>
              <input
                type="tel"
                name="Mobile"
                value={formData.Mobile || ''}
                onChange={handleChange}
                maxLength={10}
                inputMode="numeric"
              />
            </div>
            <div className="form-group form-group-full">
              <label>Current Address</label>
              <textarea
                name="CurrentAddress"
                value={formData.CurrentAddress || ''}
                onChange={handleChange}
                rows="3"
              />
            </div>
          </div>

          <div className="profile-actions">
            <button type="button" className="btn btn-secondary" onClick={() => {
              setEditing(false)
              fetchProfile()
            }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save changes
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default MyProfile

