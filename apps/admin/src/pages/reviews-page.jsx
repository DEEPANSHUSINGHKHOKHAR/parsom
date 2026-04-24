import { useEffect, useState } from 'react';
import {
  fetchAdminReviews,
  updateAdminReviewPublishState,
  deleteAdminReview,
} from '../services/admin-reviews-service';

export default function ReviewsPage() {
  const [filters, setFilters] = useState({
    search: '',
    isPublished: '',
  });

  const [state, setState] = useState({
    loading: true,
    error: '',
    items: [],
  });

  const loadReviews = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const items = await fetchAdminReviews(filters);
      setState({
        loading: false,
        error: '',
        items,
      });
    } catch (error) {
      setState({
        loading: false,
        error: error?.response?.data?.message || 'Unable to load reviews.',
        items: [],
      });
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    await loadReviews();
  };

  const handleTogglePublish = async (reviewId, nextValue) => {
    try {
      await updateAdminReviewPublishState(reviewId, {
        isPublished: nextValue,
      });
      await loadReviews();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error?.response?.data?.message || 'Unable to update review state.',
      }));
    }
  };

  const handleDelete = async (reviewId) => {
    const confirmed = window.confirm('Delete this review?');
    if (!confirmed) return;

    try {
      await deleteAdminReview(reviewId);
      await loadReviews();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.message || 'Unable to delete review.',
      }));
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
        <p className="text-xs uppercase  text-[#756c63]">
          Reviews
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          Review Moderation
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
          placeholder="Search product or customer"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        />

        <select
          value={filters.isPublished}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, isPublished: event.target.value }))
          }
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        >
          <option value="">All</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
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
            Loading reviews...
          </div>
        ) : state.items.length === 0 ? (
          <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 text-[#756c63]">
            No reviews found.
          </div>
        ) : (
          state.items.map((item) => (
            <article
              key={item.id}
              className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase  text-[#756c63]">
                    {item.product?.name}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[#171412]">
                    {item.customerName}
                  </h3>
                  <p className="mt-2 text-sm text-[#756c63]">{item.customerEmail}</p>
                </div>

                <div className="text-right">
                  <p className="text-[#171412]">{item.rating}/5</p>
                  <p className="mt-2 text-sm text-[#756c63]">
                    {item.isPublished ? 'Published' : 'Hidden'}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-[#756c63]">{item.comment}</p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(item.id, !item.isPublished)}
                  className="rounded-full border border-[#171412]/10 px-4 py-2 text-sm text-[#574f48] transition hover:bg-[#171412]/5"
                >
                  {item.isPublished ? 'Unpublish' : 'Publish'}
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="rounded-full border border-[#171412]/10 px-4 py-2 text-sm text-red-700 transition hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}