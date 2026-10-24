import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // S4 fix: Pure httpOnly cookie session check on mount
  const checkSession = async () => {
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

  const registerStudent = async (payload, { defer = false } = {}) => {
    const data = await api.registerStudent(payload);
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
    // Optimistic instant client logout
    setUser(null);
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
    <AuthContext.Provider value={{ user, loading, loginStudent, registerStudent, loginAdmin, completeLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
