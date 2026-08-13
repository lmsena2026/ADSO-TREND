import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import type { Product } from '@/types';
import Rating from './Rating';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';

export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  useEffect(() => {
    if (!user) {
      setIsFavorite(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();
      setIsFavorite(!!data);
    })();
  }, [user, product.id]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast('Inicia sesión para guardar favoritos', 'info');
      return;
    }
    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', product.id);
      setIsFavorite(false);
      toast('Eliminado de favoritos', 'info');
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: user.id, product_id: product.id });
      setIsFavorite(true);
      toast('Agregado a favoritos', 'success');
    }
  };

  return (
    <Link to={`/producto/${product.slug}`} className="card-product group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-ink-50">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {product.images[1] && (
          <img
            src={product.images[1]}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.is_new && (
            <span className="rounded-full bg-ink-950 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              Nuevo
            </span>
          )}
          {hasDiscount && (
            <span className="rounded-full bg-red-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              -{discountPct}%
            </span>
          )}
          {product.is_trending && (
            <span className="rounded-full bg-gold-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-950">
              Tendencia
            </span>
          )}
        </div>
        <button
          onClick={toggleFavorite}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur transition-all hover:bg-white"
          aria-label="Favorito"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-ink-700 hover:text-red-500'
            }`}
          />
        </button>
        <div className="absolute inset-x-3 bottom-3 translate-y-12 opacity-0 transition-all duration-400 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="flex items-center justify-center gap-2 rounded-full bg-white/95 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink-950 backdrop-blur">
            <ShoppingBag className="h-4 w-4" /> Ver producto
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-medium text-ink-900">{product.name}</h3>
        </div>
        <div className="mb-2">
          <Rating value={product.rating} count={product.reviews_count} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-ink-950">${product.price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-sm text-ink-400 line-through">${product.compare_at_price!.toFixed(2)}</span>
          )}
        </div>
        {product.stock <= 10 && product.stock > 0 && (
          <p className="mt-1 text-xs text-amber-600">¡Solo quedan {product.stock}!</p>
        )}
        {product.stock === 0 && <p className="mt-1 text-xs text-red-500">Agotado</p>}
      </div>
    </Link>
  );
}
