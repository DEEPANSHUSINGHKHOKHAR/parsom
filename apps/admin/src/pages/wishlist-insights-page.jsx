import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { fetchAdminWishlistInsights } from '../services/admin-wishlist-service';
import AdminMediaPreview from '../components/media/admin-media-preview';

function getWhatsAppHref(item) {
  const phone = `${item.customerPhone || ''}`.replace(/\D/g, '');

  if (!phone) {
    return '';
  }

  const messageParts = [
    `Hi ${item.customerName || 'there'}, this is Parsom.`,
    `We noticed you saved ${item.product?.name || 'one of our products'} to your wishlist.`,
    'Would you like any help with size, availability, or placing the order?',
  ];

  return `https://wa.me/${phone}?text=${encodeURIComponent(messageParts.join('\n\n'))}`;
}

export default function WishlistInsightsPage() {
  const [search, setSearch] = useState('');
  const [state, setState] = useState({
    loading: true,
    error: '',
    items: [],
  });

  const loadItems = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const items = await fetchAdminWishlistInsights({ search });
      setState({
        loading: false,
        error: '',
        items,
      });
    } catch (error) {
      setState({
        loading: false,
        error:
          error?.response?.data?.message || 'Unable to load wishlist insights.',
        items: [],
      });
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
        <p className="text-xs uppercase  text-[#756c63]">
          Wishlist Insights
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          Saved Product Tracking
        </h2>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          loadItems();
        }}
        className="grid gap-4 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 md:grid-cols-[1fr_auto]"
      >
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search product or customer"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        />

        <button
          type="submit"
          className="rounded-full border border-[#171412]/10 px-5 py-3 text-sm text-[#574f48] transition hover:bg-[#171412]/5 hover:text-[#171412]"
        >
          Search
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
            Loading wishlist insights...
          </div>
        ) : state.items.length === 0 ? (
          <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 text-[#756c63]">
            No wishlist insights found.
          </div>
        ) : (
          state.items.map((item) => {
            const whatsappHref = getWhatsAppHref(item);

            return (
              <article
                key={item.id}
                className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <AdminMediaPreview
                      media={item.product?.primaryImage}
                      alt={item.product?.name || 'Wishlist product'}
                      className="h-20 w-16 shrink-0"
                      fit="cover"
                    />
                    <div className="min-w-0">
                      <p className="text-xs uppercase  text-[#756c63]">
                        {item.product?.name}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[#171412]">
                        {item.customerName}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[#756c63]">
                        {item.customerEmail}
                        <br />
                        {item.customerPhone || '-'}
                      </p>
                    </div>
                  </div>

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
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
