import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vizinho_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.get('/api/notificaciones');
      setNotifications(data.items || []);
      setUnreadCount(data.unread_count || 0);
    } catch (e) {}
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('vizinho_token');
    if (token) {
      api.get('/api/auth/me').then(u => {
        setUser(u);
        localStorage.setItem('vizinho_user', JSON.stringify(u));
      }).catch(() => {
        localStorage.removeItem('vizinho_token');
        localStorage.removeItem('vizinho_user');
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  // WebSocket
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('vizinho_token');
    if (!token) return;
    const wsUrl = process.env.REACT_APP_BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    let ws;
    try {
      ws = new WebSocket(`${wsUrl}/api/ws/${token}`);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'notification') {
            fetchNotifications();
          }
        } catch (err) {}
      };
      ws.onclose = () => {};
      const ping = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 25000);
      return () => {
        clearInterval(ping);
        ws.close();
      };
    } catch (err) {}
  }, [user, fetchNotifications]);

  const login = async (username, password) => {
    const data = await api.post('/api/auth/login', { username, password });
    localStorage.setItem('vizinho_token', data.token);
    localStorage.setItem('vizinho_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (formData) => {
    const data = await api.post('/api/auth/register', formData);
    localStorage.setItem('vizinho_token', data.token);
    localStorage.setItem('vizinho_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('vizinho_token');
    localStorage.removeItem('vizinho_user');
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('vizinho_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, updateUser,
      notifications, unreadCount, fetchNotifications,
      isAdmin: user?.rol === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
