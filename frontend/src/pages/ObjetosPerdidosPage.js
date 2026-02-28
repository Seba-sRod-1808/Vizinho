import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Plus, Search, X, Send, CheckCircle, Package } from 'lucide-react';

export default function ObjetosPerdidosPage() {
  const { user, isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: '', descripcion: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = useCallback(async () => {
    try {
      const data = await api.get('/api/objetos-perdidos?limit=50');
      setItems(data.items || []);
    } catch (e) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/api/objetos-perdidos', form);
      setForm({ titulo: '', descripcion: '' });
      setShowForm(false);
      fetchItems();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const handleFound = async (id) => {
    if (!window.confirm('Marcar como encontrado?')) return;
    try {
      await api.put(`/api/objetos-perdidos/${id}/encontrado`);
      fetchItems();
    } catch (err) { alert(err.message); }
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-primary-700 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div data-testid="objetos-perdidos-page" className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-stone-900">Objetos Perdidos</h1>
          <p className="text-stone-500 text-sm">Ayuda a encontrar lo perdido</p>
        </div>
        <button data-testid="create-lost-item-btn" onClick={() => setShowForm(true)} className="h-10 px-4 bg-primary-700 text-white rounded-full text-sm font-medium flex items-center gap-2 hover:bg-primary-800 transition-colors shadow-sm active:scale-95">
          <Plus size={18} />Reportar
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-stone-900">Reportar Objeto Perdido</h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-stone-100"><X size={20} className="text-stone-500" /></button>
            </div>
            {error && <p className="text-danger-600 text-sm mb-3 bg-danger-50 px-3 py-2 rounded-lg">{error}</p>}
            <form onSubmit={handleCreate} className="space-y-4">
              <input data-testid="lost-item-title" type="text" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} placeholder="Que perdiste?" className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
              <textarea data-testid="lost-item-desc" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Describe el objeto con detalle..." rows={3} className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 placeholder:text-stone-400 resize-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
              <button data-testid="submit-lost-item" type="submit" disabled={submitting} className="h-12 w-full bg-primary-700 text-white font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-primary-800 transition-colors disabled:opacity-60">
                {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={18} />Reportar</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-medium">No hay objetos reportados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item, i) => (
            <div key={item.id} data-testid={`lost-item-card-${i}`} className={`bg-white rounded-2xl p-4 shadow-sm border ${item.encontrado ? 'border-emerald-200 bg-emerald-50/50' : 'border-stone-100'}`}>
              {item.imagen_url && <img src={item.imagen_url} alt="" className="w-full h-32 object-cover rounded-xl mb-3" />}
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-heading font-semibold text-stone-900 text-sm">{item.titulo}</h3>
                {item.encontrado && <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 ml-2" />}
              </div>
              <p className="text-stone-600 text-xs mb-2 line-clamp-2">{item.descripcion}</p>
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>{item.autor?.nombre_completo || item.autor?.username}</span>
                <span>{formatDate(item.fecha)}</span>
              </div>
              {!item.encontrado && (item.usuario_id === user?.id || isAdmin) && (
                <button data-testid={`mark-found-${i}`} onClick={() => handleFound(item.id)} className="mt-3 w-full h-9 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1">
                  <CheckCircle size={14} />Marcar encontrado
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
