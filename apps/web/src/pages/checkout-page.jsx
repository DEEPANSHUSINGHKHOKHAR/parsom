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
import { createOrder, verifyOrderPayment } from '../services/orders-service';

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

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById('razorpay-checkout-js');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function getRazorpayImageUrl() {
  if (window.location.protocol === 'https:') {
    return new URL('/favicon.svg', window.location.origin).href;
  }

  return siteConfig.defaultSeoImage;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const actor = useAuthStore((state) => state.actor);
  const cartItems = useCartStore((state) => state.cartItems);
  const clearCart = useCartStore((state) => state.clearCart);

  const [formValues, setFormValues] = useState(initialCheckoutValues);
  const [couponCode, setCouponCode] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('parsom-checkout-coupon') || '{}')?.code || '';
    } catch {
      return '';
    }
  });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [couponState, setCouponState] = useState({ loading: false, error: '', applied: null });
  const [status, setStatus] = useState({ loading: false, error: '' });
  const [agreements, setAgreements] = useState({
    termsAccepted: false,
    returnPolicyAccepted: false,
  });

  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0),
    [cartItems]
  );
  const itemCount = useMemo(
    () => cartItems.reduce((totalItems, item) => totalItems + Number(item.quantity), 0),
    [cartItems]
  );

  const discount = couponState.applied?.discountAmount || 0;
  const total = couponState.applied?.totalAfterDiscount ?? subtotal;
  const selectedSavedAddress = savedAddresses.find(
    (item) => String(item.id) === String(selectedAddressId)
  );

  useEffect(() => {
    if (!actor) return;

    setFormValues((prev) => ({
      ...prev,
      firstName: prev.firstName || actor.firstName || '',
      lastName: prev.lastName || actor.lastName || '',
      email: prev.email || actor.email || '',
      phone: prev.phone || actor.phone || '',
    }));
  }, [actor]);

  useEffect(() => {
    let ignore = false;
    const loadAddresses = async () => {
      if (!token) return;
      try {
        const data = await fetchMyAddresses();
        if (ignore) return;
        setSavedAddresses(data);
        const defaultAddress = data.find((item) => item.isDefault) || data[0];

        if (defaultAddress) {
          setSelectedAddressId(String(defaultAddress.id));
          setFormValues((prev) => ({
            ...prev,
            firstName: prev.firstName || defaultAddress.fullName?.split(' ')[0] || '',
            lastName:
              prev.lastName || defaultAddress.fullName?.split(' ').slice(1).join(' ') || '',
            phone: prev.phone || defaultAddress.phone || '',
            addressLine1: prev.addressLine1 || defaultAddress.addressLine1 || '',
            addressLine2: prev.addressLine2 || defaultAddress.addressLine2 || '',
            city: prev.city || defaultAddress.city || '',
            state: prev.state || defaultAddress.state || '',
            postalCode: prev.postalCode || defaultAddress.postalCode || '',
            addressLabel: prev.addressLabel || defaultAddress.label || '',
          }));
        }
      } catch {
        // optional
      }
    };
    loadAddresses();
    return () => {
      ignore = true;
    };
  }, [token]);

  useEffect(() => {
    if (!couponCode) return;

    try {
      const storedCoupon = JSON.parse(
        sessionStorage.getItem('parsom-checkout-coupon') || '{}'
      );

      if (
        storedCoupon?.code &&
        storedCoupon.code.toUpperCase() === couponCode.trim().toUpperCase() &&
        Number(storedCoupon.subtotal) === Number(subtotal)
      ) {
        setCouponState({
          loading: false,
          error: '',
          applied: storedCoupon,
        });
      }
    } catch {
      // optional
    }
  }, [couponCode, subtotal]);

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
    if (!agreements.termsAccepted || !agreements.returnPolicyAccepted) {
      setStatus({
        loading: false,
        error: 'Please accept the Return Policy and Terms & Conditions before payment.',
      });
      return;
    }

    setStatus({ loading: true, error: '' });
    try {
      await loadRazorpayScript();

      const orderResponse = await createOrder({
        customer: formValues,
        couponCode: couponCode || undefined,
        agreements,
        items: cartItems.map((item) => ({
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
        })),
      });

      const razorpay = orderResponse.razorpay;

      if (!razorpay?.keyId || !razorpay?.orderId) {
        throw new Error('Payment could not be initialized.');
      }

      const paymentResult = await new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: razorpay.keyId,
          amount: razorpay.amount,
          currency: razorpay.currency || 'INR',
          name: siteConfig.brandName,
          description: `Order ${orderResponse.orderNumber}`,
          image: getRazorpayImageUrl(),
          order_id: razorpay.orderId,
          prefill: {
            name: `${formValues.firstName} ${formValues.lastName}`.trim(),
            email: formValues.email,
            contact: formValues.phone,
          },
          notes: {
            orderNumber: orderResponse.orderNumber,
          },
          theme: {
            color: '#8f3d2f',
          },
          handler: async (response) => {
            try {
              const verifiedPayment = await verifyOrderPayment({
                orderNumber: orderResponse.orderNumber,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              resolve(verifiedPayment);
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment was cancelled.')),
          },
          retry: {
            enabled: true,
            max_count: 3,
          },
        });

        checkout.on('payment.failed', (response) => {
          reject(new Error(response?.error?.description || 'Payment failed.'));
        });

        checkout.open();
      });

      sessionStorage.setItem(
        'parsom-last-order',
        JSON.stringify({
          order: {
            ...orderResponse,
            ...paymentResult,
          },
          customer: formValues,
          items: cartItems,
          couponCode,
          createdAt: new Date().toISOString(),
        })
      );

      sessionStorage.removeItem('parsom-checkout-coupon');
      clearCart();
      navigate('/thank-you');
    } catch (error) {
      setStatus({
        loading: false,
        error:
          error?.response?.data?.message ||
          error?.message ||
          'Unable to complete payment.',
      });
      return;
    }
    setStatus({ loading: false, error: '' });
  };

  if (cartItems.length === 0) {
    return (
      <PageShell tone="light">
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-8">
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
    <PageShell tone="light">
      <section className="min-h-screen bg-[#f6f3ee] pb-32 pt-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {savedAddresses.length > 0 ? (
            <div className="mb-6 rounded-[8px] border border-[#ded5ca] bg-[#fffaf4] p-5 shadow-[0_16px_34px_rgba(23,20,18,0.06)]">
              <label className="mb-2 block text-label text-[#756c63]">Saved Address</label>
              <select
                onChange={(event) => {
                  const selected = savedAddresses.find((item) => String(item.id) === event.target.value);
                  if (!selected) {
                    setSelectedAddressId('');
                    return;
                  }
                  setSelectedAddressId(String(selected.id));
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
                className="w-full border-b border-[#cfc5b8] bg-[#fffaf4] px-0 py-3 text-sm text-[#171412] outline-none focus:border-[#8f3d2f]"
                value={selectedAddressId}
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
            <div className="order-2 lg:order-1">
              {selectedSavedAddress ? (
                <div className="rounded-[8px] border border-[#ded5ca] bg-[#fffaf4] p-6 shadow-[0_16px_34px_rgba(23,20,18,0.06)] md:p-8">
                  <p className="text-label text-[#8f3d2f]">Delivery Address</p>
                  <h1 className="mt-3 text-display-3 text-[#171412]">
                    Saved Address Selected
                  </h1>
                  <div className="mt-5 rounded-[8px] border border-[#ded5ca] bg-[#f6f3ee] p-4 text-sm leading-6 text-[#574f48]">
                    <p className="font-semibold text-[#171412]">
                      {selectedSavedAddress.fullName}
                    </p>
                    <p>
                      {selectedSavedAddress.addressLine1}
                      {selectedSavedAddress.addressLine2
                        ? `, ${selectedSavedAddress.addressLine2}`
                        : ''}
                    </p>
                    <p>
                      {selectedSavedAddress.city}, {selectedSavedAddress.state}{' '}
                      {selectedSavedAddress.postalCode}
                    </p>
                    <p>{selectedSavedAddress.phone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAddressId('')}
                    className="mt-5 rounded-full border border-[#171412]/15 px-5 py-3 text-sm font-semibold text-[#574f48] transition hover:bg-[#171412] hover:text-[#fffaf4]"
                  >
                    Enter New Address
                  </button>
                </div>
              ) : (
                <CheckoutForm values={formValues} onChange={setFormValues} />
              )}
            </div>

            <div className="order-1 space-y-6 lg:order-2 lg:sticky lg:top-28 lg:self-start">
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

              <div className="rounded-[8px] border border-[#ded5ca] bg-[#fffaf4] p-4 text-sm text-[#574f48]">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={agreements.returnPolicyAccepted}
                    onChange={(event) =>
                      setAgreements((prev) => ({
                        ...prev,
                        returnPolicyAccepted: event.target.checked,
                      }))
                    }
                    className="mt-1"
                  />
                  <span>
                    I agree to the <Link to="/returns" className="font-semibold text-[#8f3d2f]">Return Policy</Link>.
                  </span>
                </label>
                <label className="mt-3 flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={agreements.termsAccepted}
                    onChange={(event) =>
                      setAgreements((prev) => ({
                        ...prev,
                        termsAccepted: event.target.checked,
                      }))
                    }
                    className="mt-1"
                  />
                  <span>
                    I agree to the <Link to="/terms" className="font-semibold text-[#8f3d2f]">Terms & Conditions</Link>.
                  </span>
                </label>
              </div>

              {status.error ? (
                <div className="rounded-[8px] border border-[#a33a2a]/20 bg-[#a33a2a]/10 px-4 py-4 text-sm text-[#a33a2a]">
                  {status.error}
                </div>
              ) : null}

              <Button
                onClick={handlePlaceOrder}
                className="hidden w-full justify-center bg-[#171412] text-[#fffaf4] hover:bg-[#8f3d2f] lg:inline-flex"
                disabled={status.loading || !agreements.termsAccepted || !agreements.returnPolicyAccepted}
              >
                {status.loading ? 'Opening Payment...' : 'Pay Securely'}
              </Button>
            </div>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ded5ca] bg-[#fffaf4] px-4 py-3 shadow-[0_-14px_35px_rgba(23,20,18,0.14)] lg:hidden">
          <div className="mx-auto grid max-w-xl grid-cols-[minmax(0,1fr)_minmax(150px,auto)] items-center gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-[#756c63]">
                {itemCount} item{itemCount === 1 ? '' : 's'} in order
              </p>
              <p className="mt-1 text-xl font-semibold text-[#171412]">
                {formatCurrency(total)}
              </p>
            </div>
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={status.loading || !agreements.termsAccepted || !agreements.returnPolicyAccepted}
              className="min-h-12 rounded-full bg-[#171412] px-5 text-sm font-semibold uppercase tracking-[0.12em] text-[#fffaf4] transition hover:bg-[#8f3d2f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status.loading ? 'Opening...' : 'Pay Securely'}
            </button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
