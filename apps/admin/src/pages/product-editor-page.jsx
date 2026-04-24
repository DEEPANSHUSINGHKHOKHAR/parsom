import { useEffect, useMemo, useState } from 'react';
import { uploadAdminMedia } from '../services/admin-tools-service';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createAdminProduct,
  fetchAdminProductById,
  updateAdminProduct,
} from '../services/admin-products-service';
import { fetchAdminCategories } from '../services/admin-categories-service';

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
  sizes: [
    {
      size: 'S',
      stockQty: 0,
      reservedQty: 0,
      lowStockThreshold: 3,
      isActive: true,
    },
  ],
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
  const handleUploadForRow = async (index, file) => {
  if (!file) return;

  setUploadingIndex(index);
  setStatus((prev) => ({ ...prev, error: '' }));

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
          sizes: Array.isArray(data?.sizes) && data.sizes.length > 0
            ? data.sizes.map((item) => ({
                size: item.size || '',
                stockQty: item.stockQty ?? 0,
                reservedQty: item.reservedQty ?? 0,
                lowStockThreshold: item.lowStockThreshold ?? 3,
                isActive: Boolean(item.isActive),
              }))
            : initialForm.sizes,
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

  const handleField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'name' && !prev.slug ? { slug: slugify(value) } : {}),
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

  const addSizeRow = () => {
    setForm((prev) => ({
      ...prev,
      sizes: [
        ...prev.sizes,
        {
          size: '',
          stockQty: 0,
          reservedQty: 0,
          lowStockThreshold: 3,
          isActive: true,
        },
      ],
    }));
  };

  const removeSizeRow = (index) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const validateForm = () => {
    if (!form.categoryId) return 'Choose a category.';
    if (!form.name.trim()) return 'Product name is required.';
    if (!form.slug.trim()) return 'Product slug is required.';
    if (form.price === '' || Number.isNaN(Number(form.price))) {
      return 'Price is required.';
    }
    if (Number(form.price) < 0) return 'Price cannot be negative.';
    if (form.discountPrice !== '' && Number(form.discountPrice) < 0) {
      return 'Discount price cannot be negative.';
    }
    if (form.costPrice !== '' && Number(form.costPrice) < 0) {
      return 'Cost price cannot be negative.';
    }

    const validSizes = form.sizes.filter((item) => item.size.trim());
    if (validSizes.length === 0) return 'Add at least one size.';

    return '';
  };

  const buildPayload = () => ({
    categoryId: Number(form.categoryId),
    name: form.name,
    slug: form.slug,
    shortDescription: form.shortDescription || undefined,
    description: form.description || undefined,
    materialDetails: form.materialDetails || undefined,
    careDetails: form.careDetails || undefined,
    shippingNotes: form.shippingNotes || undefined,
    price: Number(form.price),
    discountPrice:
      form.discountPrice === '' ? undefined : Number(form.discountPrice),
    costPrice: form.costPrice === '' ? undefined : Number(form.costPrice),
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
      .map((item) => ({
        type: item.type,
        url: item.url,
        alt: item.alt || undefined,
        isPrimary: Boolean(item.isPrimary),
        isSecondary: Boolean(item.isSecondary),
        sortOrder: Number(item.sortOrder || 0),
      })),
    sizes: form.sizes
      .filter((item) => item.size.trim())
      .map((item) => ({
        size: item.size,
        stockQty: Number(item.stockQty || 0),
        reservedQty: Number(item.reservedQty || 0),
        lowStockThreshold: Number(item.lowStockThreshold || 0),
        isActive: Boolean(item.isActive),
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
                  {category.name}
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
            <input
              type="text"
              value={form.slug}
              onChange={(event) => handleField('slug', event.target.value)}
              placeholder="Slug"
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />
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
              value={form.price}
              onChange={(event) => handleField('price', event.target.value)}
              placeholder="Price"
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />
            <input
              type="number"
              value={form.discountPrice}
              onChange={(event) => handleField('discountPrice', event.target.value)}
              placeholder="Discount price"
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />
            <input
              type="number"
              value={form.costPrice}
              onChange={(event) => handleField('costPrice', event.target.value)}
              placeholder="Cost price"
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />
            <input
              type="number"
              value={form.sortOrder}
              onChange={(event) => handleField('sortOrder', event.target.value)}
              placeholder="Sort order"
              className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            />

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
                className="grid gap-4 rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] p-4 md:grid-cols-3"
              >
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

                <input
                  type="number"
                  value={item.sortOrder}
                  onChange={(event) =>
                    handleImageField(index, 'sortOrder', event.target.value)
                  }
                  placeholder="Sort order"
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
                  className="rounded-full border border-[#171412]/10 px-4 py-2 text-sm text-red-700 transition hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-4 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-[#171412]">Sizes & Stock</h3>
              <button
                type="button"
                onClick={addSizeRow}
                className="rounded-full border border-[#171412]/10 px-4 py-2 text-sm text-[#574f48] transition hover:bg-[#171412]/5"
              >
                Add Size
              </button>
            </div>

            {form.sizes.map((item, index) => (
              <div
                key={`size-${index}`}
                className="grid gap-4 rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] p-4 md:grid-cols-5"
              >
                <input
                  type="text"
                  value={item.size}
                  onChange={(event) =>
                    handleSizeField(index, 'size', event.target.value)
                  }
                  placeholder="Size"
                  className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
                />

                <input
                  type="number"
                  value={item.stockQty}
                  onChange={(event) =>
                    handleSizeField(index, 'stockQty', event.target.value)
                  }
                  placeholder="Stock qty"
                  className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
                />

                <input
                  type="number"
                  value={item.reservedQty}
                  onChange={(event) =>
                    handleSizeField(index, 'reservedQty', event.target.value)
                  }
                  placeholder="Reserved qty"
                  className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
                />

                <input
                  type="number"
                  value={item.lowStockThreshold}
                  onChange={(event) =>
                    handleSizeField(index, 'lowStockThreshold', event.target.value)
                  }
                  placeholder="Low stock threshold"
                  className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
                />

                <label className="flex items-center gap-2 text-sm text-[#574f48]">
                  <input
                    type="checkbox"
                    checked={item.isActive}
                    onChange={(event) =>
                      handleSizeField(index, 'isActive', event.target.checked)
                    }
                  />
                  Active
                </label>

                <button
                  type="button"
                  onClick={() => removeSizeRow(index)}
                  className="rounded-full border border-[#171412]/10 px-4 py-2 text-sm text-red-700 transition hover:bg-red-50 md:col-span-5"
                >
                  Remove Size
                </button>
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
