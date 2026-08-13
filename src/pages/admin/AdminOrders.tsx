import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { FileText, Mail, X } from 'lucide-react';

const statusOptions = [
  { value: 'pending', label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  { value: 'paid', label: 'Pagado', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'cod_pending', label: 'Pago contra entrega', color: 'bg-orange-100 text-orange-700' },
  { value: 'cod_received', label: 'Recibido y pagado', color: 'bg-teal-100 text-teal-700' },
  { value: 'shipped', label: 'Enviado', color: 'bg-blue-100 text-blue-700' },
  { value: 'delivered', label: 'Entregado', color: 'bg-ink-100 text-ink-700' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-700' },
];

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  cod_pending: 'Pago contra entrega',
  cod_received: 'Recibido y pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export default function AdminOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) toast('Error al actualizar', 'error');
    else {
      toast('Estado actualizado', 'success');
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: status as Order['status'] } : o)));
    }
  };

  const markAsReceivedAndPaid = async (id: string) => {
    await updateStatus(id, 'cod_received');
  };

  const sendInvoiceEmail = async (order: Order) => {
    setSending(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invoice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      if (!response.ok) throw new Error('Failed to send');
      toast('Factura enviada al correo del cliente', 'success');
    } catch {
      toast('No se pudo enviar la factura', 'error');
    }
    setSending(false);
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-ink-950">Pedidos</h1>

      {/* Filter pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-full px-4 py-2 text-sm font-medium ${filter === 'all' ? 'bg-ink-950 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-200'}`}
        >
          Todos ({orders.length})
        </button>
        {statusOptions.map((s) => {
          const count = orders.filter((o) => o.status === s.value).length;
          return (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${filter === s.value ? 'bg-ink-950 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-200'}`}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center text-ink-500">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-ink-100 bg-white p-12 text-center text-ink-500">
          No hay pedidos en esta categoría.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => (
            <div key={o.id} className="rounded-xl border border-ink-100 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink-950">Pedido #{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-ink-500">{new Date(o.created_at).toLocaleString('es')}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    Envío: {o.shipping_address?.street}, {o.shipping_address?.city} · {o.shipping_address?.phone}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    Cliente: {o.shipping_address?.full_name ?? 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-ink-950">${Number(o.total).toFixed(2)}</p>
                  <p className="text-xs text-ink-500">
                    {o.payment_method === 'cod' ? 'Contra entrega' : o.payment_method === 'card' ? 'Tarjeta' : o.payment_method}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2 border-t border-ink-50 pt-4">
                {o.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                      {item.product_image && <img src={item.product_image} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <span className="flex-1 text-ink-700">{item.product_name}</span>
                    <span className="text-ink-500">{item.size} · {item.color} · x{item.quantity}</span>
                    <span className="font-medium">${(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink-50 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink-700">Estado:</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusOptions.find((s) => s.value === o.status)?.color ?? 'bg-ink-100 text-ink-700'}`}>
                    {statusLabels[o.status] ?? o.status}
                  </span>
                </div>
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm outline-none focus:border-ink-950"
                >
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {o.status === 'cod_pending' && (
                  <button
                    onClick={() => markAsReceivedAndPaid(o.id)}
                    className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
                  >
                    Marcar como recibido y pagado
                  </button>
                )}
                <button
                  onClick={() => setInvoiceOrder(o)}
                  className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
                >
                  <FileText className="h-3.5 w-3.5" /> Ver factura
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Modal */}
      {invoiceOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm"
          onClick={() => setInvoiceOrder(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-ink-950">Factura</h2>
              <button
                onClick={() => setInvoiceOrder(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Invoice header */}
            <div className="flex items-start justify-between border-b border-ink-100 pb-6">
              <div>
                <h3 className="font-display text-xl font-bold">ADSO Trend</h3>
                <p className="text-xs text-ink-500">Tienda de moda contemporánea</p>
                <p className="text-xs text-ink-500">contacto@adsotrend.com</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-ink-950">Factura #{invoiceOrder.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-xs text-ink-500">{new Date(invoiceOrder.created_at).toLocaleDateString('es')}</p>
              </div>
            </div>

            {/* Customer info */}
            <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-500">Facturado a</p>
                <p className="font-medium text-ink-900">{invoiceOrder.shipping_address?.full_name ?? 'Cliente'}</p>
                <p className="text-ink-600">{invoiceOrder.shipping_address?.street}</p>
                <p className="text-ink-600">{invoiceOrder.shipping_address?.city}, {invoiceOrder.shipping_address?.state}</p>
                <p className="text-ink-600">{invoiceOrder.shipping_address?.phone}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-500">Método de pago</p>
                <p className="font-medium text-ink-900">
                  {invoiceOrder.payment_method === 'cod' ? 'Contra entrega' : 'Tarjeta'}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-ink-500">Estado</p>
                <p className="font-medium text-ink-900">{statusLabels[invoiceOrder.status] ?? invoiceOrder.status}</p>
              </div>
            </div>

            {/* Items table */}
            <div className="mt-6 overflow-hidden rounded-xl border border-ink-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Talla / Color</th>
                    <th className="px-4 py-3 text-center">Cant.</th>
                    <th className="px-4 py-3 text-right">Precio</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {invoiceOrder.order_items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-ink-900">{item.product_name}</td>
                      <td className="px-4 py-3 text-ink-600">{item.size} / {item.color}</td>
                      <td className="px-4 py-3 text-center text-ink-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-ink-600">${Number(item.price).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-ink-950">${(Number(item.price) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-ink-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-semibold text-ink-700">Total:</td>
                    <td className="px-4 py-3 text-right text-lg font-bold text-ink-950">${Number(invoiceOrder.total).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Warranty section */}
            <div className="mt-6 rounded-xl border border-gold-200 bg-gold-50 p-5">
              <h4 className="mb-3 text-sm font-bold text-gold-800">Garantías</h4>
              <div className="space-y-2 text-xs text-gold-900">
                <p><span className="font-semibold">Garantía de calidad:</span> 30 días por defectos de fabricación desde la fecha de compra.</p>
                <p><span className="font-semibold">Garantía de devolución:</span> Puedes solicitar devolución dentro de los 15 días posteriores a la entrega, con la prenda sin usar y con etiquetas originales.</p>
                <p><span className="font-semibold">Garantía de talla:</span> Cambio gratuito de talla dentro de los 7 días, sujeto a disponibilidad de inventario.</p>
                <p><span className="font-semibold">Soporte:</span> Para reclamos de garantía, escríbenos a contacto@adsotrend.com con el número de factura.</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-ink-100 pt-4">
              <p className="text-xs text-ink-400">Esta factura es un documento electrónico válido como comprobante de compra.</p>
              <button
                onClick={() => sendInvoiceEmail(invoiceOrder)}
                disabled={sending}
                className="btn-primary flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                {sending ? 'Enviando...' : 'Enviar al correo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
