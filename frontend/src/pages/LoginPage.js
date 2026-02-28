import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', email: '', nombre_completo: '', telefono: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(form);
      } else {
        await login(form.username, form.password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #064E3B 0%, #047857 50%, #059669 100%)' }}>
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8">
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center mb-4 animate-fade-in">
          <span className="text-3xl font-heading font-bold text-white">V</span>
        </div>
        <h1 className="font-heading font-bold text-3xl text-white mb-1 animate-fade-in">Vizinho</h1>
        <p className="text-primary-200 text-sm animate-fade-in">Tu comunidad, conectada</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-t-3xl px-6 pt-8 pb-10 shadow-2xl animate-slide-up" style={{ minHeight: '55vh' }}>
        <h2 className="font-heading font-bold text-2xl text-stone-900 mb-1">
          {isRegister ? 'Crear cuenta' : 'Bienvenido'}
        </h2>
        <p className="text-stone-500 text-sm mb-6">
          {isRegister ? 'Registrate para unirte a tu comunidad' : 'Inicia sesion en tu comunidad'}
        </p>

        {error && (
          <div data-testid="login-error" className="bg-danger-50 text-danger-600 text-sm px-4 py-3 rounded-xl mb-4 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-stone-700 mb-1.5 block">Usuario</label>
            <input
              data-testid="login-username"
              type="text"
              value={form.username}
              onChange={e => setForm({...form, username: e.target.value})}
              placeholder="Tu nombre de usuario"
              className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-full transition-all text-stone-900 placeholder:text-stone-400"
              required
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1.5 block">Correo electronico</label>
                <input
                  data-testid="register-email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="correo@ejemplo.com"
                  className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-full transition-all text-stone-900 placeholder:text-stone-400"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1.5 block">Nombre completo</label>
                <input
                  data-testid="register-name"
                  type="text"
                  value={form.nombre_completo}
                  onChange={e => setForm({...form, nombre_completo: e.target.value})}
                  placeholder="Juan Perez"
                  className="h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-full transition-all text-stone-900 placeholder:text-stone-400"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium text-stone-700 mb-1.5 block">Contrasena</label>
            <div className="relative">
              <input
                data-testid="login-password"
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                placeholder="Tu contrasena"
                className="h-12 px-4 pr-12 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-full transition-all text-stone-900 placeholder:text-stone-400"
                required
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">
                {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            data-testid="login-submit-btn"
            type="submit"
            disabled={loading}
            className="h-12 w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-full flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary-700/25 disabled:opacity-60 active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isRegister ? 'Crear cuenta' : 'Iniciar Sesion'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            data-testid="toggle-auth-mode"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-sm text-primary-700 font-medium hover:text-primary-800 transition-colors"
          >
            {isRegister ? 'Ya tengo cuenta - Iniciar Sesion' : 'No tengo cuenta - Registrarme'}
          </button>
        </div>

        {/* Quick access hint */}
        {!isRegister && (
          <div className="mt-6 p-4 bg-stone-50 rounded-xl border border-stone-100">
            <p className="text-xs text-stone-500 mb-2 font-medium">Acceso rapido (demo):</p>
            <div className="flex gap-2">
              <button
                data-testid="quick-login-admin"
                onClick={() => setForm({ ...form, username: 'admin', password: 'admin123' })}
                className="text-xs px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg font-medium hover:bg-primary-100 transition-colors"
              >
                Admin
              </button>
              <button
                data-testid="quick-login-vecino"
                onClick={() => setForm({ ...form, username: 'vecino1', password: 'vecino123' })}
                className="text-xs px-3 py-1.5 bg-stone-100 text-stone-600 rounded-lg font-medium hover:bg-stone-200 transition-colors"
              >
                Vecino
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
