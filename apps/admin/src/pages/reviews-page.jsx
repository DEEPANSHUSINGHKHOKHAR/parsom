import { useEffect, useState } from 'react';
import {
  fetchAdminReviews,
  updateAdminReviewPublishState,
  createAdminWebsiteReview,
  updateAdminWebsiteReview,
  deleteAdminReview,
} from '../services/admin-reviews-service';

const emptyReviewForm = {
  reviewerName: '',
  reviewerEmail: '',
  reviewerAvatarUrl: '',
  rating: 5,
  comment: '',
  source: 'outside',
  platform: 'WhatsApp',
  isPublished: true,
};

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
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewForm, setReviewForm] = useState(emptyReviewForm);

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

  const handleSaveWebsiteReview = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        ...reviewForm,
        rating: Number(reviewForm.rating),
        isPublished: Boolean(reviewForm.isPublished),
      };

      if (editingReviewId) {
        await updateAdminWebsiteReview(editingReviewId, payload);
      } else {
        await createAdminWebsiteReview(payload);
      }

      setEditingReviewId(null);
      setReviewForm(emptyReviewForm);
      await loadReviews();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.message || 'Unable to save website review.',
      }));
    }
  };

  const handleEditReview = (item) => {
    setEditingReviewId(item.id);
    setReviewForm({
      reviewerName: item.customerName || '',
      reviewerEmail: item.customerEmail || '',
      reviewerAvatarUrl: item.reviewerAvatarUrl || '',
      rating: Number(item.rating || 5),
      comment: item.comment || '',
      source: item.source || 'outside',
      platform: item.platform || '',
      isPublished: Boolean(item.isPublished),
    });
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
          Website Review Moderation
        </h2>
      </div>

      <form
        onSubmit={handleSaveWebsiteReview}
        className="grid gap-4 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-4 sm:p-6 md:grid-cols-2"
      >
        <input
          type="text"
          value={reviewForm.reviewerName}
          onChange={(event) =>
            setReviewForm((prev) => ({ ...prev, reviewerName: event.target.value }))
          }
          placeholder="Reviewer name"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        />
        <input
          type="email"
          value={reviewForm.reviewerEmail}
          onChange={(event) =>
            setReviewForm((prev) => ({ ...prev, reviewerEmail: event.target.value }))
          }
          placeholder="Reviewer email (optional)"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        />
        <input
          type="url"
          value={reviewForm.reviewerAvatarUrl}
          onChange={(event) =>
            setReviewForm((prev) => ({ ...prev, reviewerAvatarUrl: event.target.value }))
          }
          placeholder="Profile image URL (optional)"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        />
        <select
          value={reviewForm.platform}
          onChange={(event) =>
            setReviewForm((prev) => ({ ...prev, platform: event.target.value }))
          }
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        >
          <option value="WhatsApp">WhatsApp</option>
          <option value="Instagram">Instagram</option>
          <option value="Website">Website</option>
          <option value="Store">Store</option>
          <option value="Other">Other</option>
        </select>
        <select
          value={reviewForm.rating}
          onChange={(event) =>
            setReviewForm((prev) => ({ ...prev, rating: Number(event.target.value) }))
          }
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        >
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {rating} star{rating === 1 ? '' : 's'}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#574f48]">
          <input
            type="checkbox"
            checked={reviewForm.isPublished}
            onChange={(event) =>
              setReviewForm((prev) => ({ ...prev, isPublished: event.target.checked }))
            }
          />
          Show on homepage
        </label>
        <textarea
          rows={4}
          value={reviewForm.comment}
          onChange={(event) =>
            setReviewForm((prev) => ({ ...prev, comment: event.target.value }))
          }
          placeholder="Website review comment"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none md:col-span-2"
        />
        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button
            type="submit"
            className="w-full rounded-full border border-[#171412] bg-[#171412] px-5 py-3 text-sm text-white transition hover:bg-[#574f48] sm:w-auto"
          >
            {editingReviewId ? 'Replace Review' : 'Add Website Review'}
          </button>
          {editingReviewId ? (
            <button
              type="button"
              onClick={() => {
                setEditingReviewId(null);
                setReviewForm(emptyReviewForm);
              }}
              className="w-full rounded-full border border-[#171412]/10 px-5 py-3 text-sm text-[#574f48] transition hover:bg-[#171412]/5 hover:text-[#171412] sm:w-auto"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
      </form>

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
          placeholder="Search reviewer or comment"
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
                    {item.source === 'outside'
                      ? item.platform || 'Outside review'
                      : item.source === 'admin'
                        ? 'Admin added'
                        : 'Customer submitted'}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    {item.reviewerAvatarUrl ? (
                      <img
                        src={item.reviewerAvatarUrl}
                        alt={item.customerName}
                        className="h-11 w-11 rounded-full border border-[#171412]/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#171412]/10 bg-[#ede8df] text-sm font-semibold uppercase text-[#574f48]">
                        {String(item.customerName || 'R').slice(0, 1)}
                      </div>
                    )}
                    <h3 className="text-xl font-semibold text-[#171412]">
                      {item.customerName}
                    </h3>
                  </div>
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
                  onClick={() => handleEditReview(item)}
                  className="rounded-full border border-[#171412]/10 px-4 py-2 text-sm text-[#574f48] transition hover:bg-[#171412]/5"
                >
                  Edit / Replace
                </button>

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
