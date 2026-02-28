import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Plus, FileWarning, X, Send, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const estadoConfig = {
  'Recibido': { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Recibido' },
  'EnProceso': { color: 'bg-blue-100 text-blue-700', icon: AlertCircle, label: 'En Proceso' },
  'Resuelto': { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Resuelto' },
};

export default function ReportesPage() {
  const { user, isAdmin } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: '', descripcion: '', ubicacion: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('');

  const fetchReportes = useCallback(async () => {
    try {
      const url = filtro ? `/api/reportes?limit=50&estado=${filtro}` : '/api/reportes?limit=50';
      const data = await api.get(url);
      setReportes(data.items || []);
    } catch (e) {} finally { setLoading(false); }
  }, [filtro]);

  useEffect(() => { fetchReportes(); }, [fetchReportes]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/api/reportes', form);
      setForm({ titulo: '', descripcion: '', ubicacion: '' });
      setShowForm(false);
      fetchReportes();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const handleEstado = async (id, estado) => {
    try {
      await api.put(`/api/reportes/${id}/estado`, { estado });
      fetchReportes();
    } catch (err) { alert(err.message); }
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-primary-700 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div data-testid="reportes-page" className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-stone-900">Reportes</h1>
          <p className="text-stone-500 text-sm">Incidentes de la comunidad</p>
        </div>
        <button data-testid="create-report-btn" onClick={() => setShowForm(true)} className="h-10 px-4 bg-primary-700 text-white rounded-full text-sm font-medium flex items-center gap-2 hover:bg-primary-800 transition-colors shadow-sm active:scale-95">
          <Plus size={18} />Reportar
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['', 'Recibido', 'EnProceso', 'Resuelto'].map(f => (
          <button key={f} data-testid={`filter-${f || 'all'}`} onClick={() => setFiltro(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filtro === f ? 'bg-primary-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
            {f ? (estadoConfig[f]?.label || f) : 'Todos'}
          </button>
        ))}
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-stone-900">Nuevo Reporte</h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-stone-100"><X size={20} className="text-stone-500" /></button>
            </div>
            {error && <p className="text-danger-600 text-sm mb-3 bg-danger-50 px-3 py-2 rounded-lg">{error}</p>}
            <form onSubmit={handleCreate} className="space-y-4">
              <input data-testid="report-title-input" type="text" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} placeholder="Titulo del incidente" className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
              <textarea data-testid="report-desc-input" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Describe el incidente con detalle..." rows={3} className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 placeholder:text-stone-400 resize-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
              <input data-testid="report-location-input" type="text" value={form.ubicacion} onChange={e => setForm({...form, ubicacion: e.target.value})} placeholder="Ubicacion (ej: Calle 5, entre Av 3 y 4)" className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
              <button data-testid="submit-report-btn" type="submit" disabled={submitting} className="h-12 w-full bg-primary-700 text-white font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-primary-800 transition-colors disabled:opacity-60">
                {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={18} />Enviar Reporte</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {reportes.length === 0 ? (
        <div className="text-center py-16">
          <FileWarning size={48} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-medium">No hay reportes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reportes.map((r, i) => {
            const cfg = estadoConfig[r.estado] || estadoConfig['Recibido'];
            const Icon = cfg.icon;
            return (
              <div key={r.id} data-testid={`report-card-${i}`} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-heading font-semibold text-stone-900 text-sm flex-1">{r.titulo}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 ${cfg.color}`}>
                    <Icon size={12} />{cfg.label}
                  </span>
                </div>
                <p className="text-stone-600 text-sm mb-2 line-clamp-2">{r.descripcion}</p>
                <div className="flex items-center gap-4 text-xs text-stone-400">
                  <span className="flex items-center gap-1"><MapPin size={12} />{r.ubicacion}</span>
                  <span>{formatDate(r.fecha)}</span>
                  <span>{r.autor?.nombre_completo || r.autor?.username}</span>
                </div>
                {isAdmin && r.estado !== 'Resuelto' && (
                  <div className="mt-3 flex gap-2">
                    {r.estado === 'Recibido' && (
                      <button data-testid={`mark-process-${i}`} onClick={() => handleEstado(r.id, 'EnProceso')} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">En Proceso</button>
                    )}
                    <button data-testid={`mark-resolved-${i}`} onClick={() => handleEstado(r.id, 'Resuelto')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors">Resuelto</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
