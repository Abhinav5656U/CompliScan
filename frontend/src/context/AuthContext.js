import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } catch (err) {
        localStorage.removeItem('user');
        setUser(null);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user: userData, csrf_token, access_token } = response.data;
    localStorage.setItem('user', JSON.stringify(userData));
    if (csrf_token) {
      localStorage.setItem('csrf_token', csrf_token);
    }
    if (access_token) {
      localStorage.setItem('access_token', access_token);
    }
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  };

  const ssoLogin = async (provider) => {
    const response = await api.post(`/auth/${provider}/callback`, { provider });
    const { user: userData, csrf_token, access_token } = response.data;
    localStorage.setItem('user', JSON.stringify(userData));
    if (csrf_token) {
      localStorage.setItem('csrf_token', csrf_token);
    }
    if (access_token) {
      localStorage.setItem('access_token', access_token);
    }
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('user');
    localStorage.removeItem('csrf_token');
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    ssoLogin,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
