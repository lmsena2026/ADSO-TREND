import { Star } from 'lucide-react';

interface RatingProps {
  value: number;
  count?: number;
  size?: 'sm' | 'md';
  showCount?: boolean;
}

export default function Rating({ value, count, size = 'sm', showCount = true }: RatingProps) {
  const stars = [1, 2, 3, 4, 5];
  const px = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {stars.map((s) => (
          <Star
            key={s}
            className={`${px} ${s <= Math.round(value) ? 'fill-gold-400 text-gold-400' : 'fill-ink-100 text-ink-200'}`}
          />
        ))}
      </div>
      {showCount && count !== undefined && (
        <span className="text-xs text-ink-400">({count})</span>
      )}
    </div>
  );
}
