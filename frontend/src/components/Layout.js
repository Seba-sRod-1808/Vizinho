import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, FileWarning, Receipt, Search, Calendar, User, Shield, Bell, LogOut, Menu, X, BarChart3, Download } from 'lucide-react';

const navItems = [
  { path: '/app/feed', icon: Home, label: 'Inicio' },
  { path: '/app/reportes', icon: FileWarning, label: 'Reportes' },
  { path: '/app/encuestas', icon: BarChart3, label: 'Encuestas' },
  { path: '/app/areas', icon: Calendar, label: 'Areas' },
  { path: '/app/perfil', icon: User, label: 'Perfil' },
];

export default function Layout() {
  const { user, logout, isAdmin, unreadCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sideOpen, setSideOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  // PWA Install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      const dismissed = localStorage.getItem('vizinho_install_dismissed');
      if (!dismissed) setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') setShowInstall(false);
    }
  };

  const dismissInstall = () => {
    setShowInstall(false);
    localStorage.setItem('vizinho_install_dismissed', 'true');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close drawer on route change
  useEffect(() => { setSideOpen(false); }, [location.pathname]);

  // Haptic feedback helper
  const vibrate = () => { if (navigator.vibrate) navigator.vibrate(5); };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Status bar spacer for standalone PWA */}
      <div className="status-bar-spacer md:hidden" />

      {/* Top Bar - Mobile */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-stone-200/60 px-4 h-14 flex items-center justify-between md:hidden safe-top">
        <button
          data-testid="mobile-menu-btn"
          onClick={() => { setSideOpen(!sideOpen); vibrate(); }}
          className="p-2.5 -ml-2 rounded-xl hover:bg-stone-100 active:bg-stone-200 transition-colors"
        >
          <Menu size={22} className="text-stone-800" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-700 flex items-center justify-center">
            <span className="text-white text-xs font-bold font-heading">V</span>
          </div>
          <h1 className="font-heading font-bold text-lg text-stone-900 tracking-tight">Vizinho</h1>
        </div>
        <button
          data-testid="notifications-btn-mobile"
          onClick={() => { navigate('/app/notificaciones'); vibrate(); }}
          className="p-2.5 -mr-2 rounded-xl hover:bg-stone-100 active:bg-stone-200 relative transition-colors"
        >
          <Bell size={22} className="text-stone-800" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </header>

      {/* Mobile Side Drawer */}
      {sideOpen && (
        <div className="fixed inset-0 z-[100] md:hidden" style={{ touchAction: 'none' }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-backdrop" onClick={() => setSideOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl animate-drawer flex flex-col" style={{ zIndex: 101 }} onClick={e => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="p-5 bg-gradient-to-br from-primary-800 to-primary-700 safe-top">
              <button data-testid="close-drawer-btn" onClick={() => setSideOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 z-10">
                <X size={18} />
              </button>
              {user?.foto_url ? (
                <img src={user.foto_url} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30 mb-3" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-white font-bold text-xl mb-3 border-2 border-white/20">
                  {(user?.nombre_completo || user?.username || '?')[0].toUpperCase()}
                </div>
              )}
              <p className="text-white font-heading font-semibold text-base">{user?.nombre_completo || user?.username}</p>
              <p className="text-primary-200 text-xs mt-0.5">{isAdmin ? 'Administrador' : 'Vecino'} | {user?.email}</p>
            </div>

            {/* Drawer Nav */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {navItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => vibrate()}
                  className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-stone-600 hover:bg-stone-50 active:bg-stone-100'}`}
                >
                  <item.icon size={20} />
                  {item.label}
                </NavLink>
              ))}
              <div className="h-px bg-stone-100 my-2" />
              <NavLink to="/app/multas" onClick={() => vibrate()} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-stone-600 hover:bg-stone-50 active:bg-stone-100'}`}>
                <Receipt size={20} />Multas
              </NavLink>
              <NavLink to="/app/objetos-perdidos" onClick={() => vibrate()} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-stone-600 hover:bg-stone-50 active:bg-stone-100'}`}>
                <Search size={20} />Objetos Perdidos
              </NavLink>
              <NavLink to="/app/notificaciones" onClick={() => vibrate()} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative ${isActive ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-stone-600 hover:bg-stone-50 active:bg-stone-100'}`}>
                <Bell size={20} />Notificaciones
                {unreadCount > 0 && <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>}
              </NavLink>
              {isAdmin && (
                <>
                  <div className="h-px bg-stone-100 my-2" />
                  <NavLink to="/app/admin" onClick={() => vibrate()} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-stone-600 hover:bg-stone-50 active:bg-stone-100'}`}>
                    <Shield size={20} />Panel Admin
                  </NavLink>
                </>
              )}
            </nav>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-stone-100 safe-bottom">
              <button data-testid="logout-btn-side" onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-danger-600 hover:bg-danger-50 active:bg-danger-100 w-full transition-colors">
                <LogOut size={20} />Cerrar Sesion
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-primary-900 text-white">
          <div className="p-6">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <span className="text-white text-sm font-bold font-heading">V</span>
              </div>
              <h1 className="font-heading font-bold text-xl tracking-tight">Vizinho</h1>
            </div>
            <p className="text-primary-400 text-xs ml-[42px]">Comunidad conectada</p>
          </div>
          <nav className="flex-1 px-3 space-y-0.5">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-white/15 text-white shadow-lg shadow-black/10' : 'text-primary-300 hover:bg-white/8 hover:text-white'}`}
              >
                <item.icon size={19} />
                {item.label}
              </NavLink>
            ))}
            <div className="h-px bg-white/10 my-3" />
            <NavLink to="/app/multas" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-white/15 text-white' : 'text-primary-300 hover:bg-white/8 hover:text-white'}`}>
              <Receipt size={19} />Multas
            </NavLink>
            <NavLink to="/app/objetos-perdidos" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-white/15 text-white' : 'text-primary-300 hover:bg-white/8 hover:text-white'}`}>
              <Search size={19} />Perdidos
            </NavLink>
            <NavLink to="/app/notificaciones" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative ${isActive ? 'bg-white/15 text-white' : 'text-primary-300 hover:bg-white/8 hover:text-white'}`}>
              <Bell size={19} />Notificaciones
              {unreadCount > 0 && <span className="ml-auto min-w-[20px] h-5 px-1 bg-danger-500 text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>}
            </NavLink>
            {isAdmin && (
              <>
                <div className="h-px bg-white/10 my-3" />
                <NavLink to="/app/admin" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-white/15 text-white' : 'text-primary-300 hover:bg-white/8 hover:text-white'}`}>
                  <Shield size={19} />Panel Admin
                </NavLink>
              </>
            )}
          </nav>
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3 px-2">
              {user?.foto_url ? (
                <img src={user.foto_url} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary-700 flex items-center justify-center text-sm font-bold">
                  {(user?.nombre_completo || user?.username || '?')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.nombre_completo || user?.username}</p>
                <p className="text-xs text-primary-400">{isAdmin ? 'Admin' : 'Vecino'}</p>
              </div>
            </div>
            <button data-testid="logout-btn-desktop" onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-primary-300 hover:bg-white/10 w-full transition-colors">
              <LogOut size={18} />Cerrar Sesion
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen pb-20 md:pb-0">
          <div className="max-w-3xl mx-auto px-4 py-5 md:px-8 md:py-6 page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Nav - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-stone-200/60 flex justify-around items-center z-50 safe-bottom md:hidden" style={{ height: 'calc(var(--nav-height) + var(--safe-bottom))' }}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={vibrate}
            className={({ isActive }) => `nav-indicator ${isActive ? 'active' : ''} flex flex-col items-center justify-center gap-0.5 py-2 px-4 transition-all duration-200 ${isActive ? 'text-primary-700' : 'text-stone-400'}`}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            {({ isActive }) => (
              <>
                <item.icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.3 : 1.8} className={`transition-all duration-200 ${isActive ? 'text-primary-700' : 'text-stone-400'}`} />
                <span className={`text-[10px] font-semibold transition-all duration-200 ${isActive ? 'text-primary-700' : 'text-stone-400'}`}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* PWA Install Banner */}
      {showInstall && (
        <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:w-80 install-banner">
          <div className="bg-primary-800 rounded-2xl p-4 shadow-2xl shadow-primary-900/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Download size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">Instalar Vizinho</p>
              <p className="text-primary-200 text-xs">Acceso rapido desde tu pantalla</p>
            </div>
            <button data-testid="install-pwa-btn" onClick={handleInstall} className="px-3 py-1.5 bg-white text-primary-800 rounded-full text-xs font-bold hover:bg-primary-50 transition-colors">
              Instalar
            </button>
            <button onClick={dismissInstall} className="p-1 text-white/60 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
