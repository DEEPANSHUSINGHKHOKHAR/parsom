import { useEffect, useMemo, useState } from 'react';
import { uploadAdminMedia } from '../services/admin-tools-service';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createAdminProduct,
  fetchAdminProductById,
  updateAdminProduct,
} from '../services/admin-products-service';
import { fetchAdminCategories } from '../services/admin-categories-service';
import AdminImageEditor from '../components/media/admin-image-editor';
import AdminMediaPreview from '../components/media/admin-media-preview';

const DEFAULT_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const buildDefaultSizeRows = () =>
  DEFAULT_SIZE_OPTIONS.map((size) => ({
    size,
    mode: 'hidden',
    stockQty: '',
    reservedQty: 0,
    lowStockThreshold: '',
    isActive: true,
  }));

const initialForm = {
  categoryId: '',
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  materialDetails: '',
  careDetails: '',
  shippingNotes: '',
  price: '',
  discountPrice: '',
  costPrice: '',
  makingPrice: '',
  deliveryPrice: '',
  packingPrice: '',
  profitMargin: '',
  paymentGatewayPrice: '',
  sellingPrice: '',
  finalSellingPrice: '',
  roundedSellingPrice: '',
  mrpMode: 'amount',
  mrpValue: '',
  status: 'active',
  isActive: true,
  isFeatured: false,
  isTrending: false,
  videoUrl: '',
  seoTitle: '',
  seoDescription: '',
  seoImage: '',
  sortOrder: 0,
  images: [
    {
      type: 'image',
      url: '',
      alt: '',
      isPrimary: true,
      isSecondary: false,
      sortOrder: 0,
    },
  ],
  sizes: buildDefaultSizeRows(),
};

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getApiErrorMessage(error) {
  const details = error?.response?.data?.details;
  const fieldError = details?.errors?.[0];

  if (fieldError) {
    return `${fieldError.path || fieldError.param || 'Field'}: ${fieldError.msg}`;
  }

  return error?.response?.data?.message || 'Unable to save product.';
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function measureLocalMedia(file, previewUrl) {
  return new Promise((resolve) => {
    if (file.type.startsWith('image/')) {
      const image = new Image();
      image.onload = () =>
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => resolve({});
      image.src = previewUrl;
      return;
    }

    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.onloadedmetadata = () =>
        resolve({ width: video.videoWidth, height: video.videoHeight });
      video.onerror = () => resolve({});
      video.src = previewUrl;
      return;
    }

    resolve({});
  });
}

