import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/layout/page-shell';
import EmptyState from '../components/ui/empty-state';
import Button from '../components/ui/button';
import CartLineItem from '../features/cart/components/cart-line-item';
import { useCartStore } from '../features/cart/cart-store';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));

export default function CartPage() {
  const cartItems = useCartStore((state) => state.cartItems);
  const clearCart = useCartStore((state) => state.clearCart);
  const [couponCode, setCouponCode] = useState('');

  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0),
    [cartItems]
  );

  const discount = 0;
  const total = subtotal - discount;

  return (
    <PageShell>
      <section className="min-h-screen bg-background-base pb-24 pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-12 text-display-2 text-foreground-primary">Shopping Bag</h1>

          {cartItems.length === 0 ? (
            <EmptyState
              title="Your cart is empty"
              description="Add products from the collection to begin checkout."
              action={<Button as={Link} to="/collection">Continue Shopping</Button>}
            />
          ) : (
            <div className="grid gap-16 lg:grid-cols-[1fr_380px]">
              <div className="space-y-8">
                {cartItems.map((item) => (
                  <CartLineItem key={item.key} item={item} />
                ))}

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border-soft pt-6">
                  <p className="text-body-sm text-foreground-secondary">
                    {cartItems.length} line item{cartItems.length === 1 ? '' : 's'}
                  </p>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="border border-border-soft px-4 py-2 text-sm text-foreground-secondary transition hover:bg-glass-soft hover:text-foreground-primary"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>

              <aside className="lg:sticky lg:top-28 lg:self-start">
                <div className="border border-border-soft bg-background-elevated p-8">
                  <h2 className="text-display-3 text-foreground-primary">Order Summary</h2>

                  <div className="mt-8 space-y-4">
                    <label className="block text-label text-foreground-muted">Promo Code</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(event) => setCouponCode(event.target.value)}
                        placeholder="Enter code"
                        className="w-full border-b border-border-strong bg-transparent px-0 py-3 text-sm text-foreground-primary outline-none placeholder:text-foreground-muted focus:border-accent-primary"
                      />
                      <button
                        type="button"
                        className="border border-border-soft px-4 py-3 text-sm text-foreground-secondary transition hover:bg-glass-soft hover:text-foreground-primary"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3 border border-border-soft bg-background-panel p-4">
                    <div className="flex items-center justify-between text-sm text-foreground-secondary">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-foreground-secondary">
                      <span>Discount</span>
                      <span>{formatCurrency(discount)}</span>
                    </div>
                    <div className="h-px bg-border-soft" />
                    <div className="flex items-center justify-between text-display-3 text-foreground-primary">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <Button as={Link} to="/checkout" className="w-full justify-center">
                      Proceed To Checkout
                    </Button>
                    <Button as={Link} to="/collection" variant="secondary" className="w-full justify-center">
                      Continue Shopping
                    </Button>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
