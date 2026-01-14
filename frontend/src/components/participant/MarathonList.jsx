import { useState, useEffect } from 'react'
import api from '../../utils/api'

function MarathonList() {
  const [marathons, setMarathons] = useState([])
  const [myParticipations, setMyParticipations] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Load marathons and user's existing registrations in parallel
    fetchMarathons()
    fetchMyParticipations()
  }, [])

  const fetchMarathons = async () => {
    try {
      const response = await api.get('/marathons')
      setMarathons(response.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching marathons:', error)
      setLoading(false)
    }
  }

  const fetchMyParticipations = async () => {
    try {
      const response = await api.get('/participations/my')
      setMyParticipations(response.data.data || [])
    } catch (error) {
      console.error('Error fetching my participations:', error)
      // Do not block the page if this fails
    }
  }

  const handleRegister = async (marathonId) => {
    const hotel = prompt('Enter hotel name (optional):')
    if (hotel === null) return

    setMessage('')
    try {
      await api.post('/participations', {
        marathonId,
        hotel: hotel || null,
      })
      setMessage('Registration successful! Waiting for admin approval.')
      fetchMarathons()
      fetchMyParticipations()
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  const registeredIds = new Set(myParticipations.map((p) => p.MarathonID))

  return (
    <div className="card">
      <h3>Available Marathons</h3>
      {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}
      {marathons.length === 0 ? (
        <p>No marathons available</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Race Name</th>
              <th>Race Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {marathons.map((marathon) => {
              const isRegistered = registeredIds.has(marathon.MarathonID)
              return (
                <tr key={marathon.MarathonID}>
                  <td>{marathon.RaceName}</td>
                  <td>{new Date(marathon.RaceDate).toLocaleDateString()}</td>
                  <td>
                    {isRegistered ? (
                      <span className="badge badge-active">Registered</span>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleRegister(marathon.MarathonID)}
                      >
                        Register
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default MarathonList

