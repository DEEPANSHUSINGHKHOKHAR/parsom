import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import PageShell from '../components/layout/page-shell';
import Button from '../components/ui/button';
import EmptyState from '../components/ui/empty-state';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));

export default function ThankYouPage() {
  const [orderSnapshot, setOrderSnapshot] = useState(null);

  useEffect(() => {
    const rawValue = sessionStorage.getItem('parsom-last-order');
    if (rawValue) {
      try {
        setOrderSnapshot(JSON.parse(rawValue));
      } catch {
        setOrderSnapshot(null);
      }
    }
  }, []);

  if (!orderSnapshot?.order) {
    return (
      <PageShell>
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
          <EmptyState
            title="No recent order found"
            description="Complete checkout first to see your order confirmation."
            action={<Button as={Link} to="/collection">Continue Shopping</Button>}
          />
        </section>
      </PageShell>
    );
  }

  const { order, customer, items } = orderSnapshot;

  return (
    <PageShell>
      <section className="bg-background-base pb-24 pt-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="border border-border-soft bg-background-elevated p-8 text-center md:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#8fae8b]/40 bg-[#8fae8b]/10">
              <CheckCircle2 className="text-[#8fae8b]" size={40} />
            </div>
            <p className="mt-8 text-label text-accent-primary">Order Confirmed</p>
            <h1 className="mt-4 text-display-2 text-foreground-primary">
              Thank You, {customer?.firstName || 'Customer'}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-body text-foreground-secondary">
              Your order has been created successfully and your WhatsApp confirmation flow has been prepared.
            </p>

            <div className="mt-10 grid gap-4 border border-border-soft bg-background-panel p-6 text-left">
              <div className="flex items-center justify-between text-sm text-foreground-secondary">
                <span>Order Number</span>
                <span>{order.orderNumber}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-foreground-secondary">
                <span>Status</span>
                <span>{order.status}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-foreground-secondary">
                <span>Total Items</span>
                <span>{items?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-foreground-secondary">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-foreground-secondary">
                <span>Email</span>
                <span>{customer?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-foreground-secondary">
                <span>Phone</span>
                <span>{customer?.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button as={Link} to="/collection">Continue Shopping</Button>
              <Button as={Link} to="/account" variant="secondary">Go To Account</Button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
