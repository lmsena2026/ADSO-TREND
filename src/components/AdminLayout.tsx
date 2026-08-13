import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Package, Tags, ShoppingCart, Users, Boxes, LogOut, Store, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/productos', label: 'Productos', icon: Package },
  { to: '/admin/categorias', label: 'Categorías', icon: Tags },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/inventario', label: 'Inventario', icon: Boxes },
];

export default function AdminLayout() {
  const { profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { count } = await supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      setUnreadCount(count ?? 0);
    })();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-ink-950">Acceso restringido</h1>
        <p className="mt-2 text-ink-500">No tienes permisos de administrador.</p>
        <Link to="/" className="btn-primary mt-6">Volver a la tienda</Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ink-50">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 bg-ink-950 text-white lg:flex lg:flex-col">
        <div className="flex items-center gap-1 px-6 py-6">
          <span className="font-display text-xl font-bold">ADSO</span>
          <span className="font-display text-xl font-light tracking-widest text-gold-500">Admin</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/10 text-gold-400' : 'text-ink-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          {unreadCount > 0 && (
            <Link
              to="/admin"
              className="mb-1 flex items-center justify-between rounded-lg bg-gold-500/10 px-4 py-3 text-sm text-gold-400 transition-colors hover:bg-gold-500/20"
            >
              <span className="flex items-center gap-3">
                <Bell className="h-5 w-5" />
                Notificaciones
              </span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            </Link>
          )}
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-ink-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Store className="h-5 w-5" /> Ver tienda
          </Link>
          <button
            onClick={() => {
              signOut();
              navigate('/');
            }}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="h-5 w-5" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex w-full flex-col">
        <header className="flex items-center justify-between bg-ink-950 px-4 py-4 text-white lg:hidden">
          <span className="font-display text-lg font-bold">ADSO Admin</span>
          <Link to="/" className="text-sm text-gold-400">Ver tienda</Link>
        </header>
        <div className="flex gap-2 overflow-x-auto bg-ink-900 px-4 py-2 lg:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                  isActive ? 'bg-gold-500 text-ink-950' : 'text-ink-300'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
