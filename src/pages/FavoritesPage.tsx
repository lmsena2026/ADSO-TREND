import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Favorite } from '@/types';
import ProductCard from '@/components/ProductCard';

export default function FavoritesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('favorites')
        .select('*, product:products(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setFavorites((data as Favorite[]) ?? []);
      setLoading(false);
    })();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <h1 className="mb-8 font-display text-4xl font-bold text-ink-950">Favoritos</h1>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl skeleton" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Heart className="mb-4 h-16 w-16 text-ink-300" />
          <h2 className="text-xl font-semibold text-ink-950">Tu lista de deseos está vacía</h2>
          <p className="mt-2 text-ink-500">Guarda tus prendas favoritas tocando el corazón.</p>
          <Link to="/catalogo" className="btn-primary mt-6">Explorar catálogo</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {favorites.map((f) => f.product && <ProductCard key={f.id} product={f.product} />)}
        </div>
      )}
    </div>
  );
}
