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
    <div className="space-y-6 rounded-[8px] border border-[#ded5ca] bg-[#fffaf4] p-6 shadow-[0_16px_34px_rgba(23,20,18,0.06)]">
      <div>
        <p className="text-label text-[#8f3d2f]">Summary</p>
        <h2 className="mt-3 text-display-3 text-[#171412]">Order Overview</h2>
      </div>

      <div className="space-y-4">
        {cartItems.map((item) => (
          <article
            key={item.key}
            className="flex gap-4 rounded-[8px] border border-[#ded5ca] bg-[#f6f3ee] p-4"
          >
            <div className="h-24 w-20 overflow-hidden rounded-[8px] border border-[#ded5ca] bg-[#ede8df]">
              {item.image ? (
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] uppercase text-[#756c63]">
                  USE YOUR DATA HERE
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-medium text-[#171412]">{item.name}</h3>
              <p className="mt-1 text-label text-[#756c63]">
                Size {item.size} - Qty {item.quantity}
              </p>
              <PriceBlock
                className="mt-3"
                tone="light"
                price={item.price}
                originalPrice={item.originalPrice}
              />
            </div>
          </article>
        ))}
      </div>

      <div className="space-y-3">
        <label className="block text-label text-[#756c63]">Coupon</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={couponCode}
            onChange={(event) => onCouponChange(event.target.value)}
            placeholder="Enter coupon code"
            className="w-full border-b border-[#cfc5b8] bg-transparent px-0 py-3 text-sm text-[#171412] outline-none placeholder:text-[#8b847b] focus:border-[#8f3d2f]"
          />
          <button
            type="button"
            onClick={onApplyCoupon}
            className="rounded-full border border-[#171412]/15 px-5 py-3 text-sm text-[#574f48] transition hover:bg-[#171412] hover:text-[#fffaf4]"
          >
            {couponLoading ? 'Applying...' : 'Apply'}
          </button>
        </div>
        {couponError ? <p className="text-sm text-[#a33a2a]">{couponError}</p> : null}
      </div>

      <div className="space-y-3 rounded-[8px] border border-[#ded5ca] bg-[#f6f3ee] p-4">
        <div className="flex items-center justify-between text-sm text-[#756c63]">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-[#756c63]">
          <span>Discount</span>
          <span>{formatCurrency(discount)}</span>
        </div>
        <div className="h-px bg-[#ded5ca]" />
        <div className="flex items-center justify-between text-lg font-semibold text-[#171412]">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
