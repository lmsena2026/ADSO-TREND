import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { AlertTriangle, PackageX } from 'lucide-react';

export default function AdminInventory() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState('');

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('stock', { ascending: true });
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const saveStock = async (id: string) => {
    const { error } = await supabase.from('products').update({ stock: Number(stockValue) }).eq('id', id);
    if (error) toast('Error al actualizar', 'error');
    else {
      toast('Stock actualizado', 'success');
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: Number(stockValue) } : p)));
    }
    setEditId(null);
  };

  const stockLevel = (stock: number) => {
    if (stock === 0) return { label: 'Agotado', color: 'bg-red-100 text-red-700' };
    if (stock < 10) return { label: 'Bajo', color: 'bg-amber-100 text-amber-700' };
    if (stock < 30) return { label: 'Medio', color: 'bg-blue-100 text-blue-700' };
    return { label: 'Óptimo', color: 'bg-emerald-100 text-emerald-700' };
  };

  const outOfStock = products.filter((p) => p.stock === 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 10);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-ink-950">Inventario</h1>

      {/* Low stock alert banner */}
      {(outOfStock.length > 0 || lowStock.length > 0) && (
        <div className="mb-6 space-y-3">
          {outOfStock.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <PackageX className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-900">
                  {outOfStock.length} {outOfStock.length === 1 ? 'producto agotado' : 'productos agotados'}
                </p>
                <p className="text-xs text-red-700">
                  {outOfStock.map((p) => p.name).join(', ')}
                </p>
              </div>
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {lowStock.length} {lowStock.length === 1 ? 'producto con stock bajo' : 'productos con stock bajo'}
                </p>
                <p className="text-xs text-amber-700">
                  {lowStock.map((p) => `${p.name} (${p.stock})`).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Agotados', value: outOfStock.length, color: 'text-red-600' },
          { label: 'Stock bajo', value: lowStock.length, color: 'text-amber-600' },
          { label: 'Total productos', value: products.length, color: 'text-ink-950' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-ink-100 bg-white p-5">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-ink-500">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-ink-500">Cargando...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Stock actual</th>
                <th className="px-4 py-3">Nivel</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                        <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                      </div>
                      <span className="font-medium text-ink-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editId === p.id ? (
                      <input
                        type="number"
                        value={stockValue}
                        onChange={(e) => setStockValue(e.target.value)}
                        className="w-20 rounded-lg border border-ink-200 px-2 py-1 text-sm"
                        autoFocus
                      />
                    ) : (
                      <span className="font-semibold text-ink-950">{p.stock}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stockLevel(p.stock).color}`}>
                      {stockLevel(p.stock).label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editId === p.id ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => saveStock(p.id)} className="rounded-lg bg-ink-950 px-3 py-1.5 text-xs font-medium text-white">Guardar</button>
                        <button onClick={() => setEditId(null)} className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs">Cancelar</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditId(p.id); setStockValue(String(p.stock)); }}
                        className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
                      >
                        Editar
                      </button>
                    )}
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
