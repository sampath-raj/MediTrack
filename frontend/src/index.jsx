import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';
import { toast } from 'react-toastify';

// Dynamically set API base URL for local & production
axios.defaults.baseURL = process.env.NODE_ENV === 'production'
  ? 'https://medicine-backend-zgtg.onrender.com' // Updated to use your Render.com URL
  : 'http://localhost:5000';

// Configure axios with better error handling
axios.interceptors.request.use(
  config => {
    console.log(`Making ${config.method.toUpperCase()} request to: ${config.url}`);
    // Add authentication header if token exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  response => response,
  error => {
    console.error('Response error:', error);
    
    if (error.code === 'ERR_NETWORK') {
      toast.error('Network error: Unable to connect to the server. Please check if the backend is running.');
    } else if (error.response) {
      // Server responded with a non-2xx status
      toast.error(`Error ${error.response.status}: ${error.response.data.message || 'Something went wrong'}`);
    } else if (error.request) {
      // Request was made but no response received
      toast.error('No response from server. Please check your connection and server status.');
    } else {
      toast.error(`Error: ${error.message}`);
    }
    
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
