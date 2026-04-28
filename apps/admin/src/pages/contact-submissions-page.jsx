import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import {
  fetchAdminContactSubmissions,
  updateAdminContactSubmission,
} from '../services/admin-contact-service';

function getWhatsAppHref(item, form = {}) {
  const phone = `${item.phone || ''}`.replace(/\D/g, '');

  if (!phone) {
    return '';
  }

  const adminMessage = (form.adminNotes ?? item.adminNotes ?? '').trim();
  const messageParts = [
    `Hi ${item.fullName || 'there'}, thanks for contacting Parsom.`,
    'We are reaching out about your contact request.',
  ];

  if (adminMessage) {
    messageParts.push(adminMessage);
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(messageParts.join('\n\n'))}`;
}

export default function ContactSubmissionsPage() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
  });

  const [state, setState] = useState({
    loading: true,
    error: '',
    items: [],
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    status: 'new',
    adminNotes: '',
  });

  const loadItems = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const items = await fetchAdminContactSubmissions(filters);
      setState({
        loading: false,
        error: '',
        items,
      });
    } catch (error) {
      setState({
        loading: false,
        error:
          error?.response?.data?.message || 'Unable to load contact submissions.',
        items: [],
      });
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    await loadItems();
  };

  const handleSave = async () => {
    try {
      await updateAdminContactSubmission(editingId, editForm);
      setEditingId(null);
      await loadItems();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.message || 'Unable to update submission.',
      }));
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
        <p className="text-xs uppercase  text-[#756c63]">
          Contact Requests
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          Contact Management
        </h2>
      </div>

      <form
        onSubmit={handleSearch}
        className="grid gap-4 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 md:grid-cols-3"
      >
        <input
          type="text"
          value={filters.search}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, search: event.target.value }))
          }
          placeholder="Search name, email, or phone"
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
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
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
            Loading contact submissions...
          </div>
        ) : state.items.length === 0 ? (
          <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 text-[#756c63]">
            No contact submissions found.
          </div>
        ) : (
          state.items.map((item) => {
            const activeForm = editingId === item.id ? editForm : {};
            const whatsappHref = getWhatsAppHref(item, activeForm);

            return (
              <article
                key={item.id}
                className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-5"
              >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase  text-[#756c63]">
                    {item.category}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[#171412]">
                    {item.fullName}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#756c63]">
                    {item.email}
                    <br />
                    {item.phone || '-'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {whatsappHref ? (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-[#1f8f4d]/20 bg-[#1f8f4d]/10 px-4 py-2 text-sm font-medium text-[#1f7a43] transition ease-in-out hover:-translate-y-0.5 hover:bg-[#1f8f4d]/15 hover:text-[#126734]"
                    >
                      <MessageCircle size={16} />
                      WhatsApp
                    </a>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditForm({
                        status: item.status,
                        adminNotes: item.adminNotes || '',
                      });
                    }}
                    className="rounded-full border border-[#171412]/10 px-4 py-2 text-sm text-[#574f48] transition ease-in-out hover:bg-[#171412]/5"
                  >
                    Manage
                  </button>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-[#756c63]">{item.message}</p>

              {editingId === item.id ? (
                <div className="mt-5 grid gap-4 rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] p-4">
                  <select
                    value={editForm.status}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        status: event.target.value,
                      }))
                    }
                    className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>

                  <textarea
                    rows={4}
                    value={editForm.adminNotes}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        adminNotes: event.target.value,
                      }))
                    }
                    placeholder="Admin notes"
                    className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
                  />

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSave}
                      className="rounded-full bg-[#171412] px-5 py-3 text-sm font-medium text-[#fffaf4] transition hover:bg-[#8f3d2f]"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-full border border-[#171412]/10 px-5 py-3 text-sm text-[#574f48] transition hover:bg-[#171412]/5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
