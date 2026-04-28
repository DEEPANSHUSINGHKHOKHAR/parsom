import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/layout/page-shell';
import EmptyState from '../components/ui/empty-state';
import Button from '../components/ui/button';
import CartLineItem from '../features/cart/components/cart-line-item';
import { useAuthStore } from '../features/auth/auth-store';
import { useCartStore } from '../features/cart/cart-store';
import { validateCoupon } from '../services/coupons-service';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));

export default function CartPage() {
  const cartItems = useCartStore((state) => state.cartItems);
  const clearCart = useCartStore((state) => state.clearCart);
  const actor = useAuthStore((state) => state.actor);
  const [couponCode, setCouponCode] = useState('');
  const [couponState, setCouponState] = useState({
    loading: false,
    error: '',
    applied: null,
  });

  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0),
    [cartItems]
  );

  const discount = couponState.applied?.discountAmount || 0;
  const total = subtotal - discount;

  useEffect(() => {
    if (!couponState.applied) return;
    if (Number(couponState.applied.subtotal) === Number(subtotal)) return;

    setCouponState({ loading: false, error: '', applied: null });
    sessionStorage.removeItem('parsom-checkout-coupon');
  }, [couponState.applied, subtotal]);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();

    if (!code) {
      setCouponState({ loading: false, error: 'Enter a promo code.', applied: null });
      sessionStorage.removeItem('parsom-checkout-coupon');
      return;
    }

    setCouponState({ loading: true, error: '', applied: null });

    try {
      const result = await validateCoupon({ code, subtotal });
      const appliedCoupon = { ...result, subtotal };
      setCouponState({ loading: false, error: '', applied: appliedCoupon });
      sessionStorage.setItem(
        'parsom-checkout-coupon',
        JSON.stringify({
          code: appliedCoupon.code || code,
          subtotal,
          discountAmount: appliedCoupon.discountAmount,
          totalAfterDiscount: appliedCoupon.totalAfterDiscount,
        })
      );
    } catch (error) {
      sessionStorage.removeItem('parsom-checkout-coupon');
      setCouponState({
        loading: false,
        error: error?.response?.data?.message || 'Invalid promo code.',
        applied: null,
      });
    }
  };

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
                        onClick={handleApplyCoupon}
                        disabled={couponState.loading}
                        className="border border-border-soft px-4 py-3 text-sm text-foreground-secondary transition hover:bg-glass-soft hover:text-foreground-primary"
                      >
                        {couponState.loading ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                    {couponState.error ? (
                      <p className="text-sm text-red-300">{couponState.error}</p>
                    ) : null}
                    {couponState.applied ? (
                      <p className="text-sm text-[#b7d6ac]">
                        Promo {couponState.applied.code || couponCode} applied.
                      </p>
                    ) : null}
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

                  <div className="mt-8 border border-border-soft bg-background-panel p-4">
                    <p className="text-label text-foreground-muted">Customer Details</p>
                    {actor ? (
                      <div className="mt-4 space-y-2 text-sm text-foreground-secondary">
                        <p className="text-foreground-primary">
                          {[actor.firstName, actor.lastName].filter(Boolean).join(' ') || 'Customer'}
                        </p>
                        <p>{actor.email || 'Email not added'}</p>
                        <p>{actor.phone || 'Phone not added'}</p>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-foreground-secondary">
                        Login or create an account at checkout to save your address for next time.
                      </p>
                    )}
                  </div>

                  <div className="mt-8 space-y-4">
                    <Link
                      to="/checkout"
                      className="inline-flex w-full items-center justify-center rounded-full bg-[#171412] px-8 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-[#fffaf4] shadow-[0_12px_28px_rgba(0,0,0,0.32)] transition hover:bg-[#8f3d2f]"
                    >
                      Proceed To Checkout
                    </Link>
                    <Button
                      as={Link}
                      to="/collection"
                      variant="secondary"
                      className="w-full justify-center border-white/20 bg-transparent text-[#f5f2ed] hover:bg-white/10 hover:text-white"
                    >
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
