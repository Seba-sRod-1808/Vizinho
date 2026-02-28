import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Receipt, DollarSign, CheckCircle, Clock, CreditCard } from 'lucide-react';

export default function MultasPage() {
  const { user, isAdmin } = useAuth();
  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);

  const fetchMultas = useCallback(async () => {
    try {
      const data = await api.get('/api/multas?limit=50');
      setMultas(data.items || []);
    } catch (e) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMultas(); }, [fetchMultas]);

  const handlePagar = async (id) => {
    if (!window.confirm('Confirmar pago de esta multa?')) return;
    setPaying(id);
    try {
      await api.put(`/api/multas/${id}/pagar`);
      fetchMultas();
    } catch (err) { alert(err.message); } finally { setPaying(null); }
  };

  const totalPendiente = multas.filter(m => m.estado === 'Pendiente').reduce((s, m) => s + m.monto, 0);
  const formatDate = (iso) => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-primary-700 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div data-testid="multas-page" className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-stone-900">Multas</h1>
        <p className="text-stone-500 text-sm">{isAdmin ? 'Todas las multas del condominio' : 'Tus multas asignadas'}</p>
      </div>

      {/* Summary Card */}
      {!isAdmin && totalPendiente > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 mb-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={24} />
            <p className="text-sm font-medium opacity-90">Total pendiente</p>
          </div>
          <p className="text-3xl font-heading font-bold">${totalPendiente.toFixed(2)}</p>
        </div>
      )}

      {multas.length === 0 ? (
        <div className="text-center py-16">
          <Receipt size={48} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-medium">No hay multas</p>
          <p className="text-stone-400 text-sm">{isAdmin ? 'No se han creado multas' : 'No tienes multas asignadas'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {multas.map((m, i) => (
            <div key={m.id} data-testid={`multa-card-${i}`} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-stone-900 text-sm">{m.motivo}</p>
                  {isAdmin && <p className="text-xs text-stone-400 mt-0.5">{m.vecino?.nombre_completo || m.vecino?.username}</p>}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 ${m.estado === 'Pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {m.estado === 'Pendiente' ? <Clock size={12} /> : <CheckCircle size={12} />}
                  {m.estado}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-xl font-heading font-bold text-stone-900">${m.monto.toFixed(2)}</p>
                  <p className="text-xs text-stone-400">{formatDate(m.fecha)}</p>
                </div>
                {m.estado === 'Pendiente' && m.vecino_id === user?.id && (
                  <button
                    data-testid={`pay-multa-${i}`}
                    onClick={() => handlePagar(m.id)}
                    disabled={paying === m.id}
                    className="h-10 px-5 bg-primary-700 text-white rounded-full text-sm font-medium flex items-center gap-2 hover:bg-primary-800 transition-colors disabled:opacity-60 active:scale-95"
                  >
                    {paying === m.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><CreditCard size={16} />Pagar</>}
                  </button>
                )}
              </div>
              {m.fecha_pago && <p className="text-xs text-emerald-600 mt-2">Pagada el {formatDate(m.fecha_pago)}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
