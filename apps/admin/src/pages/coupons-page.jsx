import { useEffect, useState } from 'react';
import {
  fetchAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
} from '../services/admin-coupons-service';

const initialForm = {
  code: '',
  discountType: 'percent',
  discountValue: '',
  minimumOrderAmount: '',
  maximumDiscountAmount: '',
  usageLimit: '',
  perUserLimit: '',
  startsAt: '',
  endsAt: '',
  isActive: true,
};

export default function CouponsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({
    loading: true,
    saving: false,
    error: '',
  });

  const loadCoupons = async () => {
    setStatus((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const data = await fetchAdminCoupons();
      setItems(data);
      setStatus((prev) => ({ ...prev, loading: false, error: '' }));
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        loading: false,
        error: error?.response?.data?.message || 'Unable to load coupons.',
      }));
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const buildPayload = () => ({
    code: form.code,
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    minimumOrderAmount:
      form.minimumOrderAmount === '' ? undefined : Number(form.minimumOrderAmount),
    maximumDiscountAmount:
      form.maximumDiscountAmount === ''
        ? undefined
        : Number(form.maximumDiscountAmount),
    usageLimit: form.usageLimit === '' ? undefined : Number(form.usageLimit),
    perUserLimit: form.perUserLimit === '' ? undefined : Number(form.perUserLimit),
    startsAt: form.startsAt || undefined,
    endsAt: form.endsAt || undefined,
    isActive: Boolean(form.isActive),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus((prev) => ({ ...prev, saving: true, error: '' }));

    try {
      const payload = buildPayload();

      if (editingId) {
        await updateAdminCoupon(editingId, payload);
      } else {
        await createAdminCoupon(payload);
      }

      resetForm();
      await loadCoupons();
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        saving: false,
        error: error?.response?.data?.message || 'Unable to save coupon.',
      }));
      return;
    }

    setStatus((prev) => ({ ...prev, saving: false, error: '' }));
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      code: item.code || '',
      discountType: item.discountType || 'percent',
      discountValue: item.discountValue ?? '',
      minimumOrderAmount: item.minimumOrderAmount ?? '',
      maximumDiscountAmount: item.maximumDiscountAmount ?? '',
      usageLimit: item.usageLimit ?? '',
      perUserLimit: item.perUserLimit ?? '',
      startsAt: item.startsAt ? String(item.startsAt).slice(0, 16) : '',
      endsAt: item.endsAt ? String(item.endsAt).slice(0, 16) : '',
      isActive: item.isActive,
    });
  };

  const handleDelete = async (couponId) => {
    const confirmed = window.confirm('Delete this coupon?');
    if (!confirmed) return;

    try {
      await deleteAdminCoupon(couponId);
      await loadCoupons();
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        error: error?.response?.data?.message || 'Unable to delete coupon.',
      }));
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
        <p className="text-xs uppercase  text-[#756c63]">
          Coupons
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          Coupon Management
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 md:grid-cols-3"
      >
        <input
          type="text"
          value={form.code}
          onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
          placeholder="Coupon code"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        />
        <select
          value={form.discountType}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, discountType: event.target.value }))
          }
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        >
          <option value="percent">Percent</option>
          <option value="fixed">Fixed</option>
        </select>
        <input
          type="number"
          value={form.discountValue}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, discountValue: event.target.value }))
          }
          placeholder="Discount value"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        />
        <input
          type="number"
          value={form.minimumOrderAmount}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, minimumOrderAmount: event.target.value }))
          }
          placeholder="Minimum order amount"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        />
        <input
          type="number"
          value={form.maximumDiscountAmount}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              maximumDiscountAmount: event.target.value,
            }))
          }
          placeholder="Maximum discount amount"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        />
        <input
          type="number"
          value={form.usageLimit}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, usageLimit: event.target.value }))
          }
          placeholder="Usage limit"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        />
        <input
          type="number"
          value={form.perUserLimit}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, perUserLimit: event.target.value }))
          }
          placeholder="Per-user limit"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        />
        <input
          type="datetime-local"
          value={form.startsAt}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, startsAt: event.target.value }))
          }
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        />
        <input
          type="datetime-local"
          value={form.endsAt}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, endsAt: event.target.value }))
          }
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        />

        <label className="flex items-center gap-2 text-sm text-[#574f48]">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, isActive: event.target.checked }))
            }
          />
          Active
        </label>

        <div className="md:col-span-3 flex gap-3">
          <button
            type="submit"
            disabled={status.saving}
            className="rounded-full bg-[#171412] px-5 py-3 text-sm font-medium text-[#fffaf4] transition hover:bg-[#8f3d2f]"
          >
            {status.saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </button>

          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-[#171412]/10 px-5 py-3 text-sm text-[#574f48] transition hover:bg-[#171412]/5"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {status.error ? (
        <div className="rounded-[8px] border border-red-500/20 bg-red-50 px-4 py-4 text-sm text-red-700">
          {status.error}
        </div>
      ) : null}

      <div className="space-y-4">
        {status.loading ? (
          <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
            Loading coupons...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 text-[#756c63]">
            No coupons found.
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-5"
            >
              <div>
                <h3 className="text-xl font-semibold text-[#171412]">{item.code}</h3>
                <p className="mt-2 text-sm text-[#756c63]">
                  {item.discountType} · {item.discountValue}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleEdit(item)}
                  className="rounded-full border border-[#171412]/10 px-4 py-2 text-sm text-[#574f48] transition hover:bg-[#171412]/5"
                >
                  Edit
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