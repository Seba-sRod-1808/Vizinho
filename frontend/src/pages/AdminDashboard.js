import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { 
  BarChart3, Users, FileWarning, Receipt, AlertTriangle, Package, 
  Plus, X, Send, ChevronRight, Shield, Clock
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showMultaForm, setShowMultaForm] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', email: '', password: '', rol: 'vecino', nombre_completo: '', telefono: '' });
  const [multaForm, setMultaForm] = useState({ vecino_id: '', monto: '', motivo: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [dashData, usersData] = await Promise.all([
        api.get('/api/admin/dashboard'),
        api.get('/api/admin/usuarios?limit=100')
      ]);
      setStats(dashData);
      setUsuarios(usersData.items || []);
    } catch (e) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/api/admin/usuarios', userForm);
      setUserForm({ username: '', email: '', password: '', rol: 'vecino', nombre_completo: '', telefono: '' });
      setShowUserForm(false);
      fetchData();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const handleCreateMulta = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/api/multas', { ...multaForm, monto: parseFloat(multaForm.monto) });
      setMultaForm({ vecino_id: '', monto: '', motivo: '' });
      setShowMultaForm(false);
      fetchData();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const vecinos = usuarios.filter(u => u.rol === 'vecino');

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-primary-700 border-t-transparent rounded-full animate-spin"></div></div>;

  const statCards = stats ? [
    { label: 'Reportes Pendientes', value: stats.reportes_pendientes, icon: FileWarning, color: 'text-amber-600 bg-amber-50' },
    { label: 'Reportes En Proceso', value: stats.reportes_en_proceso, icon: Clock, color: 'text-blue-600 bg-blue-50' },
    { label: 'Multas Pendientes', value: stats.multas_pendientes, icon: Receipt, color: 'text-orange-600 bg-orange-50' },
    { label: 'Monto Pendiente', value: `$${stats.monto_multas_pendientes.toFixed(2)}`, icon: Receipt, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Alertas Activas', value: stats.alertas_activas, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
    { label: 'Objetos Perdidos', value: stats.objetos_perdidos_activos, icon: Package, color: 'text-purple-600 bg-purple-50' },
    { label: 'Total Usuarios', value: stats.total_usuarios, icon: Users, color: 'text-stone-600 bg-stone-50' },
    { label: 'Total Vecinos', value: stats.total_vecinos, icon: Users, color: 'text-primary-600 bg-primary-50' },
  ] : [];

  return (
    <div data-testid="admin-dashboard" className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={24} className="text-primary-700" />
        <div>
          <h1 className="font-heading font-bold text-2xl text-stone-900">Panel Admin</h1>
          <p className="text-stone-500 text-sm">Gestion del condominio</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { key: 'dashboard', label: 'Resumen' },
          { key: 'usuarios', label: 'Usuarios' },
          { key: 'acciones', label: 'Acciones' },
        ].map(t => (
          <button key={t.key} data-testid={`admin-tab-${t.key}`} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${tab === t.key ? 'bg-primary-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((s, i) => (
            <div key={i} data-testid={`stat-card-${i}`} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <s.icon size={20} />
              </div>
              <p className="text-2xl font-heading font-bold text-stone-900">{s.value}</p>
              <p className="text-xs text-stone-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Usuarios */}
      {tab === 'usuarios' && (
        <div>
          <div className="flex justify-end mb-4">
            <button data-testid="create-user-btn" onClick={() => { setShowUserForm(true); setError(''); }} className="h-10 px-4 bg-primary-700 text-white rounded-full text-sm font-medium flex items-center gap-2 hover:bg-primary-800 transition-colors active:scale-95">
              <Plus size={18} />Nuevo Usuario
            </button>
          </div>
          <div className="space-y-2">
            {usuarios.map((u, i) => (
              <div key={u.id} data-testid={`user-row-${i}`} className="bg-white rounded-xl p-4 shadow-sm border border-stone-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {(u.nombre_completo || u.username || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-stone-900 truncate">{u.nombre_completo || u.username}</p>
                  <p className="text-xs text-stone-400">{u.email}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${u.rol === 'admin' ? 'bg-primary-100 text-primary-700' : 'bg-stone-100 text-stone-600'}`}>
                  {u.rol === 'admin' ? 'Admin' : 'Vecino'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      {tab === 'acciones' && (
        <div className="space-y-3">
          <button data-testid="admin-create-user-action" onClick={() => { setShowUserForm(true); setError(''); }} className="w-full bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex items-center gap-4 hover:bg-stone-50 transition-colors text-left">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center"><Users size={22} className="text-primary-700" /></div>
            <div className="flex-1"><p className="font-medium text-sm text-stone-900">Crear Usuario</p><p className="text-xs text-stone-500">Agregar vecino o administrador</p></div>
            <ChevronRight size={18} className="text-stone-400" />
          </button>
          <button data-testid="admin-create-multa-action" onClick={() => { setShowMultaForm(true); setError(''); }} className="w-full bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex items-center gap-4 hover:bg-stone-50 transition-colors text-left">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center"><Receipt size={22} className="text-amber-600" /></div>
            <div className="flex-1"><p className="font-medium text-sm text-stone-900">Crear Multa</p><p className="text-xs text-stone-500">Asignar multa a un vecino</p></div>
            <ChevronRight size={18} className="text-stone-400" />
          </button>
        </div>
      )}

      {/* Create User Modal */}
      {showUserForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowUserForm(false)}>
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg p-6 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-stone-900">Crear Usuario</h3>
              <button onClick={() => setShowUserForm(false)} className="p-2 rounded-lg hover:bg-stone-100"><X size={20} className="text-stone-500" /></button>
            </div>
            {error && <p className="text-danger-600 text-sm mb-3 bg-danger-50 px-3 py-2 rounded-lg">{error}</p>}
            <form onSubmit={handleCreateUser} className="space-y-3">
              <input data-testid="new-user-username" type="text" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} placeholder="Nombre de usuario" className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
              <input data-testid="new-user-name" type="text" value={userForm.nombre_completo} onChange={e => setUserForm({...userForm, nombre_completo: e.target.value})} placeholder="Nombre completo" className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
              <input data-testid="new-user-email" type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} placeholder="Correo electronico" className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
              <input data-testid="new-user-password" type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} placeholder="Contrasena (min 8 caracteres)" className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
              <select data-testid="new-user-role" value={userForm.rol} onChange={e => setUserForm({...userForm, rol: e.target.value})} className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
                <option value="vecino">Vecino</option>
                <option value="admin">Administrador</option>
              </select>
              <button data-testid="submit-new-user" type="submit" disabled={submitting} className="h-12 w-full bg-primary-700 text-white font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-primary-800 transition-colors disabled:opacity-60">
                {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={18} />Crear</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Multa Modal */}
      {showMultaForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowMultaForm(false)}>
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-stone-900">Crear Multa</h3>
              <button onClick={() => setShowMultaForm(false)} className="p-2 rounded-lg hover:bg-stone-100"><X size={20} className="text-stone-500" /></button>
            </div>
            {error && <p className="text-danger-600 text-sm mb-3 bg-danger-50 px-3 py-2 rounded-lg">{error}</p>}
            <form onSubmit={handleCreateMulta} className="space-y-4">
              <select data-testid="multa-vecino-select" value={multaForm.vecino_id} onChange={e => setMultaForm({...multaForm, vecino_id: e.target.value})} className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required>
                <option value="">Selecciona un vecino...</option>
                {vecinos.map(v => <option key={v.id} value={v.id}>{v.nombre_completo || v.username} ({v.email})</option>)}
              </select>
              <input data-testid="multa-amount" type="number" step="0.01" min="0.01" max="10000" value={multaForm.monto} onChange={e => setMultaForm({...multaForm, monto: e.target.value})} placeholder="Monto ($)" className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
              <textarea data-testid="multa-reason" value={multaForm.motivo} onChange={e => setMultaForm({...multaForm, motivo: e.target.value})} placeholder="Motivo de la multa (min 10 caracteres)" rows={3} className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 placeholder:text-stone-400 resize-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
              <button data-testid="submit-multa" type="submit" disabled={submitting} className="h-12 w-full bg-primary-700 text-white font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-primary-800 transition-colors disabled:opacity-60">
                {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={18} />Crear Multa</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
