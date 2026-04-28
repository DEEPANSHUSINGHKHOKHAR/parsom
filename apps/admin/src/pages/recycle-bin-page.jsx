import { useEffect, useState } from 'react';
import AdminMediaPreview from '../components/media/admin-media-preview';
import {
  fetchDeletedAdminProducts,
  permanentlyDeleteAdminProduct,
  restoreAdminProduct,
} from '../services/admin-products-service';
import {
  fetchDeletedAdminCoupons,
  permanentlyDeleteAdminCoupon,
  restoreAdminCoupon,
} from '../services/admin-coupons-service';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function RecycleBinPage() {
  const [state, setState] = useState({
    loading: true,
    error: '',
    products: [],
    coupons: [],
  });

  const loadDeletedItems = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const [products, coupons] = await Promise.all([
        fetchDeletedAdminProducts(),
        fetchDeletedAdminCoupons(),
      ]);

      setState({
        loading: false,
        error: '',
        products,
        coupons,
      });
    } catch (error) {
      setState({
        loading: false,
        error: error?.response?.data?.message || 'Unable to load deleted items.',
        products: [],
        coupons: [],
      });
    }
  };

  useEffect(() => {
    loadDeletedItems();
  }, []);

  const runAction = async (action, fallbackMessage) => {
    try {
      await action();
      await loadDeletedItems();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.message || fallbackMessage,
      }));
    }
  };

  const permanentlyDeleteProduct = (product) => {
    const confirmed = window.confirm(
      `Permanently delete ${product.name}? This cannot be undone.`
    );
    if (!confirmed) return;

    runAction(
      () => permanentlyDeleteAdminProduct(product.id),
      'Unable to permanently delete product.'
    );
  };

  const permanentlyDeleteCoupon = (coupon) => {
    const confirmed = window.confirm(
      `Permanently delete coupon ${coupon.code}? This cannot be undone.`
    );
    if (!confirmed) return;

    runAction(
      () => permanentlyDeleteAdminCoupon(coupon.id),
      'Unable to permanently delete coupon.'
    );
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
        <p className="text-xs uppercase text-[#756c63]">Recovery</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          Recycle Bin
        </h2>
        <p className="mt-2 text-sm text-[#756c63]">
          Restore soft-deleted products and coupons, or permanently remove items
          that are not tied to order history.
        </p>
      </div>

      {state.error ? (
        <div className="rounded-[8px] border border-red-500/20 bg-red-50 px-4 py-4 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
        <h3 className="text-2xl font-semibold text-[#171412]">Deleted Products</h3>
        <div className="mt-5 space-y-3">
          {state.loading ? (
            <p className="text-sm text-[#756c63]">Loading deleted products...</p>
          ) : state.products.length === 0 ? (
            <p className="text-sm text-[#756c63]">No deleted products.</p>
          ) : (
            state.products.map((product) => (
              <article
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] p-4"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <AdminMediaPreview
                    media={{
                      url: product.primaryImage,
                      type: product.primaryMediaType,
                    }}
                    alt={product.name}
                    className="h-16 w-16"
                  />
                  <div className="min-w-0">
                    <h4 className="truncate font-semibold text-[#171412]">
                      {product.name}
                    </h4>
                    <p className="mt-1 text-sm text-[#756c63]">
                      {product.slug} / {product.categoryName || 'No category'}
                    </p>
                    <p className="mt-1 text-sm text-[#756c63]">
                      {product.orderItemCount} order references
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      runAction(
                        () => restoreAdminProduct(product.id),
                        'Unable to restore product.'
                      )
                    }
                    className="rounded-full border border-[#171412]/10 px-4 py-2 text-sm text-[#574f48] transition hover:bg-[#171412]/5"
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => permanentlyDeleteProduct(product)}
                    className="rounded-full border border-red-700/20 px-4 py-2 text-sm text-red-700 transition hover:bg-red-50"
                  >
                    Permanent Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
        <h3 className="text-2xl font-semibold text-[#171412]">Deleted Coupons</h3>
        <div className="mt-5 space-y-3">
          {state.loading ? (
            <p className="text-sm text-[#756c63]">Loading deleted coupons...</p>
          ) : state.coupons.length === 0 ? (
            <p className="text-sm text-[#756c63]">No deleted coupons.</p>
          ) : (
            state.coupons.map((coupon) => (
              <article
                key={coupon.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] p-4"
              >
                <div>
                  <h4 className="font-semibold text-[#171412]">{coupon.code}</h4>
                  <p className="mt-1 text-sm text-[#756c63]">
                    Used {coupon.orderUsageCount} times / limit{' '}
                    {coupon.usageLimit ?? 'unlimited'}
                  </p>
                  <p className="mt-1 text-sm text-[#756c63]">
                    Discount given {formatCurrency(coupon.totalDiscountGiven)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      runAction(
                        () => restoreAdminCoupon(coupon.id),
                        'Unable to restore coupon.'
                      )
                    }
                    className="rounded-full border border-[#171412]/10 px-4 py-2 text-sm text-[#574f48] transition hover:bg-[#171412]/5"
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => permanentlyDeleteCoupon(coupon)}
                    className="rounded-full border border-red-700/20 px-4 py-2 text-sm text-red-700 transition hover:bg-red-50"
                  >
                    Permanent Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
