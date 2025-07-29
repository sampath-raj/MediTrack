import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  // Check for token in localStorage
  const token = localStorage.getItem('token');
  
  // If there's no token, redirect to login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // If there's a token, render the component
  return children;
};

export default PrivateRoute;
