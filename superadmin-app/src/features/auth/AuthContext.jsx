import React, { createContext, useContext, useState, useEffect } from 'react';
import { superAdminApiClient } from '../../shared/api/client';

const SuperAdminAuthContext = createContext(null);

export const SuperAdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('autocomm_superadmin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('autocomm_superadmin_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await superAdminApiClient.get('/auth/me');
        setAdminUser(res.data.data);
        localStorage.setItem('autocomm_superadmin_user', JSON.stringify(res.data.data));
      } catch (err) {
        setAdminUser(null);
        localStorage.removeItem('autocomm_superadmin_token');
        localStorage.removeItem('autocomm_superadmin_user');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (username, password) => {
    const res = await superAdminApiClient.post('/auth/login', { username, password });
    const { token, user } = res.data.data;
    localStorage.setItem('autocomm_superadmin_token', token);
    localStorage.setItem('autocomm_superadmin_user', JSON.stringify(user));
    setAdminUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('autocomm_superadmin_token');
    localStorage.removeItem('autocomm_superadmin_user');
    setAdminUser(null);
  };

  return (
    <SuperAdminAuthContext.Provider value={{ adminUser, loading, login, logout }}>
      {children}
    </SuperAdminAuthContext.Provider>
  );
};

export const useSuperAdminAuth = () => useContext(SuperAdminAuthContext);
