import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bell, CheckCheck, AlertTriangle, FileWarning, Receipt, Info } from 'lucide-react';
import api from '../utils/api';

const iconMap = {
  panico: AlertTriangle,
  reporte: FileWarning,
  multa: Receipt,
};

export default function NotificacionesPage() {
  const { notifications, unreadCount, fetchNotifications } = useAuth();

  useEffect(() => {
    if (unreadCount > 0) {
      api.put('/api/notificaciones/leer-todas').then(() => fetchNotifications());
    }
  }, []);

  const formatDate = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `hace ${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `hace ${diffHr}h`;
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  };

  return (
    <div data-testid="notificaciones-page" className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-stone-900">Notificaciones</h1>
          <p className="text-stone-500 text-sm">{notifications.length} notificaciones</p>
        </div>
        {notifications.some(n => !n.leida) && (
          <button
            data-testid="mark-all-read"
            onClick={() => api.put('/api/notificaciones/leer-todas').then(() => fetchNotifications())}
            className="flex items-center gap-1 text-sm text-primary-700 font-medium hover:text-primary-800"
          >
            <CheckCheck size={16} />Leer todas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={48} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-medium">Sin notificaciones</p>
          <p className="text-stone-400 text-sm">Te avisaremos cuando algo ocurra</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => {
            const Icon = iconMap[n.tipo] || Info;
            return (
              <div
                key={n.id}
                data-testid={`notification-${i}`}
                className={`bg-white rounded-2xl p-4 shadow-sm border flex items-start gap-3 transition-colors ${!n.leida ? 'border-primary-200 bg-primary-50/30' : 'border-stone-100'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  n.tipo === 'panico' ? 'bg-red-100 text-red-600' :
                  n.tipo === 'multa' ? 'bg-amber-100 text-amber-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-stone-900">{n.titulo}</p>
                  <p className="text-stone-500 text-xs mt-0.5">{n.mensaje}</p>
                  <p className="text-stone-400 text-[11px] mt-1">{formatDate(n.fecha)}</p>
                </div>
                {!n.leida && <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
