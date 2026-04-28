import { useEffect, useState } from 'react';
import { fetchAdminAnalyticsOverview } from '../services/admin-analytics-service';

const currency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));

export default function DashboardPage() {
  const [state, setState] = useState({
    loading: true,
    error: '',
    data: null,
  });

  useEffect(() => {
    let ignore = false;

    const loadAnalytics = async () => {
      try {
        const data = await fetchAdminAnalyticsOverview();

        if (!ignore) {
          setState({
            loading: false,
            error: '',
            data,
          });
        }
      } catch (error) {
        if (!ignore) {
          setState({
            loading: false,
            error: error?.response?.data?.message || 'Unable to load analytics.',
            data: null,
          });
        }
      }
    };

    loadAnalytics();

    return () => {
      ignore = true;
    };
  }, []);

  if (state.loading) {
    return (
      <section className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-8">
        Loading analytics...
      </section>
    );
  }

  if (state.error || !state.data) {
    return (
      <section className="rounded-[8px] border border-red-500/20 bg-red-50 px-4 py-4 text-sm text-red-700">
        {state.error || 'Analytics unavailable.'}
      </section>
    );
  }

  const {
    cards,
    monthlySales,
    orderStatusBreakdown,
    topProducts,
    categoryBreakdown = [],
    couponTracking = [],
  } = state.data;

  const summaryCards = [
    { label: 'Total Orders', value: cards.totalOrders },
    { label: 'Pending Orders', value: cards.pendingOrders },
    { label: 'Gross Revenue', value: currency(cards.grossRevenue) },
    { label: 'Active Products', value: cards.activeProducts },
    { label: 'Low Stock Products', value: cards.lowStockProducts },
    { label: 'Pending Notify', value: cards.pendingNotify },
  ];

  const maxMonthlyRevenue = Math.max(
    ...monthlySales.map((item) => Number(item.revenue || 0)),
    1
  );
  const totalStatusCount = Math.max(
    orderStatusBreakdown.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    ),
    1
  );

  return (
    <section className="space-y-6">
      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-8 shadow-[0_18px_45px_rgba(23,20,18,0.06)]">
        <p className="text-xs font-semibold uppercase text-[#8f3d2f]">
          Analytics
        </p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[#171412]">
          Business Overview
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-5 shadow-[0_14px_35px_rgba(23,20,18,0.05)]"
          >
            <p className="text-xs font-semibold uppercase text-[#756c63]">
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#171412]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
          <h3 className="text-2xl font-semibold text-[#171412]">Monthly Sales</h3>
          <div className="mt-6 space-y-4">
            {monthlySales.length === 0 ? (
              <p className="text-sm text-[#756c63]">No monthly sales yet.</p>
            ) : (
              monthlySales.map((item) => {
                const percent = Math.max(
                  (Number(item.revenue || 0) / maxMonthlyRevenue) * 100,
                  4
                );

                return (
                  <div key={item.monthLabel} className="space-y-2">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-[#171412]">
                        {item.monthLabel}
                      </span>
                      <span className="text-[#756c63]">
                        {currency(item.revenue)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#e5ded5]">
                      <div
                        className="h-full rounded-full bg-[#8f3d2f]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
          <h3 className="text-2xl font-semibold text-[#171412]">Order Status</h3>
          <div className="mt-6 space-y-4">
            {orderStatusBreakdown.length === 0 ? (
              <p className="text-sm text-[#756c63]">No orders yet.</p>
            ) : (
              orderStatusBreakdown.map((item) => {
                const percent =
                  (Number(item.total || 0) / totalStatusCount) * 100;

                return (
                  <div key={item.status} className="space-y-2">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium capitalize text-[#171412]">
                        {String(item.status).replace(/_/g, ' ')}
                      </span>
                      <span className="text-[#756c63]">
                        {item.total} orders
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#e5ded5]">
                      <div
                        className="h-full rounded-full bg-[#171412]"
                        style={{ width: `${Math.max(percent, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
        <h3 className="text-2xl font-semibold text-[#171412]">Top Products</h3>
        <div className="mt-5 space-y-3">
          {topProducts.length === 0 ? (
            <p className="text-sm text-[#756c63]">No product sales yet.</p>
          ) : (
            topProducts.map((item) => (
              <div
                key={item.productName}
                className="flex items-center justify-between rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-4"
              >
                <div>
                  <span className="text-[#171412]">{item.productName}</span>
                  <p className="mt-1 text-sm text-[#756c63]">
                    {item.categoryName || 'Uncategorized'}
                  </p>
                </div>
                <span className="text-[#756c63]">{item.totalSold} sold</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
        <h3 className="text-2xl font-semibold text-[#171412]">Category Accuracy</h3>
        <div className="mt-5 space-y-3">
          {categoryBreakdown.length === 0 ? (
            <p className="text-sm text-[#756c63]">No categories created yet.</p>
          ) : (
            categoryBreakdown.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-4"
              >
                <div>
                  <p className="font-semibold text-[#171412]">{item.name}</p>
                  <p className="mt-1 text-sm text-[#756c63]">{item.slug}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#756c63]">
                    {item.productCount} active product{item.productCount === 1 ? '' : 's'}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#8f3d2f]">
                    {item.isActive ? 'Visible in collection' : 'Hidden from collection'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
        <h3 className="text-2xl font-semibold text-[#171412]">Coupon Tracking</h3>
        <div className="mt-5 space-y-3">
          {couponTracking.length === 0 ? (
            <p className="text-sm text-[#756c63]">No coupons tracked yet.</p>
          ) : (
            couponTracking.map((item) => {
              const limitText =
                item.usageLimit === null ? 'Unlimited' : `${item.usageLimit} limit`;
              const percent =
                item.usageLimit && item.usageLimit > 0
                  ? Math.min((item.orderUsageCount / item.usageLimit) * 100, 100)
                  : 0;

              return (
                <div
                  key={item.id}
                  className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#171412]">{item.code}</p>
                      <p className="mt-1 text-sm text-[#756c63]">
                        {item.orderUsageCount} used / {limitText}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#756c63]">Discount Given</p>
                      <p className="font-semibold text-[#171412]">
                        {currency(item.totalDiscountGiven)}
                      </p>
                    </div>
                  </div>
                  {item.usageLimit ? (
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#e5ded5]">
                      <div
                        className="h-full rounded-full bg-[#8f3d2f]"
                        style={{ width: `${Math.max(percent, 4)}%` }}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
