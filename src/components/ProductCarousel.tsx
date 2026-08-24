import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '@/types';
import ProductCard from '@/components/ProductCard';

interface ProductCarouselProps {
  products: Product[];
  loading?: boolean;
}

export default function ProductCarousel({ products, loading }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] w-[45%] shrink-0 rounded-xl skeleton sm:w-[30%] lg:w-[23%]" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <div key={p.id} className="w-[45%] shrink-0 snap-start sm:w-[30%] lg:w-[23%]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      {products.length > 4 && (
        <div className="mt-4 hidden justify-end gap-2 sm:flex">
          <button
            onClick={() => scroll('left')}
            aria-label="Anterior"
            className="rounded-full border border-ink-200 p-2 text-ink-700 transition-colors hover:bg-ink-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Siguiente"
            className="rounded-full border border-ink-200 p-2 text-ink-700 transition-colors hover:bg-ink-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
