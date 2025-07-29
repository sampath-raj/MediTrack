const express = require('express');
const router = express.Router();
const { 
  getAlerts, 
  getAlertById, 
  updateAlertStatus,
  getRecentAlerts,
  getAlertSummary,
  generateAlerts
} = require('../controllers/alertController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// Get routes
router.get('/', getAlerts);
router.get('/recent', getRecentAlerts);
router.get('/summary', getAlertSummary);
router.get('/:id', getAlertById);

// Update route
router.put('/:id', updateAlertStatus);

// Generate alerts route (admin only)
router.post('/generate', admin, generateAlerts);

module.exports = router;
