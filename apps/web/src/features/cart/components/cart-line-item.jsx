import { Link } from 'react-router-dom';
import PriceBlock from '../../../components/ui/price-block';
import { useCartStore } from '../cart-store';

export default function CartLineItem({ item }) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <article className="grid gap-4 border-b border-border-soft pb-8 md:grid-cols-[140px_1fr_auto] md:p-0">
      <Link
        to={`/products/${item.slug}`}
        className="overflow-hidden border border-border-soft bg-background-panel"
      >
        <div className="aspect-[4/5]">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs uppercase text-foreground-muted/60">
              USE YOUR DATA HERE
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-col justify-between gap-4">
        <div>
          <p className="text-label text-foreground-muted">
            Size {item.size}
          </p>
          <Link
            to={`/products/${item.slug}`}
            className="mt-2 block text-xl font-semibold tracking-tight text-foreground-primary"
          >
            {item.name}
          </Link>

          <PriceBlock
            className="mt-3"
            price={item.price}
            originalPrice={item.originalPrice}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center border border-border-soft bg-background-panel p-1">
            <button
              type="button"
              onClick={() => updateQuantity(item.key, item.quantity - 1)}
              className="rounded-full px-4 py-2 text-foreground-secondary transition hover:bg-glass-soft hover:text-foreground-primary"
            >
              -
            </button>

            <span className="w-12 text-center text-sm">{item.quantity}</span>

            <button
              type="button"
              onClick={() => updateQuantity(item.key, item.quantity + 1)}
              className="rounded-full px-4 py-2 text-foreground-secondary transition hover:bg-glass-soft hover:text-foreground-primary"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.key)}
            className="border border-border-soft px-4 py-2 text-sm text-foreground-secondary transition hover:bg-glass-soft hover:text-foreground-primary"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="flex items-start justify-between md:flex-col md:items-end">
        <span className="text-label text-foreground-muted">
          Line Total
        </span>
        <span className="text-xl font-semibold tracking-tight text-foreground-primary">
          {new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
          }).format(Number(item.price) * Number(item.quantity))}
        </span>
      </div>
    </article>
  );
}
