import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChatProvider } from './contexts/ChatContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VehicleListings from './pages/VehicleListings';
import VehicleDetails from './pages/VehicleDetails';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Bookings from './pages/Bookings';
import OwnerVehicles from './pages/OwnerVehicles';
import Logout from './pages/Logout';
import ProtectedRoute from './components/ProtectedRoute';
import Chat from './components/Chat';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ChatProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
              <Header />
              <main className="pt-16">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/vehicles" element={<VehicleListings />} />
                  <Route path="/vehicles/:id" element={<VehicleDetails />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/bookings" 
                    element={
                      <ProtectedRoute>
                        <Bookings />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/my-vehicles" 
                    element={
                      <ProtectedRoute>
                        <OwnerVehicles />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/logout" element={<Logout />} />
                  {/* Catch-all route for malformed URLs */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Toaster position="top-right" toastOptions={{ duration: 1000 }} />
              <Chat />
            </div>
          </ChatProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;