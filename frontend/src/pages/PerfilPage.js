import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { User, Phone, Mail, Edit3, Save, LogOut, Shield, AlertTriangle, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ImageUpload from '../components/ImageUpload';

export default function PerfilPage() {
  const { user, updateUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nombre_completo: user?.nombre_completo || '',
    telefono: user?.telefono || '',
    bio: user?.bio || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPanic, setShowPanic] = useState(false);
  const [panicking, setPanicking] = useState(false);

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const updated = await api.put('/api/profile', form);
      updateUser({ ...user, ...form });
      setEditing(false);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const handlePanic = async () => {
    setPanicking(true);
    try {
      await api.post('/api/panico');
      setShowPanic(false);
      alert('Alerta de panico activada. Los administradores han sido notificados.');
    } catch (err) { alert(err.message); } finally { setPanicking(false); }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div data-testid="perfil-page" className="animate-fade-in">
      <h1 className="font-heading font-bold text-2xl text-stone-900 mb-6">Mi Perfil</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden mb-4">
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 h-24 relative">
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center text-primary-700 font-bold text-2xl font-heading border-4 border-white">
              {(user?.nombre_completo || user?.username || '?')[0].toUpperCase()}
            </div>
          </div>
        </div>
        <div className="pt-14 pb-5 px-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-heading font-bold text-lg text-stone-900">{user?.nombre_completo || user?.username}</h2>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${isAdmin ? 'bg-primary-100 text-primary-700' : 'bg-stone-100 text-stone-600'}`}>
                {isAdmin ? <><Shield size={12} />Administrador</> : 'Vecino'}
              </span>
            </div>
            <button data-testid="edit-profile-btn" onClick={() => setEditing(!editing)} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors">
              <Edit3 size={18} />
            </button>
          </div>

          {error && <p className="text-danger-600 text-sm mb-3 bg-danger-50 px-3 py-2 rounded-lg">{error}</p>}

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Nombre completo</label>
                <input data-testid="profile-name-input" type="text" value={form.nombre_completo} onChange={e => setForm({...form, nombre_completo: e.target.value})} className="h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-sm text-stone-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Telefono</label>
                <input data-testid="profile-phone-input" type="text" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-sm text-stone-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Biografia</label>
                <textarea data-testid="profile-bio-input" value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3} maxLength={500} className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl w-full text-sm text-stone-900 resize-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
              </div>
              <button data-testid="save-profile-btn" onClick={handleSave} disabled={saving} className="h-11 w-full bg-primary-700 text-white font-medium rounded-full flex items-center justify-center gap-2 hover:bg-primary-800 transition-colors disabled:opacity-60 text-sm">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={16} />Guardar</>}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-stone-600">
                <Mail size={16} className="text-stone-400" />
                {user?.email}
              </div>
              {user?.telefono && (
                <div className="flex items-center gap-3 text-sm text-stone-600">
                  <Phone size={16} className="text-stone-400" />
                  {user.telefono}
                </div>
              )}
              {user?.bio && (
                <p className="text-sm text-stone-600 bg-stone-50 rounded-xl p-3">{user.bio}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Panic Button */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 mb-4">
        <h3 className="font-heading font-semibold text-stone-900 mb-2 flex items-center gap-2">
          <AlertTriangle size={18} className="text-danger-500" />
          Boton de Panico
        </h3>
        <p className="text-stone-500 text-sm mb-4">Activa una alerta de emergencia. Los administradores seran notificados inmediatamente.</p>
        <button
          data-testid="panic-button"
          onClick={() => setShowPanic(true)}
          className="h-12 w-full bg-danger-600 text-white font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-200 animate-pulse-glow active:scale-95"
        >
          <AlertTriangle size={20} />ACTIVAR ALERTA
        </button>
      </div>

      {/* Panic Confirmation */}
      {showPanic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPanic(false)}>
          <div className="bg-white rounded-2xl w-80 p-6 text-center animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-danger-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-danger-600" />
            </div>
            <h3 className="font-heading font-bold text-lg text-stone-900 mb-2">Confirmar Alerta</h3>
            <p className="text-stone-500 text-sm mb-6">Esto enviara una alerta de emergencia a todos los administradores. Deseas continuar?</p>
            <div className="flex gap-3">
              <button data-testid="cancel-panic" onClick={() => setShowPanic(false)} className="flex-1 h-11 bg-stone-100 text-stone-600 font-medium rounded-full hover:bg-stone-200 transition-colors text-sm">Cancelar</button>
              <button data-testid="confirm-panic" onClick={handlePanic} disabled={panicking} className="flex-1 h-11 bg-danger-600 text-white font-medium rounded-full hover:bg-red-700 transition-colors text-sm disabled:opacity-60">
                {panicking ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <button data-testid="logout-btn" onClick={handleLogout} className="w-full h-12 flex items-center justify-center gap-2 text-danger-600 font-medium bg-white rounded-2xl shadow-sm border border-stone-100 hover:bg-danger-50 transition-colors">
        <LogOut size={18} />Cerrar Sesion
      </button>
    </div>
  );
}
