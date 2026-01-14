const { getPool, sql } = require('../config/db');

// Business rules:
// - Table: dbo.Participate
// - Composite PK: (MarathonID, UserID)
// - EntryNumber: bib number, unique constraint (must be unique)
// - EntryNumber < 0: pending approval (using -UserID to ensure uniqueness)
// - EntryNumber > 0: accepted and assigned entry number
// - Cancellation: delete record from Participate table (as per requirements)
//   This preserves user data while removing participation record

async function createParticipation({ marathonId, userId, hotel = null }) {
  const pool = await getPool();
  const request = pool.request();
  request.input('MarathonID', sql.Int, marathonId);
  request.input('UserID', sql.Int, userId);
  request.input('Hotel', sql.NVarChar, hotel);
  
  // EntryNumber has UNIQUE constraint, so we need a unique value for pending
  // Use negative UserID as temporary pending marker (unique per user)
  // Admin will assign the real entry number (starting from 1) when accepting
  // Negative numbers ensure uniqueness and are easy to identify as pending
  request.input('EntryNumber', sql.Int, -userId); // Negative UserID = pending approval

  const query = `
    INSERT INTO dbo.Participate (MarathonID, UserID, EntryNumber, Hotel)
    VALUES (@MarathonID, @UserID, @EntryNumber, @Hotel);
  `;

  await request.query(query);
}

async function getParticipation(marathonId, userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('MarathonID', sql.Int, marathonId)
    .input('UserID', sql.Int, userId)
    .query(
      'SELECT MarathonID, UserID, EntryNumber, Hotel, ' +
        'CASE WHEN TimeRecord IS NULL THEN NULL ELSE CONVERT(VARCHAR(8), TimeRecord, 108) END AS TimeRecord, ' +
        'Standings ' +
        'FROM dbo.Participate WHERE MarathonID = @MarathonID AND UserID = @UserID'
    );
  return result.recordset[0] || null;
}

async function getMyParticipations(userId) {
  const pool = await getPool();
  const query = `
    SELECT p.MarathonID,
           p.UserID,
           p.EntryNumber,
           p.Hotel,
           CASE 
             WHEN p.TimeRecord IS NULL THEN NULL
             ELSE CONVERT(VARCHAR(8), p.TimeRecord, 108)
           END AS TimeRecord,
           p.Standings,
           m.RaceName,
           m.RaceDate,
           m.Status,
           CASE 
             WHEN p.EntryNumber <= 0 THEN 'Pending'
             ELSE CAST(p.EntryNumber AS VARCHAR)
           END AS EntryNumberDisplay
    FROM dbo.Participate p
    JOIN dbo.Marathons m ON p.MarathonID = m.MarathonID
    WHERE p.UserID = @UserID
    ORDER BY m.RaceDate;
  `;
  const result = await pool
    .request()
    .input('UserID', sql.Int, userId)
    .query(query);
  return result.recordset;
}

async function cancelParticipation(marathonId, userId) {
  const pool = await getPool();
  const request = pool.request();
  request.input('MarathonID', sql.Int, marathonId);
  request.input('UserID', sql.Int, userId);

  // According to requirements: "cancellation should be implemented by deleting 
  // only the corresponding data in the participate table"
  // This preserves user data while removing participation record
  const query = `
    DELETE FROM dbo.Participate
    WHERE MarathonID = @MarathonID AND UserID = @UserID;
  `;
  await request.query(query);
}

async function deleteAllParticipationsWithoutResults(userId) {
  // Delete all participation records that don't have TimeRecord and Standings
  // This allows deleting participant if they only have pending/registered participations
  const pool = await getPool();
  const request = pool.request();
  request.input('UserID', sql.Int, userId);
  
  const query = `
    DELETE FROM dbo.Participate
    WHERE UserID = @UserID 
      AND (TimeRecord IS NULL OR Standings IS NULL);
  `;
  
  const result = await request.query(query);
  return result.rowsAffected[0]; // Return number of deleted records
}

async function getAllParticipations() {
  const pool = await getPool();
  const query = `
    SELECT p.MarathonID,
           p.UserID,
           p.EntryNumber,
           p.Hotel,
           CASE 
             WHEN p.TimeRecord IS NULL THEN NULL
             ELSE CONVERT(VARCHAR(8), p.TimeRecord, 108)
           END AS TimeRecord,
           p.Standings,
           m.RaceName,
           m.RaceDate,
           m.Status,
           u.FullName,
           u.Email,
           CASE 
             WHEN p.EntryNumber <= 0 THEN 'Pending'
             ELSE CAST(p.EntryNumber AS VARCHAR)
           END AS EntryNumberDisplay
    FROM dbo.Participate p
    JOIN dbo.Marathons m ON p.MarathonID = m.MarathonID
    JOIN dbo.Participants u ON p.UserID = u.UserID
    ORDER BY m.RaceDate, 
             CASE WHEN p.EntryNumber <= 0 THEN 999999 ELSE p.EntryNumber END;
  `;
  const result = await pool.request().query(query);
  return result.recordset;
}

