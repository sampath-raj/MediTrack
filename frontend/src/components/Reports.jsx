import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [categoryDistribution, setCategoryDistribution] = useState({
    labels: [],
    datasets: [],
  });
  const [stockHistory, setStockHistory] = useState({
    labels: [],
    datasets: [],
  });
  const [alertsOverTime, setAlertsOverTime] = useState({
    labels: [],
    datasets: [],
  });
  const [demandPrediction, setDemandPrediction] = useState({
    labels: [],
    datasets: [],
  });
  const [reportPeriod, setReportPeriod] = useState('month');
  
  // Report date range
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportPeriod]); // We're disabling the warning since fetchReportData includes more dependencies
  
  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Define config for future API calls
      // eslint-disable-next-line no-unused-vars
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          period: reportPeriod,
          startDate,
          endDate,
        },
      };
      
      // Simulate API calls
      // In a real app, we would use axios with the config
      // Example: const { data } = await axios.get('/api/report/categories', config);
      
      // Category distribution data
      const categoryData = {
        labels: ['Antibiotics', 'Analgesics', 'Antivirals', 'Antipyretics', 'Others'],
        datasets: [
          {
            label: 'Number of Medicines',
            data: [25, 18, 12, 15, 20],
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
          },
        ],
      };
      setCategoryDistribution(categoryData);
      
      // Stock history data
      const historyData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
          {
            label: 'Stock Additions',
            data: [65, 59, 80, 81, 56, 55, 40],
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
          {
            label: 'Stock Removals',
            data: [28, 48, 40, 19, 86, 27, 90],
            fill: false,
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1,
          },
        ],
      };
      setStockHistory(historyData);
      
      // Alerts over time data
      const alertsData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
          {
            label: 'Low Stock Alerts',
            data: [12, 19, 3, 5, 2, 3, 7],
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
          },
          {
            label: 'Expiry Alerts',
            data: [2, 3, 20, 5, 1, 4, 9],
            backgroundColor: 'rgba(255, 206, 86, 0.6)',
          },
          {
            label: 'High Demand Alerts',
            data: [3, 10, 13, 15, 22, 30, 15],
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
          },
        ],
      };
      setAlertsOverTime(alertsData);
      
      // Demand prediction data
      const predictionData = {
        labels: ['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Vitamin C', 'Loratadine'],
        datasets: [
          {
            label: 'Current Month Demand',
            data: [65, 59, 80, 81, 56],
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
          {
            label: 'Predicted Next Month Demand',
            data: [70, 62, 85, 75, 60],
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
        ],
      };
      setDemandPrediction(predictionData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching report data', error);
      toast.error('Failed to load report data');
      setLoading(false);
    }
  };
  
  const handleDateRangeChange = () => {
    fetchReportData();
  };
  
  const exportToPDF = () => {
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Medicine Management Report', 14, 22);
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Report Period: ${reportPeriod}`, 14, 38);
      
      // Add summary statistics
      doc.setFontSize(14);
      doc.text('Summary Statistics', 14, 50);
      
      const summaryData = [
        ['Inventory Value', '₹24,358.75', '+5.3% from last month'],
        ['Monthly Sales', '₹8,942.30', '-2.1% from last month'],
        ['Average Stock Level', '78%', '+12% from last month']
      ];
      
      doc.autoTable({
        startY: 55,
        head: [['Metric', 'Value', 'Change']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] }
      });
      
      // Add stock movement details
      doc.setFontSize(14);
      doc.text('Stock Movement Details', 14, doc.autoTable.previous.finalY + 15);
      
      const stockData = [
        ['Paracetamol', '120', '+50', '-65', '105', '54.2%'],
        ['Amoxicillin', '80', '+30', '-45', '65', '56.3%'],
        ['Vitamin C', '200', '+0', '-25', '175', '12.5%'],
        ['Ibuprofen', '90', '+60', '-75', '75', '83.3%']
      ];
      
      doc.autoTable({
        startY: doc.autoTable.previous.finalY + 20,
        head: [['Medicine', 'Initial Stock', 'Added', 'Removed', 'Current Stock', 'Turnover Rate']],
        body: stockData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] }
      });
      
      // Save the PDF
      doc.save(`medicine-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      
      toast.success('PDF report generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  const exportToCSV = () => {
    try {
      // Stock movement details
      const stockData = [
        ['Medicine', 'Initial Stock', 'Added', 'Removed', 'Current Stock', 'Turnover Rate'],
        ['Paracetamol', '120', '+50', '-65', '105', '54.2%'],
        ['Amoxicillin', '80', '+30', '-45', '65', '56.3%'],
        ['Vitamin C', '200', '+0', '-25', '175', '12.5%'],
        ['Ibuprofen', '90', '+60', '-75', '75', '83.3%']
      ];
      
      // Convert the data array to CSV format
      let csvContent = stockData.map(row => row.join(',')).join('\n');
      
      // Create a Blob containing the CSV data
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      
      // Save the CSV file
      saveAs(blob, `medicine-stock-${new Date().toISOString().slice(0, 10)}.csv`);
      
      toast.success('CSV report generated successfully');
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast.error('Failed to generate CSV report');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
        <div className="flex space-x-2">
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Export to PDF
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export to CSV
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Report Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
              Report Period
            </label>
            <select
              id="period"
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {reportPeriod === 'custom' && (
            <>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleDateRangeChange}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Apply Range
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Medicine Categories</h2>
          <div className="h-80">
            <Pie data={categoryDistribution} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        
        {/* Stock History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Stock History</h2>
          <div className="h-80">
            <Line data={stockHistory} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        
        {/* Alerts Over Time */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Alerts Over Time</h2>
          <div className="h-80">
            <Bar data={alertsOverTime} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        
        {/* Demand Prediction */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Demand Prediction Comparison</h2>
          <div className="h-80">
            <Bar data={demandPrediction} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Summary Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-gray-600 mb-2">Inventory Value</h3>
            <p className="text-2xl font-bold text-gray-800">₹24,358.75</p>
            <p className="text-sm text-green-600">+5.3% from last month</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-600 mb-2">Monthly Sales</h3>
            <p className="text-2xl font-bold text-gray-800">₹8,942.30</p>
            <p className="text-sm text-red-600">-2.1% from last month</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-600 mb-2">Average Stock Level</h3>
            <p className="text-2xl font-bold text-gray-800">78%</p>
            <p className="text-sm text-green-600">+12% from last month</p>
          </div>
        </div>
      </div>
      
      {/* Usage Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">System Recommendations</h2>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="font-medium">Consider restocking Amoxicillin soon</p>
            <p className="text-sm text-gray-600">Current stock is 15% above minimum, but high demand is predicted for next month.</p>
          </div>
          <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <p className="font-medium">Paracetamol expiring in 45 days</p>
            <p className="text-sm text-gray-600">Consider running a promotion to reduce inventory before expiration.</p>
          </div>
          <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
            <p className="font-medium">Optimal Vitamins inventory</p>
            <p className="text-sm text-gray-600">Current stock levels match predicted demand patterns for the next 3 months.</p>
          </div>
        </div>
      </div>
      
      {/* Detailed Tables Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Stock Movement Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medicine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Initial Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Removed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turnover Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Paracetamol
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">120</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+50</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">-65</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">105</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">54.2%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Amoxicillin
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">80</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+30</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">-45</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">65</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">56.3%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Vitamin C
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">200</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+0</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">-25</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">175</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12.5%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Ibuprofen
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">90</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+60</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">-75</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">75</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">83.3%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
