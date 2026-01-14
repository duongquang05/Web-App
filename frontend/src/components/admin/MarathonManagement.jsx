import { useState, useEffect } from 'react'
import api from '../../utils/api'

function MarathonManagement() {
  const [marathons, setMarathons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ raceName: '', raceDate: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchMarathons()
  }, [])

  const fetchMarathons = async () => {
    try {
      const response = await api.get('/admin/marathons')
      setMarathons(response.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching marathons:', error)
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      if (editing) {
        await api.put(`/admin/marathons/${editing}`, formData)
        setMessage('Marathon updated successfully')
      } else {
        await api.post('/admin/marathons', formData)
        setMessage('Marathon created successfully')
      }
      setShowForm(false)
      setEditing(null)
      setFormData({ raceName: '', raceDate: '' })
      fetchMarathons()
    } catch (error) {
      setMessage(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleEdit = (marathon) => {
    setEditing(marathon.MarathonID)
    setFormData({
      raceName: marathon.RaceName,
      raceDate: marathon.RaceDate.split('T')[0],
    })
    setShowForm(true)
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this marathon? This will prevent new registrations but preserve all existing data.')) return

    setMessage('')
    try {
      await api.post(`/admin/marathons/${id}/cancel`)
      setMessage('Marathon cancelled successfully. All participations and data are preserved.')
      fetchMarathons()
    } catch (error) {
      setMessage(error.response?.data?.message || 'Cancellation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this marathon? This may fail if there are existing participations.')) return

    setMessage('')
    try {
      await api.delete(`/admin/marathons/${id}`)
      setMessage('Marathon deleted successfully')
      fetchMarathons()
    } catch (error) {
      setMessage(error.response?.data?.message || 'Deletion failed. Marathon may have existing participations.')
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      Active: { background: '#2e7d32', color: 'white', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
      Cancelled: { background: '#c62828', color: 'white', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
      Postponed: { background: '#e65100', color: 'white', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
      Completed: { background: '#1565c0', color: 'white', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    }
    return <span style={styles[status] || styles.Active}>{status || 'Active'}</span>
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Marathon Management</h3>
          <button className="btn btn-primary" onClick={() => {
            setShowForm(!showForm)
            setEditing(null)
            setFormData({ raceName: '', raceDate: '' })
          }}>
            {showForm ? 'Cancel' : 'Add Marathon'}
          </button>
        </div>
        {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}
        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label>Race Name</label>
              <input
                type="text"
                name="raceName"
                value={formData.raceName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Race Date</label>
              <input
                type="date"
                name="raceDate"
                value={formData.raceDate}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              {editing ? 'Update' : 'Create'}
            </button>
          </form>
        )}
      </div>
      <div className="card">
        <h3>Marathons List</h3>
        {marathons.length === 0 ? (
          <p>No marathons</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Race Name</th>
                <th>Race Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {marathons.map((marathon) => (
                <tr key={marathon.MarathonID}>
                  <td>{marathon.MarathonID}</td>
                  <td>{marathon.RaceName}</td>
                  <td>{new Date(marathon.RaceDate).toLocaleDateString()}</td>
                  <td>{getStatusBadge(marathon.Status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleEdit(marathon)}
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        Edit
                      </button>
                      {marathon.Status === 'Active' && (
                        <button
                          className="btn btn-warning"
                          onClick={() => handleCancel(marathon.MarathonID)}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(marathon.MarathonID)}
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default MarathonManagement

