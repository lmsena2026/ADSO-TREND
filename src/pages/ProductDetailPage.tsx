import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Heart, Minus, Plus, ShoppingBag, Truck, RefreshCw, Shield, ChevronRight, X, Ruler } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import type { Product, Review, SizeGuide } from '@/types';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/config';
import ProductCard from '@/components/ProductCard';
import Rating from '@/components/Rating';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [sizeGuides, setSizeGuides] = useState<SizeGuide[]>([]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
      const p = data as Product | null;
      setProduct(p);
      setActiveImage(0);
      setSelectedSize('');
      setSelectedColor('');
      setQuantity(1);

      if (p) {
        const [rel, revs, favRes, guideRes] = await Promise.all([
          supabase.from('products').select('*').eq('category_id', p.category_id).neq('id', p.id).limit(4),
          supabase
            .from('reviews')
            .select('*, profiles:profiles(full_name)')
            .eq('product_id', p.id)
            .order('created_at', { ascending: false }),
          user
            ? supabase.from('favorites').select('id').eq('user_id', user.id).eq('product_id', p.id).maybeSingle()
            : Promise.resolve({ data: null }),
          supabase.from('size_guides').select('*').order('size_label', { ascending: true }),
        ]);
        setRelated((rel.data as Product[]) ?? []);
        setReviews((revs.data as Review[]) ?? []);
        setIsFavorite(!!favRes.data);
        setSizeGuides((guideRes.data as SizeGuide[]) ?? []);

        if (user) {
          await supabase
            .from('recently_viewed')
            .upsert({ user_id: user.id, product_id: p.id, viewed_at: new Date().toISOString() }, { onConflict: 'user_id,product_id' });
        }
      }
      setLoading(false);
    })();
  }, [slug, user]);

  const handleAddToCart = async () => {
    if (!product) return;
    if (!user) {
      toast('Inicia sesión para comprar', 'info');
      navigate('/login');
      return;
    }
    if (!selectedColor) {
      toast('Selecciona un color', 'error');
      return;
    }
    if (!selectedSize) {
      toast('Selecciona una talla', 'error');
      return;
    }
    if (quantity < 1) {
      toast('La cantidad debe ser al menos 1', 'error');
      return;
    }
    setAdding(true);
    try {
      await addToCart(product, selectedSize, selectedColor, quantity);
      toast('Producto agregado al carrito', 'success');
    } catch {
      toast('No se pudo agregar al carrito', 'error');
    }
    setAdding(false);
  };

  const toggleFavorite = async () => {
    if (!product || !user) {
      toast('Inicia sesión para guardar favoritos', 'info');
      return;
    }
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', product.id);
      setIsFavorite(false);
      toast('Eliminado de favoritos', 'info');
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, product_id: product.id });
      setIsFavorite(true);
      toast('Agregado a favoritos', 'success');
    }
  };

  const submitReview = async () => {
    if (!product || !user) return;
    if (!newReview.comment.trim()) {
      toast('Escribe un comentario', 'error');
      return;
    }
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        product_id: product.id,
        rating: newReview.rating,
        comment: newReview.comment,
      })
      .select('*, profiles:profiles(full_name)')
      .single();
    if (!error && data) {
      setReviews((prev) => [data as Review, ...prev]);
      setNewReview({ rating: 5, comment: '' });
      toast('Reseña publicada', 'success');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-[3/4] rounded-xl skeleton" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 rounded skeleton" />
            <div className="h-6 w-1/3 rounded skeleton" />
            <div className="h-24 w-full rounded skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h1 className="text-2xl font-bold text-ink-950">Producto no encontrado</h1>
        <Link to="/catalogo" className="btn-primary mt-6">Volver al catálogo</Link>
      </div>
    );
  }

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const guideForSelected = sizeGuides.filter((g) => g.size_label === selectedSize);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-ink-100">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-4 text-sm text-ink-500 lg:px-8">
          <Link to="/" className="hover:text-ink-950">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/catalogo" className="hover:text-ink-950">Catálogo</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate text-ink-900">{product.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="aspect-[3/4] overflow-hidden rounded-xl bg-ink-50">
              <img
                src={product.images[activeImage]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="mt-4 flex gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`aspect-[3/4] w-20 overflow-hidden rounded-lg border-2 transition-colors ${
                      activeImage === i ? 'border-ink-950' : 'border-transparent hover:border-ink-300'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              {product.is_new && (
                <span className="rounded-full bg-ink-950 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">Nuevo</span>
              )}
              {product.is_trending && (
                <span className="rounded-full bg-gold-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-950">Tendencia</span>
              )}
            </div>
            <h1 className="font-display text-3xl font-bold text-ink-950 md:text-4xl">{product.name}</h1>
            <div className="mt-3 flex items-center gap-3">
              <Rating value={product.rating} size="md" showCount={false} />
              <span className="text-sm text-ink-500">{product.rating} · {product.reviews_count} reseñas</span>
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-ink-950">${product.price.toFixed(2)}</span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-ink-400 line-through">${product.compare_at_price!.toFixed(2)}</span>
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                    Ahorra ${(product.compare_at_price! - product.price).toFixed(2)}
                  </span>
                </>
              )}
            </div>

            <p className="mt-5 leading-relaxed text-ink-600">{product.description}</p>

            {/* Colors */}
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-ink-900">
                Color: <span className="text-ink-600">{selectedColor}</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                      selectedColor === c
                        ? 'border-ink-950 bg-ink-950 text-white'
                        : 'border-ink-200 text-ink-700 hover:border-ink-400'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-900">Talla</h3>
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="flex items-center gap-1 text-xs text-ink-500 underline hover:text-ink-950"
                >
                  <Ruler className="h-3.5 w-3.5" /> Guía de tallas
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-12 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                      selectedSize === s
                        ? 'border-ink-950 bg-ink-950 text-white'
                        : 'border-ink-200 text-ink-700 hover:border-ink-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity + Add */}
            <div className="mt-7 flex items-center gap-4">
              <div className="flex items-center rounded-full border border-ink-200">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-11 w-11 items-center justify-center text-ink-700 hover:text-ink-950"
                  aria-label="Disminuir"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="flex h-11 w-11 items-center justify-center text-ink-700 hover:text-ink-950"
                  aria-label="Aumentar"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={adding || product.stock === 0}
                className={`btn-primary flex-1 ${(!selectedColor || !selectedSize) ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <ShoppingBag className="h-4 w-4" />
                {product.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
              </button>
              <button
                onClick={toggleFavorite}
                className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
                  isFavorite
                    ? 'border-red-400 bg-red-50 text-red-500 hover:border-red-500'
                    : 'border-ink-200 text-ink-700 hover:border-red-400 hover:text-red-500'
                }`}
                aria-label="Favorito"
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>

            {product.stock <= 10 && product.stock > 0 && (
              <p className="mt-3 text-sm text-amber-600">¡Pocas unidades! Solo quedan {product.stock}.</p>
            )}

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-ink-100 pt-6">
              {[
                { icon: Truck, label: `Envío gratis +$${FREE_SHIPPING_THRESHOLD}` },
                { icon: RefreshCw, label: '30 días devolución' },
                { icon: Shield, label: 'Pago seguro' },
              ].map((b) => (
                <div key={b.label} className="flex flex-col items-center gap-2 text-center">
                  <b.icon className="h-6 w-6 text-ink-700" />
                  <span className="text-xs text-ink-500">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16 border-t border-ink-100 pt-12">
          <h2 className="section-title mb-8">Reseñas ({reviews.length})</h2>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Review list */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-ink-500">Aún no hay reseñas. ¡Sé el primero en opinar!</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-ink-100 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-ink-900">{r.profiles?.full_name ?? 'Usuario'}</span>
                      <Rating value={r.rating} showCount={false} />
                    </div>
                    <p className="mt-2 text-sm text-ink-600">{r.comment}</p>
                  </div>
                ))
              )}
            </div>
            {/* Review form */}
            {user ? (
              <div className="rounded-xl border border-ink-100 p-6">
                <h3 className="mb-4 text-lg font-semibold">Deja tu reseña</h3>
                <div className="mb-4 flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setNewReview((p) => ({ ...p, rating: s }))}
                      className={`text-2xl transition-colors ${s <= newReview.rating ? 'text-gold-400' : 'text-ink-200'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview((p) => ({ ...p, comment: e.target.value }))}
                  placeholder="Cuéntanos tu experiencia..."
                  rows={4}
                  className="input-field resize-none"
                />
                <button onClick={submitReview} className="btn-primary mt-4">Publicar reseña</button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-ink-100 p-8 text-center">
                <p className="text-ink-600">Inicia sesión para dejar una reseña</p>
                <Link to="/login" className="btn-outline mt-4">Iniciar sesión</Link>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-16 border-t border-ink-100 pt-12">
            <h2 className="section-title mb-8">También te puede gustar</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm"
          onClick={() => setShowSizeGuide(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-ink-950">Guía de Tallas</h2>
              <button
                onClick={() => setShowSizeGuide(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {guideForSelected.length > 0 ? (
              <>
                <p className="mb-4 text-sm text-ink-600">
                  Medidas para talla <span className="font-semibold text-ink-950">{selectedSize}</span> (en centímetros)
                </p>
                <div className="overflow-hidden rounded-xl border border-ink-100">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
                      <tr>
                        <th className="px-4 py-3">Medida</th>
                        <th className="px-4 py-3 text-right">Talla {selectedSize}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-50">
                      {guideForSelected.map((g) => {
                        const rows = [
                          { label: 'Pecho', value: g.chest_cm },
                          { label: 'Cintura', value: g.waist_cm },
                          { label: 'Cadera', value: g.hip_cm },
                          { label: 'Largo', value: g.length_cm },
                          { label: 'Hombro', value: g.shoulder_cm },
                          { label: 'Manga', value: g.sleeve_cm },
                        ].filter((r) => r.value !== null);
                        return rows.map((r, i) => (
                          <tr key={`${g.id}-${i}`} className="hover:bg-ink-50">
                            <td className="px-4 py-3 text-ink-700">{r.label}</td>
                            <td className="px-4 py-3 text-right font-semibold text-ink-950">{r.value} cm</td>
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-sm text-ink-500">No hay medidas específicas para esta talla.</p>
            )}

            {/* Full size chart */}
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-ink-900">Tabla completa de tallas</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
                    <tr>
                      <th className="px-3 py-2">Talla</th>
                      <th className="px-3 py-2">Pecho</th>
                      <th className="px-3 py-2">Cintura</th>
                      <th className="px-3 py-2">Cadera</th>
                      <th className="px-3 py-2">Largo</th>
                      <th className="px-3 py-2">Hombro</th>
                      <th className="px-3 py-2">Manga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-50">
                    {sizeGuides
                      .filter((g) => g.category === 'general')
                      .map((g) => (
                        <tr key={g.id} className={selectedSize === g.size_label ? 'bg-gold-50' : 'hover:bg-ink-50'}>
                          <td className="px-3 py-2 font-semibold text-ink-950">{g.size_label}</td>
                          <td className="px-3 py-2 text-ink-600">{g.chest_cm ? `${g.chest_cm} cm` : '—'}</td>
                          <td className="px-3 py-2 text-ink-600">{g.waist_cm ? `${g.waist_cm} cm` : '—'}</td>
                          <td className="px-3 py-2 text-ink-600">{g.hip_cm ? `${g.hip_cm} cm` : '—'}</td>
                          <td className="px-3 py-2 text-ink-600">{g.length_cm ? `${g.length_cm} cm` : '—'}</td>
                          <td className="px-3 py-2 text-ink-600">{g.shoulder_cm ? `${g.shoulder_cm} cm` : '—'}</td>
                          <td className="px-3 py-2 text-ink-600">{g.sleeve_cm ? `${g.sleeve_cm} cm` : '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-4 text-xs text-ink-400">
              Las medidas son referenciales y pueden variar ligeramente. Si dudas entre dos tallas, te recomendamos elegir la más grande.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
