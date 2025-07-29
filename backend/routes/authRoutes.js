const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ✅ Test Route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth API is working!' });
});

// 🔹 Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// 🔹 Protected Routes
router.get('/profile', protect, getUserProfile);

module.exports = router;
