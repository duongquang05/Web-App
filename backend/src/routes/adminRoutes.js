const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const adminController = require('../controllers/adminController');
const passingPointController = require('../controllers/passingPointController');

// All admin routes require ADMIN role
router.use(auth, requireRole('ADMIN'));

// Marathons CRUD
router.get('/marathons', adminController.listMarathons);
router.post('/marathons', adminController.createMarathon);
router.put('/marathons/:id', adminController.updateMarathon);
router.delete('/marathons/:id', adminController.deleteMarathon);
router.post('/marathons/:id/cancel', adminController.cancelMarathon);

// Participations
router.get('/participations', adminController.getAllParticipations);
router.post('/participations/:id/accept', adminController.acceptParticipation);
router.post('/participations/:id/result', adminController.setResult);

// Tables
router.get('/tables', adminController.listTables);
router.get('/table/:name', adminController.getTable);

// Passing Points Management (Admin only)
router.post('/passing-points', passingPointController.createPassingPoint);
router.put('/passing-points/:id', passingPointController.updatePassingPoint);
router.delete('/passing-points/:id', passingPointController.deletePassingPoint);

// Participants Management (Admin only)
router.put('/participants/:id', adminController.updateParticipant);
router.delete('/participants/:id', adminController.deleteParticipant);

module.exports = router;











