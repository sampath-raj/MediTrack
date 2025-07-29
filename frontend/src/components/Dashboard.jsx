import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { toast } from 'react-toastify';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [stockSummary, setStockSummary] = useState({
    total: 0,
    lowStock: 0,
    expiringSoon: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [stockData, setStockData] = useState({
    labels: [],
    datasets: [],
  });
  const [demandData, setDemandData] = useState({
    labels: [],
    datasets: [],
  });
  const [seasonalRecommendations, setSeasonalRecommendations] = useState([]);
  const [currentSeason, setCurrentSeason] = useState('');
  const [currentClimate, setCurrentClimate] = useState('');
  const [loading, setLoading] = useState(true);

  const handleLoadSampleData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      
      console.log('Attempting to load sample data...');
      const response = await axios.get('/api/medicines/seed-sample-data', config);
      console.log('Sample data response:', response.data);
      
      if (response.data.success) {
        toast.success(`Successfully loaded ${response.data.count} sample medicines!`);
        // Refresh dashboard data after a short delay to allow DB updates to propagate
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(response.data.message || 'Failed to load sample data');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading sample data:', error);
      
      // Improved error reporting
      if (error.response) {
        console.error('Error response:', error.response.data);
        toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        console.error('Error request:', error.request);
        toast.error('No response received from server. Please check your connection.');
      } else {
        toast.error(`Request failed: ${error.message}`);
      }
      
      setLoading(false);
    }
  };

  const fetchSeasonalRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      
      const { data } = await axios.get('/api/medicines/climate-demand', config);
      
      // Get top high-risk medicine recommendations
      const recommendations = data.predictions
        .filter(pred => 
          pred.isHighRiskCategory && 
          pred.predictedDemandMultiplier > 1.3
        )
        .sort((a, b) => b.predictedDemandMultiplier - a.predictedDemandMultiplier)
        .slice(0, 5);
      
      setSeasonalRecommendations(recommendations);
      setCurrentSeason(data.currentSeason);
      setCurrentClimate(data.currentClimate);
    } catch (error) {
      console.error('Error fetching seasonal recommendations', error);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        // Fetch stock summary
        let summaryRes;
        try {
          summaryRes = await axios.get('/api/medicines/summary', config);
          setStockSummary(summaryRes.data);
        } catch (error) {
          console.error('Error fetching summary', error);
          // Set default data for empty system
          setStockSummary({
            total: 0,
            lowStock: 0,
            expiringSoon: 0,
          });
        }

        // Fetch recent alerts
        try {
          const alertsRes = await axios.get('/api/alerts/recent', config);
          setRecentAlerts(alertsRes.data);
        } catch (error) {
          console.error('Error fetching alerts', error);
          setRecentAlerts([]);
        }

        // Set default chart data if no data exists
        setStockData({
          labels: ['No medicines yet'],
          datasets: [
            {
              label: 'Current Stock',
              data: [0],
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
            {
              label: 'Minimum Required',
              data: [0],
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
            },
          ],
        });

        setDemandData({
          labels: ['No demand data yet'],
          datasets: [
            {
              label: 'Predicted Demand Multiplier',
              data: [0],
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
              tension: 0.4,
            },
          ],
        });

        await fetchSeasonalRecommendations();

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
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
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
      
      {stockSummary.total === 0 && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="flex flex-col items-center justify-center">
            <svg className="w-16 h-16 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Medicines Found</h2>
            <p className="text-gray-600 mb-4">Your medicine inventory is empty. Start by adding medicines to track stock.</p>
            <div className="flex space-x-4">
              <Link
                to="/medicines/add"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add Medicine
              </Link>
              <button
                onClick={handleLoadSampleData}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Load Sample Data
              </button>
            </div>
          </div>
        </div>
      )}
      
      {stockSummary.total > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700">Total Medicines</h2>
              <p className="text-3xl font-bold text-blue-600">{stockSummary.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700">Low Stock Items</h2>
              <p className="text-3xl font-bold text-red-600">{stockSummary.lowStock}</p>
              <Link to="/medicines?filter=low-stock" className="text-sm text-blue-500 hover:underline">
                View all
              </Link>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700">Expiring Soon</h2>
              <p className="text-3xl font-bold text-yellow-600">{stockSummary.expiringSoon}</p>
              <Link to="/medicines?filter=expiring" className="text-sm text-blue-500 hover:underline">
                View all
              </Link>
            </div>
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Current Stock Levels</h2>
              <div className="h-80">
                <Bar data={stockData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Demand Prediction</h2>
              <div className="h-80">
                <Line data={demandData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
          
          {/* Seasonal Disease Pattern Recommendations */}
          {seasonalRecommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Seasonal & Climate Recommendations
              </h2>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Based on current <span className="font-medium capitalize">{currentSeason}</span> season 
                  and <span className="font-medium capitalize">{currentClimate}</span> climate, 
                  these medicines may see higher demand:
                </p>
              </div>
              
              <div className="space-y-3">
                {seasonalRecommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{rec.medicine} ({rec.category})</p>
                      <span className="px-2 py-1 bg-blue-100 rounded-full text-xs font-medium">
                        {rec.predictedDemandMultiplier.toFixed(1)}x demand
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Current stock: {rec.currentStock} units {rec.needsRestock && 
                        <span className="text-red-600 font-medium">(Restock Recommended)</span>
                      }
                    </p>
                    {rec.reasonsForPrediction.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        <p>Reasons:</p>
                        <ul className="list-disc list-inside">
                          {rec.reasonsForPrediction.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-end">
                <Link to="/climate-analytics" className="text-blue-600 hover:underline text-sm">
                  View detailed climate analysis →
                </Link>
              </div>
            </div>
          )}
          
          {/* Recent Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Recent Alerts</h2>
              <Link to="/alerts" className="text-sm text-blue-500 hover:underline">
                View all alerts
              </Link>
            </div>
            
            {recentAlerts.length === 0 ? (
              <p className="text-gray-500">No recent alerts</p>
            ) : (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div 
                    key={alert._id} 
                    className={`p-3 rounded-md ${
                      alert.severity === 'high' 
                        ? 'bg-red-100 border-l-4 border-red-500' 
                        : alert.severity === 'medium'
                        ? 'bg-yellow-100 border-l-4 border-yellow-500'
                        : 'bg-blue-100 border-l-4 border-blue-500'
                    }`}
                  >
                    <p className="font-medium text-gray-800">{alert.message}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
