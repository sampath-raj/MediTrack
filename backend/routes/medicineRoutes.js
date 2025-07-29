const express = require('express');
const router = express.Router();
const { 
  getMedicines, 
  getMedicineById, 
  createMedicine, 
  updateMedicine, 
  deleteMedicine,
  getSummary,
  getStockChart,
  getDemandChart,
  seedSampleData,
  getClimateDemand  // Add this new import
} = require('../controllers/medicineController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public route to seed sample data (FOR DEMO PURPOSES ONLY)
// In a production app, you would want this to be protected
router.get('/seed-sample-data', protect, seedSampleData);

// All other routes are protected
router.use(protect);

// Get routes
router.get('/', getMedicines);
router.get('/summary', getSummary);
router.get('/stock-chart', getStockChart);
router.get('/demand-chart', getDemandChart);
router.get('/climate-demand', getClimateDemand); // Add this new route
router.get('/:id', getMedicineById);

// Post/update/delete routes (admin only)
router.post('/', admin, createMedicine);
router.put('/:id', admin, updateMedicine);
router.delete('/:id', admin, deleteMedicine);

module.exports = router;
