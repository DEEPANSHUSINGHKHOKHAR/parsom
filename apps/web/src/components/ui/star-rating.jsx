import { Star } from 'lucide-react';

export default function StarRating({
  rating = 0,
  max = 5,
  size = 16,
  interactive = false,
  value,
  onChange,
  className = '',
}) {
  const currentValue = Number(value ?? rating ?? 0);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: max }).map((_, index) => {
        const starValue = index + 1;
        const filled = starValue <= currentValue;

        const content = (
          <Star
            size={size}
            className={filled ? 'fill-[#b69a62] text-[#b69a62]' : 'text-[#c9b9a5]'}
          />
        );

        if (!interactive) {
          return <span key={starValue}>{content}</span>;
        }

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange?.(starValue)}
            className="transition hover:scale-105"
            aria-label={`Rate ${starValue} star${starValue === 1 ? '' : 's'}`}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
