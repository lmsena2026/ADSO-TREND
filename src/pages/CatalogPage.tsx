import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';
import ProductCard from '@/components/ProductCard';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];
const ALL_COLORS = ['Negro', 'Blanco', 'Gris', 'Beige', 'Azul', 'Rojo', 'Verde oliva', 'Camel', 'Grafito', 'Crema', 'Burdeos', 'Rosa', 'Marrón', 'Tortuga', 'Dorado', 'Oro', 'Plata', 'Arena', 'Negro'];

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');

  const categorySlug = searchParams.get('categoria') ?? '';
  const query = searchParams.get('q') ?? '';
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('categories').select('*').order('created_at'),
        supabase.from('products').select('*'),
      ]);
      setCategories((cats as Category[]) ?? []);
      setProducts((prods as Product[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = [...products];

    if (categorySlug) {
      const cat = categories.find((c) => c.slug.toLowerCase() === categorySlug.toLowerCase());
      result = cat ? result.filter((p) => p.category_id === cat.id) : [];
    }

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.style_tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (selectedSizes.length > 0) {
      result = result.filter((p) => p.sizes.some((s) => selectedSizes.includes(s)));
    }

    if (selectedColors.length > 0) {
      result = result.filter((p) => p.colors.some((c) => selectedColors.includes(c)));
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return result;
  }, [products, categories, categorySlug, query, priceRange, selectedSizes, selectedColors, sortBy]);

  const activeCategory = categories.find((c) => c.slug.toLowerCase() === categorySlug.toLowerCase());

  const toggleArray = (arr: string[], value: string, setter: (v: string[]) => void) => {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const setCategory = (slug: string) => {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set('categoria', slug);
    else next.delete('categoria');
    setSearchParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-ink-950">
          {activeCategory ? activeCategory.name : query ? `Resultados: "${query}"` : 'Catálogo'}
        </h1>
        <p className="mt-2 text-ink-500">
          {loading ? 'Cargando...' : `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Category pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            !categorySlug ? 'bg-ink-950 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
          }`}
        >
          Todos
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.slug)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              categorySlug.toLowerCase() === c.slug.toLowerCase() ? 'bg-ink-950 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex gap-8">
        {/* Desktop filters */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <FilterContent
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            selectedSizes={selectedSizes}
            selectedColors={selectedColors}
            toggleSize={(v) => toggleArray(selectedSizes, v, setSelectedSizes)}
            toggleColor={(v) => toggleArray(selectedColors, v, setSelectedColors)}
          />
        </aside>

        <div className="flex-1">
          {/* Toolbar */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 rounded-full border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filtros
            </button>
            <div className="relative ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none rounded-full border border-ink-200 bg-white py-2 pl-4 pr-10 text-sm font-medium text-ink-700 outline-none focus:border-ink-950"
              >
                <option value="relevance">Relevancia</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="rating">Mejor valorados</option>
                <option value="newest">Más recientes</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-xl skeleton" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg font-medium text-ink-700">No se encontraron productos</p>
              <p className="mt-1 text-sm text-ink-400">Prueba con otros filtros</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Filtros</h3>
              <button onClick={() => setShowFilters(false)} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterContent
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedSizes={selectedSizes}
              selectedColors={selectedColors}
              toggleSize={(v) => toggleArray(selectedSizes, v, setSelectedSizes)}
              toggleColor={(v) => toggleArray(selectedColors, v, setSelectedColors)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterContent({
  priceRange,
  setPriceRange,
  selectedSizes,
  selectedColors,
  toggleSize,
  toggleColor,
}: {
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  selectedSizes: string[];
  selectedColors: string[];
  toggleSize: (v: string) => void;
  toggleColor: (v: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-900">Precio</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
            className="w-20 rounded-lg border border-ink-200 px-2 py-1.5 text-sm"
            min={0}
          />
          <span className="text-ink-400">—</span>
          <input
            type="number"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-20 rounded-lg border border-ink-200 px-2 py-1.5 text-sm"
            min={0}
          />
        </div>
        <input
          type="range"
          min={0}
          max={1000000}
          step={10000}
          value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
          className="mt-3 w-full accent-ink-950"
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-900">Talla</h3>
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggleSize(s)}
              className={`min-w-10 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                selectedSizes.includes(s)
                  ? 'border-ink-950 bg-ink-950 text-white'
                  : 'border-ink-200 text-ink-700 hover:border-ink-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-900">Color</h3>
        <div className="flex flex-wrap gap-2">
          {ALL_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => toggleColor(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedColors.includes(c)
                  ? 'border-ink-950 bg-ink-950 text-white'
                  : 'border-ink-200 text-ink-700 hover:border-ink-400'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
