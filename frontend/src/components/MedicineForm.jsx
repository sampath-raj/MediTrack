import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const MedicineForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAddMode = !id;
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    currentStock: 0,
    minStockLevel: 10,
    unitPrice: 0,
    expiryDate: '',
    manufacturer: '',
    demandFactors: {
      seasonal: false,
      seasonalTrend: {
        winter: 1,
        spring: 1,
        summer: 1,
        fall: 1,
      },
      climateDependent: false,
      climateFactors: {
        rainy: 1,
        dry: 1,
        cold: 1,
        hot: 1,
      },
    },
  });
  
  // Common categories for medicines
  const categories = [
    'Antibiotics',
    'Analgesics',
    'Antivirals',
    'Antipyretics',
    'Antidepressants',
    'Antidiabetics',
    'Antihistamines',
    'Antihypertensives',
    'Steroids',
    'Vitamins',
    'Supplements',
    'Other',
  ];
  
  useEffect(() => {
    if (!isAddMode) {
      fetchMedicine();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAddMode]); // Added isAddMode as dependency
  
  const fetchMedicine = async () => {
    try {
      setFetchLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      
      const { data } = await axios.get(`/api/medicines/${id}`, config);
      
      // Format date for input
      const expiryDate = data.expiryDate 
        ? new Date(data.expiryDate).toISOString().split('T')[0]
        : '';
      
      setFormData({
        ...data,
        expiryDate,
      });
      
      setFetchLoading(false);
    } catch (error) {
      console.error('Error fetching medicine', error);
      toast.error('Failed to fetch medicine details');
      setFetchLoading(false);
      navigate('/medicines');
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: type === 'checkbox' ? checked : value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' 
          ? checked 
          : type === 'number' 
            ? parseFloat(value)
            : value,
      });
    }
  };
  
  const handleSeasonalTrendChange = (season, value) => {
    setFormData({
      ...formData,
      demandFactors: {
        ...formData.demandFactors,
        seasonalTrend: {
          ...formData.demandFactors.seasonalTrend,
          [season]: parseFloat(value),
        },
      },
    });
  };
  
  const handleClimateFactorChange = (climate, value) => {
    setFormData({
      ...formData,
      demandFactors: {
        ...formData.demandFactors,
        climateFactors: {
          ...formData.demandFactors.climateFactors,
          [climate]: parseFloat(value),
        },
      },
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      
      if (isAddMode) {
        await axios.post('/api/medicines', formData, config);
        toast.success('Medicine added successfully');
      } else {
        await axios.put(`/api/medicines/${id}`, formData, config);
        toast.success('Medicine updated successfully');
      }
      
      navigate('/medicines');
    } catch (error) {
      console.error('Error saving medicine', error);
      toast.error(error.response?.data?.message || 'Failed to save medicine');
      setLoading(false);
    }
  };
  
  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        {isAddMode ? 'Add Medicine' : 'Edit Medicine'}
      </h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Basic Information</h2>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Medicine Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category*
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                id="manufacturer"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          {/* Stock and Price */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Stock & Price</h2>
            
            <div>
              <label htmlFor="currentStock" className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock*
              </label>
              <input
                type="number"
                id="currentStock"
                name="currentStock"
                value={formData.currentStock}
                onChange={handleChange}
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="minStockLevel" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Stock Level*
              </label>
              <input
                type="number"
                id="minStockLevel"
                name="minStockLevel"
                value={formData.minStockLevel}
                onChange={handleChange}
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (₹)*
              </label>
              <input
                type="number"
                id="unitPrice"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
        
        {/* Demand Prediction Factors */}
        <div className="pt-4 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Demand Prediction Factors</h2>
          
          {/* Seasonal Factors */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="seasonal"
                name="demandFactors.seasonal"
                checked={formData.demandFactors.seasonal}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="seasonal" className="ml-2 block text-sm font-medium text-gray-700">
                Is demand affected by seasons?
              </label>
            </div>
            
            {formData.demandFactors.seasonal && (
              <div className="pl-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Set multipliers for each season (1.0 = normal demand, 2.0 = double demand)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="winter" className="block text-sm font-medium text-gray-700 mb-1">
                      Winter
                    </label>
                    <input
                      type="number"
                      id="winter"
                      value={formData.demandFactors.seasonalTrend.winter}
                      onChange={(e) => handleSeasonalTrendChange('winter', e.target.value)}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="spring" className="block text-sm font-medium text-gray-700 mb-1">
                      Spring
                    </label>
                    <input
                      type="number"
                      id="spring"
                      value={formData.demandFactors.seasonalTrend.spring}
                      onChange={(e) => handleSeasonalTrendChange('spring', e.target.value)}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="summer" className="block text-sm font-medium text-gray-700 mb-1">
                      Summer
                    </label>
                    <input
                      type="number"
                      id="summer"
                      value={formData.demandFactors.seasonalTrend.summer}
                      onChange={(e) => handleSeasonalTrendChange('summer', e.target.value)}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="fall" className="block text-sm font-medium text-gray-700 mb-1">
                      Fall
                    </label>
                    <input
                      type="number"
                      id="fall"
                      value={formData.demandFactors.seasonalTrend.fall}
                      onChange={(e) => handleSeasonalTrendChange('fall', e.target.value)}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Climate Factors */}
          <div>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="climateDependent"
                name="demandFactors.climateDependent"
                checked={formData.demandFactors.climateDependent}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="climateDependent" className="ml-2 block text-sm font-medium text-gray-700">
                Is demand affected by climate?
              </label>
            </div>
            
            {formData.demandFactors.climateDependent && (
              <div className="pl-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Set multipliers for each climate condition (1.0 = normal demand, 2.0 = double demand)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rainy" className="block text-sm font-medium text-gray-700 mb-1">
                      Rainy
                    </label>
                    <input
                      type="number"
                      id="rainy"
                      value={formData.demandFactors.climateFactors.rainy}
                      onChange={(e) => handleClimateFactorChange('rainy', e.target.value)}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="dry" className="block text-sm font-medium text-gray-700 mb-1">
                      Dry
                    </label>
                    <input
                      type="number"
                      id="dry"
                      value={formData.demandFactors.climateFactors.dry}
                      onChange={(e) => handleClimateFactorChange('dry', e.target.value)}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="cold" className="block text-sm font-medium text-gray-700 mb-1">
                      Cold
                    </label>
                    <input
                      type="number"
                      id="cold"
                      value={formData.demandFactors.climateFactors.cold}
                      onChange={(e) => handleClimateFactorChange('cold', e.target.value)}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="hot" className="block text-sm font-medium text-gray-700 mb-1">
                      Hot
                    </label>
                    <input
                      type="number"
                      id="hot"
                      value={formData.demandFactors.climateFactors.hot}
                      onChange={(e) => handleClimateFactorChange('hot', e.target.value)}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Medicine'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/medicines')}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicineForm;
