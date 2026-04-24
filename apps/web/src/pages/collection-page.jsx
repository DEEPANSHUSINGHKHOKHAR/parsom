import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageShell from '../components/layout/page-shell';
import LoadingState from '../components/ui/loading-state';
import EmptyState from '../components/ui/empty-state';
import ProductCard from '../features/collection/components/product-card';
import CollectionFilters from '../features/collection/components/collection-filters';
import { fetchProducts } from '../services/products-service';

const initialFilters = {
  search: '',
  category: '',
  availability: 'all',
  sort: 'latest',
};

export default function CollectionPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [state, setState] = useState({
    loading: true,
    error: '',
    items: [],
    categories: [],
  });

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
    return `${state.items.length} item${state.items.length === 1 ? '' : 's'} found`;
  }, [state.items.length, state.loading]);

  return (
    <PageShell>
      <section className="min-h-screen bg-background-base pb-24 pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="mb-12">
            <span className="mb-4 block text-label text-accent-primary">Shop</span>
            <h1 className="text-display-1 text-foreground-primary">Collection Archive</h1>
            <p className="mt-6 max-w-2xl text-body-lg text-foreground-secondary">
              Filter the archive by category, availability, and search to find the right piece.
            </p>
          </header>

          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <CollectionFilters
                filters={filters}
                categories={state.categories}
                onChange={(field, value) => setFilters((prev) => ({ ...prev, [field]: value }))}
                onReset={() => setFilters(initialFilters)}
              />
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border-soft py-5">
                <p className="text-label text-foreground-muted">{resultLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {filters.category ? (
                    <span className="border border-border-soft px-4 py-2 text-label text-foreground-secondary">
                      {filters.category}
                    </span>
                  ) : null}
                  {filters.availability !== 'all' ? (
                    <span className="border border-border-soft px-4 py-2 text-label text-foreground-secondary">
                      {filters.availability}
                    </span>
                  ) : null}
                </div>
              </div>

              {state.loading ? (
                <LoadingState label="Loading collection..." />
              ) : state.error ? (
                <EmptyState title="Collection unavailable" description={state.error} />
              ) : state.items.length === 0 ? (
                <EmptyState
                  title="No products matched these filters"
                  description="Try adjusting the search, category, availability, or sorting."
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid gap-8 md:grid-cols-2 xl:grid-cols-3"
                >
                  {state.items.map((product) => (
                    <ProductCard key={product.id || product.slug} product={product} />
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
