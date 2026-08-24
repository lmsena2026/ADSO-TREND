import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Shirt, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category, Outfit } from '@/types';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/config';
import ProductCarousel from '@/components/ProductCarousel';

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    const el = categoriesScrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  useEffect(() => {
    (async () => {
      const [feat, newArr, trend, off, cats, fits] = await Promise.all([
        supabase.from('products').select('*').eq('is_featured', true).limit(8),
        supabase.from('products').select('*').eq('is_new', true).limit(4),
        supabase.from('products').select('*').eq('is_trending', true).limit(4),
        supabase.from('products').select('*').not('compare_at_price', 'is', null).limit(4),
        supabase.from('categories').select('*').order('created_at'),
        supabase.from('outfits').select('*').limit(4),
      ]);
      setFeatured((feat.data as Product[]) ?? []);
      setNewArrivals((newArr.data as Product[]) ?? []);
      setTrending((trend.data as Product[]) ?? []);
      setOffers((off.data as Product[]) ?? []);
      setCategories((cats.data as Category[]) ?? []);
      setOutfits((fits.data as Outfit[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden bg-ink-950">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/28609631/pexels-photo-28609631.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="ADSO Trend"
            className="h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/50 to-transparent" />
        </div>
        <div className="relative flex h-full items-center">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="max-w-xl animate-fade-up">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-gold-400 ring-1 ring-white/20 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Colección Otoño 2026
              </span>
              <h1 className="font-display text-5xl font-bold leading-tight text-white md:text-7xl">
                Descubre tu<br />nuevo estilo
              </h1>
              <p className="mt-6 text-lg text-ink-200">
                Prendas modernas y tendencias actuales para quienes definen su propia moda.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/catalogo" className="btn-gold">
                  Explorar colección <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/estilo" className="btn-outline border-white/30 text-white hover:bg-white hover:text-ink-950">
                  Recomendador de estilo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="section-title">Categorías</h2>
            <p className="mt-2 text-ink-500">Explora por categoría y encuentra tu look</p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={() => scrollCategories('left')}
              aria-label="Categorías anteriores"
              className="rounded-full border border-ink-200 p-2 text-ink-700 transition-colors hover:bg-ink-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollCategories('right')}
              aria-label="Categorías siguientes"
              className="rounded-full border border-ink-200 p-2 text-ink-700 transition-colors hover:bg-ink-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <Link to="/catalogo" className="ml-2 flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-ink-950">
              Ver todo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div
          ref={categoriesScrollRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/catalogo?categoria=${cat.slug}`}
              className="group relative aspect-[3/4] w-[45%] shrink-0 snap-start overflow-hidden rounded-xl bg-ink-100 sm:w-[30%] lg:w-[19%]"
            >
              <img
                src={cat.image_url ?? ''}
                alt={cat.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="text-lg font-semibold text-white">{cat.name}</h3>
                <span className="mt-1 inline-flex items-center gap-1 text-xs text-white/80 opacity-0 transition-opacity group-hover:opacity-100">
                  Explorar <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
        <Link to="/catalogo" className="mt-4 flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-ink-950 sm:hidden">
          Ver todo <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* FEATURED */}
      <section className="bg-ink-50 py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="mb-2 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-gold-600">
                <Sparkles className="h-4 w-4" /> Destacados
              </span>
              <h2 className="section-title">Productos destacados</h2>
            </div>
            <Link to="/catalogo" className="hidden items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-ink-950 sm:flex">
              Ver todo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ProductCarousel products={featured} loading={loading} />
        </div>
      </section>

      {/* PROMO BANNER */}
      <section className="relative overflow-hidden bg-ink-950 py-24">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/18889257/pexels-photo-18889257.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Ofertas"
            className="h-full w-full object-cover opacity-30"
          />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 text-center lg:px-8">
          <Tag className="mx-auto mb-4 h-10 w-10 text-gold-500" />
          <h2 className="font-display text-4xl font-bold text-white md:text-5xl">
            Hasta 40% de descuento
          </h2>
          <p className="mt-4 text-lg text-ink-200">
            Renueva tu armario con las mejores moda a precios irresistibles.
          </p>
          <Link to="/catalogo?categoria=ofertas" className="btn-gold mt-8">
            Comprar ofertas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* TRENDING */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-gold-600">
              <TrendingUp className="h-4 w-4" /> Tendencias del mes
            </span>
            <h2 className="section-title">Lo más popular ahora</h2>
          </div>
        </div>
        <ProductCarousel products={trending} loading={loading} />
      </section>

      {/* OUTFITS */}
      <section className="bg-ink-50 py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-8 text-center">
            <span className="mb-2 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-gold-600">
              <Shirt className="h-4 w-4" /> Combina tu outfit
            </span>
            <h2 className="section-title">Looks curados para ti</h2>
            <p className="mt-2 text-ink-500">Combinaciones de prendas listas para usar</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {outfits.map((o) => (
              <Link
                key={o.id}
                to="/outfits"
                className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-ink-100"
              >
                <img
                  src={o.image_url ?? ''}
                  alt={o.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="mb-2 inline-block rounded-full bg-gold-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-950">
                    {o.style}
                  </span>
                  <h3 className="text-xl font-semibold text-white">{o.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-200">{o.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-gold-600">
              <Sparkles className="h-4 w-4" /> Nueva colección
            </span>
            <h2 className="section-title">Recién llegado</h2>
          </div>
          <Link to="/catalogo?categoria=nueva-coleccion" className="hidden items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-ink-950 sm:flex">
            Ver todo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ProductCarousel products={newArrivals} loading={loading} />
      </section>

      {/* OFFERS */}
      {offers.length > 0 && (
        <section className="bg-ink-50 py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <span className="mb-2 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-red-500">
                  <Tag className="h-4 w-4" /> Ofertas
                </span>
                <h2 className="section-title">Aprovecha antes de que se agote</h2>
              </div>
            </div>
            <ProductCarousel products={offers} loading={loading} />
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section className="border-t border-ink-100 py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 md:grid-cols-3 lg:px-8">
          {[
            { icon: '🚚', title: 'Envío gratis', desc: `En pedidos superiores a $${FREE_SHIPPING_THRESHOLD}` },
            { icon: '↩️', title: 'Devoluciones', desc: '30 días para devoluciones gratuitas' },
            { icon: '🔒', title: 'Pago seguro', desc: 'Transacciones 100% protegidas' },
          ].map((f) => (
            <div key={f.title} className="text-center">
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="text-base font-semibold text-ink-950">{f.title}</h3>
              <p className="mt-1 text-sm text-ink-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
