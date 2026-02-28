import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Plus, X, Send, BarChart3, CheckCircle, Lock, Trash2, Vote, Users } from 'lucide-react';

export default function EncuestasPage() {
  const { user, isAdmin } = useAuth();
  const [encuestas, setEncuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ pregunta: '', descripcion: '', opciones: ['', ''] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [voting, setVoting] = useState(null);

  const fetchEncuestas = useCallback(async () => {
    try {
      const data = await api.get('/api/encuestas');
      setEncuestas(data.items || []);
    } catch (e) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEncuestas(); }, [fetchEncuestas]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const opciones = form.opciones.filter(o => o.trim());
      await api.post('/api/encuestas', { ...form, opciones });
      setForm({ pregunta: '', descripcion: '', opciones: ['', ''] });
      setShowForm(false);
      fetchEncuestas();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const handleVote = async (encuestaId, opcionIndex) => {
    setVoting(`${encuestaId}-${opcionIndex}`);
    try {
      await api.post(`/api/encuestas/${encuestaId}/votar`, { opcion_index: opcionIndex });
      fetchEncuestas();
    } catch (err) { alert(err.message); } finally { setVoting(null); }
  };

  const handleCerrar = async (id) => {
    if (!window.confirm('Cerrar esta encuesta? No se podran agregar mas votos.')) return;
    try {
      await api.put(`/api/encuestas/${id}/cerrar`);
      fetchEncuestas();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar esta encuesta?')) return;
    try {
      await api.delete(`/api/encuestas/${id}`);
      fetchEncuestas();
    } catch (err) { alert(err.message); }
  };

  const addOption = () => {
    if (form.opciones.length < 10) {
      setForm({ ...form, opciones: [...form.opciones, ''] });
    }
  };

  const removeOption = (idx) => {
    if (form.opciones.length > 2) {
      setForm({ ...form, opciones: form.opciones.filter((_, i) => i !== idx) });
    }
  };

  const updateOption = (idx, val) => {
    const newOpciones = [...form.opciones];
    newOpciones[idx] = val;
    setForm({ ...form, opciones: newOpciones });
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-primary-700 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div data-testid="encuestas-page" className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-stone-900">Encuestas</h1>
          <p className="text-stone-500 text-sm">Vota y decide con tu comunidad</p>
        </div>
        <button
          data-testid="create-encuesta-btn"
          onClick={() => { setShowForm(true); setError(''); }}
          className="h-10 px-4 bg-primary-700 text-white rounded-full text-sm font-medium flex items-center gap-2 hover:bg-primary-800 transition-colors shadow-sm active:scale-95"
        >
          <Plus size={18} />Crear
        </button>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg p-6 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-stone-900">Nueva Encuesta</h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-stone-100"><X size={20} className="text-stone-500" /></button>
            </div>
            {error && <p className="text-danger-600 text-sm mb-3 bg-danger-50 px-3 py-2 rounded-lg">{error}</p>}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1.5 block">Pregunta</label>
                <input
                  data-testid="encuesta-pregunta"
                  type="text"
                  value={form.pregunta}
                  onChange={e => setForm({...form, pregunta: e.target.value})}
                  placeholder="Ej: Deberiamos permitir mascotas en areas comunes?"
                  className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1.5 block">Descripcion (opcional)</label>
                <textarea
                  data-testid="encuesta-descripcion"
                  value={form.descripcion}
                  onChange={e => setForm({...form, descripcion: e.target.value})}
                  placeholder="Contexto adicional para los votantes..."
                  rows={2}
                  className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 placeholder:text-stone-400 resize-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">Opciones</label>
                <div className="space-y-2">
                  {form.opciones.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        data-testid={`encuesta-opcion-${i}`}
                        type="text"
                        value={opt}
                        onChange={e => updateOption(i, e.target.value)}
                        placeholder={`Opcion ${i + 1}`}
                        className="h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl flex-1 text-sm text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        required
                      />
                      {form.opciones.length > 2 && (
                        <button type="button" onClick={() => removeOption(i)} className="p-2 text-stone-400 hover:text-danger-500 transition-colors">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {form.opciones.length < 10 && (
                  <button
                    type="button"
                    data-testid="add-option-btn"
                    onClick={addOption}
                    className="mt-2 text-sm text-primary-700 font-medium hover:text-primary-800 flex items-center gap-1"
                  >
                    <Plus size={14} />Agregar opcion
                  </button>
                )}
              </div>
              <button
                data-testid="submit-encuesta-btn"
                type="submit"
                disabled={submitting}
                className="h-12 w-full bg-primary-700 text-white font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-primary-800 transition-colors disabled:opacity-60"
              >
                {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={18} />Crear Encuesta</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {encuestas.length === 0 ? (
        <div className="text-center py-16">
          <BarChart3 size={48} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-medium">No hay encuestas</p>
          <p className="text-stone-400 text-sm">Crea la primera encuesta de tu comunidad</p>
        </div>
      ) : (
        <div className="space-y-4">
          {encuestas.map((enc, i) => {
            const maxVotos = Math.max(...enc.opciones.map(o => o.votos), 1);
            return (
              <div key={enc.id} data-testid={`encuesta-card-${i}`} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!enc.activa && <Lock size={14} className="text-stone-400" />}
                      <h3 className="font-heading font-semibold text-stone-900">{enc.pregunta}</h3>
                    </div>
                    {enc.descripcion && <p className="text-stone-500 text-sm mb-2">{enc.descripcion}</p>}
                    <div className="flex items-center gap-3 text-xs text-stone-400">
                      <span>{enc.creador?.nombre_completo || enc.creador?.username}</span>
                      <span>{formatDate(enc.fecha)}</span>
                      <span className="flex items-center gap-1"><Users size={12} />{enc.total_votos} votos</span>
                    </div>
                  </div>
                  {(enc.creador_id === user?.id || isAdmin) && (
                    <div className="flex gap-1">
                      {enc.activa && (
                        <button data-testid={`close-encuesta-${i}`} onClick={() => handleCerrar(enc.id)} className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-amber-500 transition-colors" title="Cerrar encuesta">
                          <Lock size={16} />
                        </button>
                      )}
                      <button data-testid={`delete-encuesta-${i}`} onClick={() => handleDelete(enc.id)} className="p-2 rounded-lg hover:bg-danger-50 text-stone-400 hover:text-danger-500 transition-colors" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-2 mt-4">
                  {enc.opciones.map((opt, j) => {
                    const pct = enc.total_votos > 0 ? Math.round((opt.votos / enc.total_votos) * 100) : 0;
                    const isMyVote = enc.mi_voto === j;
                    const isWinner = !enc.activa && opt.votos === maxVotos && opt.votos > 0;
                    return (
                      <button
                        key={j}
                        data-testid={`vote-option-${i}-${j}`}
                        onClick={() => enc.activa ? handleVote(enc.id, j) : null}
                        disabled={!enc.activa || voting === `${enc.id}-${j}`}
                        className={`w-full text-left relative overflow-hidden rounded-xl border transition-all ${
                          isMyVote ? 'border-primary-400 bg-primary-50' : 
                          isWinner ? 'border-emerald-300 bg-emerald-50' : 
                          'border-stone-200 hover:border-primary-300'
                        } ${enc.activa ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'}`}
                      >
                        {/* Progress bar bg */}
                        <div
                          className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                            isMyVote ? 'bg-primary-100' : isWinner ? 'bg-emerald-100' : 'bg-stone-100'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isMyVote && <CheckCircle size={16} className="text-primary-600" />}
                            <span className={`text-sm font-medium ${isMyVote ? 'text-primary-700' : 'text-stone-700'}`}>
                              {opt.texto}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-500">{pct}%</span>
                            <span className="text-[10px] text-stone-400">({opt.votos})</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {!enc.activa && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-stone-400">
                    <Lock size={12} />
                    <span>Encuesta cerrada</span>
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
