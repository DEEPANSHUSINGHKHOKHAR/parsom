import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Download, FileText, Package, Truck } from 'lucide-react';
import EmptyState from '../../../components/ui/empty-state';
import Button from '../../../components/ui/button';
import FormField from '../../../components/ui/form-field';
import StarRating from '../../../components/ui/star-rating';
import PasswordField from '../../auth/components/password-field';
import {
  fetchMyAddresses,
  createAddress,
  setDefaultAddress,
  deleteAddress,
} from '../../../services/addresses-service';
import {
  fetchMyOrders,
  createReturnRequest,
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
import { uploadReviewMedia } from '../../../services/uploads-service';
import MediaPlaceholder from '../../../components/ui/media-placeholder';
import {
  changePassword,
  deleteMyAccount,
} from '../../../services/auth-service';
import { useAuthStore } from '../../auth/auth-store';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));

const formatDate = (value) => {
  if (!value) return 'Not available';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const formatDateTime = (value) => {
  if (!value) return 'Not available';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const statusStyles = {
  pending: 'border-[#a86e1f]/25 bg-[#a86e1f]/10 text-[#8a5616]',
  confirmed: 'border-[#1f6f8f]/25 bg-[#1f6f8f]/10 text-[#165a74]',
  shipped: 'border-[#5b5ca8]/25 bg-[#5b5ca8]/10 text-[#44458c]',
  delivered: 'border-[#1f8f4d]/25 bg-[#1f8f4d]/10 text-[#1f7a43]',
  cancelled: 'border-[#b23b3b]/25 bg-[#b23b3b]/10 text-[#963030]',
};

const passwordRequirementMessage =
  'Password must be at least 8 characters and include uppercase, lowercase, and a number.';

function isStrongPassword(value) {
  return (
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value)
  );
}

function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (/^(blob:|data:|https?:\/\/)/i.test(url)) return url;

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const origin = apiBase.replace(/\/api\/?$/, '').replace(/\/+$/, '');

  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
}

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

function ReviewMediaPreview({ item }) {
  if (!item?.url) return null;

  if (item.type === 'video') {
    return (
      <video
        src={item.url}
        controls
        className="aspect-square w-full rounded-[8px] border border-[#171412]/10 bg-[#171412] object-contain"
      />
    );
  }

  return (
    <img
      src={item.url}
      alt="Review media"
      className="aspect-square w-full rounded-[8px] border border-[#171412]/10 bg-[#ede8df] object-contain"
      loading="lazy"
    />
  );
}

function OrderItemImage({ item }) {
  if (!item?.primaryImage) {
    return (
      <MediaPlaceholder
        label="No image"
        className="h-full bg-[#ede8df] text-[#756c63]"
      />
    );
  }

  if (item.primaryMediaType === 'video') {
    return (
      <video
        src={resolveMediaUrl(item.primaryImage)}
        className="h-full w-full object-cover"
        muted
        playsInline
      />
    );
  }

  return (
    <img
      src={resolveMediaUrl(item.primaryImage)}
      alt={item.productName || 'Order item'}
      className="h-full w-full object-cover"
      loading="lazy"
      onError={(event) => {
        event.currentTarget.hidden = true;
      }}
    />
  );
}

