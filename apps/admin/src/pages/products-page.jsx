import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteAdminProduct,
  fetchAdminProducts,
} from '../services/admin-products-service';
import AdminMediaPreview from '../components/media/admin-media-preview';

export default function ProductsPage() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    categoryId: '',
  });

  const [state, setState] = useState({
    loading: true,
    error: '',
    items: [],
  });

  const loadProducts = async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: '',
    }));

    try {
      const items = await fetchAdminProducts(filters);

      setState({
        loading: false,
        error: '',
        items,
      });
    } catch (error) {
      setState({
        loading: false,
        error: error?.response?.data?.message || 'Unable to load products.',
        items: [],
      });
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (productId) => {
    const confirmed = window.confirm(
      'This will soft delete the product. Continue?'
    );

    if (!confirmed) return;

    try {
      await deleteAdminProduct(productId);
      await loadProducts();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.message || 'Unable to delete product.',
      }));
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    await loadProducts();
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase  text-[#756c63]">
            Products
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
            Product Management
          </h2>
        </div>

        <Link
          to="/products/new"
          className="inline-flex min-w-[150px] items-center justify-center rounded-full border border-[#8f3d2f] bg-[#8f3d2f] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(143,61,47,0.22)] transition hover:bg-[#171412]"
        >
          Add Product
        </Link>
      </div>

      <form
        onSubmit={handleSearch}
        className="grid gap-4 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl md:grid-cols-4"
      >
        <input
          type="text"
          value={filters.search}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, search: event.target.value }))
          }
          placeholder="Search name or slug"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none placeholder:text-[#756c63]/60"
        />

        <select
          value={filters.status}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, status: event.target.value }))
          }
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="coming_soon">Coming Soon</option>
        </select>

        <input
          type="number"
          value={filters.categoryId}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, categoryId: event.target.value }))
          }
          placeholder="Category ID"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none placeholder:text-[#756c63]/60"
        />

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
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Preview</th>
                <th className="px-5 py-4">Slug</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.loading ? (
                <tr>
                  <td className="px-5 py-5 text-[#756c63]" colSpan={7}>
                    Loading products...
                  </td>
                </tr>
              ) : state.items.length === 0 ? (
                <tr>
                  <td className="px-5 py-5 text-[#756c63]" colSpan={7}>
                    No products found.
                  </td>
                </tr>
              ) : (
                state.items.map((item) => (
                  <tr key={item.id} className="border-b border-[#171412]/5">
                    <td className="px-5 py-4 text-[#171412]">{item.name}</td>
                    <td className="px-5 py-4">
                      <AdminMediaPreview
                        media={{
                          url: item.primaryImage,
                          type: item.primaryMediaType,
                        }}
                        alt={item.name}
                        className="h-16 w-16"
                      />
                    </td>
                    <td className="px-5 py-4 text-[#756c63]">{item.slug}</td>
                    <td className="px-5 py-4 text-[#756c63]">{item.status}</td>
                    <td className="px-5 py-4 text-[#756c63]">{item.availableStock}</td>
                    <td className="px-5 py-4 text-[#756c63]">{item.categoryName || '-'}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-3">
                        <Link
                          to={`/products/${item.id}/edit`}
                          className="rounded-full border border-[#171412]/10 px-4 py-2 text-xs uppercase  text-[#574f48] transition hover:bg-[#171412]/5"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="rounded-full border border-[#171412]/10 px-4 py-2 text-xs uppercase  text-red-700 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
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
