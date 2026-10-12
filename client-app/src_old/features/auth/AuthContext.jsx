import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../../shared/api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('autocomm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('autocomm_access_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get('/auth/me');
        setUser(res.data.data.user);
        setClient(res.data.data.client);
        localStorage.setItem('autocomm_user', JSON.stringify(res.data.data.user));
      } catch (err) {
        setUser(null);
        setClient(null);
        localStorage.removeItem('autocomm_access_token');
        localStorage.removeItem('autocomm_refresh_token');
        localStorage.removeItem('autocomm_user');
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const res = await apiClient.post('/auth/login', { email, password, rememberMe });
    const { accessToken, refreshToken, user: loggedUser } = res.data.data;
    localStorage.setItem('autocomm_access_token', accessToken);
    localStorage.setItem('autocomm_refresh_token', refreshToken);
    localStorage.setItem('autocomm_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
  };

  const logout = () => {
    localStorage.removeItem('autocomm_access_token');
    localStorage.removeItem('autocomm_refresh_token');
    localStorage.removeItem('autocomm_user');
    setUser(null);
    setClient(null);
  };

  return (
    <AuthContext.Provider value={{ user, client, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
