import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import FeedPage from './pages/FeedPage';
import ReportesPage from './pages/ReportesPage';
import MultasPage from './pages/MultasPage';
import ObjetosPerdidosPage from './pages/ObjetosPerdidosPage';
import AreasPage from './pages/AreasPage';
import PerfilPage from './pages/PerfilPage';
import AdminDashboard from './pages/AdminDashboard';
import NotificacionesPage from './pages/NotificacionesPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-8 h-8 border-3 border-primary-700 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/app/feed" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/app/feed" /> : <LoginPage />} />
      <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/feed" />} />
        <Route path="feed" element={<FeedPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="multas" element={<MultasPage />} />
        <Route path="objetos-perdidos" element={<ObjetosPerdidosPage />} />
        <Route path="areas" element={<AreasPage />} />
        <Route path="perfil" element={<PerfilPage />} />
        <Route path="notificaciones" element={<NotificacionesPage />} />
        <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to={user ? "/app/feed" : "/login"} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
