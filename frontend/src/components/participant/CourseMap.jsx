import { useState, useEffect } from 'react'
import api from '../../utils/api'
import '../../App.css'
import './CourseMap.css'

function CourseMap() {
  const [passingPoints, setPassingPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchPassingPoints()
    initializeJQueryEffects()
  }, [])

  useEffect(() => {
    if (showModal) {
      initializeModalEffects()
    }
  }, [showModal, selectedPoint])

  const fetchPassingPoints = async () => {
    try {
      const response = await api.get('/passing-points')
      setPassingPoints(response.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching passing points:', error)
      setLoading(false)
    }
  }

  const initializeJQueryEffects = () => {
    // jQuery effects removed - no map points to animate
  }

  const initializeModalEffects = () => {
    if (window.$) {
      window.$('#map-modal').fadeIn(300)
      window.$('#map-modal').on('click', function(e) {
        if (e.target === this) {
          closeModal()
        }
      })
      window.$('.modal-close').on('click', function() {
        closeModal()
      })
      window.$(document).on('keydown', function(e) {
        if (e.key === 'Escape' && showModal) {
          closeModal()
        }
      })
    }
  }

  const handlePointClick = async (point) => {
    try {
      const response = await api.get(`/passing-points/${point.PointID}`)
      setSelectedPoint(response.data.data)
      setShowModal(true)
    } catch (error) {
      console.error('Error fetching point details:', error)
      setSelectedPoint(point)
      setShowModal(true)
    }
  }

  const closeModal = () => {
    if (window.$) {
      window.$('#map-modal').fadeOut(300, () => {
        setShowModal(false)
        setSelectedPoint(null)
      })
    } else {
      setShowModal(false)
      setSelectedPoint(null)
    }
  }

  const getImageSrc = (point) => {
    if (point.PhotoPath) return point.PhotoPath
    if (point.ThumbnailPath) return point.ThumbnailPath
    const pointName = encodeURIComponent(point.PointName.substring(0, 30))
    const distance = point.DistanceFromStart ? `${point.DistanceFromStart}km` : ''
    return `https://via.placeholder.com/600x400/2e7d32/ffffff?text=${pointName}+${distance}`
  }


  if (loading) return <div className="loading">Loading map...</div>

  return (
    <div className="card">
      <h3>🗺️ Marathon Course Map</h3>

      {passingPoints.length === 0 ? (
        <p>No passing points available yet.</p>
      ) : (
        <div className="map-container">
          {/* Map Background with Custom Image */}
          <div className="map-background">
            {/* Custom Map Image */}
            <img
              src="/images/marathon-course-map.jpg"
              alt="Marathon Course Map"
              className="map-image"
              onError={(e) => {
                // Fallback to SVG route if image not found
                e.target.style.display = 'none'
                const svg = e.target.nextElementSibling
                if (svg) svg.style.display = 'block'
              }}
            />
            
            {/* Route Line (SVG fallback) */}
            <svg className="route-line" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: 'none' }}>
              <path
                d="M 5,50 Q 25,30 45,50 T 85,50 Q 90,45 95,50"
                stroke="#2e7d32"
                strokeWidth="3"
                fill="none"
                strokeDasharray="5,5"
              />
            </svg>


          </div>

          {/* Points List */}
          <div className="points-list">
            <h4>Passing Points</h4>
            <div className="points-grid">
              {passingPoints.map((point) => (
                <div
                  key={point.PointID}
                  className="point-card"
                  onClick={() => handlePointClick(point)}
                >
                  <div className="point-card-number">
                    {point.DistanceFromStart ? `${point.DistanceFromStart}km` : '0km'}
                  </div>
                  <div className="point-card-name">{point.PointName}</div>
                  {point.Location && (
                    <div className="point-card-location">{point.Location}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal for detailed information */}
      {showModal && selectedPoint && (
        <div id="map-modal" className="map-modal" style={{ display: 'none' }}>
          <div className="modal-content">
            <span className="modal-close">&times;</span>
            <div className="modal-body">
              <div className="modal-image-section">
                <img
                  src={getImageSrc(selectedPoint)}
                  alt={selectedPoint.PointName}
                  className="modal-image"
                  onError={(e) => {
                    const pointName = encodeURIComponent(selectedPoint.PointName.substring(0, 30))
                    e.target.src = `https://via.placeholder.com/600x400/2e7d32/ffffff?text=${pointName}`
                  }}
                />
              </div>
              <div className="modal-info-section">
                <h2>{selectedPoint.PointName}</h2>
                {selectedPoint.DistanceFromStart && (
                  <div className="info-row">
                    <strong>Distance from Start:</strong>
                    <span>{selectedPoint.DistanceFromStart} km</span>
                  </div>
                )}
                {selectedPoint.Location && (
                  <div className="info-row">
                    <strong>Location:</strong>
                    <span>{selectedPoint.Location}</span>
                  </div>
                )}
                {selectedPoint.Description && (
                  <div className="info-row description">
                    <strong>Description:</strong>
                    <p>{selectedPoint.Description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseMap

