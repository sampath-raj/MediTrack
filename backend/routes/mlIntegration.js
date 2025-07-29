const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');

// Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Get medicine demand prediction from ML microservice
 * @route POST /api/recommendation
 * @access Private
 */
const getMedicineDemandPrediction = async (req, res) => {
  try {
    const { region, month, avg_temp, humidity } = req.body;
    
    // Validate input parameters
    if (!region || !month || avg_temp === undefined || humidity === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters: region, month, avg_temp, and humidity are required' 
      });
    }
    
    // Call the ML microservice
    const response = await axios.post(`${ML_SERVICE_URL}/predict-demand`, {
      region,
      month,
      avg_temp,
      humidity
    });
    
    // Return the prediction results
    res.json({
      success: true,
      data: response.data
    });
    
  } catch (error) {
    console.error('Error predicting medicine demand:', error.message);
    
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('ML service response error:', error.response.data);
      console.error('Status:', error.response.status);
      
      return res.status(error.response.status).json({
        success: false,
        message: 'ML service error',
        error: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('ML service connection error');
      
      return res.status(503).json({
        success: false,
        message: 'Unable to connect to ML service',
        error: 'Service unavailable'
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

// Apply protection middleware to all routes
router.use(protect);

// Route for medicine demand prediction
router.post('/', getMedicineDemandPrediction);

module.exports = router;