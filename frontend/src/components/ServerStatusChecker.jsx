import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ServerStatusChecker = () => {
  const [serverStatus, setServerStatus] = useState('checking');
  const [errorDetail, setErrorDetail] = useState('');

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        await axios.get('/api/test');
        setServerStatus('connected');
        setErrorDetail('');
      } catch (error) {
        setServerStatus('disconnected');
        if (error.code === 'ERR_NETWORK') {
          setErrorDetail('Network error. Backend server may not be running.');
        } else {
          setErrorDetail(error.message || 'Unknown error');
        }
        console.error('Server connection error:', error);
      }
    };

    checkServerStatus();
    
    // Check again every 30 seconds
    const intervalId = setInterval(checkServerStatus, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  if (serverStatus === 'connected') return null;

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
      serverStatus === 'checking' ? 'bg-yellow-100' : 'bg-red-100'
    }`}>
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${
          serverStatus === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
        }`}></div>
        <div>
          <p className="font-medium">
            {serverStatus === 'checking' ? 'Checking server connection...' : 'Server disconnected'}
          </p>
          {errorDetail && <p className="text-sm text-red-600 mt-1">{errorDetail}</p>}
          {serverStatus === 'disconnected' && (
            <p className="text-xs mt-2">
              Please ensure the backend server is running at http://localhost:5000
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerStatusChecker;