function normalizeMoneyInput(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function calculateGatewayFee(baseSellingPrice) {
  const feeBase = Number(baseSellingPrice || 0) * 0.02;
  return Number((feeBase + feeBase * 0.18).toFixed(2));
}

function calculatePricingPreview(form) {
  const makingPrice = normalizeMoneyInput(form.makingPrice) || 0;
  const deliveryPrice = normalizeMoneyInput(form.deliveryPrice) || 0;
  const packingPrice = normalizeMoneyInput(form.packingPrice) || 0;
  const profitMargin = normalizeMoneyInput(form.profitMargin) || 0;
  const sellingPrice = Number(
    (makingPrice + deliveryPrice + packingPrice + profitMargin).toFixed(2)
  );
  const paymentGatewayPrice = calculateGatewayFee(sellingPrice);
  const finalSellingPrice = Number(
    (sellingPrice + paymentGatewayPrice).toFixed(2)
  );
  const roundedSellingPrice = normalizeMoneyInput(form.roundedSellingPrice);
  const effectiveSellingPrice = roundedSellingPrice ?? finalSellingPrice;
  const mrpMode = form.mrpMode === 'percentage' ? 'percentage' : 'amount';
  const mrpValue = normalizeMoneyInput(form.mrpValue);
  const originalPrice =
    mrpMode === 'percentage' && mrpValue !== null
      ? Number((effectiveSellingPrice * (1 + mrpValue / 100)).toFixed(2))
      : mrpValue ?? effectiveSellingPrice;

  return {
    makingPrice,
    deliveryPrice,
    packingPrice,
    profitMargin,
    sellingPrice,
    paymentGatewayPrice,
    finalSellingPrice,
    roundedSellingPrice,
    effectiveSellingPrice,
    mrpMode,
    mrpValue,
    originalPrice,
  };
}

function mergeSizesWithDefaults(sizes = []) {
  const normalized = Array.isArray(sizes) ? sizes : [];
  const bySize = new Map(
    normalized.map((item) => [
      String(item.size || '').trim().toUpperCase(),
      {
        size: String(item.size || '').trim().toUpperCase(),
        mode: item.mode || (item.notifyOnly ? 'notify' : item.isActive ? 'stock' : 'hidden'),
        stockQty: item.stockQty ?? '',
        reservedQty: item.reservedQty ?? 0,
        lowStockThreshold: item.lowStockThreshold ?? '',
        isActive: item.isActive !== false,
      },
    ])
  );

  const merged = buildDefaultSizeRows().map((item) => bySize.get(item.size) || item);
  const extras = normalized
    .map((item) => ({
      size: String(item.size || '').trim().toUpperCase(),
      mode: item.mode || (item.notifyOnly ? 'notify' : item.isActive ? 'stock' : 'hidden'),
      stockQty: item.stockQty ?? '',
      reservedQty: item.reservedQty ?? 0,
      lowStockThreshold: item.lowStockThreshold ?? '',
      isActive: item.isActive !== false,
    }))
    .filter((item) => item.size && !DEFAULT_SIZE_OPTIONS.includes(item.size));

  return [...merged, ...extras];
}

export default function ProductEditorPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const isEditMode = Boolean(productId);

  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState({
    loading: isEditMode,
    saving: false,
    error: '',
  });
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [imageEditor, setImageEditor] = useState(null);

  const uploadMediaForRow = async (index, file, meta = {}) => {
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    const localMeta = await measureLocalMedia(file, previewUrl);

    setUploadingIndex(index);
    setStatus((prev) => ({ ...prev, error: '' }));
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              previewUrl,
              type: file.type.startsWith('video/') ? 'video' : 'image',
              width: meta.width || localMeta.width || item.width,
              height: meta.height || localMeta.height || item.height,
              format: meta.format || file.name.split('.').pop() || item.format,
              sizeBytes: meta.sizeBytes || file.size,
            }
          : item
      ),
    }));

    try {
      const result = await uploadAdminMedia(file);

      setForm((prev) => ({
        ...prev,
        images: prev.images.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                url: result.url,
                type: result.type || item.type,
                previewUrl: '',
                width: result.width || item.width,
                height: result.height || item.height,
                format: result.originalFormat || result.outputFormat || item.format,
                sizeBytes: result.sizeBytes || item.sizeBytes,
              }
            : item
        ),
        }));
      } catch (error) {
        setStatus((prev) => ({
          ...prev,
          error: error?.response?.data?.message || 'Unable to upload media.',
        }));
      } finally {
        setUploadingIndex(null);
      }
    };

  const handleUploadForRow = async (index, file) => {
    if (!file) return;

    if (file.type.startsWith('image/')) {
      setImageEditor({ index, file });
      return;
    }

    await uploadMediaForRow(index, file);
  };

  useEffect(() => {
    let ignore = false;

    const loadProduct = async () => {
      setStatus((prev) => ({ ...prev, loading: true, error: '' }));

      try {
        const categoriesData = await fetchAdminCategories();

        if (!ignore) {
          setCategories(categoriesData);
        }

        if (!isEditMode) {
          if (!ignore) {
            setStatus((prev) => ({ ...prev, loading: false, error: '' }));
          }
          return;
        }

        const data = await fetchAdminProductById(productId);

        if (ignore) return;

        setForm({
          categoryId: data?.categoryId || '',
          name: data?.name || '',
          slug: data?.slug || '',
          shortDescription: data?.shortDescription || '',
          description: data?.description || '',
          materialDetails: data?.materialDetails || '',
          careDetails: data?.careDetails || '',
          shippingNotes: data?.shippingNotes || '',
          price: data?.price ?? '',
          discountPrice: data?.discountPrice ?? '',
          costPrice: data?.costPrice ?? '',
          makingPrice: data?.makingPrice ?? '',
          deliveryPrice: data?.deliveryPrice ?? '',
          packingPrice: data?.packingPrice ?? '',
          profitMargin: data?.profitMargin ?? '',
          paymentGatewayPrice: data?.paymentGatewayPrice ?? '',
          sellingPrice: data?.sellingPrice ?? '',
          finalSellingPrice: data?.finalSellingPrice ?? '',
          roundedSellingPrice: data?.roundedSellingPrice ?? '',
          mrpMode: data?.mrpMode || 'amount',
          mrpValue: data?.mrpValue ?? '',
          status: data?.status || 'active',
          isActive: Boolean(data?.isActive),
          isFeatured: Boolean(data?.isFeatured),
          isTrending: Boolean(data?.isTrending),
          videoUrl: data?.videoUrl || '',
          seoTitle: data?.seoTitle || '',
          seoDescription: data?.seoDescription || '',
          seoImage: data?.seoImage || '',
          sortOrder: data?.sortOrder ?? 0,
          images: Array.isArray(data?.media) && data.media.length > 0
            ? data.media.map((item) => ({
                type: item.type || 'image',
                url: item.url || '',
                alt: item.alt || '',
                isPrimary: Boolean(item.isPrimary),
                isSecondary: Boolean(item.isSecondary),
                sortOrder: item.sortOrder ?? 0,
              }))
            : initialForm.images,
          sizes: mergeSizesWithDefaults(data?.sizes),
        });

        setStatus((prev) => ({ ...prev, loading: false, error: '' }));
      } catch (error) {
        if (!ignore) {
          setStatus((prev) => ({
            ...prev,
            loading: false,
            error: error?.response?.data?.message || 'Unable to load product.',
          }));
        }
      }
    };

    loadProduct();

    return () => {
      ignore = true;
    };
  }, [isEditMode, productId]);

  const pageTitle = useMemo(
    () => (isEditMode ? 'Edit Product' : 'Create Product'),
    [isEditMode]
  );
  const pricingPreview = useMemo(() => calculatePricingPreview(form), [form]);

  const handleField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'name' && !isEditMode ? { slug: slugify(value) } : {}),
    }));
  };

  const handleImageField = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSizeField = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addImageRow = () => {
    setForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        {
          type: 'image',
          url: '',
          alt: '',
          isPrimary: false,
          isSecondary: false,
          sortOrder: prev.images.length,
        },
      ],
    }));
  };

  const removeImageRow = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const validateForm = () => {
    if (!form.categoryId) return 'Choose a category.';
    if (!form.name.trim()) return 'Product name is required.';
    if (isEditMode && !form.slug.trim()) return 'Product slug is required.';
    if (normalizeMoneyInput(form.makingPrice) === null) {
      return 'Making price is required.';
    }
    if (form.costPrice !== '' && Number(form.costPrice) < 0) {
      return 'Cost price cannot be negative.';
    }
    if (form.mrpMode === 'amount' && normalizeMoneyInput(form.mrpValue) === null) {
      return 'MRP amount is required.';
    }
    if (form.mrpMode === 'percentage' && normalizeMoneyInput(form.mrpValue) === null) {
      return 'MRP percentage is required.';
    }

    const validSizes = form.sizes.filter(
      (item) => item.size.trim() && item.mode !== 'hidden'
    );
    if (validSizes.length === 0) return 'Enable at least one size.';

    return '';
  };

  const buildPayload = () => ({
    categoryId: Number(form.categoryId),
    name: form.name,
    slug: isEditMode ? form.slug : undefined,
    shortDescription: form.shortDescription || undefined,
    description: form.description || undefined,
    materialDetails: form.materialDetails || undefined,
    careDetails: form.careDetails || undefined,
    shippingNotes: form.shippingNotes || undefined,
    price: pricingPreview.originalPrice,
    discountPrice: pricingPreview.effectiveSellingPrice,
    costPrice: form.costPrice === '' ? undefined : Number(form.costPrice),
    makingPrice: pricingPreview.makingPrice,
    deliveryPrice: pricingPreview.deliveryPrice,
    packingPrice: pricingPreview.packingPrice,
    profitMargin: pricingPreview.profitMargin,
    paymentGatewayPrice: pricingPreview.paymentGatewayPrice,
    sellingPrice: pricingPreview.sellingPrice,
    finalSellingPrice: pricingPreview.finalSellingPrice,
    roundedSellingPrice:
      pricingPreview.roundedSellingPrice === null
        ? undefined
        : pricingPreview.roundedSellingPrice,
    mrpMode: pricingPreview.mrpMode,
    mrpValue: pricingPreview.mrpValue,
    status: form.status,
    isActive: Boolean(form.isActive),
    isFeatured: Boolean(form.isFeatured),
    isTrending: Boolean(form.isTrending),
    videoUrl: form.videoUrl || undefined,
    seoTitle: form.seoTitle || undefined,
    seoDescription: form.seoDescription || undefined,
    seoImage: form.seoImage || undefined,
    sortOrder: Number(form.sortOrder || 0),
    images: form.images
      .filter((item) => item.url.trim())
      .map((item, index) => ({
        type: item.type,
        url: item.url,
        alt: item.alt || undefined,
        isPrimary: Boolean(item.isPrimary),
        isSecondary: Boolean(item.isSecondary),
        sortOrder: index,
      })),
    sizes: form.sizes
      .filter((item) => item.size.trim())
      .map((item) => ({
        size: item.size,
        mode: item.mode || 'hidden',
        stockQty: item.mode === 'notify' ? 0 : Number(item.stockQty || 0),
        reservedQty: Number(item.reservedQty || 0),
        lowStockThreshold: item.mode === 'notify' ? 0 : Number(item.lowStockThreshold || 0),
        isActive: item.mode !== 'hidden' && Boolean(item.isActive),
      })),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus((prev) => ({ ...prev, saving: true, error: '' }));

    try {
      const formError = validateForm();

      if (formError) {
        setStatus((prev) => ({ ...prev, saving: false, error: formError }));
        return;
      }

      const payload = buildPayload();

      if (isEditMode) {
        await updateAdminProduct(productId, payload);
      } else {
        const result = await createAdminProduct(payload);
        navigate(`/products/${result.productId}/edit`, { replace: true });
      }
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        saving: false,
        error: getApiErrorMessage(error),
      }));
      return;
    }

    setStatus((prev) => ({ ...prev, saving: false, error: '' }));
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl">
        <p className="text-xs uppercase  text-[#756c63]">
          Products
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          {pageTitle}
        </h2>
      </div>

      {status.error ? (
        <div className="rounded-[8px] border border-red-500/20 bg-red-50 px-4 py-4 text-sm text-red-700">
          {status.error}
        </div>
      ) : null}

      {status.loading ? (
        <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-8">
          Loading product...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {imageEditor ? (
            <AdminImageEditor
              file={imageEditor.file}
              onCancel={() => setImageEditor(null)}
              onUploadOriginal={async (file) => {
                const index = imageEditor.index;
                setImageEditor(null);
                await uploadMediaForRow(index, file);
              }}
              onApply={async (file, meta) => {
                const index = imageEditor.index;
                setImageEditor(null);
                await uploadMediaForRow(index, file, meta);
              }}
            />
          ) : null}

          <div className="grid gap-6 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl md:grid-cols-2">
            <select
              value={form.categoryId}
              onChange={(event) => handleField('categoryId', event.target.value)}
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {[
                    category.audience ? category.audience.toUpperCase() : '',
                    category.parentName ? `${category.parentName} / ${category.name}` : category.name,
                  ].filter(Boolean).join(' - ')}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={form.name}
              onChange={(event) => handleField('name', event.target.value)}
              placeholder="Product name"
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />
            {isEditMode ? (
              <input
                type="text"
                value={form.slug}
                onChange={(event) => handleField('slug', slugify(event.target.value))}
                placeholder="Slug"
                className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
              />
            ) : null}
            <select
              value={form.status}
              onChange={(event) => handleField('status', event.target.value)}
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="coming_soon">Coming Soon</option>
            </select>

            <input
              type="number"
              value={form.makingPrice}
              onChange={(event) => handleField('makingPrice', event.target.value)}
              placeholder="Making price"
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />
            <input
              type="number"
              value={form.deliveryPrice}
              onChange={(event) => handleField('deliveryPrice', event.target.value)}
              placeholder="Delivery price"
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />
            <input
              type="number"
              value={form.packingPrice}
              onChange={(event) => handleField('packingPrice', event.target.value)}
              placeholder="Packing price"
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />
            <input
              type="number"
              value={form.profitMargin}
              onChange={(event) => handleField('profitMargin', event.target.value)}
              placeholder="Profit margin"
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />
            <input
              type="number"
              value={form.costPrice}
              onChange={(event) => handleField('costPrice', event.target.value)}
              placeholder="Cost price"
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />
            <select
              value={form.mrpMode}
              onChange={(event) => handleField('mrpMode', event.target.value)}
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            >
              <option value="amount">MRP as amount</option>
              <option value="percentage">MRP as percentage</option>
            </select>
            <input
              type="number"
              value={form.mrpValue}
              onChange={(event) => handleField('mrpValue', event.target.value)}
              placeholder={
                form.mrpMode === 'percentage' ? 'MRP percentage above selling price' : 'MRP amount'
              }
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />
            <input
              type="number"
              value={form.roundedSellingPrice}
              onChange={(event) => handleField('roundedSellingPrice', event.target.value)}
              placeholder="Round-off final selling price (optional)"
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />
            <div className="md:col-span-2 grid gap-4 rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] p-4 md:grid-cols-2">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#756c63]">
                  Selling Price Before Gateway
                </p>
                <p className="mt-2 text-lg font-semibold text-[#171412]">
                  {pricingPreview.sellingPrice}
                </p>
              </div>
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#756c63]">
                  Payment Gateway Price
                </p>
                <p className="mt-2 text-lg font-semibold text-[#171412]">
                  {pricingPreview.paymentGatewayPrice}
                </p>
              </div>
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#756c63]">
                  Final Discount Selling Price
                </p>
                <p className="mt-2 text-lg font-semibold text-[#171412]">
                  {pricingPreview.finalSellingPrice}
                </p>
              </div>
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#756c63]">
                  Customer Visible MRP
                </p>
                <p className="mt-2 text-lg font-semibold text-[#171412]">
                  {pricingPreview.originalPrice}
                </p>
              </div>
            </div>
            <textarea
              value={form.shortDescription}
              onChange={(event) =>
                handleField('shortDescription', event.target.value)
              }
              placeholder="Short description"
              rows={3}
              className="md:col-span-2 rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />

            <textarea
              value={form.description}
              onChange={(event) => handleField('description', event.target.value)}
              placeholder="Description"
              rows={5}
              className="md:col-span-2 rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />

            <textarea
              value={form.materialDetails}
              onChange={(event) =>
                handleField('materialDetails', event.target.value)
              }
              placeholder="Material details"
              rows={4}
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />

            <textarea
              value={form.careDetails}
              onChange={(event) => handleField('careDetails', event.target.value)}
              placeholder="Care details"
              rows={4}
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />

            <textarea
              value={form.shippingNotes}
              onChange={(event) =>
                handleField('shippingNotes', event.target.value)
              }
              placeholder="Shipping notes"
              rows={4}
              className="md:col-span-2 rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />

            <input
              type="text"
              value={form.videoUrl}
              onChange={(event) => handleField('videoUrl', event.target.value)}
              placeholder="Video URL"
              className="md:col-span-2 rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />

            <input
              type="text"
              value={form.seoTitle}
              onChange={(event) => handleField('seoTitle', event.target.value)}
              placeholder="SEO title"
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />
            <input
              type="text"
              value={form.seoImage}
              onChange={(event) => handleField('seoImage', event.target.value)}
              placeholder="SEO image URL"
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />
            <textarea
              value={form.seoDescription}
              onChange={(event) =>
                handleField('seoDescription', event.target.value)
              }
              placeholder="SEO description"
              rows={3}
              className="md:col-span-2 rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />

            <label className="flex items-center gap-2 text-sm text-[#574f48]">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => handleField('isActive', event.target.checked)}
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-[#574f48]">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) =>
                  handleField('isFeatured', event.target.checked)
                }
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-[#574f48]">
              <input
                type="checkbox"
                checked={form.isTrending}
                onChange={(event) =>
                  handleField('isTrending', event.target.checked)
                }
              />
              Trending
            </label>
          </div>

          <div className="space-y-4 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-[#171412]">Media</h3>
              <button
                type="button"
                onClick={addImageRow}
                className="rounded-full border border-[#171412]/10 px-4 py-2 text-sm text-[#574f48] transition hover:bg-[#171412]/5"
              >
                Add Media
              </button>
            </div>

            {form.images.map((item, index) => (
              <div
                key={`image-${index}`}
                className="grid gap-4 rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] p-4 md:grid-cols-[160px_1fr_1fr]"
              >
                <div className="space-y-3 md:row-span-3">
                  <AdminMediaPreview
                    media={item}
                    alt={item.alt || form.name || 'Product media'}
                    className="aspect-square w-full"
                  />
                  <input
                    type="file"
                    accept="image/*,video/*,.avif,.webp,.heic,.heif,.svg,.tif,.tiff,.mp4,.mov,.m4v,.webm,.mkv,.avi"
                    onChange={(event) =>
                      handleUploadForRow(index, event.target.files?.[0])
                    }
                    className="w-full text-xs text-[#574f48] file:mr-3 file:rounded-full file:border-0 file:bg-[#171412] file:px-3 file:py-2 file:text-xs file:text-[#fffaf4]"
                  />
                  {uploadingIndex === index ? (
                    <p className="text-xs text-[#756c63]">Uploading...</p>
                  ) : null}
                </div>

                <select
                  value={item.type}
                  onChange={(event) =>
                    handleImageField(index, 'type', event.target.value)
                  }
                  className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>

                <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] px-4 py-3 text-xs leading-5 text-[#756c63] md:col-span-2">
                  {item.width && item.height ? (
                    <span>
                      {item.width} x {item.height}px
                    </span>
                  ) : (
                    <span>Auto preview keeps the full media visible</span>
                  )}
                  {item.format ? <span> | {String(item.format).toUpperCase()}</span> : null}
                  {item.sizeBytes ? <span> | {formatBytes(item.sizeBytes)}</span> : null}
                </div>

                <input
                  type="text"
                  value={item.url}
                  onChange={(event) =>
                    handleImageField(index, 'url', event.target.value)
                  }
                  placeholder="Media URL"
                  className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
                />

                <input
                  type="text"
                  value={item.alt}
                  onChange={(event) =>
                    handleImageField(index, 'alt', event.target.value)
                  }
                  placeholder="Alt text"
                  className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
                />

                <label className="flex items-center gap-2 text-sm text-[#574f48]">
                  <input
                    type="checkbox"
                    checked={item.isPrimary}
                    onChange={(event) =>
                      handleImageField(index, 'isPrimary', event.target.checked)
                    }
                  />
                  Primary
                </label>

                <label className="flex items-center gap-2 text-sm text-[#574f48]">
                  <input
                    type="checkbox"
                    checked={item.isSecondary}
                    onChange={(event) =>
                      handleImageField(index, 'isSecondary', event.target.checked)
                    }
                  />
                  Secondary
                </label>

                <button
                  type="button"
                  onClick={() => removeImageRow(index)}
                  className="rounded-full border border-[#171412]/10 px-4 py-2 text-sm text-red-700 transition hover:bg-red-50 md:col-span-2"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-4 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl">
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold text-[#171412]">Sizes & Stock</h3>
              <p className="text-sm text-[#756c63]">
                Use stock for purchasable sizes, notify for request-only sizes, and hidden to remove a size from customers.
              </p>
            </div>

            <div className="hidden grid-cols-[1fr_160px_1fr_1fr_1fr] gap-4 px-1 text-xs uppercase text-[#756c63] md:grid">
              <span>Size</span>
              <span>Mode</span>
              <span>Total stock</span>
              <span>Low stock alert</span>
              <span>Visibility</span>
            </div>

            {form.sizes.map((item, index) => (
              <div
                key={`size-${index}`}
                className="grid gap-4 rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] p-4 md:grid-cols-[1fr_160px_1fr_1fr_1fr]"
              >
                <label className="space-y-2 text-xs uppercase text-[#756c63] md:space-y-0">
                  <span className="md:hidden">Size</span>
                  <input
                    type="text"
                    value={item.size}
                    readOnly
                    className="w-full rounded-[8px] border border-[#171412]/10 bg-[#ede8df] px-4 py-3 text-sm text-[#171412] outline-none"
                  />
                </label>

                <label className="space-y-2 text-xs uppercase text-[#756c63] md:space-y-0">
                  <span className="md:hidden">Mode</span>
                  <select
                    value={item.mode || 'hidden'}
                    onChange={(event) =>
                      handleSizeField(index, 'mode', event.target.value)
                    }
                    className="w-full rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] px-4 py-3 text-sm text-[#171412] outline-none"
                  >
                    <option value="hidden">Hidden</option>
                    <option value="stock">Add stock</option>
                    <option value="notify">Notify me</option>
                  </select>
                </label>

                <label className="space-y-2 text-xs uppercase text-[#756c63] md:space-y-0">
                  <span className="md:hidden">Total stock</span>
                  <input
                    type="number"
                    value={item.stockQty}
                    onChange={(event) =>
                      handleSizeField(index, 'stockQty', event.target.value)
                    }
                    placeholder="Total stock"
                    disabled={item.mode !== 'stock'}
                    className="w-full rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] px-4 py-3 text-sm text-[#171412] outline-none disabled:opacity-50"
                  />
                </label>

                <label className="space-y-2 text-xs uppercase text-[#756c63] md:space-y-0">
                  <span className="md:hidden">Low stock alert</span>
                  <input
                    type="number"
                    value={item.lowStockThreshold}
                    onChange={(event) =>
                      handleSizeField(index, 'lowStockThreshold', event.target.value)
                    }
                    placeholder="Alert at"
                    disabled={item.mode !== 'stock'}
                    className="w-full rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] px-4 py-3 text-sm text-[#171412] outline-none disabled:opacity-50"
                  />
                </label>

                <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] px-4 py-3 text-sm text-[#574f48]">
                  {item.mode === 'stock'
                    ? `Customers can buy this size. Reserved: ${item.reservedQty || 0}`
                    : item.mode === 'notify'
                      ? 'Customers can request notify for this size.'
                      : 'This size stays hidden from customers.'}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={status.saving}
            className="rounded-full bg-[#171412] px-6 py-3 text-sm font-medium text-[#fffaf4] transition hover:bg-[#8f3d2f] disabled:opacity-60"
          >
            {status.saving ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
          </button>
        </form>
      )}
    </section>
  );
}
