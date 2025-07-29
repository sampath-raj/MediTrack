/**
 * Example Node.js client for the MediTrack ML Microservice
 * 
 * This demonstrates how to make requests to the FastAPI microservice
 * from the main Node.js backend using Axios.
 */

const axios = require('axios');

// Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Predict medicine demand based on climate and seasonal data
 * @param {Object} params - The prediction parameters
 * @param {string} params.region - Geographic region (e.g., northeast, southwest)
 * @param {number} params.month - Month of the year (1-12)
 * @param {number} params.avg_temp - Average temperature in Celsius
 * @param {number} params.humidity - Relative humidity percentage
 * @returns {Promise<Object>} - The prediction results
 */
async function predictMedicineDemand(params) {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict-demand`, params);
    return response.data;
  } catch (error) {
    console.error('Error predicting medicine demand:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
}

// Example usage
async function example() {
  try {
    // Example parameters for summer in the northeast
    const summerParams = {
      region: 'northeast',
      month: 7,  // July
      avg_temp: 28.5,
      humidity: 65
    };
    
    console.log('Predicting demand for summer conditions...');
    const summerResults = await predictMedicineDemand(summerParams);
    console.log('Summer prediction results:', JSON.stringify(summerResults, null, 2));
    
    // Example parameters for winter in the midwest
    const winterParams = {
      region: 'midwest',
      month: 1,  // January
      avg_temp: -5.0,
      humidity: 45
    };
    
    console.log('\nPredicting demand for winter conditions...');
    const winterResults = await predictMedicineDemand(winterParams);
    console.log('Winter prediction results:', JSON.stringify(winterResults, null, 2));
    
  } catch (error) {
    console.error('Example failed:', error.message);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  example();
}

module.exports = { predictMedicineDemand };