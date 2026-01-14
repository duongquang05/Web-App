import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import MyProfile from '../components/participant/MyProfile'
import MarathonList from '../components/participant/MarathonList'
import MyParticipations from '../components/participant/MyParticipations'
import CourseMap from '../components/participant/CourseMap'
import '../App.css'

function ParticipantDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app">
      <nav>
        <div className="container dashboard-nav-inner">
          <h2>🏃 Hanoi Marathon - Participant</h2>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span className="dashboard-welcome">Welcome, <strong>{user?.fullName || user?.email}</strong></span>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>
      <div className="container" style={{ marginTop: '20px' }}>
        <div className="dashboard-hint">
          Tip: Open the "Course Map" tab above to explore the full marathon route and passing points.
        </div>
        <div className="dashboard-menu">
          <Link to="/participant/profile" className="nav-link">
            My Profile
          </Link>
          <Link to="/participant/marathons" className="nav-link">
            Marathons
          </Link>
          <Link to="/participant/participations" className="nav-link">
            My Participations
          </Link>
          <Link to="/participant/map" className="nav-link">
            Course Map
          </Link>
        </div>
        <Routes>
          <Route path="profile" element={<MyProfile />} />
          <Route path="marathons" element={<MarathonList />} />
          <Route path="participations" element={<MyParticipations />} />
          <Route path="map" element={<CourseMap />} />
          <Route path="*" element={<Navigate to="/participant/profile" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default ParticipantDashboard

