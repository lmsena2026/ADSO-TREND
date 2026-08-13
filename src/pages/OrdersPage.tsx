import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/types';

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    })();
  }, [user, navigate]);

  if (!user) return null;

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
    paid: { label: 'Pagado', color: 'bg-emerald-100 text-emerald-700' },
    cod_pending: { label: 'Pago contra entrega', color: 'bg-orange-100 text-orange-700' },
    cod_received: { label: 'Recibido y pagado', color: 'bg-teal-100 text-teal-700' },
    shipped: { label: 'Enviado', color: 'bg-blue-100 text-blue-700' },
    delivered: { label: 'Entregado', color: 'bg-ink-100 text-ink-700' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <h1 className="mb-8 font-display text-4xl font-bold text-ink-950">Mis pedidos</h1>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl skeleton" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package className="mb-4 h-16 w-16 text-ink-300" />
          <h2 className="text-xl font-semibold text-ink-950">No tienes pedidos aún</h2>
          <p className="mt-2 text-ink-500">Cuando realices tu primera compra, aparecerá aquí.</p>
          <Link to="/catalogo" className="btn-primary mt-6">Explorar catálogo</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-ink-100 p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink-950">Pedido #{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-ink-500">{new Date(order.created_at).toLocaleDateString('es', { dateStyle: 'long' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusLabels[order.status]?.color}`}>
                    {statusLabels[order.status]?.label ?? order.status}
                  </span>
                  <span className="text-lg font-bold text-ink-950">${order.total.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-3 border-t border-ink-100 pt-4">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                      {item.product_image && (
                        <img src={item.product_image} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink-900">{item.product_name}</p>
                      <p className="text-xs text-ink-500">{item.size} · {item.color} · x{item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-ink-100 pt-4 text-sm text-ink-500">
                <p>Envío a: {order.shipping_address?.street}, {order.shipping_address?.city}</p>
                <p>Método de pago: {order.payment_method}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