export default function AccountPanel({ activeTab, actor }) {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
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
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordStatus, setPasswordStatus] = useState({
    loading: false,
    error: '',
    success: '',
  });
  const [deleteStatus, setDeleteStatus] = useState({
    loading: false,
    error: '',
  });
  const [addressStatus, setAddressStatus] = useState({
    loading: false,
    error: '',
  });
  const [returnDrafts, setReturnDrafts] = useState({});
  const [returnStatus, setReturnStatus] = useState({
    loadingItemId: null,
    error: '',
    success: '',
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

  const handlePasswordField = (field, value) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    const requiresCurrentPassword = actor?.authProvider !== 'google';

    if (requiresCurrentPassword && !passwordForm.currentPassword) {
      setPasswordStatus({
        loading: false,
        error: 'Current password is required.',
        success: '',
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordStatus({
        loading: false,
        error: 'Passwords do not match.',
        success: '',
      });
      return;
    }

    if (!isStrongPassword(passwordForm.newPassword)) {
      setPasswordStatus({
        loading: false,
        error: passwordRequirementMessage,
        success: '',
      });
      return;
    }

    setPasswordStatus({ loading: true, error: '', success: '' });

    try {
      const payload = {
        newPassword: passwordForm.newPassword,
        ...(requiresCurrentPassword
          ? { currentPassword: passwordForm.currentPassword }
          : { skipCurrentPassword: true }),
      };

      await changePassword(payload);

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setPasswordStatus({
        loading: false,
        error: '',
        success: 'Password updated successfully.',
      });
    } catch (requestError) {
      setPasswordStatus({
        loading: false,
        error:
          requestError?.response?.data?.message ||
          'Unable to update password.',
        success: '',
      });
    }
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

  const handleDeleteAccount = async () => {
    const requiresCurrentPassword = actor?.authProvider !== 'google';

    if (requiresCurrentPassword && !passwordForm.currentPassword) {
      setDeleteStatus({
        loading: false,
        error: 'Enter your current password to delete your account.',
      });
      return;
    }

    const confirmed = window.confirm(
      'Delete your account permanently? This will remove your orders, addresses, wishlist items, reviews, and other account data.'
    );

    if (!confirmed) {
      return;
    }

    setDeleteStatus({ loading: true, error: '' });

    try {
      await deleteMyAccount(
        requiresCurrentPassword
          ? { currentPassword: passwordForm.currentPassword }
          : { skipCurrentPassword: true }
      );

      clearSession();
      navigate('/');
    } catch (requestError) {
      setDeleteStatus({
        loading: false,
        error:
          requestError?.response?.data?.message ||
          'Unable to delete account.',
      });
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
        media: entry.media || [],
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

  const handleReviewMediaUpload = async (orderItemId, files) => {
    const selectedFiles = Array.from(files || []).slice(0, 6);
    if (!selectedFiles.length) return;

    setReviewUploadState((prev) => ({
      ...prev,
      [orderItemId]: { loading: true, error: '' },
    }));

    try {
      const results = await Promise.all(selectedFiles.map((file) => uploadReviewMedia(file)));
      const media = results.map((result) => ({
        type: result.type || 'image',
        url: result.url,
      }));

      setReviewForm((prev) => ({
        ...prev,
        [orderItemId]: {
          ...prev[orderItemId],
          imageUrl: prev[orderItemId]?.imageUrl || media[0]?.url || '',
          media: [...(prev[orderItemId]?.media || []), ...media].slice(0, 6),
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
          error:
            error?.response?.data?.message ||
            error?.message ||
            'Media upload failed.',
        },
      }));
    }
  };

  const handleCreateReturnRequest = async (item) => {
    const reason = String(returnDrafts[item.id] || '').trim();
    if (!reason) {
      setReturnStatus({
        loadingItemId: null,
        error: 'Return reason is required.',
        success: '',
      });
      return;
    }

    setReturnStatus({
      loadingItemId: item.id,
      error: '',
      success: '',
    });

    try {
      await createReturnRequest({
        orderItemId: item.id,
        reason,
      });
      const data = await fetchMyOrders();
      setOrders(data);
      setReturnDrafts((prev) => ({ ...prev, [item.id]: '' }));
      setReturnStatus({
        loadingItemId: null,
        error: '',
        success: 'Return request submitted successfully.',
      });
    } catch (error) {
      setReturnStatus({
        loadingItemId: null,
        error: error?.response?.data?.message || 'Unable to submit return request.',
        success: '',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-5 backdrop-blur-xl md:p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#171412]">
          Loading...
        </h2>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase  text-[#756c63]">
          Customer Area
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#171412] sm:text-3xl">
          Account Overview
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#756c63]">
          Welcome back{actor?.firstName ? `, ${actor.firstName}` : ''}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((item) => (
          <div
            key={item.label}
            className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] p-4"
          >
            <p className="text-xs uppercase  text-[#756c63]">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-[#171412]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] p-4">
        <p className="text-xs uppercase  text-[#756c63]">
          User Details
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase  text-[#756c63]">Name</p>
            <p className="mt-2 text-sm font-semibold text-[#171412]">
              {[actor?.firstName, actor?.lastName].filter(Boolean).join(' ') || 'Not added'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase  text-[#756c63]">Email</p>
            <p className="mt-2 break-all text-sm font-semibold text-[#171412]">
              {actor?.email || 'Not added'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase  text-[#756c63]">Phone</p>
            <p className="mt-2 text-sm font-semibold text-[#171412]">
              {actor?.phone || 'Not added'}
            </p>
          </div>
        </div>
      </div>

      {addresses[0] ? (
        <div className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] p-4">
          <p className="text-xs uppercase  text-[#756c63]">
            Saved Address
          </p>
          <div className="mt-4 text-sm leading-6 text-[#574f48]">
            <p className="font-semibold text-[#171412]">{addresses[0].fullName}</p>
            <p>
              {addresses[0].addressLine1}
              {addresses[0].addressLine2 ? `, ${addresses[0].addressLine2}` : ''}
            </p>
            <p>
              {addresses[0].city}, {addresses[0].state} {addresses[0].postalCode}
            </p>
            <p>{addresses[0].phone}</p>
          </div>
        </div>
      ) : null}

      {orders[0] ? (
        <div className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] p-4">
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

      {returnStatus.error ? (
        <div className="rounded-[8px] border border-red-500/20 bg-red-50 px-4 py-4 text-sm text-red-700">
          {returnStatus.error}
        </div>
      ) : null}

      {returnStatus.success ? (
        <div className="rounded-[8px] border border-emerald-500/20 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
          {returnStatus.success}
        </div>
      ) : null}

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
              className="overflow-hidden rounded-[8px] border border-[#171412]/10 bg-[#f4efe8]"
            >
              <div className="grid gap-3 border-b border-[#171412]/10 bg-[#ede8df] px-4 py-3 text-xs uppercase text-[#756c63] sm:grid-cols-4">
                <div>
                  <span className="block">Order placed</span>
                  <strong className="mt-1 block text-sm normal-case text-[#171412]">
                    {formatDate(order.placedAt)}
                  </strong>
                </div>
                <div>
                  <span className="block">Total</span>
                  <strong className="mt-1 block text-sm normal-case text-[#171412]">
                    {formatCurrency(order.totalAmount)}
                  </strong>
                </div>
                <div>
                  <span className="block">Payment</span>
                  <strong className="mt-1 block text-sm normal-case text-[#171412]">
                    {order.paymentStatus}
                  </strong>
                </div>
                <div className="sm:text-right">
                  <span className="block">Order ID</span>
                  <strong className="mt-1 block break-all text-sm normal-case text-[#171412]">
                    {order.orderNumber}
                  </strong>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                          statusStyles[order.status] ||
                          'border-[#171412]/10 bg-[#171412]/5 text-[#574f48]'
                        }`}
                      >
                        <Truck size={14} />
                        {order.status}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#171412]/10 px-3 py-1 text-xs font-semibold text-[#574f48]">
                        <CreditCard size={14} />
                        {order.paymentMethod}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {(order.items || []).map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-4 border-t border-[#171412]/10 pt-3 first:border-t-0 first:pt-0"
                        >
                          <div className="h-24 w-20 shrink-0 overflow-hidden rounded-[8px] border border-[#171412]/10 bg-[#ede8df]">
                            <OrderItemImage item={item} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold text-[#171412] sm:text-lg">
                              {item.productName}
                            </h3>
                            <p className="mt-1 text-sm text-[#756c63]">
                              Size {item.size} / Qty {item.quantity}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[#171412]">
                              {formatCurrency(item.lineTotal)}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-3">
                              {item.returnRequest ? (
                                <span className="rounded-full border border-[#171412]/10 px-3 py-2 text-xs uppercase text-[#574f48]">
                                  Return {item.returnRequest.status}
                                </span>
                              ) : order.status === 'delivered' ? (
                                <div className="w-full rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-3">
                                  <p className="text-xs uppercase text-[#756c63]">
                                    Return form
                                  </p>
                                  <p className="mt-1 text-sm text-[#574f48]">
                                    Product: {item.productName} / Order: {order.orderNumber}
                                  </p>
                                  <textarea
                                    rows={3}
                                    value={returnDrafts[item.id] || ''}
                                    onChange={(event) =>
                                      setReturnDrafts((prev) => ({
                                        ...prev,
                                        [item.id]: event.target.value,
                                      }))
                                    }
                                    placeholder="Reason for return"
                                    className="mt-3 w-full rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-3 text-sm text-[#171412] outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCreateReturnRequest({
                                        ...item,
                                        orderNumber: order.orderNumber,
                                      })
                                    }
                                    disabled={returnStatus.loadingItemId === item.id}
                                    className="mt-3 rounded-full border border-[#171412]/10 px-3 py-2 text-xs uppercase text-[#574f48] transition hover:bg-[#171412]/5 disabled:opacity-60"
                                  >
                                    {returnStatus.loadingItemId === item.id
                                      ? 'Submitting...'
                                      : 'Request Return'}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-full space-y-3 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-4 lg:w-80">
                    <div>
                      <p className="text-xs uppercase text-[#756c63]">
                        Razorpay transaction ID
                      </p>
                      <p className="mt-1 break-all text-sm font-semibold text-[#171412]">
                        {order.razorpayPaymentId || 'Awaiting payment'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-[#756c63]">
                        Razorpay order ID
                      </p>
                      <p className="mt-1 break-all text-sm text-[#574f48]">
                        {order.razorpayOrderId || 'Not available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-[#756c63]">Paid at</p>
                      <p className="mt-1 text-sm text-[#574f48]">
                        {formatDateTime(order.paidAt)}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      type="button"
                      className="w-full gap-2 px-4 py-3"
                      onClick={() => downloadMyInvoice(order.orderNumber)}
                    >
                      <Download size={16} />
                      Invoice
                    </Button>
                  </div>
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
                <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] px-4 py-3">
                  <p className="text-xs uppercase text-[#756c63]">Your rating</p>
                  <StarRating
                    interactive
                    value={Number(reviewForm[item.orderItemId]?.rating || 5)}
                    onChange={(ratingValue) =>
                      setReviewForm((prev) => ({
                        ...prev,
                        [item.orderItemId]: {
                          ...prev[item.orderItemId],
                          rating: ratingValue,
                        },
                      }))
                    }
                    className="mt-2"
                  />
                </div>

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
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  onChange={(event) =>
                    handleReviewMediaUpload(
                      item.orderItemId,
                      event.target.files
                    )
                  }
                  className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-3 text-sm text-[#171412] outline-none"
                />

                {reviewUploadState[item.orderItemId]?.loading ? (
                  <p className="text-sm text-[#756c63]">Uploading media...</p>
                ) : null}

                {reviewUploadState[item.orderItemId]?.error ? (
                  <p className="text-sm text-red-400">
                    {reviewUploadState[item.orderItemId].error}
                  </p>
                ) : null}

                {reviewForm[item.orderItemId]?.media?.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {reviewForm[item.orderItemId].media.map((mediaItem, index) => (
                      <div key={`${mediaItem.url}-${index}`} className="space-y-2">
                        <ReviewMediaPreview item={mediaItem} />
                        <button
                          type="button"
                          onClick={() =>
                            setReviewForm((prev) => {
                              const nextMedia = (prev[item.orderItemId]?.media || []).filter(
                                (_, mediaIndex) => mediaIndex !== index
                              );

                              return {
                                ...prev,
                                [item.orderItemId]: {
                                  ...prev[item.orderItemId],
                                  media: nextMedia,
                                  imageUrl: nextMedia[0]?.url || '',
                                },
                              };
                            })
                          }
                          className="w-full rounded-full border border-[#171412]/10 px-3 py-2 text-xs uppercase text-[#574f48] transition hover:bg-[#171412]/5"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
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
                  <StarRating rating={review.rating} className="mt-2" />
                </div>

                <span className="text-sm text-[#756c63]">
                  {review.isPublished ? 'Published' : 'Hidden'}
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-[#756c63]">
                {review.comment}
              </p>

              {review.media?.length ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {review.media.map((mediaItem, index) => (
                    <ReviewMediaPreview
                      key={`${review.id}-${mediaItem.url}-${index}`}
                      item={mediaItem}
                    />
                  ))}
                </div>
              ) : null}
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
              <div className="flex min-w-0 items-center gap-4">
                <div className="h-24 w-20 shrink-0 overflow-hidden rounded-[8px] border border-[#171412]/10 bg-[#ede8df]">
                  {item.product?.primaryImage ? (
                    <img
                      src={resolveMediaUrl(item.product.primaryImage)}
                      alt={item.product?.name || 'Wishlist product'}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.hidden = true;
                      }}
                    />
                  ) : (
                    <MediaPlaceholder
                      label="No image"
                      className="bg-[#ede8df] text-[#756c63]"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs uppercase  text-[#756c63]">
                    {item.product?.categoryName}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[#171412]">
                    {item.product?.name}
                  </h3>
                </div>
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
              className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] p-5"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[8px] border border-[#171412]/10 bg-[#ede8df] text-[#171412]">
                    <FileText size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase text-[#756c63]">
                      Invoice for {order.orderNumber}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[#171412]">
                      {formatCurrency(order.totalAmount)}
                    </h3>
                    <p className="mt-2 text-sm text-[#756c63]">
                      {formatDate(order.placedAt)} / {order.paymentStatus}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-[#574f48] lg:min-w-[360px]">
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex items-center gap-2 text-[#756c63]">
                      <CreditCard size={15} />
                      Transaction
                    </span>
                    <span className="max-w-[210px] break-all text-right font-semibold text-[#171412]">
                      {order.razorpayPaymentId || 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex items-center gap-2 text-[#756c63]">
                      <Package size={15} />
                      Razorpay order
                    </span>
                    <span className="max-w-[210px] break-all text-right">
                      {order.razorpayOrderId || 'Not available'}
                    </span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  type="button"
                  className="gap-2 px-5 py-3"
                  onClick={() => downloadMyInvoice(order.orderNumber)}
                >
                  <Download size={16} />
                  Download
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const renderSecurity = () => {
    const requiresCurrentPassword = actor?.authProvider !== 'google';

    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase  text-[#756c63]">
            Customer Area
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
            Change Password
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#756c63]">
            {requiresCurrentPassword
              ? 'Update your password to keep your account secure.'
              : 'Set a password for faster sign-ins next time.'}
          </p>
        </div>

        <form
          onSubmit={handleChangePassword}
          className="grid gap-4 rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] p-5"
        >
          {requiresCurrentPassword ? (
            <FormField label="Current Password" required>
              <PasswordField
              name="currentPassword"
              required
              minLength={8}
              value={passwordForm.currentPassword}
                onChange={(event) =>
                  handlePasswordField('currentPassword', event.target.value)
                }
                placeholder="Enter current password"
              />
            </FormField>
          ) : null}

          <FormField label="New Password" required>
            <PasswordField
              name="newPassword"
              required
              minLength={8}
              value={passwordForm.newPassword}
              onChange={(event) =>
                handlePasswordField('newPassword', event.target.value)
              }
              placeholder="Create new password"
            />
          </FormField>

          <FormField label="Confirm New Password" required>
            <PasswordField
              name="confirmNewPassword"
              required
              minLength={8}
              value={passwordForm.confirmNewPassword}
              onChange={(event) =>
                handlePasswordField('confirmNewPassword', event.target.value)
              }
              placeholder="Confirm new password"
            />
          </FormField>

          {passwordStatus.error ? (
            <p className="text-sm text-red-400">{passwordStatus.error}</p>
          ) : null}

          <p className="text-xs leading-5 text-[#756c63]">
            Password needs 8+ characters with uppercase, lowercase, and a number.
          </p>

          {passwordStatus.success ? (
            <p className="text-sm text-[#5a7d4f]">{passwordStatus.success}</p>
          ) : null}

          <div>
            <Button type="submit" disabled={passwordStatus.loading}>
              {passwordStatus.loading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>

        <div className="grid gap-4 rounded-[8px] border border-[#b23b3b]/20 bg-[#fff1ef] p-5">
          <div>
            <p className="text-xs uppercase text-[#963030]">
              Danger Zone
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#171412]">
              Delete Account
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-[#756c63]">
              This permanently deletes your account and removes your previous orders, addresses, wishlist items, reviews, and other linked data.
            </p>
          </div>

          {deleteStatus.error ? (
            <p className="text-sm text-red-400">{deleteStatus.error}</p>
          ) : null}

          <div>
            <Button
              type="button"
              variant="secondary"
              className="w-full border-[#b23b3b] bg-[#b23b3b] text-white hover:bg-[#963030] hover:text-white sm:w-auto"
              disabled={deleteStatus.loading}
              onClick={handleDeleteAccount}
            >
              {deleteStatus.loading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const contentMap = {
    overview: renderOverview(),
    orders: renderOrders(),
    addresses: renderAddresses(),
    reviews: renderReviews(),
    notify: renderNotify(),
    wishlist: renderWishlist(),
    invoices: renderInvoices(),
    security: renderSecurity(),
  };

  return (
    <div className="space-y-5 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-5 backdrop-blur-xl md:p-6">
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {contentMap[activeTab] || contentMap.overview}
    </div>
  );
}
