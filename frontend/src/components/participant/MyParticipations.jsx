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

function MyParticipations() {
  const [participations, setParticipations] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchParticipations()
  }, [])

  const fetchParticipations = async () => {
    try {
      const response = await api.get('/participations/my')
      console.log('Participations data:', response.data.data) // Debug log
      setParticipations(response.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching participations:', error)
      setLoading(false)
    }
  }

  const handleCancel = async (marathonId, userId) => {
    if (!window.confirm('Are you sure you want to cancel this participation?')) return

    setMessage('')
    try {
      await api.post(`/participations/${marathonId}-${userId}/cancel`)
      setMessage('Participation cancelled successfully')
      fetchParticipations()
    } catch (error) {
      setMessage(error.response?.data?.message || 'Cancellation failed')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="card">
      <h3>My Participations</h3>
      {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}
      {participations.length === 0 ? (
        <p>You have no participations</p>
      ) : (
        <table>
            <thead>
              <tr>
                <th>Race Name</th>
                <th>Race Date</th>
                <th>Status</th>
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
                  <td>
                    {(p.Status === 'Cancelled' || p.Status === 'cancelled') && '[CANCELLED] '}
                    {(p.Status === 'Postponed' || p.Status === 'postponed') && '[POSTPONED] '}
                    {p.RaceName}
                  </td>
                  <td>{new Date(p.RaceDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${(p.Status || 'Active').toLowerCase()}`}>
                      {p.Status || 'Active'}
                    </span>
                  </td>
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
                    {(() => {
                      try {
                        // Parse race date - handle different formats
                        let raceDate = new Date(p.RaceDate)
                        if (isNaN(raceDate.getTime())) {
                          // Try parsing as string if Date constructor fails
                          raceDate = new Date(p.RaceDate + 'T00:00:00')
                        }
                        
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        raceDate.setHours(0, 0, 0, 0)
                        
                        // Can cancel if: race date is in the future AND marathon is Active AND no result yet
                        const isFuture = raceDate > today
                        const isActive = p.Status === 'Active' || p.Status === 'active' || !p.Status
                        const noResult = !p.TimeRecord || p.TimeRecord === 'N/A' || p.TimeRecord === null || p.TimeRecord === ''
                        
                        const canCancel = isFuture && isActive && noResult
                        
                        // Debug log
                        console.log('Cancel check for', p.RaceName, ':', {
                          raceDate: p.RaceDate,
                          parsedDate: raceDate,
                          today: today,
                          isFuture,
                          status: p.Status,
                          isActive,
                          timeRecord: p.TimeRecord,
                          noResult,
                          canCancel
                        })
                        
                        return canCancel ? (
                          <button
                            className="btn btn-danger"
                            onClick={() => handleCancel(p.MarathonID, p.UserID)}
                          >
                            Cancel
                          </button>
                        ) : null
                      } catch (err) {
                        console.error('Error checking cancel eligibility:', err)
                        return null
                      }
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      )}
    </div>
  )
}

export default MyParticipations

