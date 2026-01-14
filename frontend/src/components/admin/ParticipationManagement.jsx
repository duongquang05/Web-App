import { useState, useEffect } from 'react'
import api from '../../utils/api'

// Helper function to format time (remove date if present)
function formatTime(timeValue) {
  if (!timeValue) return 'N/A'
  
  // If it's already in HH:MM:SS format, return as is
  if (typeof timeValue === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(timeValue)) {
    return timeValue
  }
  
  // If it's a Date object or contains date, extract only time
  if (timeValue instanceof Date) {
    return timeValue.toTimeString().slice(0, 8) // HH:MM:SS
  }
  
  // If it's a string with date and time, extract time part
  if (typeof timeValue === 'string') {
    const timeMatch = timeValue.match(/(\d{2}:\d{2}:\d{2})/)
    if (timeMatch) {
      return timeMatch[1]
    }
    // If it's just time format, return as is
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeValue)) {
      return timeValue
    }
  }
  
  return timeValue
}

function ParticipationManagement() {
  const [participations, setParticipations] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState(null) // 'success' | 'error'
  const [editing, setEditing] = useState(null)
  const [accepting, setAccepting] = useState(null)
  const [entryNumber, setEntryNumber] = useState('')
  const [resultForm, setResultForm] = useState({ timeRecord: '', standings: '' })

  useEffect(() => {
    fetchParticipations()
  }, [])

  const fetchParticipations = async () => {
    try {
      const response = await api.get('/admin/participations')
      setParticipations(response.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching participations:', error)
      setLoading(false)
    }
  }

  const handleAccept = async (marathonId, userId, customEntryNumber = null) => {
    setMessage('')
    setMessageType(null)
    try {
      const payload = customEntryNumber !== null && customEntryNumber !== '' 
        ? { entryNumber: parseInt(customEntryNumber, 10) }
        : {}
      
      await api.post(`/admin/participations/${marathonId}-${userId}/accept`, payload)
      setMessage('Participation accepted and entry number assigned')
      setMessageType('success')
      setAccepting(null)
      setEntryNumber('')
      fetchParticipations()
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to accept participation')
      setMessageType('error')
    }
  }

  const handleSetResult = async (marathonId, userId) => {
    setMessage('')
    setMessageType(null)
    try {
      await api.post(`/admin/participations/${marathonId}-${userId}/result`, resultForm)
      setMessage('Result updated successfully')
      setMessageType('success')
      setEditing(null)
      setResultForm({ timeRecord: '', standings: '' })
      fetchParticipations()
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update result')
      setMessageType('error')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="card">
      <h3>Participation Management</h3>
      {message && (
        <div className={messageType === 'success' ? 'success' : 'error'}>
          {message}
        </div>
      )}
      {participations.length === 0 ? (
        <p>No participations</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Race Name</th>
              <th>Participant</th>
              <th>Email</th>
              <th>Entry Number</th>
              <th>Hotel</th>
              <th>Time Record</th>
              <th>Standings</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {participations.map((p) => (
              <tr key={`${p.MarathonID}-${p.UserID}`}>
                <td>{p.RaceName}</td>
                <td>{p.FullName}</td>
                <td>{p.Email}</td>
                <td>
                  {p.EntryNumber > 0 ? (
                    <span className="badge badge-active">#{p.EntryNumber}</span>
                  ) : (
                    <span className="badge badge-warning">Pending</span>
                  )}
                </td>
                <td>{p.Hotel || 'N/A'}</td>
                <td>{formatTime(p.TimeRecord)}</td>
                <td>{p.Standings || 'N/A'}</td>
                <td>
                  <div className="participation-actions">
                    {p.EntryNumber <= 0 && (
                      <button
                        className="btn btn-success"
                        onClick={() => setAccepting(`${p.MarathonID}-${p.UserID}`)}
                      >
                        Accept
                      </button>
                    )}
                    {p.EntryNumber > 0 && (
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setEditing(`${p.MarathonID}-${p.UserID}`)
                          setResultForm({
                            timeRecord: p.TimeRecord || '',
                            standings: p.Standings || '',
                          })
                        }}
                      >
                        Set Result
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {accepting && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h4>Accept Participation</h4>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const [marathonId, userId] = accepting.split('-')
              handleAccept(parseInt(marathonId), parseInt(userId), entryNumber)
            }}
          >
            <div className="form-group">
              <label>Entry Number (Leave empty for auto-assign)</label>
              <input
                type="number"
                value={entryNumber}
                onChange={(e) => setEntryNumber(e.target.value)}
                placeholder="Auto-assign if empty"
                min="1"
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Leave empty to auto-assign the next available number, or enter a custom number
              </small>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-success">Accept</button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setAccepting(null)
                  setEntryNumber('')
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      {editing && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h4>Set Race Result</h4>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const [marathonId, userId] = editing.split('-')
              handleSetResult(parseInt(marathonId), parseInt(userId))
            }}
          >
            <div className="form-group">
              <label>Time Record (HH:MM:SS or HH:MM)</label>
              <input
                type="text"
                value={resultForm.timeRecord}
                onChange={(e) => setResultForm({ ...resultForm, timeRecord: e.target.value })}
                pattern="^(\d{1,2}):(\d{2})(:(\d{2}))?$"
                required
              />
            </div>
            <div className="form-group">
              <label>Standings</label>
              <input
                type="number"
                value={resultForm.standings}
                onChange={(e) => setResultForm({ ...resultForm, standings: e.target.value })}
                min="1"
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary">Save</button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditing(null)
                  setResultForm({ timeRecord: '', standings: '' })
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default ParticipationManagement

