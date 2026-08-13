import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function CartPage() {
  const { items, loading, subtotal, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();

  const shipping = subtotal >= 99 ? 0 : 9.99;
  const total = subtotal + shipping;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <ShoppingBag className="mb-4 h-16 w-16 text-ink-300" />
        <h1 className="text-2xl font-bold text-ink-950">Tu carrito</h1>
        <p className="mt-2 text-ink-500">Inicia sesión para ver y gestionar tu carrito.</p>
        <Link to="/login" className="btn-primary mt-6">Iniciar sesión</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-ink-500">Cargando carrito...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <ShoppingBag className="mb-4 h-16 w-16 text-ink-300" />
        <h1 className="text-2xl font-bold text-ink-950">Tu carrito está vacío</h1>
        <p className="mt-2 text-ink-500">Descubre prendas increíbles y agrégalas aquí.</p>
        <Link to="/catalogo" className="btn-primary mt-6">Explorar catálogo</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <h1 className="mb-8 font-display text-4xl font-bold text-ink-950">Tu carrito</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-xl border border-ink-100 p-4">
              <Link to={`/producto/${item.product?.slug}`} className="shrink-0">
                <div className="h-32 w-24 overflow-hidden rounded-lg bg-ink-50">
                  <img src={item.product?.images[0]} alt={item.product?.name} className="h-full w-full object-cover" />
                </div>
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between">
                  <Link to={`/producto/${item.product?.slug}`} className="font-medium text-ink-900 hover:text-ink-950">
                    {item.product?.name}
                  </Link>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-ink-400 transition-colors hover:text-red-500"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-ink-500">Talla: {item.size} · Color: {item.color}</p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-ink-200">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="flex h-9 w-9 items-center justify-center text-ink-700 hover:text-ink-950"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex h-9 w-9 items-center justify-center text-ink-700 hover:text-ink-950"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-lg font-semibold text-ink-950">
                    ${((item.product?.price ?? 0) * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="h-fit rounded-xl border border-ink-100 p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-950">Resumen del pedido</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-ink-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-ink-600">
              <span>Envío</span>
              <span>{shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`}</span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-ink-400">Agrega ${(99 - subtotal).toFixed(2)} más para envío gratis</p>
            )}
            <div className="border-t border-ink-100 pt-3">
              <div className="flex justify-between text-base font-bold text-ink-950">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <Link to="/checkout" className="btn-primary mt-6 w-full">
            Finalizar compra <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/catalogo" className="mt-3 block text-center text-sm text-ink-500 hover:text-ink-950">
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
