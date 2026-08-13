import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Building2, Coffee, Crown, Dumbbell, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, StyleType } from '@/types';
import ProductCard from '@/components/ProductCard';

const styles: { id: StyleType; label: string; desc: string; icon: typeof Building2; img: string }[] = [
  {
    id: 'urbano',
    label: 'Urbano',
    desc: 'Streetwear, oversized y actitud ciudad',
    icon: Building2,
    img: 'https://images.pexels.com/photos/18403112/pexels-photo-18403112.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  },
  {
    id: 'casual',
    label: 'Casual',
    desc: 'Cómodo, versátil y siempre con estilo',
    icon: Coffee,
    img: 'https://images.pexels.com/photos/23911182/pexels-photo-23911182.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  },
  {
    id: 'elegante',
    label: 'Elegante',
    desc: 'Sofisticado, refinado y atemporal',
    icon: Crown,
    img: 'https://images.pexels.com/photos/34921744/pexels-photo-34921744.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  },
  {
    id: 'deportivo',
    label: 'Deportivo',
    desc: 'Activo, funcional y con energía',
    icon: Dumbbell,
    img: 'https://images.pexels.com/photos/10682327/pexels-photo-10682327.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  },
];

export default function StyleQuizPage() {
  const [selected, setSelected] = useState<StyleType | null>(null);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selected) {
      setResults([]);
      return;
    }
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .contains('style_tags', [selected])
        .limit(8);
      setResults((data as Product[]) ?? []);
      setLoading(false);
    })();
  }, [selected]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-10 text-center">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-gold-100 px-4 py-1.5 text-sm font-medium uppercase tracking-wider text-gold-700">
          <Sparkles className="h-4 w-4" /> Recomendador de Estilo
        </span>
        <h1 className="font-display text-4xl font-bold text-ink-950 md:text-5xl">¿Cuál es tu estilo?</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-500">
          Selecciona el estilo que más se identifica contigo y te recomendaremos las prendas perfectas.
        </p>
      </div>

      {/* Style cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {styles.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelected(s.id)}
            className={`group relative aspect-[4/5] overflow-hidden rounded-2xl text-left transition-all duration-300 ${
              selected === s.id ? 'ring-2 ring-gold-500 ring-offset-2' : 'ring-1 ring-ink-100 hover:ring-ink-300'
            }`}
          >
            <img
              src={s.img}
              alt={s.label}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <s.icon className="mb-2 h-8 w-8 text-gold-400" />
              <h3 className="text-2xl font-bold text-white">{s.label}</h3>
              <p className="mt-1 text-sm text-ink-200">{s.desc}</p>
            </div>
            {selected === s.id && (
              <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-ink-950">
                ✓
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Results */}
      {selected && (
        <div className="mt-12 animate-fade-up">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="section-title">
              Recomendaciones para tu estilo {styles.find((s) => s.id === selected)?.label}
            </h2>
            <button onClick={() => setSelected(null)} className="text-sm text-ink-500 underline">
              Cambiar estilo
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-xl skeleton" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="text-center text-ink-500">No se encontraron productos para este estilo.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      )}

      {!selected && (
        <div className="mt-10 text-center">
          <Link to="/catalogo" className="inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-950">
            O explora todo el catálogo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
