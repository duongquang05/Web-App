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

function TableManagement() {
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [tableData, setTableData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      const response = await api.get('/admin/tables')
      setTables(response.data.data)
    } catch (error) {
      console.error('Error fetching tables:', error)
    }
  }

  const fetchTableData = async (tableName) => {
    setLoading(true)
    setSelectedTable(tableName)
    try {
      const response = await api.get(`/admin/table/${tableName}`)
      setTableData(response.data.data)
    } catch (error) {
      console.error('Error fetching table data:', error)
      setTableData([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="card">
        <h3>Database Tables</h3>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          {tables.map((table) => (
            <button
              key={table}
              className={`btn ${selectedTable === table ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => fetchTableData(table)}
            >
              {table}
            </button>
          ))}
        </div>
      </div>
      {selectedTable && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>Table: {selectedTable}</h3>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : tableData.length === 0 ? (
            <p>No data</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    {Object.keys(tableData[0]).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, idx) => (
                    <tr key={idx}>
                      {Object.entries(row).map(([key, value], i) => {
                        // Format TimeRecord column to show only time
                        if (key === 'TimeRecord' && value !== null && value !== undefined) {
                          return <td key={i}>{formatTime(value)}</td>
                        }
                        // Mask PasswordHash for security
                        if (key === 'PasswordHash') {
                          return (
                            <td key={i} style={{ fontFamily: 'monospace', color: '#666' }}>
                              ********
                            </td>
                          )
                        }
                        return (
                          <td key={i}>{value !== null && value !== undefined ? String(value) : 'NULL'}</td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TableManagement

