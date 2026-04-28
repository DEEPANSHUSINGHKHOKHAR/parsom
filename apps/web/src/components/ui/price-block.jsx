const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'USE YOUR DATA HERE';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
};

export default function PriceBlock({
  price,
  originalPrice,
  className = '',
  size = 'default',
  tone = 'dark',
}) {
  const hasDiscount =
    originalPrice !== null &&
    originalPrice !== undefined &&
    Number(originalPrice) > Number(price);

  const currentPriceClass =
    size === 'large' ? 'text-3xl md:text-4xl' : 'text-lg md:text-xl';

  const originalPriceClass =
    size === 'large' ? 'text-base md:text-lg' : 'text-sm md:text-base';

  const currentToneClass = tone === 'light' ? 'text-[#171412]' : 'text-foreground-primary';
  const originalToneClass = tone === 'light' ? 'text-[#756c63]' : 'text-foreground-muted';

  return (
    <div className={`flex items-end gap-3 ${className}`}>
      <span className={`font-display tracking-tight ${currentToneClass} ${currentPriceClass}`}>
        {formatCurrency(price)}
      </span>

      {hasDiscount ? (
        <span className={`${originalToneClass} line-through ${originalPriceClass}`}>
          {formatCurrency(originalPrice)}
        </span>
      ) : null}
    </div>
  );
}
