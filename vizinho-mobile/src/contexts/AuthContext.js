import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/api/notificaciones');
      setNotifications(data.items || []);
      setUnreadCount(data.unread_count || 0);
    } catch (e) {}
  }, [user]);

  useEffect(() => {
    const init = async () => {
      try {
        const token = await SecureStore.getItemAsync('vizinho_token');
        if (token) {
          const { data } = await api.get('/api/auth/me');
          setUser(data);
        }
      } catch (e) {
        await SecureStore.deleteItemAsync('vizinho_token');
        await SecureStore.deleteItemAsync('vizinho_user');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const login = async (username, password) => {
    const { data } = await api.post('/api/auth/login', { username, password });
    await SecureStore.setItemAsync('vizinho_token', data.token);
    await SecureStore.setItemAsync('vizinho_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await api.post('/api/auth/register', formData);
    await SecureStore.setItemAsync('vizinho_token', data.token);
    await SecureStore.setItemAsync('vizinho_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('vizinho_token');
    await SecureStore.deleteItemAsync('vizinho_user');
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    SecureStore.setItemAsync('vizinho_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, updateUser,
      notifications, unreadCount, fetchNotifications,
      isAdmin: user?.rol === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
