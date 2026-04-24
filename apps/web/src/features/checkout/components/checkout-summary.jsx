import PriceBlock from '../../../components/ui/price-block';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));

export default function CheckoutSummary({
  cartItems,
  couponCode,
  onCouponChange,
  onApplyCoupon,
  couponError,
  couponLoading,
  subtotal,
  discount,
  total,
}) {
  return (
    <div className="space-y-6 border border-border-soft bg-background-elevated p-6 backdrop-blur-xl">
      <div>
        <p className="text-label text-accent-primary">Summary</p>
        <h2 className="mt-3 text-display-3 text-foreground-primary">Order Overview</h2>
      </div>

      <div className="space-y-4">
        {cartItems.map((item) => (
          <article key={item.key} className="flex gap-4 border border-border-soft bg-background-panel p-4">
            <div className="h-24 w-20 overflow-hidden border border-border-soft bg-background-panel">
              {item.image ? (
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] uppercase text-foreground-muted/60">
                  USE YOUR DATA HERE
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-medium text-foreground-primary">{item.name}</h3>
              <p className="mt-1 text-label text-foreground-muted">
                Size {item.size} · Qty {item.quantity}
              </p>
              <PriceBlock className="mt-3" price={item.price} originalPrice={item.originalPrice} />
            </div>
          </article>
        ))}
      </div>

      <div className="space-y-3">
        <label className="block text-label text-foreground-muted">Coupon</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={couponCode}
            onChange={(event) => onCouponChange(event.target.value)}
            placeholder="Enter coupon code"
            className="w-full border-b border-border-strong bg-transparent px-0 py-3 text-sm text-foreground-primary outline-none placeholder:text-foreground-muted focus:border-accent-primary"
          />
          <button
            type="button"
            onClick={onApplyCoupon}
            className="border border-border-soft px-5 py-3 text-sm text-foreground-secondary transition hover:bg-glass-soft hover:text-foreground-primary"
          >
            {couponLoading ? 'Applying...' : 'Apply'}
          </button>
        </div>
        {couponError ? <p className="text-sm text-[#f28b82]">{couponError}</p> : null}
      </div>

      <div className="space-y-3 border border-border-soft bg-background-panel p-4">
        <div className="flex items-center justify-between text-sm text-foreground-secondary">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-foreground-secondary">
          <span>Discount</span>
          <span>{formatCurrency(discount)}</span>
        </div>
        <div className="h-px bg-border-soft" />
        <div className="flex items-center justify-between text-lg font-semibold text-foreground-primary">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
