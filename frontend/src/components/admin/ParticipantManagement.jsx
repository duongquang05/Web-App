import { useState, useEffect } from 'react'
import api from '../../utils/api'

// Helper function to format sex display
function formatSex(sex) {
  if (!sex) return 'N/A'
  const sexMap = {
    'M': 'Male',
    'F': 'Female',
    'Male': 'Male',
    'Female': 'Female',
    'Other': 'Other'
  }
  return sexMap[sex] || sex
}

function ParticipantManagement() {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    nationality: '',
    sex: '',
    birthYear: '',
    passportNo: '',
    mobile: '',
    currentAddress: '',
    bestRecord: '',
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchParticipants()
  }, [])

  const fetchParticipants = async () => {
    try {
      const response = await api.get('/admin/table/Participants')
      setParticipants(response.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching participants:', error)
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleEdit = (participant) => {
    setEditing(participant.UserID)
    setFormData({
      fullName: participant.FullName || '',
      email: participant.Email || '',
      nationality: participant.Nationality || '',
      sex: participant.Sex || '',
      birthYear: participant.BirthYear || '',
      passportNo: participant.PassportNo || '',
      mobile: participant.Mobile || '',
      currentAddress: participant.CurrentAddress || '',
      bestRecord: participant.BestRecord || '',
    })
  }

  const handleCancel = () => {
    setEditing(null)
    setFormData({
      fullName: '',
      email: '',
      nationality: '',
      sex: '',
      birthYear: '',
      passportNo: '',
      mobile: '',
      currentAddress: '',
      bestRecord: '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      await api.put(`/admin/participants/${editing}`, formData)
      setMessage('Participant updated successfully')
      setEditing(null)
      setFormData({
        fullName: '',
        email: '',
        nationality: '',
        sex: '',
        birthYear: '',
        passportNo: '',
        mobile: '',
        currentAddress: '',
        bestRecord: '',
      })
      fetchParticipants()
    } catch (error) {
      setMessage(error.response?.data?.message || 'Update failed')
    }
  }

  const handleDelete = async (id, fullName) => {
    if (!window.confirm(`Are you sure you want to delete participant "${fullName}"? This will fail if they have race results (TimeRecord and Standings).`)) return

    setMessage('')
    try {
      await api.delete(`/admin/participants/${id}`)
      setMessage('Participant deleted successfully')
      fetchParticipants()
    } catch (error) {
      setMessage(error.response?.data?.message || 'Deletion failed. Participant may have existing race results (TimeRecord and Standings).')
    }
  }

  const getRoleBadge = (nationality) => {
    if (nationality === 'ADMIN') {
      return <span style={{ background: '#c62828', color: 'white', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>ADMIN</span>
    }
    return <span style={{ background: '#2e7d32', color: 'white', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>PARTICIPANT</span>
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}
      
      <div className="card">
        <h3>Participants List</h3>
        {participants.length === 0 ? (
          <p>No participants</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Nationality</th>
                  <th>Sex</th>
                  <th>Birth Year</th>
                  <th>Mobile</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant) => (
                  <tr key={participant.UserID}>
                    <td>{participant.UserID}</td>
                    <td>{participant.FullName}</td>
                    <td>{participant.Email}</td>
                    <td>{participant.Nationality}</td>
                    <td>{formatSex(participant.Sex)}</td>
                    <td>{participant.BirthYear || 'N/A'}</td>
                    <td>{participant.Mobile || 'N/A'}</td>
                    <td>{getRoleBadge(participant.Nationality)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {participant.Nationality !== 'ADMIN' && (
                          <>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleEdit(participant)}
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDelete(participant.UserID, participant.FullName)}
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {participant.Nationality === 'ADMIN' && (
                          <span style={{ fontSize: '12px', color: '#666' }}>Protected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>Edit Participant</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Nationality</label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Sex</label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
              >
                <option value="">Select...</option>
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
              />
            </div>
            <div className="form-group">
              <label>Passport No</label>
              <input
                type="text"
                name="passportNo"
                value={formData.passportNo}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Mobile</label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Current Address</label>
              <textarea
                name="currentAddress"
                value={formData.currentAddress}
                onChange={handleChange}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Best Record (HH:MM:SS) <span style={{ color: '#666', fontSize: '12px' }}>(Optional)</span></label>
              <input
                type="text"
                name="bestRecord"
                value={formData.bestRecord}
                onChange={handleChange}
                placeholder="HH:MM:SS"
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary">
                Update
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default ParticipantManagement