async function hasParticipations(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserID', sql.Int, userId)
    .query('SELECT COUNT(*) as count FROM dbo.Participate WHERE UserID = @UserID');
  return result.recordset[0].count > 0;
}

async function hasResults(userId) {
  // Check if participant has TimeRecord and Standings (completed marathon results)
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserID', sql.Int, userId)
    .query(`
      SELECT COUNT(*) as count 
      FROM dbo.Participate 
      WHERE UserID = @UserID 
        AND TimeRecord IS NOT NULL 
        AND Standings IS NOT NULL
    `);
  return result.recordset[0].count > 0;
}

async function acceptParticipation(marathonId, userId, entryNumber = null) {
  const pool = await getPool();
  const request = pool.request();
  request.input('MarathonID', sql.Int, marathonId);
  request.input('UserID', sql.Int, userId);

  let finalEntryNumber;

  if (entryNumber !== null && entryNumber !== undefined) {
    // Admin provided entry number
    finalEntryNumber = parseInt(entryNumber, 10);
    if (isNaN(finalEntryNumber) || finalEntryNumber <= 0) {
      throw new Error('Entry number must be a positive integer');
    }

    // Check if entry number already exists for this marathon
    const checkResult = await pool
      .request()
      .input('MarathonID', sql.Int, marathonId)
      .input('EntryNumber', sql.Int, finalEntryNumber)
      .query('SELECT COUNT(*) AS Count FROM dbo.Participate WHERE MarathonID = @MarathonID AND EntryNumber = @EntryNumber');

    if (checkResult.recordset[0].Count > 0) {
      throw new Error(`Entry number ${finalEntryNumber} already exists for this marathon`);
    }
  } else {
    // Auto-assign next entry number
    const maxResult = await pool
      .request()
      .input('MarathonID', sql.Int, marathonId)
      .query('SELECT MAX(EntryNumber) AS MaxEntry FROM dbo.Participate WHERE MarathonID = @MarathonID AND EntryNumber > 0');

    finalEntryNumber = (maxResult.recordset[0]?.MaxEntry || 0) + 1;
  }

  request.input('EntryNumber', sql.Int, finalEntryNumber);

  const query = `
    UPDATE dbo.Participate
    SET EntryNumber = @EntryNumber
    WHERE MarathonID = @MarathonID AND UserID = @UserID;
  `;

  await request.query(query);
  return finalEntryNumber;
}

async function setResult(marathonId, userId, { timeRecord, standings }) {
  const pool = await getPool();
  const request = pool.request();
  request.input('MarathonID', sql.Int, marathonId);
  request.input('UserID', sql.Int, userId);
  request.input('Standings', sql.Int, standings);

  // Parse and validate time format
  // Accept formats: "HH:MM:SS", "H:MM:SS", "HH:MM", "H:MM"
  let timeValue = timeRecord;
  
  if (typeof timeRecord === 'string') {
    // Validate time format (HH:MM:SS or HH:MM)
    const timeRegex = /^(\d{1,2}):(\d{2})(:(\d{2}))?$/;
    const match = timeRecord.trim().match(timeRegex);
    
    if (!match) {
      throw new Error('Invalid time format. Use HH:MM:SS or HH:MM');
    }

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = match[4] ? parseInt(match[4], 10) : 0;

    if (hours < 0 || hours > 23) {
      throw new Error('Hours must be between 0 and 23');
    }
    if (minutes < 0 || minutes > 59) {
      throw new Error('Minutes must be between 0 and 59');
    }
    if (seconds < 0 || seconds > 59) {
      throw new Error('Seconds must be between 0 and 59');
    }

    // Format as HH:MM:SS for SQL Server
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    timeValue = formattedTime;
  }

  // Use NVarChar and CAST to Time in SQL to avoid parsing issues
  request.input('TimeRecordStr', sql.NVarChar, timeValue);
  
  const query = `
    UPDATE dbo.Participate
    SET TimeRecord = CAST(@TimeRecordStr AS TIME),
        Standings = @Standings
    WHERE MarathonID = @MarathonID AND UserID = @UserID;
  `;

  await request.query(query);
}

module.exports = {
  createParticipation,
  getParticipation,
  getMyParticipations,
  cancelParticipation,
  getAllParticipations,
  acceptParticipation,
  setResult,
  hasParticipations,
  hasResults,
  deleteAllParticipationsWithoutResults,
};











