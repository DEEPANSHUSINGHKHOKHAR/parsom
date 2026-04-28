import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpDown, SlidersHorizontal, X } from 'lucide-react';
import PageShell from '../components/layout/page-shell';
import LoadingState from '../components/ui/loading-state';
import EmptyState from '../components/ui/empty-state';
import PriceBlock from '../components/ui/price-block';
import MediaPlaceholder from '../components/ui/media-placeholder';
import ProductCard, { ProductRating } from '../features/collection/components/product-card';
import CollectionFilters from '../features/collection/components/collection-filters';
import { fetchProducts } from '../services/products-service';
import { collectionAudiences } from '../config/collection-taxonomy';
import VelocityBanner from '../components/sections/velocity-banner';

const initialFilters = {
  search: '',
  audience: '',
  category: '',
  availability: 'all',
  sort: 'latest',
};

const sortOptions = [
  { value: 'latest', label: 'Recommended' },
  { value: 'price_low_to_high', label: 'Price: Low to High' },
  { value: 'price_high_to_low', label: 'Price: High to Low' },
  { value: 'average', label: 'Customer Rating' },
];

const getFiltersFromSearch = (searchParams) => ({
  ...initialFilters,
  audience: searchParams.get('audience') || '',
  category: searchParams.get('category') || '',
  availability: searchParams.get('availability') || 'all',
  sort: searchParams.get('sort') || 'latest',
});

const getFilterLabel = (options, value) =>
  options.find((option) => option.value === value)?.label || value;

