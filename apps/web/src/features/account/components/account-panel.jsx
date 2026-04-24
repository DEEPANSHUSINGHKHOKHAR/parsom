import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../../../components/ui/empty-state';
import Button from '../../../components/ui/button';
import {
  fetchMyAddresses,
  createAddress,
  setDefaultAddress,
  deleteAddress,
} from '../../../services/addresses-service';
import {
  fetchMyOrders,
  downloadMyInvoice,
} from '../../../services/orders-service';
import {
  createReview,
  fetchEligibleReviewItems,
  fetchMyReviews,
} from '../../../services/reviews-service';
import { fetchMyNotifyRequests } from '../../../services/notify-service';
import {
  fetchMyWishlist,
  removeWishlistItem,
} from '../../../services/wishlist-service';
import { uploadReviewImage } from '../../../services/uploads-service';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));

const initialAddressForm = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  label: '',
  isDefault: false,
};

export default function AccountPanel({ activeTab, actor }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [eligibleReviewItems, setEligibleReviewItems] = useState([]);
  const [notifyRequests, setNotifyRequests] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [addressForm, setAddressForm] = useState(initialAddressForm);
  const [reviewForm, setReviewForm] = useState({});
  const [reviewUploadState, setReviewUploadState] = useState({});
  const [addressStatus, setAddressStatus] = useState({
    loading: false,
    error: '',
  });

  const overviewStats = useMemo(
    () => [
      { label: 'Orders', value: orders.length },
      { label: 'Addresses', value: addresses.length },
      { label: 'Reviews', value: reviews.length },
      { label: 'Notify Requests', value: notifyRequests.length },
    ],
    [orders.length, addresses.length, reviews.length, notifyRequests.length]
  );

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      setLoading(true);
      setError('');

      try {
        if (activeTab === 'overview') {
          const [ordersData, addressesData, reviewsData, notifyData] =
            await Promise.all([
              fetchMyOrders(),
              fetchMyAddresses(),
              fetchMyReviews(),
              fetchMyNotifyRequests(),
            ]);

          if (ignore) return;

          setOrders(ordersData);
          setAddresses(addressesData);
          setReviews(reviewsData);
          setNotifyRequests(notifyData);
        }

        if (activeTab === 'orders') {
          const data = await fetchMyOrders();
          if (!ignore) setOrders(data);
        }

        if (activeTab === 'addresses') {
          const data = await fetchMyAddresses();
          if (!ignore) setAddresses(data);
        }

        if (activeTab === 'reviews') {
          const [reviewsData, eligibleData] = await Promise.all([
            fetchMyReviews(),
            fetchEligibleReviewItems(),
          ]);
          if (!ignore) {
            setReviews(reviewsData);
            setEligibleReviewItems(eligibleData);
          }
        }

        if (activeTab === 'notify') {
          const data = await fetchMyNotifyRequests();
          if (!ignore) setNotifyRequests(data);
        }

        if (activeTab === 'wishlist') {
          const data = await fetchMyWishlist();
          if (!ignore) setWishlist(data);
        }

        if (activeTab === 'invoices') {
          const data = await fetchMyOrders();
          if (!ignore) setOrders(data);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(
            requestError?.response?.data?.message || 'Unable to load dashboard data.'
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      ignore = true;
    };
  }, [activeTab]);

  const reloadAddresses = async () => {
    const data = await fetchMyAddresses();
    setAddresses(data);
  };

  const handleAddressField = (field, value) => {
    setAddressForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateAddress = async (event) => {
    event.preventDefault();
    setAddressStatus({ loading: true, error: '' });

    try {
      await createAddress(addressForm);
      setAddressForm(initialAddressForm);
      await reloadAddresses();
    } catch (requestError) {
      setAddressStatus({
        loading: false,
        error:
          requestError?.response?.data?.message || 'Unable to create address.',
      });
      return;
    }

    setAddressStatus({ loading: false, error: '' });
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      await setDefaultAddress(addressId);
      await reloadAddresses();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message || 'Unable to update default address.'
      );
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await deleteAddress(addressId);
      await reloadAddresses();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message || 'Unable to delete address.'
      );
    }
  };

  const handleSubmitReview = async (item) => {
    const entry = reviewForm[item.orderItemId] || {};

    try {
      await createReview({
        productId: item.productId,
        orderItemId: item.orderItemId,
        rating: Number(entry.rating || 5),
        comment: entry.comment || '',
        imageUrl: entry.imageUrl || '',
      });

      const [reviewsData, eligibleData] = await Promise.all([
        fetchMyReviews(),
        fetchEligibleReviewItems(),
      ]);

      setReviews(reviewsData);
      setEligibleReviewItems(eligibleData);
    } catch (error) {
      setError(error?.response?.data?.message || 'Unable to submit review.');
    }
  };

  const handleReviewImageUpload = async (orderItemId, file) => {
    if (!file) return;

    setReviewUploadState((prev) => ({
      ...prev,
      [orderItemId]: { loading: true, error: '' },
    }));

    try {
      const result = await uploadReviewImage(file);

      setReviewForm((prev) => ({
        ...prev,
        [orderItemId]: {
          ...prev[orderItemId],
          imageUrl: result.url,
        },
      }));

      setReviewUploadState((prev) => ({
        ...prev,
        [orderItemId]: { loading: false, error: '' },
      }));
    } catch (error) {
      setReviewUploadState((prev) => ({
        ...prev,
        [orderItemId]: {
          loading: false,
          error: error?.response?.data?.message || 'Upload failed.',
        },
      }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl md:p-8">
        <h2 className="text-3xl font-semibold tracking-tight text-[#171412]">
          Loading...
        </h2>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase  text-[#756c63]">
          Customer Area
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          Account Overview
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#756c63]">
          Welcome back{actor?.firstName ? `, ${actor.firstName}` : ''}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((item) => (
          <div
            key={item.label}
            className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] p-5"
          >
            <p className="text-xs uppercase  text-[#756c63]">
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#171412]">{item.value}</p>
          </div>
        ))}
      </div>

      {orders[0] ? (
        <div className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] p-5">
          <p className="text-xs uppercase  text-[#756c63]">
            Latest Order
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-[#171412]">
                {orders[0].orderNumber}
              </h3>
              <p className="mt-2 text-sm text-[#756c63]">{orders[0].status}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#756c63]">Total</p>
              <p className="text-xl font-semibold text-[#171412]">
                {formatCurrency(orders[0].totalAmount)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No order activity yet"
          description="Your overview cards are connected. Order data will appear here after checkout."
        />
      )}
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase  text-[#756c63]">
          Customer Area
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          Your Orders
        </h2>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description="Once you place real orders, they will appear here."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article
              key={order.orderNumber}
              className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase  text-[#756c63]">
                    {order.orderNumber}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[#171412]">
                    {order.status}
                  </h3>
                  <p className="mt-2 text-sm text-[#756c63]">
                    Payment: {order.paymentStatus}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-[#756c63]">Total</p>
                  <p className="text-xl font-semibold text-[#171412]">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const renderAddresses = () => (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase  text-[#756c63]">
          Customer Area
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          Saved Addresses
        </h2>
      </div>

      <form
        onSubmit={handleCreateAddress}
        className="grid gap-4 rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] p-5 md:grid-cols-2"
      >
        <input
          type="text"
          value={addressForm.fullName}
          onChange={(event) => handleAddressField('fullName', event.target.value)}
          placeholder="Full name"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-3 text-sm text-[#171412] outline-none placeholder:text-[#756c63]/60"
        />
        <input
          type="text"
          value={addressForm.phone}
          onChange={(event) => handleAddressField('phone', event.target.value)}
          placeholder="Phone"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-3 text-sm text-[#171412] outline-none placeholder:text-[#756c63]/60"
        />
        <input
          type="text"
          value={addressForm.addressLine1}
          onChange={(event) => handleAddressField('addressLine1', event.target.value)}
          placeholder="Address line 1"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-3 text-sm text-[#171412] outline-none placeholder:text-[#756c63]/60"
        />
        <input
          type="text"
          value={addressForm.addressLine2}
          onChange={(event) => handleAddressField('addressLine2', event.target.value)}
          placeholder="Address line 2"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-3 text-sm text-[#171412] outline-none placeholder:text-[#756c63]/60"
        />
        <input
          type="text"
          value={addressForm.city}
          onChange={(event) => handleAddressField('city', event.target.value)}
          placeholder="City"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-3 text-sm text-[#171412] outline-none placeholder:text-[#756c63]/60"
        />
        <input
          type="text"
          value={addressForm.state}
          onChange={(event) => handleAddressField('state', event.target.value)}
          placeholder="State"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-3 text-sm text-[#171412] outline-none placeholder:text-[#756c63]/60"
        />
        <input
          type="text"
          value={addressForm.postalCode}
          onChange={(event) => handleAddressField('postalCode', event.target.value)}
          placeholder="Postal code"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-3 text-sm text-[#171412] outline-none placeholder:text-[#756c63]/60"
        />
        <input
          type="text"
          value={addressForm.label}
          onChange={(event) => handleAddressField('label', event.target.value)}
          placeholder="Label"
          className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-3 text-sm text-[#171412] outline-none placeholder:text-[#756c63]/60"
        />

        <label className="flex items-center gap-2 text-sm text-[#756c63]">
          <input
            type="checkbox"
            checked={addressForm.isDefault}
            onChange={(event) => handleAddressField('isDefault', event.target.checked)}
          />
          Set as default
        </label>

        <div className="md:col-span-2">
          {addressStatus.error ? (
            <p className="mb-3 text-sm text-red-400">{addressStatus.error}</p>
          ) : null}

          <Button type="submit" disabled={addressStatus.loading}>
            {addressStatus.loading ? 'Saving Address...' : 'Save Address'}
          </Button>
        </div>
      </form>

      {addresses.length === 0 ? (
        <EmptyState
          title="No saved addresses"
          description="Create your first address using the form above."
        />
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <article
              key={address.id}
              className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#171412]">
                    {address.fullName}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#756c63]">
                    {address.addressLine1}
                    {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                    <br />
                    {address.city}, {address.state} {address.postalCode}
                    <br />
                    {address.phone}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {address.isDefault ? (
                    <span className="rounded-full border border-[#171412]/10 px-4 py-2 text-xs uppercase  text-[#574f48]">
                      Default
                    </span>
                  ) : (
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => handleSetDefaultAddress(address.id)}
                    >
                      Set Default
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => handleDeleteAddress(address.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase  text-[#756c63]">
          Customer Area
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          Your Reviews
        </h2>
      </div>

      <div className="space-y-4">
        {eligibleReviewItems.length === 0 ? (
          <EmptyState
            title="No eligible purchases to review"
            description="Delivered items that still need reviews will appear here."
          />
        ) : (
          eligibleReviewItems.map((item) => (
            <article
              key={item.orderItemId}
              className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] p-5"
            >
              <h3 className="text-xl font-semibold text-[#171412]">{item.productName}</h3>
              <p className="mt-2 text-sm text-[#756c63]">
                Order {item.orderNumber} · Size {item.size}
              </p>

              <div className="mt-4 grid gap-4">
                <select
                  value={reviewForm[item.orderItemId]?.rating || 5}
                  onChange={(event) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      [item.orderItemId]: {
                        ...prev[item.orderItemId],
                        rating: event.target.value,
                      },
                    }))
                  }
                  className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-3 text-sm text-[#171412] outline-none"
                >
                  <option value={5}>5</option>
                  <option value={4}>4</option>
                  <option value={3}>3</option>
                  <option value={2}>2</option>
                  <option value={1}>1</option>
                </select>

                <textarea
                  rows={4}
                  value={reviewForm[item.orderItemId]?.comment || ''}
                  onChange={(event) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      [item.orderItemId]: {
                        ...prev[item.orderItemId],
                        comment: event.target.value,
                      },
                    }))
                  }
                  placeholder="Write your review"
                  className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-3 text-sm text-[#171412] outline-none"
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleReviewImageUpload(
                      item.orderItemId,
                      event.target.files?.[0]
                    )
                  }
                  className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-3 text-sm text-[#171412] outline-none"
                />

                {reviewUploadState[item.orderItemId]?.loading ? (
                  <p className="text-sm text-[#756c63]">Uploading image...</p>
                ) : null}

                {reviewUploadState[item.orderItemId]?.error ? (
                  <p className="text-sm text-red-400">
                    {reviewUploadState[item.orderItemId].error}
                  </p>
                ) : null}

                {reviewForm[item.orderItemId]?.imageUrl ? (
                  <input
                    readOnly
                    value={reviewForm[item.orderItemId].imageUrl}
                    className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-3 text-sm text-[#171412] outline-none"
                  />
                ) : null}

                <Button type="button" onClick={() => handleSubmitReview(item)}>
                  Submit Review
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <EmptyState
            title="No reviews submitted yet"
            description="Submitted reviews will appear here."
          />
        ) : (
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase  text-[#756c63]">
                    {review.product?.name}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[#171412]">
                    {review.rating}/5
                  </h3>
                </div>

                <span className="text-sm text-[#756c63]">
                  {review.isPublished ? 'Published' : 'Hidden'}
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-[#756c63]">
                {review.comment}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );

  const renderNotify = () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase  text-[#756c63]">
          Customer Area
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          Notify Requests
        </h2>
      </div>

      {notifyRequests.length === 0 ? (
        <EmptyState
          title="No notify requests found"
          description="Out-of-stock size requests will appear here."
        />
      ) : (
        <div className="space-y-4">
          {notifyRequests.map((request) => (
            <article
              key={request.id}
              className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase  text-[#756c63]">
                    {request.product?.name}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[#171412]">
                    Size {request.size}
                  </h3>
                </div>

                <span className="rounded-full border border-[#171412]/10 px-4 py-2 text-xs uppercase  text-[#574f48]">
                  {request.status}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const renderWishlist = () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase  text-[#756c63]">
          Customer Area
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          Wishlist
        </h2>
      </div>

      {wishlist.length === 0 ? (
        <EmptyState
          title="No wishlist items"
          description="Saved products will appear here."
        />
      ) : (
        <div className="space-y-4">
          {wishlist.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] p-5"
            >
              <div>
                <p className="text-xs uppercase  text-[#756c63]">
                  {item.product?.categoryName}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[#171412]">
                  {item.product?.name}
                </h3>
              </div>

              <Button
                variant="secondary"
                type="button"
                onClick={async () => {
                  try {
                    await removeWishlistItem(item.product.id);
                    const data = await fetchMyWishlist();
                    setWishlist(data);
                  } catch (error) {
                    setError(
                      error?.response?.data?.message ||
                        'Unable to remove wishlist item.'
                    );
                  }
                }}
              >
                Remove
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const renderInvoices = () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase  text-[#756c63]">
          Customer Area
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          Invoices
        </h2>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No invoices available"
          description="Invoices will appear after you place orders."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article
              key={order.orderNumber}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] p-5"
            >
              <div>
                <h3 className="text-xl font-semibold text-[#171412]">
                  {order.orderNumber}
                </h3>
                <p className="mt-2 text-sm text-[#756c63]">{order.status}</p>
              </div>

              <Button
                variant="secondary"
                type="button"
                onClick={() => downloadMyInvoice(order.orderNumber)}
              >
                Download Invoice
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const renderFallback = (title, description) => (
    <div className="space-y-6 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl md:p-8">
      <div>
        <p className="text-xs uppercase  text-[#756c63]">
          Customer Area
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          {title}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#756c63]">
          {description}
        </p>
      </div>

      <EmptyState
        title={`${title} is not connected yet`}
        description="This section needs its dedicated backend endpoints before frontend integration."
      />
    </div>
  );

  const contentMap = {
    overview: renderOverview(),
    orders: renderOrders(),
    addresses: renderAddresses(),
    reviews: renderReviews(),
    notify: renderNotify(),
    wishlist: renderWishlist(),
    invoices: renderInvoices(),
  };

  return (
    <div className="space-y-6 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl md:p-8">
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {contentMap[activeTab] || contentMap.overview}
    </div>
  );
}
