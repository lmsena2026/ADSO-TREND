import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Package, Users, ShoppingCart, TrendingUp, ArrowUpRight, Boxes, Bell, AlertTriangle, Crown, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Order, AdminNotification } from '@/types';
import { useToast } from '@/contexts/ToastContext';

interface AdminStat {
  label: string;
  value: string;
  icon: typeof DollarSign;
  change: string;
}

interface TopBuyer {
  user_id: string;
  full_name: string;
  total_spent: number;
  order_count: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStat[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; sold: number; revenue: number }[]>([]);
  const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [prodRes, orderRes, userRes, itemsRes, notifRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('order_items').select('*'),
        supabase.from('admin_notifications').select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      const products = (prodRes.data as Product[]) ?? [];
      const orders = (orderRes.data as Order[]) ?? [];
      const items = itemsRes.data ?? [];
      const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
      const lowStock = products.filter((p) => p.stock <= 10).sort((a, b) => a.stock - b.stock);

      setStats([
        { label: 'Ingresos totales', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, change: `${orders.length} pedidos` },
        { label: 'Pedidos', value: String(orders.length), icon: ShoppingCart, change: `${orders.filter(o => o.status === 'pending' || o.status === 'cod_pending').length} activos` },
        { label: 'Productos', value: String(products.length), icon: Package, change: `${lowStock.length} bajos` },
        { label: 'Usuarios', value: String(userRes.count ?? 0), icon: Users, change: 'registrados' },
      ]);

      setRecentOrders(orders.slice(0, 5));
      setLowStockProducts(lowStock);
      setNotifications((notifRes.data as AdminNotification[]) ?? []);

      // Top products by quantity sold
      const productMap: Record<string, { name: string; sold: number; revenue: number }> = {};
      items.forEach((it: { product_name: string; quantity: number; price: number }) => {
        if (!productMap[it.product_name]) productMap[it.product_name] = { name: it.product_name, sold: 0, revenue: 0 };
        productMap[it.product_name].sold += it.quantity;
        productMap[it.product_name].revenue += it.quantity * Number(it.price);
      });
      setTopProducts(Object.values(productMap).sort((a, b) => b.sold - a.sold).slice(0, 5));

      // Top buyers: aggregate orders by user_id
      const buyerMap: Record<string, { total_spent: number; order_count: number }> = {};
      orders.forEach((o: Order) => {
        if (!buyerMap[o.user_id]) buyerMap[o.user_id] = { total_spent: 0, order_count: 0 };
        buyerMap[o.user_id].total_spent += Number(o.total);
        buyerMap[o.user_id].order_count += 1;
      });

      const buyerIds = Object.keys(buyerMap);
      if (buyerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', buyerIds);

        const topBuyerList: TopBuyer[] = buyerIds
          .map((uid) => {
            const profile = (profiles ?? []).find((p: { id: string }) => p.id === uid);
            return {
              user_id: uid,
              full_name: profile?.full_name ?? 'Usuario',
              total_spent: buyerMap[uid].total_spent,
              order_count: buyerMap[uid].order_count,
            };
          })
          .sort((a, b) => b.total_spent - a.total_spent)
          .slice(0, 5);
        setTopBuyers(topBuyerList);
      }

      setLoading(false);
    })();
  }, []);

  const markNotificationRead = async (id: string) => {
    await supabase.from('admin_notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const dismissNotification = async (id: string) => {
    await supabase.from('admin_notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (loading) {
    return <div className="text-center text-ink-500">Cargando dashboard...</div>;
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-ink-950">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-ink-100 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink-50">
                <s.icon className="h-5 w-5 text-ink-700" />
              </div>
              <span className="text-xs font-medium text-ink-400">{s.change}</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-ink-950">{s.value}</p>
            <p className="text-sm text-ink-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mt-6 rounded-xl border border-ink-100 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-ink-700" />
            <h2 className="text-lg font-semibold text-ink-950">Notificaciones</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">{unreadCount} nuevas</span>
            )}
          </div>
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-center justify-between rounded-lg p-3 transition-colors ${
                  n.is_read ? 'bg-ink-50' : 'bg-gold-50 ring-1 ring-gold-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${n.is_read ? 'bg-ink-100' : 'bg-gold-100'}`}>
                    <Bell className={`h-4 w-4 ${n.is_read ? 'text-ink-400' : 'text-gold-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900">{n.title}</p>
                    <p className="text-xs text-ink-500">{n.message} · {new Date(n.created_at).toLocaleString('es')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!n.is_read && (
                    <button
                      onClick={() => markNotificationRead(n.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-emerald-600 hover:bg-emerald-50"
                      title="Marcar como leída"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => dismissNotification(n.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100"
                    title="Descartar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low stock alert */}
      {lowStockProducts.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <h2 className="text-lg font-semibold text-amber-900">Alerta de inventario ({lowStockProducts.length} productos)</h2>
          </div>
          <div className="mt-4 space-y-2">
            {lowStockProducts.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/60 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-8 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                    <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                  </div>
                  <span className="text-sm font-medium text-ink-900">{p.name}</span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {p.stock === 0 ? 'Agotado' : `${p.stock} en stock`}
                </span>
              </div>
            ))}
          </div>
          <Link to="/admin/inventario" className="btn-outline mt-4 border-amber-300 text-amber-700 hover:bg-amber-100">
            Gestionar inventario
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="rounded-xl border border-ink-100 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-950">Pedidos recientes</h2>
            <Link to="/admin/pedidos" className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-950">
              Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-ink-500">No hay pedidos aún.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between border-b border-ink-50 pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-ink-900">#{o.id.slice(0, 8)}</p>
                    <p className="text-xs text-ink-500">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-500 capitalize">{o.status}</span>
                    <span className="text-sm font-semibold">${Number(o.total).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="rounded-xl border border-ink-100 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-950">Productos más vendidos</h2>
            <TrendingUp className="h-5 w-5 text-ink-400" />
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-ink-500">Aún no hay ventas registradas.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-sm font-bold text-ink-700">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-900">{p.name}</p>
                    <p className="text-xs text-ink-500">{p.sold} vendidos</p>
                  </div>
                  <span className="text-sm font-semibold text-ink-950">${p.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top buyers */}
      {topBuyers.length > 0 && (
        <div className="mt-6 rounded-xl border border-ink-100 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-950">Top compradores</h2>
            <Crown className="h-5 w-5 text-gold-500" />
          </div>
          <div className="space-y-3">
            {topBuyers.map((b, i) => (
              <div key={b.user_id} className="flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  i === 0 ? 'bg-gold-100 text-gold-700' : 'bg-ink-100 text-ink-700'
                }`}>
                  {i === 0 ? <Crown className="h-4 w-4" /> : i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900">{b.full_name}</p>
                  <p className="text-xs text-ink-500">{b.order_count} {b.order_count === 1 ? 'pedido' : 'pedidos'}</p>
                </div>
                <span className="text-sm font-semibold text-ink-950">${b.total_spent.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
