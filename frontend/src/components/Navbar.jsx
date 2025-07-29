import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AlertBadge from './AlertBadge';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const userData = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  
  const logoutHandler = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };
  
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-blue-600">
            MediTrack
          </Link>
          
          {/* Navigation for larger screens */}
          {userData ? (
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-gray-700 hover:text-blue-600">
                Dashboard
              </Link>
              <Link to="/medicines" className="text-gray-700 hover:text-blue-600">
                Medicines
              </Link>
              <AlertBadge />
              <Link to="/sales" className="text-gray-700 hover:text-blue-600">
                Sales
              </Link>
              <Link to="/climate-analytics" className="text-gray-700 hover:text-blue-600">
                Climate Analytics
              </Link>
              {userData.role === 'admin' && (
                <Link to="/reports" className="text-gray-700 hover:text-blue-600">
                  Reports
                </Link>
              )}
              
              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 focus:outline-none"
                >
                  <span>{userData.name}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button
                      onClick={logoutHandler}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link to="/login" className="hidden md:block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Login
            </Link>
          )}
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && userData && (
          <div className="md:hidden py-4 space-y-2 border-t">
            <Link to="/" className="block text-gray-700 hover:text-blue-600">
              Dashboard
            </Link>
            <Link to="/medicines" className="block text-gray-700 hover:text-blue-600">
              Medicines
            </Link>
            <AlertBadge />
            <Link to="/sales" className="block text-gray-700 hover:text-blue-600">
              Sales
            </Link>
            <Link to="/climate-analytics" className="block text-gray-700 hover:text-blue-600">
              Climate Analytics
            </Link>
            {userData.role === 'admin' && (
              <Link to="/reports" className="block text-gray-700 hover:text-blue-600">
                Reports
              </Link>
            )}
            <button
              onClick={logoutHandler}
              className="block w-full text-left text-gray-700 hover:text-blue-600"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
