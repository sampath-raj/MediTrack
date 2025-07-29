const express = require('express');
const router = express.Router();
const { 
  createTransaction, 
  getTransactions, 
  getTransactionById,
  getSalesSummary
} = require('../controllers/transactionController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// Get transactions with optional filtering
router.get('/', getTransactions);

// Get sales summary
router.get('/sales-summary', getSalesSummary);

// Get transaction by ID
router.get('/:id', getTransactionById);

// Create a transaction
router.post('/', createTransaction);

module.exports = router;
