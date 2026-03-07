import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '../config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['Authorization'];
    window.location.replace(`${config.adminPath}#${config.adminRoutes.login}`);
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        setIsAuthenticated(false);
        return;
      }

      try {
        const response = await axios.get(`${config.apiUrl}${config.apiPath}/auth/verify`);
        setCurrentUser(response.data.user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Token invalide:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token, logout]);

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(
      async () => {
        try {
          await axios.get(`${config.apiUrl}${config.apiPath}/auth/verify`);
        } catch {
          logout();
        }
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [token, logout]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const url = error.config?.url || '';

          if (!url.includes('/auth/login')) {
            logout();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  const login = async (username, password) => {
    const response = await axios.post(`${config.apiUrl}${config.apiPath}/auth/login`, {
      username,
      password,
    });
    const { token: newToken, user } = response.data;

    localStorage.setItem('token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setCurrentUser(user);
    setIsAuthenticated(true);

    const landingPage = localStorage.getItem('landingPage') || config.adminRoutes.home;
    setTimeout(() => {
      window.location.replace(`${config.adminPath}#${landingPage}`);
    }, 100);

    return { success: true };
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
