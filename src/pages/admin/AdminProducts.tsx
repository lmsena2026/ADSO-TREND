import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';
import { useToast } from '@/contexts/ToastContext';

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  price: '',
  compare_at_price: '',
  category_id: '',
  images: '',
  sizes: '',
  colors: '',
  stock: '',
  style_tags: '',
  is_featured: false,
  is_new: false,
  is_trending: false,
};

export default function AdminProducts() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await fetchProducts();
      const { data: cats } = await supabase.from('categories').select('*');
      setCategories((cats as Category[]) ?? []);
    })();
  }, []);

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

  // Formatea una cadena de dígitos como pesos colombianos con puntos de miles (ej: 80000 -> "80.000")
  const formatCOP = (digits: string) => {
    if (!digits) return '';
    return Number(digits).toLocaleString('es-CO');
  };

  const openNew = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? '',
      price: String(p.price),
      compare_at_price: p.compare_at_price ? String(p.compare_at_price) : '',
      category_id: p.category_id ?? '',
      images: p.images.join('\n'),
      sizes: p.sizes.join(', '),
      colors: p.colors.join(', '),
      stock: String(p.stock),
      style_tags: p.style_tags.join(', '),
      is_featured: p.is_featured,
      is_new: p.is_new,
      is_trending: p.is_trending,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.price) {
      toast('Nombre y precio son obligatorios', 'error');
      return;
    }
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description,
      price: Number(form.price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      category_id: form.category_id || null,
      images: form.images.split('\n').map((s) => s.trim()).filter(Boolean),
      sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
      stock: Number(form.stock) || 0,
      style_tags: form.style_tags.split(',').map((s) => s.trim()).filter(Boolean),
      is_featured: form.is_featured,
      is_new: form.is_new,
      is_trending: form.is_trending,
    };
    if (editingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingId);
      if (error) toast('Error al actualizar', 'error');
      else toast('Producto actualizado', 'success');
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) toast('Error al crear producto', 'error');
      else toast('Producto creado', 'success');
    }
    setShowForm(false);
    await fetchProducts();
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast('Error al eliminar', 'error');
    else toast('Producto eliminado', 'success');
    await fetchProducts();
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink-950">Productos</h1>
        <button onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" /> Nuevo producto
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-11"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center text-ink-500">Cargando...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {filtered.map((p) => {
                const cat = categories.find((c) => c.id === p.category_id);
                return (
                  <tr key={p.id} className="hover:bg-ink-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                          <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                        </div>
                        <span className="font-medium text-ink-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{cat?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold">${p.price.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3">
                      <span className={p.stock < 10 ? 'text-amber-600' : 'text-ink-600'}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {p.is_featured && <span className="rounded bg-gold-100 px-1.5 py-0.5 text-[10px] text-gold-700">Destacado</span>}
                        {p.is_new && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">Nuevo</span>}
                        {p.is_trending && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">Tendencia</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="text-ink-500 hover:text-ink-950" aria-label="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => remove(p.id)} className="text-ink-500 hover:text-red-500" aria-label="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-ink-950">{editingId ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button onClick={() => setShowForm(false)} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-ink-700">Nombre</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Precio</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input-field pl-7"
                    value={formatCOP(form.price)}
                    onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, '') })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Precio antes (descuento)</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input-field pl-7"
                    value={formatCOP(form.compare_at_price)}
                    onChange={(e) => setForm({ ...form, compare_at_price: e.target.value.replace(/\D/g, '') })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Categoría</label>
                <select className="input-field" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Stock</label>
                <input type="number" className="input-field" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-ink-700">Descripción</label>
                <textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-ink-700">Imágenes (una URL por línea)</label>
                <textarea className="input-field" rows={3} value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Tallas (coma)</label>
                <input className="input-field" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="S, M, L" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Colores (coma)</label>
                <input className="input-field" value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="Negro, Blanco" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-ink-700">Etiquetas de estilo (coma)</label>
                <input className="input-field" value={form.style_tags} onChange={(e) => setForm({ ...form, style_tags: e.target.value })} placeholder="urbano, casual" />
              </div>
              <div className="flex flex-wrap gap-4 sm:col-span-2">
                {[
                  { key: 'is_featured', label: 'Destacado' },
                  { key: 'is_new', label: 'Nuevo' },
                  { key: 'is_trending', label: 'Tendencia' },
                ].map((f) => (
                  <label key={f.key} className="flex items-center gap-2 text-sm font-medium text-ink-700">
                    <input
                      type="checkbox"
                      checked={form[f.key as keyof typeof form] as boolean}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                      className="h-4 w-4 accent-ink-950"
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={save} className="btn-primary">{editingId ? 'Guardar' : 'Crear'}</button>
              <button onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
