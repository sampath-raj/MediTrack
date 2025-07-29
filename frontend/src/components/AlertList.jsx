import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AlertList = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [alertSummary, setAlertSummary] = useState({
    byStatus: { new: 0, read: 0, resolved: 0 },
    bySeverity: { high: 0, medium: 0, low: 0 },
    byType: { low_stock: 0, expiry: 0, high_demand_predicted: 0 },
  });
  const [generatingAlerts, setGeneratingAlerts] = useState(false);

  useEffect(() => {
    fetchAlerts();
    fetchAlertSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Build query parameters
      const params = new URLSearchParams();

      if (selectedStatus) {
        params.append('status', selectedStatus);
      }

      if (selectedType) {
        params.append('type', selectedType);
      }

      if (selectedSeverity) {
        params.append('severity', selectedSeverity);
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` },
        params,
      };

      const { data } = await axios.get('/api/alerts', config);
      setAlerts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alerts', error);
      toast.error('Failed to fetch alerts');
      setLoading(false);
    }
  };

  const fetchAlertSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const { data } = await axios.get('/api/alerts/summary', config);
      setAlertSummary(data);
    } catch (error) {
      console.error('Error fetching alert summary', error);
    }
  };

  const handleFilterChange = () => {
    fetchAlerts();
  };

  const handleClearFilters = () => {
    setSelectedStatus('');
    setSelectedType('');
    setSelectedSeverity('');
    fetchAlerts();
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      await axios.put(`/api/alerts/${id}`, { status: newStatus }, config);

      // Update the local state to reflect the change
      setAlerts(alerts.map(alert =>
        alert._id === id ? { ...alert, status: newStatus } : alert
      ));

      toast.success(`Alert marked as ${newStatus}`);
      fetchAlertSummary(); // Refresh summary after status change
    } catch (error) {
      console.error('Error updating alert status', error);
      toast.error('Failed to update alert status');
    }
  };

  const handleGenerateAlerts = async () => {
    try {
      setGeneratingAlerts(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const { data } = await axios.post('/api/alerts/generate', {}, config);

      if (data.success) {
        toast.success(data.message);
        fetchAlerts();
        fetchAlertSummary();
      } else {
        toast.error(data.message || 'Failed to generate alerts');
      }

      setGeneratingAlerts(false);
    } catch (error) {
      console.error('Error generating alerts', error);
      toast.error('Failed to generate alerts');
      setGeneratingAlerts(false);
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'read':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'low_stock':
        return 'Low Stock';
      case 'expiry':
        return 'Expiring Soon';
      case 'high_demand_predicted':
        return 'High Demand';
      default:
        return type;
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Alerts</h1>
        {isAdmin && (
          <button
            onClick={handleGenerateAlerts}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            disabled={generatingAlerts}
          >
            {generatingAlerts ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Alerts Now'
            )}
          </button>
        )}
      </div>

      <div className="mt-4 bg-blue-50 p-3 rounded-md text-sm text-blue-700 border border-blue-200">
        <p className="font-medium">Note: Alerts are automatically generated every 6 hours.</p>
        <p>The button above can be used to manually refresh alerts immediately if needed.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>New</span>
              <span className="font-semibold">{alertSummary.byStatus.new}</span>
            </div>
            <div className="flex justify-between">
              <span>Read</span>
              <span className="font-semibold">{alertSummary.byStatus.read}</span>
            </div>
            <div className="flex justify-between">
              <span>Resolved</span>
              <span className="font-semibold">{alertSummary.byStatus.resolved}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Severity</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>High</span>
              <span className="font-semibold">{alertSummary.bySeverity.high}</span>
            </div>
            <div className="flex justify-between">
              <span>Medium</span>
              <span className="font-semibold">{alertSummary.bySeverity.medium}</span>
            </div>
            <div className="flex justify-between">
              <span>Low</span>
              <span className="font-semibold">{alertSummary.bySeverity.low}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Type</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Low Stock</span>
              <span className="font-semibold">{alertSummary.byType.low_stock}</span>
            </div>
            <div className="flex justify-between">
              <span>Expiring Soon</span>
              <span className="font-semibold">{alertSummary.byType.expiry}</span>
            </div>
            <div className="flex justify-between">
              <span>High Demand</span>
              <span className="font-semibold">{alertSummary.byType.high_demand_predicted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert type explanation */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Alert Types Explained</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-md">
            <h3 className="font-medium">Low Stock</h3>
            <p className="text-sm text-gray-600">Medicines that have fallen below their minimum stock level.</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-md">
            <h3 className="font-medium">Expiry</h3>
            <p className="text-sm text-gray-600">Medicines that will expire within the next 30 days.</p>
          </div>
          <div className="bg-green-50 p-3 rounded-md">
            <h3 className="font-medium">High Demand Predicted</h3>
            <p className="text-sm text-gray-600">Medicines that are likely to have increased demand due to seasonal or climate factors.</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-md">
            <h3 className="font-medium">Disease Pattern Risk</h3>
            <p className="text-sm text-gray-600">Medicines in categories that typically see higher demand during current season/climate conditions.</p>
          </div>
          <div className="bg-indigo-50 p-3 rounded-md">
            <h3 className="font-medium">Recommended Stock</h3>
            <p className="text-sm text-gray-600">Alternative medicines that can be offered when similar items are low in stock.</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Filter Alerts</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Types</option>
              <option value="low_stock">Low Stock</option>
              <option value="expiry">Expiring Soon</option>
              <option value="high_demand_predicted">High Demand</option>
            </select>
          </div>

          <div>
            <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              id="severity"
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={handleFilterChange}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Filter
            </button>
            <button
              onClick={handleClearFilters}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-lg text-gray-600">No alerts found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert._id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {alert.medicineId ? alert.medicineId.name : 'Unknown Medicine'}
                  </h3>
                  <p className="text-gray-700 mt-1">{alert.message}</p>
                  <div className="flex space-x-2 mt-2">
                    <span 
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(alert.status)}`}
                    >
                      {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                    </span>
                    <span 
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityClass(alert.severity)}`}
                    >
                      {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {getTypeLabel(alert.type)}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {alert.status === 'new' && (
                    <button
                      onClick={() => handleUpdateStatus(alert._id, 'read')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Mark as Read
                    </button>
                  )}
                  {alert.status !== 'resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(alert._id, 'resolved')}
                      className="text-green-600 hover:text-green-800"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {new Date(alert.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertList;
