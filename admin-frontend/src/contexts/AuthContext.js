import React, { createContext, useState, useContext, useEffect } from 'react';
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
  // Suppression de useNavigate() ici car il cause une erreur d'initialisation

  // Configuration des en-têtes d'autorisation pour les requêtes axios
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Vérifier la validité du token au chargement et à chaque changement de token
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
  }, [token]);

  // Intercepteur pour gérer les erreurs d'authentification
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Fonction de connexion
  const login = async (username, password) => {
    try {
      const response = await axios.post(`${config.apiUrl}${config.apiPath}/auth/login`, { username, password });
      const { token: newToken, user } = response.data;
      
      // Stocker le token et mettre à jour l'état
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      // Définir explicitement l'en-tête d'autorisation pour toutes les futures requêtes
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      // Attendre un court instant pour s'assurer que le token est bien appliqué
      setTimeout(() => {
        // Utiliser le format de HashRouter pour la redirection
        window.location.href = `${config.adminPath}#${config.adminRoutes.home}`;
      }, 100);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    // Utiliser le format de HashRouter pour la redirection
    window.location.href = `${config.adminPath}#${config.adminRoutes.login}`;
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
