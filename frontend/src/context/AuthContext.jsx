import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check existing session on boot
  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.auth.me()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          api.setToken(null);
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    // Listen for unauthorized events to automatically clear session
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await api.auth.login({ email, password });
      api.setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const register = async (name, email, password, confirmPassword) => {
    setAuthError(null);
    try {
      const res = await api.auth.register({
        name,
        email,
        password,
        confirm_password: confirmPassword
      });
      api.setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      authError,
      setAuthError,
      login,
      register,
      logout,
      isAuthenticated: !!user
    }}>
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
