import { useEffect, useState } from 'react';
import {
  fetchAdminReturnRequests,
  updateAdminReturnRequest,
} from '../services/admin-returns-service';

export default function ReturnRequestsPage() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
  });
  const [state, setState] = useState({
    loading: true,
    error: '',
    items: [],
  });
  const [drafts, setDrafts] = useState({});

  const loadRequests = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const items = await fetchAdminReturnRequests(filters);
      setState({
        loading: false,
        error: '',
        items,
      });
      setDrafts(
        Object.fromEntries(
          items.map((item) => [
            item.id,
            { status: item.status, adminNotes: item.adminNotes || '' },
          ])
        )
      );
    } catch (error) {
      setState({
        loading: false,
        error: error?.response?.data?.message || 'Unable to load return requests.',
        items: [],
      });
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await loadRequests();
  };

  const handleSave = async (itemId) => {
    try {
      await updateAdminReturnRequest(itemId, drafts[itemId]);
      await loadRequests();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.message || 'Unable to update return request.',
      }));
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
        <p className="text-xs uppercase text-[#756c63]">Returns</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          Return Requests
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 md:grid-cols-3"
      >
        <input
          type="text"
          value={filters.search}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, search: event.target.value }))
          }
          placeholder="Search order, product, or email"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        />
        <select
          value={filters.status}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, status: event.target.value }))
          }
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
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

      <div className="space-y-4">
        {state.loading ? (
          <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
            Loading return requests...
          </div>
        ) : state.items.length === 0 ? (
          <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 text-[#756c63]">
            No return requests found.
          </div>
        ) : (
          state.items.map((item) => (
            <article
              key={item.id}
              className="space-y-4 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-[#756c63]">{item.orderNumber}</p>
                  <h3 className="mt-2 text-xl font-semibold text-[#171412]">
                    {item.productName}
                  </h3>
                  <p className="mt-2 text-sm text-[#756c63]">
                    {item.customerName} / {item.customerEmail} / Size {item.size}
                  </p>
                </div>
                <span className="rounded-full border border-[#171412]/10 px-4 py-2 text-xs uppercase text-[#574f48]">
                  {item.status}
                </span>
              </div>

              <div className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] p-4 text-sm leading-7 text-[#574f48]">
                {item.reason}
              </div>

              <div className="grid gap-4 md:grid-cols-[200px_1fr_auto]">
                <select
                  value={drafts[item.id]?.status || item.status}
                  onChange={(event) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [item.id]: {
                        ...prev[item.id],
                        status: event.target.value,
                      },
                    }))
                  }
                  className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
                <textarea
                  rows={3}
                  value={drafts[item.id]?.adminNotes || ''}
                  onChange={(event) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [item.id]: {
                        ...prev[item.id],
                        adminNotes: event.target.value,
                      },
                    }))
                  }
                  placeholder="Admin notes"
                  className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSave(item.id)}
                  className="rounded-full bg-[#171412] px-5 py-3 text-sm font-medium text-[#fffaf4] transition hover:bg-[#8f3d2f]"
                >
                  Save
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
