import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Star } from 'lucide-react';
import Badge from '../../../components/ui/badge';
import PriceBlock from '../../../components/ui/price-block';

function getBadge(product) {
  if (product?.status === 'out_of_stock') {
    return { label: 'Out of Stock', tone: 'outOfStock' };
  }

  if (product?.isComingSoon) {
    return { label: 'Coming Soon', tone: 'comingSoon' };
  }

  if (product?.isTrending) {
    return { label: 'Trending', tone: 'trending' };
  }

  if (product?.isFeatured) {
    return { label: 'Featured', tone: 'featured' };
  }

  return null;
}

export function ProductRating({ rating = 0, count = 0, tone = 'dark', compact = false }) {
  const numericRating = Number(rating || 0);
  const reviewCount = Number(count || 0);
  const label = reviewCount > 0 ? numericRating.toFixed(1) : 'New';
  const isLight = tone === 'light';

  return (
    <div
      className={
        isLight
          ? 'flex items-center gap-1.5 text-[#756c63]'
          : 'flex items-center gap-1.5 text-foreground-secondary'
      }
      aria-label={reviewCount > 0 ? `${label} out of 5 from ${reviewCount} reviews` : 'No ratings yet'}
    >
      <Star
        size={compact ? 13 : 15}
        className={reviewCount > 0 ? 'fill-[#b69a62] text-[#b69a62]' : 'text-current'}
      />
      <span className={compact ? 'text-xs font-medium leading-4' : 'text-sm font-medium'}>
        {label}
      </span>
      <span className={compact ? 'text-[0.68rem] leading-4' : 'text-xs'}>
        {reviewCount > 0 ? `(${reviewCount})` : 'No reviews'}
      </span>
    </div>
  );
}

function ProductImageFallback({ isLight }) {
  return (
    <div
      className={
        isLight
          ? 'flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#eee6da_0%,#fffaf4_52%,#e4d7c8_100%)] px-4 text-center text-[0.62rem] uppercase leading-5 tracking-[0.2em] text-[#8f3d2f]'
          : 'flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#171412_0%,#2a2521_52%,#0f0f10_100%)] px-4 text-center text-[0.62rem] uppercase leading-5 tracking-[0.2em] text-accent-primary'
      }
    >
      Image coming soon
    </div>
  );
}

export default function ProductCard({ product, tone = 'dark', compact = false, onQuickPreview }) {
  const badge = getBadge(product);
  const isLight = tone === 'light';
  const availableStock = Number(product?.availableStock || 0);
  const stockLabel =
    availableStock === 1
      ? 'Last piece'
      : availableStock > 1 && availableStock <= 5
        ? 'Few left'
        : '';
  const ratingLabel =
    Number(product?.reviewCount || 0) > 0
      ? `${Number(product?.avgRating || 0).toFixed(1)}`
      : 'New';
  const reviewCount = Number(product?.reviewCount || 0);
  const productUrl = `/products/${product.slug}`;

  const handleCardClick = (event) => {
    if (!onQuickPreview || typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 767px)').matches) return;

    event.preventDefault();
    onQuickPreview(product);
  };

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      className={
        isLight
          ? 'group relative overflow-hidden bg-white transition-shadow duration-300 hover:shadow-[0_16px_36px_rgba(23,20,18,0.1)]'
          : 'group relative overflow-hidden border border-border-soft bg-background-elevated shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition-shadow duration-300 hover:shadow-[0_24px_60px_rgba(0,0,0,0.34)]'
      }
    >
      <Link to={productUrl} onClick={handleCardClick} className="block">
        <div className={isLight ? 'relative aspect-[4/5] overflow-hidden bg-[#f4f4f4]' : 'relative aspect-[4/5] overflow-hidden bg-background-panel'}>
          <div className="absolute inset-0">
            <ProductImageFallback isLight={isLight} />
          </div>
          {product?.primaryImage ? (
            <>
              <img
                src={product.primaryImage}
                alt={product.name}
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03] group-hover:opacity-0"
              />
              <img
                src={product.secondaryImage || product.primaryImage}
                alt={product.name}
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:scale-[1.06] group-hover:opacity-100"
              />
            </>
          ) : (
            <ProductImageFallback isLight={isLight} />
          )}

          <div className="absolute inset-x-2 bottom-2 flex items-end justify-between gap-2">
            <div className="inline-flex items-center gap-1 rounded-full bg-white/92 px-2 py-1 text-[0.68rem] font-semibold text-[#171412] shadow-[0_6px_18px_rgba(23,20,18,0.12)] backdrop-blur-sm">
              <Star size={11} className="fill-[#0f9d8a] text-[#0f9d8a]" />
              <span>{ratingLabel}</span>
              <span className="text-[#756c63]">|</span>
              <span>{reviewCount > 999 ? `${Math.round(reviewCount / 100) / 10}k` : reviewCount || '0'}</span>
            </div>

            <button
              type="button"
              aria-label={`Save ${product?.name || 'product'} to wishlist`}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/92 text-[#4b4b4b] shadow-[0_6px_18px_rgba(23,20,18,0.12)] backdrop-blur-sm"
              onClick={(event) => {
                event.preventDefault();
              }}
            >
              <Heart size={15} />
            </button>
          </div>

          {badge ? (
            <div className={compact ? 'absolute left-2 top-2 sm:left-3 sm:top-3' : 'absolute left-4 top-4'}>
              <Badge tone={badge.tone}>{badge.label}</Badge>
            </div>
          ) : null}
        </div>

        <div className={compact ? 'space-y-1.5 px-2 pb-3 pt-2 sm:px-3 sm:pb-4' : 'space-y-4 p-5'}>
          <div className={compact ? 'space-y-1' : 'space-y-2'}>
            <h3
              className={
                compact
                  ? isLight
                    ? 'line-clamp-2 min-h-9 text-[0.9rem] font-semibold leading-5 text-[#171412]'
                    : 'line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-foreground-primary sm:text-base'
                  : isLight
                    ? 'text-xl font-semibold tracking-tight text-[#171412] md:text-2xl'
                    : 'text-xl font-semibold tracking-tight text-foreground-primary md:text-2xl'
              }
            >
              {product?.name || 'USE YOUR DATA HERE'}
            </h3>
            <p
              className={
                compact
                  ? isLight
                    ? 'line-clamp-1 text-xs leading-4 text-[#756c63]'
                    : 'hidden text-xs leading-5 text-foreground-secondary sm:line-clamp-2'
                  : isLight
                    ? 'line-clamp-2 text-sm leading-6 text-[#756c63]'
                    : 'line-clamp-2 text-sm leading-6 text-foreground-secondary'
              }
            >
              {product?.shortDescription || 'USE YOUR DATA HERE'}
            </p>
          </div>

          <PriceBlock
            tone={isLight ? 'light' : 'dark'}
            price={product?.discountPrice ?? product?.price}
            originalPrice={product?.originalPrice}
            className={compact ? 'flex-wrap gap-x-1.5 gap-y-1 text-sm [&_span:first-child]:text-base [&_span:first-child]:font-semibold [&_span:last-child]:text-[0.72rem]' : ''}
          />

          {stockLabel ? (
            <p className={isLight ? 'text-xs uppercase text-[#8f3d2f]' : 'text-xs uppercase text-accent-primary'}>
              {stockLabel}
            </p>
          ) : null}
        </div>
      </Link>
    </motion.article>
  );
}
