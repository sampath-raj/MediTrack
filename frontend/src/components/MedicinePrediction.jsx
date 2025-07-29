import React, { useState } from 'react';
import axios from 'axios';

// API base URL - should be configured based on environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MedicinePrediction = () => {
  // Form state
  const [formData, setFormData] = useState({
    region: 'northeast',
    month: 7,
    avg_temp: 28.5,
    humidity: 65
  });

  // Results state
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'month' || name === 'avg_temp' || name === 'humidity' 
        ? parseFloat(value) 
        : value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/recommendation`, formData);
      setPredictions(response.data.data.predictions);
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError(
        err.response?.data?.message || 
        'Failed to get predictions. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Medicine Demand Prediction</h2>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Region Selection */}
          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
              Region
            </label>
            <select
              id="region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="northeast">Northeast</option>
              <option value="southeast">Southeast</option>
              <option value="midwest">Midwest</option>
              <option value="southwest">Southwest</option>
              <option value="west">West</option>
            </select>
          </div>
          
          {/* Month Selection */}
          <div>
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              id="month"
              name="month"
              value={formData.month}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          
          {/* Average Temperature */}
          <div>
            <label htmlFor="avg_temp" className="block text-sm font-medium text-gray-700 mb-1">
              Average Temperature (°C)
            </label>
            <input
              type="number"
              id="avg_temp"
              name="avg_temp"
              value={formData.avg_temp}
              onChange={handleChange}
              step="0.1"
              min="-20"
              max="50"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Humidity */}
          <div>
            <label htmlFor="humidity" className="block text-sm font-medium text-gray-700 mb-1">
              Humidity (%)
            </label>
            <input
              type="number"
              id="humidity"
              name="humidity"
              value={formData.humidity}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Getting Predictions...' : 'Predict Demand'}
        </button>
      </form>
      
      {/* Error Message */}
      {error && (
        <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {/* Results Display */}
      {predictions && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <h3 className="text-lg font-semibold p-4 bg-gray-50 border-b border-gray-200">
            Prediction Results
          </h3>
          
          <div className="divide-y divide-gray-200">
            {predictions.map((prediction, index) => (
              <div key={index} className="p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-gray-800">{prediction.category}</h4>
                  <p className="text-sm text-gray-500">
                    Confidence: {(prediction.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  prediction.demand_level === 'High' 
                    ? 'bg-red-100 text-red-800' 
                    : prediction.demand_level === 'Moderate'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                }`}>
                  {prediction.demand_level} Demand
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicinePrediction;