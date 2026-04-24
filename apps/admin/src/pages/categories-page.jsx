import { useEffect, useState } from 'react';
import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '../services/admin-categories-service';

const initialForm = {
  name: '',
  slug: '',
  isActive: true,
};

export default function CategoriesPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({
    loading: true,
    saving: false,
    error: '',
  });

  const loadCategories = async () => {
    setStatus((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const data = await fetchAdminCategories();
      setItems(data);
      setStatus((prev) => ({ ...prev, loading: false, error: '' }));
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        loading: false,
        error: error?.response?.data?.message || 'Unable to load categories.',
      }));
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus((prev) => ({ ...prev, saving: true, error: '' }));

    try {
      if (editingId) {
        await updateAdminCategory(editingId, form);
      } else {
        await createAdminCategory(form);
      }

      resetForm();
      await loadCategories();
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        saving: false,
        error: error?.response?.data?.message || 'Unable to save category.',
      }));
      return;
    }

    setStatus((prev) => ({ ...prev, saving: false, error: '' }));
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      slug: item.slug,
      isActive: item.isActive,
    });
  };

  const handleDelete = async (categoryId) => {
    const confirmed = window.confirm('Delete this category?');
    if (!confirmed) return;

    try {
      await deleteAdminCategory(categoryId);
      await loadCategories();
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        error: error?.response?.data?.message || 'Unable to delete category.',
      }));
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
        <p className="text-xs uppercase  text-[#756c63]">
          Categories
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          Category Management
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 md:grid-cols-4"
      >
        <input
          type="text"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Category name"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        />
        <input
          type="text"
          value={form.slug}
          onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
          placeholder="Slug"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        />
        <label className="flex items-center gap-2 text-sm text-[#574f48]">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
          />
          Active
        </label>

        <div className="flex gap-3">
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
            Loading categories...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 text-[#756c63]">
            No categories found.
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-5"
            >
              <div>
                <h3 className="text-xl font-semibold text-[#171412]">{item.name}</h3>
                <p className="mt-2 text-sm text-[#756c63]">{item.slug}</p>
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