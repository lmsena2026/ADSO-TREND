import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle2, Lock } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    street: profile?.address?.street ?? '',
    city: profile?.address?.city ?? '',
    state: profile?.address?.state ?? '',
    zip: profile?.address?.zip ?? '',
    country: profile?.address?.country ?? 'Colombia',
    phone: profile?.phone ?? '',
    payment_method: 'card',
  });
  const [placing, setPlacing] = useState(false);
  const [orderComplete, setOrderComplete] = useState<string | null>(null);

  const shipping = subtotal >= 99 ? 0 : 9.99;
  const total = subtotal + shipping;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h1 className="text-2xl font-bold text-ink-950">Inicia sesión para finalizar tu compra</h1>
        <Link to="/login" className="btn-primary mt-6">Iniciar sesión</Link>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto mb-6 h-20 w-20 text-emerald-500" />
        <h1 className="font-display text-4xl font-bold text-ink-950">¡Pedido confirmado!</h1>
        <p className="mt-3 text-ink-600">
          Tu pedido <span className="font-semibold">#{orderComplete.slice(0, 8)}</span> ha sido realizado con éxito.
          Recibirás un email de confirmación pronto.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/pedidos" className="btn-primary">Ver mis pedidos</Link>
          <Link to="/catalogo" className="btn-outline">Seguir comprando</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h1 className="text-2xl font-bold text-ink-950">Tu carrito está vacío</h1>
        <Link to="/catalogo" className="btn-primary mt-6">Explorar catálogo</Link>
      </div>
    );
  }

  const placeOrder = async () => {
    if (!form.full_name || !form.street || !form.city || !form.phone) {
      toast('Completa todos los campos de envío', 'error');
      return;
    }
    setPlacing(true);
    try {
      const initialStatus = form.payment_method === 'cod' ? 'cod_pending' : 'paid';

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total,
          shipping_address: form,
          payment_method: form.payment_method,
          status: initialStatus,
        })
        .select()
        .single();

      if (orderError || !order) throw new Error('No se pudo crear el pedido');

      const orderItems = items.map((i) => ({
        order_id: order.id,
        product_id: i.product_id,
        product_name: i.product?.name ?? '',
        product_image: i.product?.images[0] ?? null,
        price: i.product?.price ?? 0,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw new Error('No se pudieron guardar los items');

      await clearCart();
      setOrderComplete(order.id);
    } catch {
      toast('Error al procesar el pedido. Inténtalo de nuevo.', 'error');
    }
    setPlacing(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <h1 className="mb-8 font-display text-4xl font-bold text-ink-950">Finalizar compra</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* Shipping */}
          <section className="rounded-xl border border-ink-100 p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink-950">Datos de envío</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-ink-700">Nombre completo</label>
                <input className="input-field" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-ink-700">Dirección</label>
                <input className="input-field" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Ciudad</label>
                <input className="input-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Estado/Provincia</label>
                <input className="input-field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Código postal</label>
                <input className="input-field" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">País</label>
                <input className="input-field" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-ink-700">Teléfono</label>
                <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-xl border border-ink-100 p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink-950">Método de pago</h2>
            <div className="space-y-3">
              {[
                { id: 'card', label: 'Tarjeta de crédito/débito', icon: CreditCard },
                { id: 'paypal', label: 'PayPal', icon: Lock },
                { id: 'cod', label: 'Contra entrega', icon: Lock },
              ].map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                    form.payment_method === m.id ? 'border-ink-950 bg-ink-50' : 'border-ink-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m.id}
                    checked={form.payment_method === m.id}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className="accent-ink-950"
                  />
                  <m.icon className="h-5 w-5 text-ink-700" />
                  <span className="text-sm font-medium text-ink-900">{m.label}</span>
                </label>
              ))}
            </div>
            {form.payment_method === 'card' && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-ink-700">Número de tarjeta</label>
                  <input className="input-field" placeholder="0000 0000 0000 0000" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">Vencimiento</label>
                  <input className="input-field" placeholder="MM/AA" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">CVV</label>
                  <input className="input-field" placeholder="123" />
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Summary */}
        <div className="h-fit rounded-xl border border-ink-100 p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-950">Tu pedido</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                  <img src={item.product?.images[0]} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900">{item.product?.name}</p>
                  <p className="text-xs text-ink-500">{item.size} · {item.color} · x{item.quantity}</p>
                </div>
                <span className="text-sm font-semibold">${((item.product?.price ?? 0) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
            <div className="flex justify-between text-ink-600">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-ink-600">
              <span>Envío</span><span>{shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-bold text-ink-950">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
          <button onClick={placeOrder} disabled={placing} className="btn-primary mt-6 w-full">
            {placing ? 'Procesando...' : `Pagar $${total.toFixed(2)}`}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-400">
            <Lock className="h-3 w-3" /> Pago 100% seguro y encriptado
          </p>
        </div>
      </div>
    </div>
  );
}
