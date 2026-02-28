import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, FileWarning, Receipt, Search, Calendar, User, Shield, Bell, LogOut, Menu, X, BarChart3 } from 'lucide-react';

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
  const [sideOpen, setSideOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top Bar - Mobile */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-stone-200 px-4 h-14 flex items-center justify-between md:hidden">
        <button data-testid="mobile-menu-btn" onClick={() => setSideOpen(!sideOpen)} className="p-2 -ml-2 rounded-lg hover:bg-stone-100 transition-colors">
          {sideOpen ? <X size={22} className="text-stone-700" /> : <Menu size={22} className="text-stone-700" />}
        </button>
        <h1 className="font-heading font-bold text-lg text-primary-800 tracking-tight">Vizinho</h1>
        <button data-testid="notifications-btn-mobile" onClick={() => navigate('/app/notificaciones')} className="p-2 -mr-2 rounded-lg hover:bg-stone-100 relative">
          <Bell size={22} className="text-stone-700" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>
      </header>

      {/* Mobile Side Drawer */}
      {sideOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setSideOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="p-6 bg-primary-700">
              <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg mb-3">
                {(user?.nombre_completo || user?.username || '?')[0].toUpperCase()}
              </div>
              <p className="text-white font-heading font-semibold">{user?.nombre_completo || user?.username}</p>
              <p className="text-primary-200 text-sm">{isAdmin ? 'Administrador' : 'Vecino'}</p>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSideOpen(false)}
                  className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-primary-50 text-primary-700' : 'text-stone-600 hover:bg-stone-50'}`}
                >
                  <item.icon size={20} />
                  {item.label}
                </NavLink>
              ))}
              <NavLink to="/app/multas" onClick={() => setSideOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-primary-50 text-primary-700' : 'text-stone-600 hover:bg-stone-50'}`}>
                <Receipt size={20} />Multas
              </NavLink>
              <NavLink to="/app/objetos-perdidos" onClick={() => setSideOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-primary-50 text-primary-700' : 'text-stone-600 hover:bg-stone-50'}`}>
                <Search size={20} />Objetos Perdidos
              </NavLink>
              {isAdmin && (
                <NavLink to="/app/admin" onClick={() => setSideOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-primary-50 text-primary-700' : 'text-stone-600 hover:bg-stone-50'}`}>
                  <Shield size={20} />Panel Admin
                </NavLink>
              )}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-stone-100">
              <button data-testid="logout-btn-side" onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-danger-600 hover:bg-danger-50 w-full transition-colors">
                <LogOut size={20} />Cerrar Sesion
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-primary-900 text-white">
          <div className="p-6">
            <h1 className="font-heading font-bold text-2xl tracking-tight mb-1">Vizinho</h1>
            <p className="text-primary-300 text-sm">Comunidad conectada</p>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-white/15 text-white' : 'text-primary-200 hover:bg-white/10 hover:text-white'}`}
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}
            <NavLink to="/app/multas" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-white/15 text-white' : 'text-primary-200 hover:bg-white/10 hover:text-white'}`}>
              <Receipt size={20} />Multas
            </NavLink>
            <NavLink to="/app/notificaciones" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors relative ${isActive ? 'bg-white/15 text-white' : 'text-primary-200 hover:bg-white/10 hover:text-white'}`}>
              <Bell size={20} />Notificaciones
              {unreadCount > 0 && <span className="ml-auto w-5 h-5 bg-danger-500 text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>}
            </NavLink>
            {isAdmin && (
              <NavLink to="/app/admin" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-white/15 text-white' : 'text-primary-200 hover:bg-white/10 hover:text-white'}`}>
                <Shield size={20} />Panel Admin
              </NavLink>
            )}
          </nav>
          <div className="p-4 border-t border-primary-800">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-9 h-9 rounded-full bg-primary-700 flex items-center justify-center text-sm font-bold">
                {(user?.nombre_completo || user?.username || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.nombre_completo || user?.username}</p>
                <p className="text-xs text-primary-300">{isAdmin ? 'Admin' : 'Vecino'}</p>
              </div>
            </div>
            <button data-testid="logout-btn-desktop" onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-primary-200 hover:bg-white/10 w-full transition-colors">
              <LogOut size={18} />Cerrar Sesion
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen pb-20 md:pb-0">
          <div className="max-w-3xl mx-auto px-4 py-6 md:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Nav - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-lg border-t border-stone-200 flex justify-around items-center z-50 safe-bottom md:hidden">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${isActive ? 'text-primary-700' : 'text-stone-400'}`}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <item.icon size={22} strokeWidth={isActive => isActive ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
