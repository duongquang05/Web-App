import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import MarathonManagement from '../components/admin/MarathonManagement'
import ParticipationManagement from '../components/admin/ParticipationManagement'
import ParticipantManagement from '../components/admin/ParticipantManagement'
import TableManagement from '../components/admin/TableManagement'
import CourseMap from '../components/participant/CourseMap'
import '../App.css'

function AdminDashboard() {
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
          <h2>🏃 Hanoi Marathon - Admin</h2>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span className="dashboard-welcome">Welcome, <strong>{user?.fullName || user?.email}</strong></span>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>
      <div className="container" style={{ marginTop: '20px' }}>
        <div className="dashboard-menu">
          <Link to="/admin/marathons" className="nav-link">
            Marathon Management
          </Link>
          <Link to="/admin/participations" className="nav-link">
            Participation Management
          </Link>
          <Link to="/admin/participants" className="nav-link">
            Participant Management
          </Link>
          <Link to="/admin/tables" className="nav-link">
            Database Tables
          </Link>
          <Link to="/admin/map" className="nav-link">
            Course Map
          </Link>
        </div>
        <Routes>
          <Route path="marathons" element={<MarathonManagement />} />
          <Route path="participations" element={<ParticipationManagement />} />
          <Route path="participants" element={<ParticipantManagement />} />
          <Route path="tables" element={<TableManagement />} />
          <Route path="map" element={<CourseMap />} />
          <Route path="*" element={<Navigate to="/admin/marathons" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default AdminDashboard

