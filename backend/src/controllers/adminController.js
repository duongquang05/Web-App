const marathonRepository = require('../repositories/marathonRepository');
const participationRepository = require('../repositories/participationRepository');
const userRepository = require('../repositories/userRepository');
const { getPool, sql } = require('../config/db');
const { decodeParticipationId } = require('./participantController');

// Marathons CRUD
async function listMarathons(req, res, next) {
  try {
    // Admin can see all marathons including cancelled ones
    const marathons = await marathonRepository.getAllMarathons(true);
    res.json({ success: true, data: marathons });
  } catch (err) {
    next(err);
  }
}

async function createMarathon(req, res, next) {
  try {
    const { raceName, raceDate } = req.body;
    if (!raceName || !raceDate) {
      return res.status(400).json({ success: false, message: 'raceName and raceDate are required' });
    }
    const marathon = await marathonRepository.createMarathon({ raceName, raceDate });
    res.status(201).json({ success: true, data: marathon });
  } catch (err) {
    next(err);
  }
}

async function updateMarathon(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const marathon = await marathonRepository.updateMarathon(id, {
      raceName: req.body.raceName,
      raceDate: req.body.raceDate,
      status: req.body.status,
    });
    res.json({ success: true, data: marathon });
  } catch (err) {
    next(err);
  }
}

async function cancelMarathon(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    
    const marathon = await marathonRepository.cancelMarathon(id);
    res.json({ 
      success: true, 
      message: 'Marathon cancelled successfully. All participations and data are preserved.',
      data: marathon 
    });
  } catch (err) {
    next(err);
  }
}

async function deleteMarathon(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    
    // Check if marathon has participations
    const participations = await participationRepository.getAllParticipations();
    const hasParticipations = participations.some(p => p.MarathonID === id);
    
    if (hasParticipations) {
      // Don't delete if there are participations - this would lose historical data
      // Instead, suggest using cancelMarathon or handle manually
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete marathon with existing participations. This would lose historical data. Consider marking as cancelled instead.' 
      });
    }
    
    await marathonRepository.deleteMarathon(id);
    res.json({ success: true, message: 'Marathon deleted' });
  } catch (err) {
    // If foreign key constraint error, provide helpful message
    if (err.code === 'EREQUEST' && err.message && err.message.includes('FOREIGN KEY')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete marathon with existing participations. This would violate referential integrity and lose historical data.',
      });
    }
    next(err);
  }
}

// Participations
async function getAllParticipations(req, res, next) {
  try {
    const participations = await participationRepository.getAllParticipations();
    res.json({ success: true, data: participations });
  } catch (err) {
    next(err);
  }
}

