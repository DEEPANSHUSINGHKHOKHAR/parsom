import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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

export default function ProductCard({ product }) {
  const badge = getBadge(product);

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      className="group relative overflow-hidden border border-border-soft bg-background-elevated shadow-[0_18px_45px_rgba(0,0,0,0.18)]"
    >
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-background-panel">
          {product?.primaryImage ? (
            <>
              <img
                src={product.primaryImage}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03] group-hover:opacity-0"
              />
              <img
                src={product.secondaryImage || product.primaryImage}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:scale-[1.06] group-hover:opacity-100"
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-background-panel text-sm uppercase text-foreground-muted">
              USE YOUR DATA HERE
            </div>
          )}

          {badge ? (
            <div className="absolute left-4 top-4">
              <Badge tone={badge.tone}>{badge.label}</Badge>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 p-5">
          <div className="space-y-2">
            <p className="text-label text-accent-primary">
              {product?.categoryName || 'USE YOUR DATA HERE'}
            </p>
            <h3 className="text-xl font-semibold tracking-tight text-foreground-primary md:text-2xl">
              {product?.name || 'USE YOUR DATA HERE'}
            </h3>
            <p className="line-clamp-2 text-sm leading-6 text-foreground-secondary">
              {product?.shortDescription || 'USE YOUR DATA HERE'}
            </p>
          </div>

          <PriceBlock
            price={product?.discountPrice ?? product?.price}
            originalPrice={product?.originalPrice}
          />
        </div>
      </Link>
    </motion.article>
  );
}
