import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, Order } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { Users, Crown, ShoppingBag } from 'lucide-react';

interface TopBuyer {
  user_id: string;
  full_name: string;
  total_spent: number;
  order_count: number;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [usersRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('user_id, total'),
      ]);

      const allUsers = (usersRes.data as Profile[]) ?? [];
      const orders = (ordersRes.data as Pick<Order, 'user_id' | 'total'>[]) ?? [];
      setUsers(allUsers);

      // Build top buyers
      const buyerMap: Record<string, { total_spent: number; order_count: number }> = {};
      orders.forEach((o) => {
        if (!buyerMap[o.user_id]) buyerMap[o.user_id] = { total_spent: 0, order_count: 0 };
        buyerMap[o.user_id].total_spent += Number(o.total);
        buyerMap[o.user_id].order_count += 1;
      });

      const topBuyerList: TopBuyer[] = Object.keys(buyerMap)
        .map((uid) => {
          const profile = allUsers.find((p) => p.id === uid);
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
      setLoading(false);
    })();
  }, []);

  const toggleAdmin = async (id: string, current: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_admin: !current }).eq('id', id);
    if (error) toast('Error', 'error');
    else {
      toast(!current ? 'Administrador asignado' : 'Administrador removido', 'success');
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_admin: !current } : u)));
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-ink-950">Usuarios</h1>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-ink-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink-50">
              <Users className="h-5 w-5 text-ink-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink-950">{users.length}</p>
              <p className="text-sm text-ink-500">Usuarios registrados</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-ink-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold-50">
              <Crown className="h-5 w-5 text-gold-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink-950">{users.filter((u) => u.is_admin).length}</p>
              <p className="text-sm text-ink-500">Administradores</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-ink-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50">
              <ShoppingBag className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink-950">{topBuyers.length}</p>
              <p className="text-sm text-ink-500">Compradores activos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top buyers ranking */}
      {topBuyers.length > 0 && (
        <div className="mb-6 rounded-xl border border-gold-200 bg-gold-50 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5 text-gold-600" />
            <h2 className="text-lg font-semibold text-gold-900">Top 5 compradores</h2>
          </div>
          <div className="space-y-3">
            {topBuyers.map((b, i) => (
              <div key={b.user_id} className="flex items-center gap-3 rounded-lg bg-white/60 p-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                  i === 0 ? 'bg-gold-200 text-gold-800' : i === 1 ? 'bg-ink-200 text-ink-700' : i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-ink-100 text-ink-600'
                }`}>
                  {i === 0 ? <Crown className="h-4 w-4" /> : i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900">{b.full_name}</p>
                  <p className="text-xs text-ink-500">{b.order_count} {b.order_count === 1 ? 'pedido' : 'pedidos'}</p>
                </div>
                <span className="text-sm font-bold text-ink-950">${b.total_spent.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-ink-500">Cargando...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Registro</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-950 text-sm font-bold text-white">
                        {(u.full_name ?? '?')[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-ink-900">{u.full_name ?? 'Sin nombre'}</p>
                        <p className="text-xs text-ink-500">{u.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {u.is_admin ? (
                      <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-semibold text-gold-700">Admin</span>
                    ) : (
                      <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-600">Cliente</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleAdmin(u.id, u.is_admin)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                        u.is_admin
                          ? 'border border-ink-200 text-ink-700 hover:bg-ink-50'
                          : 'bg-ink-950 text-white hover:bg-gold-500 hover:text-ink-950'
                      }`}
                    >
                      {u.is_admin ? 'Quitar admin' : 'Hacer admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