async function acceptParticipation(req, res, next) {
  try {
    const decoded = decodeParticipationId(req.params.id);
    if (!decoded) {
      return res.status(400).json({ success: false, message: 'Invalid participation id format' });
    }
    const { marathonId, userId } = decoded;

    // entryNumber is optional - if provided, use it; otherwise auto-assign
    const { entryNumber } = req.body;

    const assignedEntry = await participationRepository.acceptParticipation(marathonId, userId, entryNumber);
    res.json({
      success: true,
      message: entryNumber ? `Participation accepted with entry number ${assignedEntry}` : `Participation accepted, entry number ${assignedEntry} assigned automatically`,
      data: { marathonId, userId, entryNumber: assignedEntry },
    });
  } catch (err) {
    if (err.message && (err.message.includes('already exists') || err.message.includes('positive integer'))) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
}

async function setResult(req, res, next) {
  try {
    const decoded = decodeParticipationId(req.params.id);
    if (!decoded) {
      return res.status(400).json({ success: false, message: 'Invalid participation id format' });
    }
    const { marathonId, userId } = decoded;
    const { timeRecord, standings } = req.body;

    if (!timeRecord || standings === undefined) {
      return res.status(400).json({
        success: false,
        message: 'timeRecord and standings are required',
      });
    }

    await participationRepository.setResult(marathonId, userId, {
      timeRecord,
      standings,
    });

    res.json({ success: true, message: 'Result updated' });
  } catch (err) {
    // Handle validation errors
    if (err.message && (err.message.includes('Invalid time format') || 
                        err.message.includes('Hours must be') ||
                        err.message.includes('Minutes must be') ||
                        err.message.includes('Seconds must be'))) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
}

// Generic admin table viewing with whitelist
const TABLE_WHITELIST = ['Marathons', 'Participants', 'Participate'];

async function listTables(req, res, next) {
  try {
    res.json({ success: true, data: TABLE_WHITELIST });
  } catch (err) {
    next(err);
  }
}

async function getTable(req, res, next) {
  try {
    const name = req.params.name;
    if (!TABLE_WHITELIST.includes(name)) {
      return res.status(400).json({ success: false, message: 'Table not allowed' });
    }
    const pool = await getPool();
    
    // Format specific columns based on table
    let query;
    if (name === 'Participate') {
      query = `
        SELECT 
          MarathonID,
          UserID,
          EntryNumber,
          Hotel,
          CASE 
            WHEN TimeRecord IS NULL THEN NULL
            ELSE CONVERT(VARCHAR(8), TimeRecord, 108)
          END AS TimeRecord,
          Standings
        FROM dbo.[${name}]
      `;
    } else if (name === 'Marathons') {
      query = `
        SELECT 
          MarathonID,
          RaceName,
          CONVERT(VARCHAR(10), RaceDate, 120) AS RaceDate,
          Status
        FROM dbo.[${name}]
      `;
    } else if (name === 'Participants') {
      // Exclude PasswordHash for security, or mask it
      query = `
        SELECT 
          UserID,
          FullName,
          Email,
          Nationality,
          Sex,
          BirthYear,
          PassportNo,
          Mobile,
          CurrentAddress,
          BestRecord,
          CASE 
            WHEN PasswordHash IS NOT NULL THEN '********' 
            ELSE NULL 
          END AS PasswordHash
        FROM dbo.[${name}]
      `;
    } else {
      query = `SELECT * FROM dbo.[${name}]`;
    }
    
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
}

async function updateParticipant(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid participant id' });
    }

    const {
      fullName,
      email,
      nationality,
      sex,
      birthYear,
      passportNo,
      mobile,
      currentAddress,
      bestRecord,
    } = req.body;

    const update = {};
    if (fullName !== undefined) update.FullName = fullName;
    if (email !== undefined) update.Email = email;
    if (nationality !== undefined) update.Nationality = nationality;
    if (sex !== undefined) update.Sex = sex;
    if (birthYear !== undefined) update.BirthYear = birthYear;
    if (passportNo !== undefined) update.PassportNo = passportNo;
    if (mobile !== undefined) update.Mobile = mobile;
    if (currentAddress !== undefined) update.CurrentAddress = currentAddress;
    if (bestRecord !== undefined) update.BestRecord = bestRecord;

    const participant = await userRepository.updateParticipant(id, update);
    res.json({ success: true, data: participant });
  } catch (err) {
    next(err);
  }
}

async function deleteParticipant(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid participant id' });
    }

    // Check if participant has TimeRecord and Standings (completed marathon results)
    const hasResults = await participationRepository.hasResults(id);

    if (hasResults) {
      // Don't delete if participant has completed marathon results (TimeRecord and Standings)
      // This preserves historical race results data
      return res.status(400).json({
        success: false,
        message: 'Cannot delete participant with existing race results (TimeRecord and Standings). This would lose historical marathon data.',
      });
    }

    // Check if trying to delete admin
    const participant = await userRepository.findById(id);
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    if (participant.Nationality === 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin account',
      });
    }

    // Delete participation records without results first (to avoid foreign key constraint)
    // This allows deleting participant if they only have pending/registered participations
    await participationRepository.deleteAllParticipationsWithoutResults(id);

    // Now delete the participant
    await userRepository.deleteParticipant(id);
    res.json({ success: true, message: 'Participant and related participation records (without results) deleted successfully' });
  } catch (err) {
    // If foreign key constraint error, provide helpful message
    if (err.code === 'EREQUEST' && err.message && err.message.includes('FOREIGN KEY')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete participant with existing participation records. This would violate referential integrity and lose historical data.',
      });
    }
    next(err);
  }
}

module.exports = {
  listMarathons,
  createMarathon,
  updateMarathon,
  deleteMarathon,
  cancelMarathon,
  getAllParticipations,
  acceptParticipation,
  setResult,
  listTables,
  getTable,
  updateParticipant,
  deleteParticipant,
};











