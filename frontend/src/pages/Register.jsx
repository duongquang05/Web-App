import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../App.css'

function Register() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/participant', { replace: true })
      }
    }
  }, [user, navigate])

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    nationality: '',
    sex: '',
    birthYear: '',
    passportNo: '',
    mobile: '',
    currentAddress: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await register(formData)
    setLoading(false)

    if (result.success) {
      const user = JSON.parse(localStorage.getItem('user'))
      if (user.role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/participant')
      }
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="app">
      <div className="auth-layout">
        <div className="card auth-card" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
          <div className="auth-brand">
            <h2 className="auth-title">🏃 Hanoi Marathon</h2>
            <h3 className="auth-subtitle">Create Your Account</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Nationality</label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Sex</label>
              <select name="sex" value={formData.sex} onChange={handleChange} disabled={loading}>
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
                name="birthYear"
                value={formData.birthYear}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear()}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Passport Number</label>
              <input
                type="text"
                name="passportNo"
                value={formData.passportNo}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Current Address</label>
              <textarea
                name="currentAddress"
                value={formData.currentAddress}
                onChange={handleChange}
                rows="3"
                disabled={loading}
              />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }} disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
            <div className="auth-footer">
              Already have an account? <Link to="/login">Login here</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register

