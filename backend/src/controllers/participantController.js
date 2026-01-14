const userRepository = require('../repositories/userRepository');
const marathonRepository = require('../repositories/marathonRepository');
const participationRepository = require('../repositories/participationRepository');

async function getMe(req, res, next) {
  try {
    const user = await userRepository.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({
      success: true,
      data: {
        id: user.UserID,
        fullName: user.FullName,
        email: user.Email,
        role: user.Nationality,
        profile: {
          bestRecord: user.BestRecord,
          nationality: user.Nationality,
          sex: user.Sex,
          birthYear: user.BirthYear,
          passportNo: user.PassportNo,
          mobile: user.Mobile,
          currentAddress: user.CurrentAddress,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const allowedFields = [
      'FullName',
      'BestRecord',
      'Nationality',
      'Sex',
      'BirthYear',
      'PassportNo',
      'Email',
      'Mobile',
      'CurrentAddress',
    ];
    const payload = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        payload[field] = req.body[field];
      }
    }
    const user = await userRepository.updateProfile(req.user.id, payload);
    return res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function listMarathons(req, res, next) {
  try {
    const marathons = await marathonRepository.getAllMarathons();
    return res.json({ success: true, data: marathons });
  } catch (err) {
    next(err);
  }
}

// For endpoints requiring :id, we'll encode composite key as "marathonId-userId"
function decodeParticipationId(id) {
  const parts = String(id).split('-');
  if (parts.length !== 2) return null;
  const marathonId = parseInt(parts[0], 10);
  const userId = parseInt(parts[1], 10);
  if (Number.isNaN(marathonId) || Number.isNaN(userId)) return null;
  return { marathonId, userId };
}

async function registerMarathon(req, res, next) {
  try {
    const { marathonId, hotel } = req.body;
    if (!marathonId) {
      return res.status(400).json({ success: false, message: 'marathonId is required' });
    }

    const marathon = await marathonRepository.getMarathonById(marathonId);
    if (!marathon) {
      return res.status(404).json({ success: false, message: 'Marathon not found' });
    }

    // Check if marathon is available for registration
    if (marathon.Status !== 'Active') {
      const statusMessages = {
        'Cancelled': 'This marathon has been cancelled',
        'Postponed': 'This marathon has been postponed',
        'Completed': 'This marathon has already been completed',
      };
      return res.status(400).json({
        success: false,
        message: statusMessages[marathon.Status] || 'This marathon is not available for registration',
      });
    }

    const existing = await participationRepository.getParticipation(marathonId, req.user.id);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already registered this marathon',
      });
    }

    await participationRepository.createParticipation({
      marathonId,
      userId: req.user.id,
      hotel: hotel || null,
    });

    return res.status(201).json({ success: true, message: 'Registered successfully' });
  } catch (err) {
    next(err);
  }
}

async function myParticipations(req, res, next) {
  try {
    const participations = await participationRepository.getMyParticipations(req.user.id);
    return res.json({ success: true, data: participations });
  } catch (err) {
    next(err);
  }
}

async function cancelParticipationController(req, res, next) {
  try {
    const decoded = decodeParticipationId(req.params.id);
    if (!decoded) {
      return res.status(400).json({ success: false, message: 'Invalid participation id format' });
    }
    const { marathonId, userId } = decoded;
    if (userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Cannot cancel others participation' });
    }

    const participation = await participationRepository.getParticipation(marathonId, userId);
    if (!participation) {
      return res.status(404).json({ success: false, message: 'Participation not found' });
    }

    const marathon = await marathonRepository.getMarathonById(marathonId);
    if (!marathon) {
      return res.status(404).json({ success: false, message: 'Marathon not found' });
    }

    const raceDate = new Date(marathon.RaceDate);
    raceDate.setHours(0, 0, 0, 0); // Set to start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    
    // Can only cancel up until the day before the marathon
    if (raceDate <= today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel participation on or after race date. Cancellation must be done before the race date.',
      });
    }

    await participationRepository.cancelParticipation(marathonId, userId);
    return res.json({ success: true, message: 'Participation cancelled successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  updateMe,
  listMarathons,
  registerMarathon,
  myParticipations,
  cancelParticipation: cancelParticipationController,
  decodeParticipationId,
};











