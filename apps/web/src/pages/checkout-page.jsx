import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/page-shell';
import Button from '../components/ui/button';
import EmptyState from '../components/ui/empty-state';
import CheckoutForm from '../features/checkout/components/checkout-form';
import CheckoutSummary from '../features/checkout/components/checkout-summary';
import { useAuthStore } from '../features/auth/auth-store';
import { useCartStore } from '../features/cart/cart-store';
import { siteConfig } from '../config/site-config';
import { fetchMyAddresses } from '../services/addresses-service';
import { validateCoupon } from '../services/coupons-service';
import { createOrder } from '../services/orders-service';

const initialCheckoutValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  addressLabel: '',
  notes: '',
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const cartItems = useCartStore((state) => state.cartItems);
  const clearCart = useCartStore((state) => state.clearCart);

  const [formValues, setFormValues] = useState(initialCheckoutValues);
  const [couponCode, setCouponCode] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [couponState, setCouponState] = useState({ loading: false, error: '', applied: null });
  const [status, setStatus] = useState({ loading: false, error: '' });

  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0),
    [cartItems]
  );

  const discount = couponState.applied?.discountAmount || 0;
  const total = couponState.applied?.totalAfterDiscount ?? subtotal;

  useEffect(() => {
    let ignore = false;
    const loadAddresses = async () => {
      if (!token) return;
      try {
        const data = await fetchMyAddresses();
        if (ignore) return;
        setSavedAddresses(data);
      } catch {
        // optional
      }
    };
    loadAddresses();
    return () => {
      ignore = true;
    };
  }, [token]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponState({ loading: true, error: '', applied: null });
    try {
      const result = await validateCoupon({ code: couponCode, subtotal });
      setCouponState({ loading: false, error: '', applied: result });
    } catch (error) {
      setCouponState({
        loading: false,
        error: error?.response?.data?.message || 'Invalid coupon.',
        applied: null,
      });
    }
  };

  const handlePlaceOrder = async () => {
    setStatus({ loading: true, error: '' });
    try {
      const orderResponse = await createOrder({
        customer: formValues,
        couponCode: couponCode || undefined,
        items: cartItems.map((item) => ({
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
        })),
      });

      sessionStorage.setItem(
        'parsom-last-order',
        JSON.stringify({
          order: orderResponse,
          customer: formValues,
          items: cartItems,
          couponCode,
          createdAt: new Date().toISOString(),
        })
      );

      const whatsappNumber = `${siteConfig.whatsappNumber}`.replace(/\D/g, '');
      window.open(`https://wa.me/${whatsappNumber}`, '_blank', 'noopener,noreferrer');
      clearCart();
      navigate('/thank-you');
    } catch (error) {
      setStatus({
        loading: false,
        error: error?.response?.data?.message || 'Unable to create order.',
      });
      return;
    }
    setStatus({ loading: false, error: '' });
  };

  if (cartItems.length === 0) {
    return (
      <PageShell>
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
          <EmptyState
            title="Your cart is empty"
            description="Add products before moving to checkout."
            action={<Button as={Link} to="/collection">Browse Collection</Button>}
          />
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="min-h-screen bg-background-base pb-24 pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {savedAddresses.length > 0 ? (
            <div className="mb-6 border border-border-soft bg-background-elevated p-5">
              <label className="mb-2 block text-label text-foreground-muted">Saved Address</label>
              <select
                onChange={(event) => {
                  const selected = savedAddresses.find((item) => String(item.id) === event.target.value);
                  if (!selected) return;
                  setFormValues((prev) => ({
                    ...prev,
                    firstName: selected.fullName?.split(' ')[0] || '',
                    lastName: selected.fullName?.split(' ').slice(1).join(' ') || '',
                    phone: selected.phone || '',
                    addressLine1: selected.addressLine1 || '',
                    addressLine2: selected.addressLine2 || '',
                    city: selected.city || '',
                    state: selected.state || '',
                    postalCode: selected.postalCode || '',
                    addressLabel: selected.label || '',
                  }));
                }}
                className="w-full border-b border-border-strong bg-background-elevated px-0 py-3 text-sm text-foreground-primary outline-none focus:border-accent-primary"
                defaultValue=""
              >
                <option value="">Select saved address</option>
                {savedAddresses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.fullName} - {item.city}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <CheckoutForm values={formValues} onChange={setFormValues} />

            <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
              <CheckoutSummary
                cartItems={cartItems}
                couponCode={couponCode}
                onCouponChange={setCouponCode}
                onApplyCoupon={handleApplyCoupon}
                couponError={couponState.error}
                couponLoading={couponState.loading}
                subtotal={subtotal}
                discount={discount}
                total={total}
              />

              {status.error ? (
                <div className="border border-[#f28b82]/30 bg-[#f28b82]/10 px-4 py-4 text-sm text-[#f28b82]">
                  {status.error}
                </div>
              ) : null}

              <Button onClick={handlePlaceOrder} className="w-full justify-center" disabled={status.loading}>
                {status.loading ? 'Creating Order...' : 'Place Order'}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
