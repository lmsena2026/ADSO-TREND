import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shirt, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Outfit, Product } from '@/types';
import ProductCard from '@/components/ProductCard';

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [activeOutfit, setActiveOutfit] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: fits } = await supabase.from('outfits').select('*').order('created_at');
      const outfitList = (fits as Outfit[]) ?? [];
      setOutfits(outfitList);

      const allIds = outfitList.flatMap((o) => o.product_ids);
      if (allIds.length > 0) {
        const { data: prods } = await supabase.from('products').select('*').in('id', allIds);
        const map: Record<string, Product> = {};
        (prods as Product[])?.forEach((p) => { map[p.id] = p; });
        setProductsMap(map);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-10 text-center">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-gold-100 px-4 py-1.5 text-sm font-medium uppercase tracking-wider text-gold-700">
          <Shirt className="h-4 w-4" /> Combina tu outfit
        </span>
        <h1 className="font-display text-4xl font-bold text-ink-950 md:text-5xl">Looks curados para ti</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-500">
          Combinaciones de prendas listas para usar. Toca un look para ver las prendas que lo componen.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {outfits.map((o) => (
          <div key={o.id} className="overflow-hidden rounded-2xl border border-ink-100">
            <div className="relative aspect-[3/4] overflow-hidden bg-ink-50">
              <img src={o.image_url ?? ''} alt={o.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <span className="mb-2 inline-block rounded-full bg-gold-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-950">
                  {o.style}
                </span>
                <h3 className="text-xl font-semibold text-white">{o.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-ink-200">{o.description}</p>
              </div>
            </div>
            <div className="p-4">
              <button
                onClick={() => setActiveOutfit(activeOutfit === o.id ? null : o.id)}
                className="flex w-full items-center justify-between text-sm font-medium text-ink-700 hover:text-ink-950"
              >
                Ver prendas ({o.product_ids.length})
                <ArrowRight className={`h-4 w-4 transition-transform ${activeOutfit === o.id ? 'rotate-90' : ''}`} />
              </button>
            </div>
            {activeOutfit === o.id && (
              <div className="border-t border-ink-100 p-4">
                <div className="space-y-3">
                  {o.product_ids.map((pid) => {
                    const p = productsMap[pid];
                    if (!p) return null;
                    return (
                      <Link key={pid} to={`/producto/${p.slug}`} className="flex items-center gap-3 rounded-lg hover:bg-ink-50">
                        <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                          <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ink-900">{p.name}</p>
                          <p className="text-xs text-ink-500">${p.price.toFixed(2)}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* All products grid */}
      <div className="mt-16">
        <h2 className="section-title mb-6">Prendas individuales</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Object.values(productsMap).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
