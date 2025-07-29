import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { toast } from 'react-toastify';

const ClimateAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [predictedDemand, setPredictedDemand] = useState([]);
  const [currentSeason, setCurrentSeason] = useState('');
  const [currentClimate, setCurrentClimate] = useState('');
  const [highRiskCategories, setHighRiskCategories] = useState([]);
  
  // Chart data states
  const [categoryDemandData, setCategoryDemandData] = useState({
    labels: [],
    datasets: []
  });
  
  const [climateImpactData, setClimateImpactData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    const fetchDemandPredictions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };
        
        // Fetch climate predictions
        const { data } = await axios.get('/api/medicines/climate-demand', config);
        
        setPredictedDemand(data.predictions);
        setCurrentSeason(data.currentSeason);
        setCurrentClimate(data.currentClimate);
        setHighRiskCategories(data.highRiskCategories);
        
        // Prepare category-based chart data
        const categories = [...new Set(data.predictions.map(item => item.category))];
        const categoryAverages = categories.map(category => {
          const categoryItems = data.predictions.filter(item => item.category === category);
          const average = categoryItems.reduce((sum, item) => sum + item.predictedDemandMultiplier, 0) / categoryItems.length;
          return { category, average };
        });
        
        // Sort by demand
        categoryAverages.sort((a, b) => b.average - a.average);
        
        setCategoryDemandData({
          labels: categoryAverages.map(item => item.category),
          datasets: [
            {
              label: 'Average Demand Multiplier by Category',
              data: categoryAverages.map(item => item.average),
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            }
          ]
        });
        
        // Prepare climate impact data for a pie chart
        const highRiskItems = data.predictions.filter(item => item.isHighRiskCategory);
        const normalItems = data.predictions.filter(item => !item.isHighRiskCategory);
        
        setClimateImpactData({
          labels: ['High Risk Categories', 'Normal Risk Categories'],
          datasets: [
            {
              data: [highRiskItems.length, normalItems.length],
              backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)'],
              borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
              borderWidth: 1,
            }
          ]
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching climate predictions', error);
        toast.error('Failed to fetch climate predictions');
        setLoading(false);
      }
    };

    fetchDemandPredictions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Climate & Seasonal Analytics</h1>
      
      {/* Current Climate Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Current Conditions</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Current Season</p>
              <p className="text-2xl font-semibold text-blue-700 capitalize">{currentSeason}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Current Climate</p>
              <p className="text-2xl font-semibold text-green-700 capitalize">{currentClimate}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">High-Risk Categories</h2>
          <div className="grid grid-cols-2 gap-2">
            {highRiskCategories.map((category, index) => (
              <div key={index} className="bg-red-50 p-2 rounded">
                <span className="text-red-700">{category}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            These categories typically see increased demand during {currentSeason}/{currentClimate} conditions.
          </p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Demand by Category</h2>
          <div className="h-80">
            <Bar 
              data={categoryDemandData}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: `Category Demand During ${currentSeason}/${currentClimate}`
                  }
                }
              }}
            />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Climate Impact Distribution</h2>
          <div className="h-80">
            <Pie 
              data={climateImpactData}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: 'Climate Sensitivity Distribution'
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Medicine List with Climate Impact */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Medicines with High Climate Sensitivity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medicine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Demand Multiplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reasons
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {predictedDemand
                .filter(item => item.predictedDemandMultiplier > 1.3)
                .sort((a, b) => b.predictedDemandMultiplier - a.predictedDemandMultiplier)
                .map((item, index) => (
                  <tr key={index} className={item.needsRestock ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{item.medicine}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={item.isHighRiskCategory ? 'text-red-600 font-semibold' : ''}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span 
                        className={`px-2 py-1 rounded-full text-white ${
                          item.predictedDemandMultiplier > 2 ? 'bg-red-600' :
                          item.predictedDemandMultiplier > 1.5 ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}
                      >
                        {item.predictedDemandMultiplier.toFixed(1)}x
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.needsRestock ? (
                        <span className="text-red-600 font-medium">Restock Needed</span>
                      ) : (
                        <span className="text-green-600">Adequate</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <ul className="list-disc list-inside">
                        {item.reasonsForPrediction.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClimateAnalytics;
