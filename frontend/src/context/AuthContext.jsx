import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check initial session
  const checkSession = async () => {
    // Skip remote check if no token exists in localStorage (renders login page instantly with 0ms delay)
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getCurrentUser();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const loginStudent = async (registerNo, password, { defer = false } = {}) => {
    const data = await api.loginStudent(registerNo, password);
    if (data.success && data.user && !defer) {
      setUser(data.user);
    }
    return data;
  };

  const loginAdmin = async (username, password, { defer = false } = {}) => {
    const data = await api.loginAdmin(username, password);
    if (data.success && data.user && !defer) {
      setUser(data.user);
    }
    return data;
  };

  // Called after the welcome animation finishes
  const completeLogin = (loggedInUser) => setUser(loggedInUser);

  const logout = async () => {
    // Optimistic instant client logout (0ms delay)
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }

    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
  };

  const refreshUser = async () => {
    await checkSession();
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginStudent, loginAdmin, completeLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
