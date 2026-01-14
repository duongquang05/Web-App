import { useState, useEffect } from 'react'
import api from '../../utils/api'
import '../../App.css'
import './CourseGallery.css'

function CourseGallery() {
  const [passingPoints, setPassingPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchPassingPoints()
    // Initialize jQuery effects after component mounts
    initializeJQueryEffects()
  }, [])

  useEffect(() => {
    // Re-initialize jQuery when modal state changes
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
    // Wait for DOM to be ready
    setTimeout(() => {
      if (window.$) {
        // Fade in gallery items (only if they're not already visible)
        window.$('.gallery-item').each(function() {
          if (window.$(this).css('opacity') === '0' || window.$(this).is(':hidden')) {
            window.$(this).css({ opacity: 0, display: 'block' }).fadeIn(600)
          }
        })
        
        // Hover effects
        window.$('.gallery-item').hover(
          function() {
            window.$(this).find('.gallery-overlay').fadeIn(200)
          },
          function() {
            window.$(this).find('.gallery-overlay').fadeOut(200)
          }
        )

        // Click animation
        window.$('.gallery-item').on('click', function() {
          window.$(this).addClass('clicked')
          setTimeout(() => {
            window.$(this).removeClass('clicked')
          }, 300)
        })
      }
    }, 100)
  }

  const initializeModalEffects = () => {
    if (window.$) {
      // Fade in modal
      window.$('#gallery-modal').fadeIn(300)
      
      // Close modal on background click
      window.$('#gallery-modal').on('click', function(e) {
        if (e.target === this) {
          closeModal()
        }
      })

      // Close modal on X button
      window.$('.modal-close').on('click', function() {
        closeModal()
      })

      // Escape key to close
      window.$(document).on('keydown', function(e) {
        if (e.key === 'Escape' && showModal) {
          closeModal()
        }
      })
    }
  }

  const handleImageClick = async (point) => {
    try {
      // Fetch full details
      const response = await api.get(`/passing-points/${point.PointID}`)
      setSelectedPoint(response.data.data)
      setShowModal(true)
    } catch (error) {
      console.error('Error fetching point details:', error)
      // Still show modal with available data
      setSelectedPoint(point)
      setShowModal(true)
    }
  }

  const getImageSrc = (point, isThumbnail = false) => {
    
    if (point.PhotoPath) {
      return point.PhotoPath
    }
   
    if (point.ThumbnailPath) {
      return point.ThumbnailPath
    }
    // Fallback to placeholder
    return getPlaceholderImage(point, isThumbnail)
  }

  const getPlaceholderImage = (point, isThumbnail = false) => {
    // Generate placeholder based on point name
    const pointName = encodeURIComponent(point.PointName.substring(0, 30))
    const distance = point.DistanceFromStart ? `${point.DistanceFromStart}km` : ''
    const size = isThumbnail ? '300x200' : '1200x800'
    return `https://via.placeholder.com/${size}/2e7d32/ffffff?text=${pointName}+${distance}`
  }

  const getPlaceholderImageFull = (point) => {
    return getPlaceholderImage(point, false)
  }

  const closeModal = () => {
    if (window.$) {
      window.$('#gallery-modal').fadeOut(300, () => {
        setShowModal(false)
        setSelectedPoint(null)
      })
    } else {
      setShowModal(false)
      setSelectedPoint(null)
    }
  }

  if (loading) return <div className="loading">Loading gallery...</div>

  return (
    <div className="card">
      <h3>🏃 Marathon Course - Passing Points Gallery</h3>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Click on any photo to view detailed information about the passing point
      </p>
      
      {passingPoints.length === 0 ? (
        <p>No passing points available yet.</p>
      ) : (
        <div className="gallery-container">
          {passingPoints.map((point) => (
            <div
              key={point.PointID}
              className="gallery-item"
              onClick={() => handleImageClick(point)}
            >
              <div className="gallery-thumbnail-wrapper">
                <img
                  src={getImageSrc(point, true)}
                  alt={point.PointName}
                  className="gallery-thumbnail"
                  style={{ 
                    display: 'block',
                    minHeight: '200px',
                    backgroundColor: '#e8f5e9'
                  }}
                  onError={(e) => {
                    console.log('Image load error, using placeholder:', point.PointName)
                    e.target.src = getPlaceholderImage(point, true)
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', point.PointName)
                  }}
                />
                <div className="gallery-overlay">
                  <span className="gallery-view-icon">👁️ View Details</span>
                </div>
              </div>
              <div className="gallery-item-info">
                <h4>{point.PointName}</h4>
                {point.DistanceFromStart && (
                  <p className="gallery-distance">{point.DistanceFromStart} km</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for detailed information */}
      {showModal && selectedPoint && (
        <div id="gallery-modal" className="gallery-modal" style={{ display: 'none' }}>
          <div className="modal-content">
            <span className="modal-close">&times;</span>
            <div className="modal-body">
              <div className="modal-image-section">
                <img
                  src={getImageSrc(selectedPoint, false)}
                  alt={selectedPoint.PointName}
                  className="modal-image"
                  onError={(e) => {
                    e.target.src = getPlaceholderImageFull(selectedPoint)
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

export default CourseGallery

