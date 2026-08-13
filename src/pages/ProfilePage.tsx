import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, Heart, ShoppingBag, LogOut, MapPin, Phone, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/types';

export default function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'Colombia',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setForm({
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      street: profile?.address?.street ?? '',
      city: profile?.address?.city ?? '',
      state: profile?.address?.state ?? '',
      zip: profile?.address?.zip ?? '',
      country: profile?.address?.country ?? 'Colombia',
    });
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setOrders((data as Order[]) ?? []);
    })();
  }, [user, profile, navigate]);

  if (!user) return null;

  const saveProfile = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        phone: form.phone,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country,
        },
      })
      .eq('id', user.id);
    if (error) {
      toast('Error al guardar', 'error');
    } else {
      await refreshProfile();
      toast('Perfil actualizado', 'success');
      setEditing(false);
    }
  };

  const menuItems = [
    { icon: Package, label: 'Mis Pedidos', to: '/pedidos', count: orders.length },
    { icon: Heart, label: 'Favoritos', to: '/favoritos' },
    { icon: ShoppingBag, label: 'Carrito', to: '/carrito' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-ink-100 p-6 text-center">
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-ink-950 text-2xl font-bold text-white">
              {(profile?.full_name ?? user.email ?? '?')[0].toUpperCase()}
            </div>
            <h2 className="text-lg font-semibold text-ink-950">{profile?.full_name ?? 'Usuario'}</h2>
            <p className="text-sm text-ink-500">{user.email}</p>
            {profile?.is_admin && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700">
                <Shield className="h-3 w-3" /> Administrador
              </span>
            )}
          </div>

          <nav className="rounded-xl border border-ink-100 p-2">
            {menuItems.map((m) => (
              <Link
                key={m.label}
                to={m.to}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
              >
                <m.icon className="h-5 w-5" />
                {m.label}
                {m.count !== undefined && m.count > 0 && (
                  <span className="ml-auto rounded-full bg-ink-100 px-2 py-0.5 text-xs">{m.count}</span>
                )}
              </Link>
            ))}
            <button
              onClick={() => {
                signOut();
                navigate('/');
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" /> Cerrar sesión
            </button>
          </nav>
        </aside>

        {/* Main */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-ink-100 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-xl font-semibold text-ink-950">Información personal</h1>
              {!editing && (
                <button onClick={() => setEditing(true)} className="text-sm font-medium text-ink-700 underline">
                  Editar
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink-700">Nombre completo</label>
                    <input className="input-field" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink-700">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
                      <input className="input-field pl-11" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">Dirección</label>
                  <input className="input-field" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink-700">Ciudad</label>
                    <input className="input-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink-700">Estado</label>
                    <input className="input-field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink-700">Código postal</label>
                    <input className="input-field" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">País</label>
                  <input className="input-field" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                </div>
                <div className="flex gap-3">
                  <button onClick={saveProfile} className="btn-primary">Guardar cambios</button>
                  <button onClick={() => setEditing(false)} className="btn-outline">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-ink-400" />
                  <span className="text-sm text-ink-600">{profile?.full_name ?? '—'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-ink-400" />
                  <span className="text-sm text-ink-600">{profile?.phone ?? '—'}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-ink-400" />
                  <div className="text-sm text-ink-600">
                    {profile?.address?.street ? (
                      <>
                        <p>{profile.address.street}</p>
                        <p>{profile.address.city} {profile.address.state} {profile.address.zip}</p>
                        <p>{profile.address.country}</p>
                      </>
                    ) : 'Sin dirección guardada'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent orders preview */}
          <div className="mt-6 rounded-xl border border-ink-100 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-950">Pedidos recientes</h2>
              <Link to="/pedidos" className="text-sm font-medium text-ink-700 underline">Ver todos</Link>
            </div>
            {orders.length === 0 ? (
              <p className="text-sm text-ink-500">Aún no tienes pedidos.</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 3).map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-lg bg-ink-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-ink-900">#{o.id.slice(0, 8)}</p>
                      <p className="text-xs text-ink-500">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        o.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        o.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        o.status === 'delivered' ? 'bg-ink-100 text-ink-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{o.status}</span>
                      <span className="text-sm font-semibold">${o.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
