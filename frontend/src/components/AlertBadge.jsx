import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AlertBadge = () => {
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };
        
        const { data } = await axios.get('/api/alerts/summary', config);
        
        // Calculate total alerts that haven't been resolved
        const totalUnresolved = data.byStatus.new + data.byStatus.read;
        setAlertCount(totalUnresolved);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching alert count', error);
        setLoading(false);
      }
    };

    fetchAlertCount();
    
    // Refresh alert count every minute
    const intervalId = setInterval(fetchAlertCount, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  if (loading || alertCount === 0) return null;

  return (
    <Link to="/alerts" className="relative inline-block">
      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
        {alertCount > 99 ? '99+' : alertCount}
      </span>
      Alerts
    </Link>
  );
};

export default AlertBadge;
