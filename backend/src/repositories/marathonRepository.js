const { getPool, sql } = require('../config/db');

async function getAllMarathons(includeCancelled = false) {
  const pool = await getPool();
  let query = 'SELECT MarathonID, RaceName, RaceDate, Status FROM dbo.Marathons';
  
  // For participants, only show Active marathons
  // For admin, show all if includeCancelled is true
  if (!includeCancelled) {
    query += " WHERE Status = 'Active'";
  }
  
  query += ' ORDER BY RaceDate';
  
  const result = await pool.request().query(query);
  return result.recordset;
}

async function cancelMarathon(id) {
  // Mark marathon as cancelled instead of deleting
  // This preserves all historical data (participations, entry numbers, results)
  const pool = await getPool();
  const request = pool.request();
  request.input('MarathonID', sql.Int, id);
  request.input('Status', sql.NVarChar, 'Cancelled');
  
  const query = `
    UPDATE dbo.Marathons
    SET Status = @Status
    WHERE MarathonID = @MarathonID;

    SELECT MarathonID, RaceName, RaceDate, Status FROM dbo.Marathons WHERE MarathonID = @MarathonID;
  `;
  
  const result = await request.query(query);
  return result.recordset[0];
}

async function getMarathonById(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('MarathonID', sql.Int, id)
    .query('SELECT MarathonID, RaceName, RaceDate, Status FROM dbo.Marathons WHERE MarathonID = @MarathonID');
  return result.recordset[0] || null;
}

async function createMarathon({ raceName, raceDate }) {
  const pool = await getPool();
  const request = pool.request();
  request.input('RaceName', sql.NVarChar, raceName);
  request.input('RaceDate', sql.Date, raceDate);
  request.input('Status', sql.NVarChar, 'Active'); // Default status
  const query = `
    INSERT INTO dbo.Marathons (RaceName, RaceDate, Status)
    OUTPUT INSERTED.MarathonID, INSERTED.RaceName, INSERTED.RaceDate, INSERTED.Status
    VALUES (@RaceName, @RaceDate, @Status)
  `;
  const result = await request.query(query);
  return result.recordset[0];
}

async function updateMarathon(id, { raceName, raceDate, status }) {
  const pool = await getPool();
  const request = pool.request();
  request.input('MarathonID', sql.Int, id);
  if (raceName !== undefined) {
    request.input('RaceName', sql.NVarChar, raceName);
  }
  if (raceDate !== undefined) {
    request.input('RaceDate', sql.Date, raceDate);
  }
  if (status !== undefined) {
    request.input('Status', sql.NVarChar, status);
  }

  const sets = [];
  if (raceName !== undefined) sets.push('RaceName = @RaceName');
  if (raceDate !== undefined) sets.push('RaceDate = @RaceDate');
  if (status !== undefined) sets.push('Status = @Status');
  if (!sets.length) return getMarathonById(id);

  const query = `
    UPDATE dbo.Marathons
    SET ${sets.join(', ')}
    WHERE MarathonID = @MarathonID;

    SELECT MarathonID, RaceName, RaceDate, Status FROM dbo.Marathons WHERE MarathonID = @MarathonID;
  `;
  const result = await request.query(query);
  return result.recordset[0];
}

async function deleteMarathon(id) {
  const pool = await getPool();
  const request = pool.request();
  request.input('MarathonID', sql.Int, id);
  await request.query('DELETE FROM dbo.Marathons WHERE MarathonID = @MarathonID');
}

module.exports = {
  getAllMarathons,
  getMarathonById,
  createMarathon,
  updateMarathon,
  deleteMarathon,
  cancelMarathon,
};











