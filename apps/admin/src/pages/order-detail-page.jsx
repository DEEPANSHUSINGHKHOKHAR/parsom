import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  fetchAdminOrderByNumber,
  updateAdminOrderStatus,
} from '../services/admin-orders-service';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));

export default function OrderDetailPage() {
  const { orderNumber } = useParams();

  const [state, setState] = useState({
    loading: true,
    error: '',
    item: null,
  });

  const [form, setForm] = useState({
    status: 'pending',
    trackingCode: '',
    cancelReason: '',
  });

  const [saveStatus, setSaveStatus] = useState({
    loading: false,
    error: '',
  });

  const loadOrder = async () => {
    setState({
      loading: true,
      error: '',
      item: null,
    });

    try {
      const item = await fetchAdminOrderByNumber(orderNumber);

      setState({
        loading: false,
        error: '',
        item,
      });

      setForm({
        status: item?.status || 'pending',
        trackingCode: item?.trackingCode || '',
        cancelReason: item?.cancelReason || '',
      });
    } catch (error) {
      setState({
        loading: false,
        error: error?.response?.data?.message || 'Unable to load order.',
        item: null,
      });
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderNumber]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaveStatus({
      loading: true,
      error: '',
    });

    try {
      await updateAdminOrderStatus(orderNumber, form);
      await loadOrder();
    } catch (error) {
      setSaveStatus({
        loading: false,
        error: error?.response?.data?.message || 'Unable to update order.',
      });
      return;
    }

    setSaveStatus({
      loading: false,
      error: '',
    });
  };

  if (state.loading) {
    return (
      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-8">
        Loading order...
      </div>
    );
  }

  if (state.error || !state.item) {
    return (
      <div className="rounded-[8px] border border-red-500/20 bg-red-50 px-4 py-4 text-sm text-red-700">
        {state.error || 'Order not found.'}
      </div>
    );
  }

  const order = state.item;

  return (
    <section className="space-y-6">
      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl">
        <p className="text-xs uppercase  text-[#756c63]">
          Order Detail
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          {order.orderNumber}
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl">
            <h3 className="text-2xl font-semibold text-[#171412]">Customer</h3>
            <div className="mt-4 space-y-2 text-sm leading-7 text-[#756c63]">
              <p>
                {order.customer.firstName} {order.customer.lastName}
              </p>
              <p>{order.customer.email}</p>
              <p>{order.customer.phone}</p>
              <p>
                {order.customer.addressLine1}
                {order.customer.addressLine2 ? `, ${order.customer.addressLine2}` : ''}
                <br />
                {order.customer.city}, {order.customer.state} {order.customer.postalCode}
              </p>
            </div>
          </div>

          <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl">
            <h3 className="text-2xl font-semibold text-[#171412]">Items</h3>

            <div className="mt-5 space-y-4">
              {order.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-[#171412]">
                        {item.productName}
                      </h4>
                      <p className="mt-2 text-sm text-[#756c63]">
                        Size {item.size} · Qty {item.quantity}
                      </p>
                    </div>

                    <p className="text-lg font-semibold text-[#171412]">
                      {formatCurrency(item.lineTotal)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl">
            <h3 className="text-2xl font-semibold text-[#171412]">Summary</h3>

            <div className="mt-5 space-y-3 text-sm text-[#756c63]">
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span>{order.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment</span>
                <span>{order.paymentStatus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Discount</span>
                <span>{formatCurrency(order.discountAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-semibold text-[#171412]">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl"
          >
            <h3 className="text-2xl font-semibold text-[#171412]">Update Status</h3>

            <select
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, status: event.target.value }))
              }
              className="w-full rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <input
              type="text"
              value={form.trackingCode}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, trackingCode: event.target.value }))
              }
              placeholder="Tracking code"
              className="w-full rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />

            <textarea
              rows={4}
              value={form.cancelReason}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, cancelReason: event.target.value }))
              }
              placeholder="Cancel reason"
              className="w-full rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />

            {saveStatus.error ? (
              <p className="text-sm text-red-400">{saveStatus.error}</p>
            ) : null}

            <button
              type="submit"
              disabled={saveStatus.loading}
              className="w-full rounded-full bg-[#171412] px-6 py-3 text-sm font-medium text-[#fffaf4] transition hover:bg-[#8f3d2f] disabled:opacity-60"
            >
              {saveStatus.loading ? 'Updating...' : 'Update Order'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}