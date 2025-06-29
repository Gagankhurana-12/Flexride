import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNotification } from './NotificationContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user if token exists
  useEffect(() => {
    // 1. Check for token in URL (Google login)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem('flexride_token', urlToken);
      fetchCurrentUser(urlToken);
      // Remove token from URL
      params.delete('token');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
      return;
    }
    // 2. Check for token in localStorage (normal login)
    const token = localStorage.getItem('flexride_token');
    if (token) {
      fetchCurrentUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (token) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Not authenticated');
      const data = await res.json();

      setUser(data);
      localStorage.setItem('flexride_user', JSON.stringify(data));
    } catch (error) {
      setUser(null);
      localStorage.removeItem('flexride_user');
      localStorage.removeItem('flexride_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('flexride_token', data.token);
      setUser(data);
      localStorage.setItem('flexride_user', JSON.stringify(data));
      toast.success('Login successful!');
    } catch (error) {
      toast.error(error.message || 'Login failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      localStorage.setItem('flexride_token', data.token);
      setUser(data);
      localStorage.setItem('flexride_user', JSON.stringify(data));
      toast.success('Registration successful!');
    } catch (error) {
      toast.error(error.message || 'Registration failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('flexride_user');
    localStorage.removeItem('flexride_token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('flexride_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token: localStorage.getItem('flexride_token'),
    login,
    register,
    logout,
    updateUser,
    isLoading,
    fetchCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}