function ProductQuickPreview({ product, onClose }) {
  if (!product) return null;
  const availableSizes = Array.isArray(product.availableSizes) ? product.availableSizes : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[#171412]/55 px-3 pb-3 pt-16 backdrop-blur-sm md:hidden">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close product preview"
      />

      <div className="relative w-full overflow-hidden rounded-[8px] border border-[#ded5ca] bg-[#fffaf4] shadow-[0_24px_70px_rgba(23,20,18,0.28)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-[#fffaf4]/90 text-[#171412] shadow-[0_8px_20px_rgba(23,20,18,0.12)]"
          aria-label="Close product preview"
        >
          <X size={17} />
        </button>

        <div className="grid grid-cols-[42%_1fr]">
          <div className="relative min-h-56 bg-[#ede8df]">
            {product.primaryImage ? (
              <img
                src={product.primaryImage}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <MediaPlaceholder
                label="Product image unavailable"
                className="absolute inset-0 bg-[#ede8df] text-[#756c63]"
              />
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-4 p-4">
            <div className="space-y-2">
              <h3 className="line-clamp-3 text-lg font-semibold leading-6 text-[#171412]">
                {product.name || 'Product'}
              </h3>
              <ProductRating
                rating={product.avgRating}
                count={product.reviewCount}
                tone="light"
                compact
              />
              <div className="flex flex-wrap items-center gap-1.5 text-[#756c63]">
                <span className="text-[0.62rem] uppercase tracking-[0.16em]">Size</span>
                {availableSizes.length ? (
                  availableSizes.slice(0, 4).map((size) => (
                    <span
                      key={size}
                      className="rounded-full border border-[#ded5ca] bg-[#f6f0e8] px-2 py-1 text-[0.65rem] font-medium text-[#574f48]"
                    >
                      {size}
                    </span>
                  ))
                ) : (
                  <span className="text-[0.68rem]">Check details</span>
                )}
              </div>
              <p className="line-clamp-2 text-xs leading-5 text-[#756c63]">
                {product.shortDescription || 'Open the full product preview for all details.'}
              </p>
            </div>

            <div className="space-y-3">
              <PriceBlock
                tone="light"
                price={product.discountPrice ?? product.price}
                originalPrice={product.originalPrice}
                className="flex-wrap gap-x-2 gap-y-1 [&_span:first-child]:text-lg [&_span:last-child]:text-sm"
              />

              <Link
                to={`/products/${product.slug}`}
                className="flex h-10 w-full items-center justify-center rounded-full border border-[#8f3d2f] bg-[#8f3d2f] px-4 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-[0_10px_22px_rgba(143,61,47,0.24)]"
              >
                View Product
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileFilterDrawer({
  isOpen,
  filters,
  categories,
  onChange,
  onReset,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#171412]/40 md:hidden">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close filters"
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-[24px] bg-[#f8f8fa] pb-6 shadow-[0_-16px_40px_rgba(23,20,18,0.24)]">
        <div className="sticky top-0 flex items-center justify-between border-b border-[#e9e9ed] bg-white px-4 py-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[#282c3f]">Filter</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-[#f3f3f5] text-[#282c3f]"
            aria-label="Close filters"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 pt-4">
          <CollectionFilters
            filters={filters}
            categories={categories}
            onChange={onChange}
            onReset={onReset}
            tone="light"
            mode="drawer"
          />
        </div>

        <div className="mt-4 flex gap-3 px-4">
          <button
            type="button"
            onClick={onReset}
            className="flex h-12 flex-1 items-center justify-center rounded-[10px] border border-[#d4d5d9] bg-white text-sm font-semibold uppercase tracking-[0.08em] text-[#282c3f]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 flex-1 items-center justify-center rounded-[10px] bg-[#ff3f6c] text-sm font-semibold uppercase tracking-[0.08em] text-white"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CollectionPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => getFiltersFromSearch(searchParams));
  const [previewProduct, setPreviewProduct] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [state, setState] = useState({
    loading: true,
    error: '',
    items: [],
    categories: [],
  });

  useEffect(() => {
    setFilters(getFiltersFromSearch(searchParams));
  }, [searchParams]);

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      setState((prev) => ({ ...prev, loading: true, error: '' }));

      try {
        const response = await fetchProducts({
          search: filters.search || undefined,
          category: filters.category || undefined,
          availability: filters.availability !== 'all' ? filters.availability : undefined,
          sort: filters.sort,
        });

        if (ignore) return;

        const categories = Array.isArray(response.filters?.categories)
          ? response.filters.categories.map((category) => ({
              value: category.value ?? category.slug ?? category.id ?? '',
              label: category.label ?? category.name ?? 'Category',
              audience: category.audience || 'women',
              parentId: category.parentId || null,
              parentName: category.parentName || '',
              badge: category.badge || '',
            }))
          : [];

        setState({
          loading: false,
          error: '',
          items: Array.isArray(response.items) ? response.items : [],
          categories,
        });
      } catch (error) {
        if (ignore) return;
        setState({
          loading: false,
          error: error?.response?.data?.message || 'Unable to load collection right now.',
          items: [],
          categories: [],
        });
      }
    };

    loadProducts();
    return () => {
      ignore = true;
    };
  }, [filters]);

  const resultLabel = useMemo(() => {
    if (state.loading) return 'Loading collection';
    return `${state.items.length} item${state.items.length === 1 ? '' : 's'}`;
  }, [state.items.length, state.loading]);

  const activeChips = useMemo(
    () =>
      [
        filters.audience ? getFilterLabel(collectionAudiences, filters.audience) : '',
        filters.category ? getFilterLabel(state.categories, filters.category) : '',
        filters.availability !== 'all' ? filters.availability.replaceAll('_', ' ') : '',
      ].filter(Boolean),
    [filters.audience, filters.availability, filters.category, state.categories]
  );

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      if (field === 'audience') {
        return {
          ...prev,
          audience: value,
          availability: value === 'men' || value === 'kids' ? 'coming_soon' : prev.availability,
        };
      }

      return { ...prev, [field]: value };
    });
  };

  return (
    <PageShell tone="light">
      <section className="min-h-screen bg-[#fafbfc] pb-24 md:pb-12">
        <VelocityBanner />
        <div className="mx-auto max-w-[1540px] px-3 py-4 sm:px-4 lg:px-8">
          <div className="border-b border-transparent pb-2">
            <p className="text-sm text-[#696b79]">
              Home / Clothing / <span className="font-semibold text-[#282c3f]">Collection</span>
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              <h1 className="text-[1.65rem] font-bold text-[#282c3f]">Collection</h1>
              <span className="text-[1.65rem] text-[#94969f]">{resultLabel}</span>
            </div>
          </div>

          <div className="mt-4 hidden items-center justify-between border-b border-[#e9e9ed] pb-3 lg:flex">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold uppercase tracking-[0.08em] text-[#282c3f]">Filters</span>
              <div className="flex flex-wrap gap-2">
                {activeChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-[#d4d5d9] bg-white px-3 py-1 text-xs font-medium capitalize text-[#535766]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-[4px] border border-[#d4d5d9] bg-white px-4 py-3 text-sm text-[#282c3f]">
              <span className="font-medium">Sort by :</span>
              <select
                value={filters.sort}
                onChange={(event) => handleFilterChange('sort', event.target.value)}
                className="bg-transparent font-semibold outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-6 lg:grid-cols-[252px_minmax(0,1fr)]">
            <div className="hidden lg:block">
              <CollectionFilters
                filters={filters}
                categories={state.categories}
                onChange={handleFilterChange}
                onReset={() => setFilters(initialFilters)}
                tone="light"
                mode="sidebar"
              />
            </div>

            <div>
              {state.loading ? (
                <LoadingState label="Loading collection..." />
              ) : state.error ? (
                <EmptyState title="Collection unavailable" description={state.error} />
              ) : state.items.length === 0 ? (
                <EmptyState
                  title="No products matched these filters"
                  description="Try adjusting the category, availability, or sorting."
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-7 xl:grid-cols-4"
                >
                  {state.items.map((product) => (
                    <ProductCard
                      key={product.id || product.slug}
                      product={product}
                      tone="light"
                      compact
                      onQuickPreview={setPreviewProduct}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e9e9ed] bg-white shadow-[0_-8px_24px_rgba(23,20,18,0.08)] lg:hidden">
          <div className="grid grid-cols-2">
            <label className="relative flex h-14 items-center justify-center gap-2 border-r border-[#e9e9ed] text-sm font-semibold uppercase tracking-[0.08em] text-[#282c3f]">
              <ArrowUpDown size={16} />
              <span>Sort</span>
              <select
                value={filters.sort}
                onChange={(event) => handleFilterChange('sort', event.target.value)}
                className="absolute inset-0 opacity-0"
                aria-label="Sort products"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="flex h-14 items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#282c3f]"
            >
              <SlidersHorizontal size={16} />
              Filter
            </button>
          </div>
        </div>
      </section>

      <MobileFilterDrawer
        isOpen={mobileFiltersOpen}
        filters={filters}
        categories={state.categories}
        onChange={handleFilterChange}
        onReset={() => setFilters(initialFilters)}
        onClose={() => setMobileFiltersOpen(false)}
      />

      <ProductQuickPreview
        product={previewProduct}
        onClose={() => setPreviewProduct(null)}
      />
    </PageShell>
  );
}
