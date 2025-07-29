import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import MedicineList from './components/MedicineList';
import AlertList from './components/AlertList';
import MedicineForm from './components/MedicineForm';
import Reports from './components/Reports';
import ServerStatusChecker from './components/ServerStatusChecker';
import ClimateAnalytics from './components/ClimateAnalytics';
import SalesManager from './components/SalesManager';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/medicines"
              element={
                <PrivateRoute>
                  <MedicineList />
                </PrivateRoute>
              }
            />
            <Route
              path="/medicines/add"
              element={
                <PrivateRoute>
                  <MedicineForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/medicines/edit/:id"
              element={
                <PrivateRoute>
                  <MedicineForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <PrivateRoute>
                  <AlertList />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <Reports />
                </PrivateRoute>
              }
            />
            <Route
              path="/climate-analytics"
              element={
                <PrivateRoute>
                  <ClimateAnalytics />
                </PrivateRoute>
              }
            />
            <Route
              path="/sales"
              element={
                <PrivateRoute>
                  <SalesManager />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
        <ServerStatusChecker />
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;
