import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthModalContext = createContext();

export const AuthModalProvider = ({ children }) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [initialTab, setInitialTab] = useState('STUDENT'); // 'STUDENT' | 'SIGNUP' | 'ADMIN'

  // Open modal automatically if URL is /login or ?login=true
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    if (path === '/login' || params.get('login') === 'true') {
      setIsLoginOpen(true);
      if (params.get('tab')) {
        setInitialTab(params.get('tab').toUpperCase());
      }
    }
  }, []);

  const openLogin = (tab = 'STUDENT') => {
    setInitialTab(tab);
    setIsLoginOpen(true);
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.history.pushState({}, '', '/login');
    }
  };

  const closeLogin = () => {
    setIsLoginOpen(false);
    if (typeof window !== 'undefined' && window.location.pathname === '/login') {
      window.history.pushState({}, '', '/');
    }
  };

  return (
    <AuthModalContext.Provider
      value={{
        isLoginOpen,
        openLogin,
        closeLogin,
        initialTab,
        setInitialTab
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => useContext(AuthModalContext);
