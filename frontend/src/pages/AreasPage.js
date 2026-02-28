import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Calendar, Plus, X, Send, Clock, Users, MapPin } from 'lucide-react';

export default function AreasPage() {
  const { isAdmin } = useAuth();
  const [areas, setAreas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReserva, setShowReserva] = useState(null);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [areaForm, setAreaForm] = useState({ nombre: '', descripcion: '', capacidad: 10 });
  const [reservaForm, setReservaForm] = useState({ fecha: '', hora_inicio: '', hora_fin: '', motivo: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [areasData, reservasData] = await Promise.all([
        api.get('/api/areas-comunes'),
        api.get('/api/reservas')
      ]);
      setAreas(areasData.items || []);
      setReservas(reservasData.items || []);
    } catch (e) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateArea = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/api/areas-comunes', { ...areaForm, capacidad: parseInt(areaForm.capacidad), disponible: true });
      setAreaForm({ nombre: '', descripcion: '', capacidad: 10 });
      setShowAreaForm(false);
      fetchData();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const handleReservar = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/api/reservas', { ...reservaForm, area_id: showReserva });
      setReservaForm({ fecha: '', hora_inicio: '', hora_fin: '', motivo: '' });
      setShowReserva(null);
      fetchData();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-primary-700 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div data-testid="areas-page" className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-stone-900">Areas Comunes</h1>
          <p className="text-stone-500 text-sm">Reserva espacios de tu comunidad</p>
        </div>
        {isAdmin && (
          <button data-testid="create-area-btn" onClick={() => setShowAreaForm(true)} className="h-10 px-4 bg-primary-700 text-white rounded-full text-sm font-medium flex items-center gap-2 hover:bg-primary-800 transition-colors shadow-sm active:scale-95">
            <Plus size={18} />Nueva Area
          </button>
        )}
      </div>

      {/* Area Form Modal */}
      {showAreaForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowAreaForm(false)}>
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-stone-900">Nueva Area Comun</h3>
              <button onClick={() => setShowAreaForm(false)} className="p-2 rounded-lg hover:bg-stone-100"><X size={20} className="text-stone-500" /></button>
            </div>
            {error && <p className="text-danger-600 text-sm mb-3 bg-danger-50 px-3 py-2 rounded-lg">{error}</p>}
            <form onSubmit={handleCreateArea} className="space-y-4">
              <input data-testid="area-name-input" type="text" value={areaForm.nombre} onChange={e => setAreaForm({...areaForm, nombre: e.target.value})} placeholder="Nombre del area" className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
              <textarea data-testid="area-desc-input" value={areaForm.descripcion} onChange={e => setAreaForm({...areaForm, descripcion: e.target.value})} placeholder="Descripcion" rows={2} className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 placeholder:text-stone-400 resize-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
              <input data-testid="area-capacity-input" type="number" min={1} value={areaForm.capacidad} onChange={e => setAreaForm({...areaForm, capacidad: e.target.value})} placeholder="Capacidad" className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
              <button data-testid="submit-area-btn" type="submit" disabled={submitting} className="h-12 w-full bg-primary-700 text-white font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-primary-800 transition-colors disabled:opacity-60">
                {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={18} />Crear Area</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      {showReserva && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowReserva(null)}>
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-stone-900">Reservar</h3>
              <button onClick={() => setShowReserva(null)} className="p-2 rounded-lg hover:bg-stone-100"><X size={20} className="text-stone-500" /></button>
            </div>
            {error && <p className="text-danger-600 text-sm mb-3 bg-danger-50 px-3 py-2 rounded-lg">{error}</p>}
            <form onSubmit={handleReservar} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1.5 block">Fecha</label>
                <input data-testid="reserva-date" type="date" value={reservaForm.fecha} onChange={e => setReservaForm({...reservaForm, fecha: e.target.value})} className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1.5 block">Hora inicio</label>
                  <input data-testid="reserva-start" type="time" value={reservaForm.hora_inicio} onChange={e => setReservaForm({...reservaForm, hora_inicio: e.target.value})} className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1.5 block">Hora fin</label>
                  <input data-testid="reserva-end" type="time" value={reservaForm.hora_fin} onChange={e => setReservaForm({...reservaForm, hora_fin: e.target.value})} className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
                </div>
              </div>
              <input data-testid="reserva-motivo" type="text" value={reservaForm.motivo} onChange={e => setReservaForm({...reservaForm, motivo: e.target.value})} placeholder="Motivo de la reserva" className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl w-full text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
              <button data-testid="submit-reserva-btn" type="submit" disabled={submitting} className="h-12 w-full bg-primary-700 text-white font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-primary-800 transition-colors disabled:opacity-60">
                {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Calendar size={18} />Reservar</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Areas List */}
      {areas.length === 0 ? (
        <div className="text-center py-16">
          <MapPin size={48} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-medium">No hay areas comunes registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {areas.map((area, i) => (
            <div key={area.id} data-testid={`area-card-${i}`} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">
              {area.imagen_url ? (
                <img src={area.imagen_url} alt="" className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <MapPin size={32} className="text-primary-500" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-heading font-semibold text-stone-900 mb-1">{area.nombre}</h3>
                <p className="text-stone-500 text-sm mb-3 line-clamp-2">{area.descripcion}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-stone-400">
                    <Users size={14} />Capacidad: {area.capacidad}
                  </span>
                  {area.disponible && (
                    <button data-testid={`reserve-area-${i}`} onClick={() => { setShowReserva(area.id); setError(''); }} className="px-4 py-2 bg-primary-700 text-white rounded-full text-xs font-medium hover:bg-primary-800 transition-colors active:scale-95">
                      Reservar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Reservations */}
      {reservas.length > 0 && (
        <div className="mt-8">
          <h2 className="font-heading font-bold text-lg text-stone-900 mb-4">Mis Reservas</h2>
          <div className="space-y-3">
            {reservas.map((r, i) => (
              <div key={r.id} data-testid={`reserva-card-${i}`} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} className="text-primary-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-stone-900">{r.area_nombre}</p>
                  <p className="text-xs text-stone-500">{r.fecha} | {r.hora_inicio} - {r.hora_fin}</p>
                  <p className="text-xs text-stone-400 truncate">{r.motivo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
