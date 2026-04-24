import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminOrders } from '../services/admin-orders-service';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));

export default function OrdersPage() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
  });

  const [state, setState] = useState({
    loading: true,
    error: '',
    items: [],
  });

  const loadOrders = async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: '',
    }));

    try {
      const items = await fetchAdminOrders(filters);

      setState({
        loading: false,
        error: '',
        items,
      });
    } catch (error) {
      setState({
        loading: false,
        error: error?.response?.data?.message || 'Unable to load orders.',
        items: [],
      });
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    await loadOrders();
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl">
        <p className="text-xs uppercase  text-[#756c63]">
          Orders
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          Order Management
        </h2>
      </div>

      <form
        onSubmit={handleSearch}
        className="grid gap-4 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl md:grid-cols-3"
      >
        <input
          type="text"
          value={filters.search}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, search: event.target.value }))
          }
          placeholder="Search order number, email, or phone"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        />

        <select
          value={filters.status}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, status: event.target.value }))
          }
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button
          type="submit"
          className="rounded-full border border-[#171412]/10 px-5 py-3 text-sm text-[#574f48] transition hover:bg-[#171412]/5 hover:text-[#171412]"
        >
          Apply Filters
        </button>
      </form>

      {state.error ? (
        <div className="rounded-[8px] border border-red-500/20 bg-red-50 px-4 py-4 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#171412]/10 bg-[#f6f3ee] text-[#756c63]">
              <tr>
                <th className="px-5 py-4">Order</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Items</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.loading ? (
                <tr>
                  <td className="px-5 py-5 text-[#756c63]" colSpan={6}>
                    Loading orders...
                  </td>
                </tr>
              ) : state.items.length === 0 ? (
                <tr>
                  <td className="px-5 py-5 text-[#756c63]" colSpan={6}>
                    No orders found.
                  </td>
                </tr>
              ) : (
                state.items.map((item) => (
                  <tr key={item.orderNumber} className="border-b border-[#171412]/5">
                    <td className="px-5 py-4 text-[#171412]">{item.orderNumber}</td>
                    <td className="px-5 py-4 text-[#756c63]">{item.customerName}</td>
                    <td className="px-5 py-4 text-[#756c63]">{item.status}</td>
                    <td className="px-5 py-4 text-[#756c63]">{item.itemsCount}</td>
                    <td className="px-5 py-4 text-[#756c63]">
                      {formatCurrency(item.totalAmount)}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/orders/${item.orderNumber}`}
                        className="rounded-full border border-[#171412]/10 px-4 py-2 text-xs uppercase  text-[#574f48] transition hover:bg-[#171412]/5"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}