import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Plus, Newspaper, Trash2, X, Send, Image } from 'lucide-react';

export default function FeedPage() {
  const { user, isAdmin } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: '', contenido: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchPosts = useCallback(async () => {
    try {
      const data = await api.get('/api/publicaciones?limit=50');
      setPosts(data.items || []);
    } catch (e) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/api/publicaciones', form);
      setForm({ titulo: '', contenido: '' });
      setShowForm(false);
      fetchPosts();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar esta publicacion?')) return;
    try {
      await api.delete(`/api/publicaciones/${id}`);
      fetchPosts();
    } catch (err) { alert(err.message); }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-primary-700 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div data-testid="feed-page" className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-stone-900">Mural</h1>
          <p className="text-stone-500 text-sm">Publicaciones de tu comunidad</p>
        </div>
        <button
          data-testid="create-post-btn"
          onClick={() => setShowForm(true)}
          className="h-10 px-4 bg-primary-700 text-white rounded-full text-sm font-medium flex items-center gap-2 hover:bg-primary-800 transition-colors shadow-sm active:scale-95"
        >
          <Plus size={18} />Publicar
        </button>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-stone-900">Nueva Publicacion</h3>
              <button data-testid="close-post-form" onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-stone-100"><X size={20} className="text-stone-500" /></button>
            </div>
            {error && <p className="text-danger-600 text-sm mb-3 bg-danger-50 px-3 py-2 rounded-lg">{error}</p>}
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                data-testid="post-title-input"
                type="text"
                value={form.titulo}
                onChange={e => setForm({...form, titulo: e.target.value})}
                placeholder="Titulo de la publicacion"
                className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-full text-stone-900 placeholder:text-stone-400"
                required
              />
              <textarea
                data-testid="post-content-input"
                value={form.contenido}
                onChange={e => setForm({...form, contenido: e.target.value})}
                placeholder="Escribe tu mensaje para la comunidad..."
                rows={4}
                className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-full text-stone-900 placeholder:text-stone-400 resize-none"
                required
              />
              <button
                data-testid="submit-post-btn"
                type="submit"
                disabled={submitting}
                className="h-12 w-full bg-primary-700 text-white font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-primary-800 transition-colors disabled:opacity-60"
              >
                {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={18} />Publicar</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <Newspaper size={48} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-medium">No hay publicaciones aun</p>
          <p className="text-stone-400 text-sm">Se el primero en publicar algo</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, i) => (
            <div key={post.id} data-testid={`post-card-${i}`} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                    {(post.autor?.nombre_completo || post.autor?.username || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-stone-900">{post.autor?.nombre_completo || post.autor?.username}</p>
                    <p className="text-xs text-stone-400">{formatDate(post.fecha)}</p>
                  </div>
                </div>
                {(post.vecino_id === user?.id || isAdmin) && (
                  <button data-testid={`delete-post-${i}`} onClick={() => handleDelete(post.id)} className="p-2 rounded-lg hover:bg-danger-50 text-stone-400 hover:text-danger-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <h3 className="font-heading font-semibold text-stone-900 mb-1">{post.titulo}</h3>
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">{post.contenido}</p>
              {post.imagen_url && (
                <img src={post.imagen_url} alt="" className="mt-3 rounded-xl w-full h-48 object-cover" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
