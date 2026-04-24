export default function CollectionFilters({
  filters,
  categories,
  onChange,
  onReset,
}) {
  return (
    <aside className="border border-border-soft bg-background-elevated p-5 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-label text-foreground-primary">
          Filters
        </h2>

        <button
          type="button"
          onClick={onReset}
          className="text-label text-foreground-muted transition hover:text-foreground-primary"
        >
          Reset
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-label text-foreground-muted">
            Search
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(event) => onChange('search', event.target.value)}
            placeholder="Search collection"
            className="w-full border-b border-border-strong bg-transparent px-0 py-3 text-sm text-foreground-primary outline-none transition placeholder:text-foreground-muted focus:border-accent-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-label text-foreground-muted">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(event) => onChange('category', event.target.value)}
            className="w-full border-b border-border-strong bg-background-elevated px-0 py-3 text-sm text-foreground-primary outline-none transition focus:border-accent-primary"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-label text-foreground-muted">
            Availability
          </label>
          <select
            value={filters.availability}
            onChange={(event) => onChange('availability', event.target.value)}
            className="w-full border-b border-border-strong bg-background-elevated px-0 py-3 text-sm text-foreground-primary outline-none transition focus:border-accent-primary"
          >
            <option value="all">All</option>
            <option value="in_stock">In Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="coming_soon">Coming Soon</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-label text-foreground-muted">
            Sort
          </label>
          <select
            value={filters.sort}
            onChange={(event) => onChange('sort', event.target.value)}
            className="w-full border-b border-border-strong bg-background-elevated px-0 py-3 text-sm text-foreground-primary outline-none transition focus:border-accent-primary"
          >
            <option value="latest">Latest</option>
            <option value="price_low_to_high">Price: Low to High</option>
            <option value="price_high_to_low">Price: High to Low</option>
            <option value="average">Average</option>
          </select>
        </div>
      </div>
    </aside>
  );
}
