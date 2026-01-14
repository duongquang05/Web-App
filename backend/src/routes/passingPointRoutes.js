const express = require('express');
const router = express.Router();
const passingPointController = require('../controllers/passingPointController');

// Public routes - anyone can view passing points gallery
router.get('/passing-points', passingPointController.getAllPassingPoints);
router.get('/passing-points/:id', passingPointController.getPassingPointById);

module.exports = router;

