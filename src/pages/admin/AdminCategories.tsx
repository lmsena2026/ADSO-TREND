import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types';
import { useToast } from '@/contexts/ToastContext';

const emptyForm = { name: '', slug: '', description: '', image_url: '' };

export default function AdminCategories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('created_at');
    setCategories((data as Category[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

  const openNew = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (c: Category) => {
    setForm({ name: c.name, slug: c.slug, description: c.description ?? '', image_url: c.image_url ?? '' });
    setEditingId(c.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name) {
      toast('El nombre es obligatorio', 'error');
      return;
    }
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description,
      image_url: form.image_url,
    };
    if (editingId) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editingId);
      if (error) toast('Error al actualizar', 'error');
      else toast('Categoría actualizada', 'success');
    } else {
      const { error } = await supabase.from('categories').insert(payload);
      if (error) toast('Error al crear categoría', 'error');
      else toast('Categoría creada', 'success');
    }
    setShowForm(false);
    await fetchCategories();
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) toast('Error al eliminar', 'error');
    else toast('Categoría eliminada', 'success');
    await fetchCategories();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink-950">Categorías</h1>
        <button onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" /> Nueva categoría
        </button>
      </div>

      {loading ? (
        <div className="text-center text-ink-500">Cargando...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-xl border border-ink-100 bg-white">
              <div className="aspect-[16/9] overflow-hidden bg-ink-50">
                {c.image_url && <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-ink-950">{c.name}</h3>
                <p className="mt-1 text-sm text-ink-500">{c.description ?? 'Sin descripción'}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openEdit(c)} className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50">
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button onClick={() => remove(c.id)} className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-ink-950">{editingId ? 'Editar categoría' : 'Nueva categoría'}</h2>
              <button onClick={() => setShowForm(false)} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Nombre</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Slug</label>
                <input className="input-field" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generado" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Descripción</label>
                <textarea className="input-field" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">URL de imagen</label>
                <input className="input-field" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
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
