import { useMemo } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { collectionAudiences } from '../../../config/collection-taxonomy';

const availabilityOptions = [
  { value: 'all', label: 'All' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'coming_soon', label: 'Coming Soon' },
];

const sortOptions = [
  { value: 'latest', label: 'Recommended' },
  { value: 'price_low_to_high', label: 'Price: Low to High' },
  { value: 'price_high_to_low', label: 'Price: High to Low' },
  { value: 'average', label: 'Customer Rating' },
];

export default function CollectionFilters({
  filters,
  categories = [],
  onChange,
  onReset,
  tone = 'dark',
  mode = 'sidebar',
}) {
  const isLight = tone === 'light';
  const categoryOptions = categories;
  const activeSummary = useMemo(
    () =>
      [
        filters.audience
          ? `Collection: ${collectionAudiences.find((item) => item.value === filters.audience)?.label || filters.audience}`
          : '',
        filters.category
          ? `Category: ${categoryOptions.find((category) => category.value === filters.category)?.label || filters.category}`
          : '',
        filters.availability !== 'all'
          ? `Stock: ${availabilityOptions.find((option) => option.value === filters.availability)?.label || filters.availability}`
          : '',
      ].filter(Boolean),
    [categoryOptions, filters.audience, filters.availability, filters.category]
  );
  const containerClass = isLight
    ? mode === 'sidebar'
      ? 'rounded-[4px] border border-[#e9e9ed] bg-white'
      : 'rounded-[18px] bg-white'
    : 'border border-border-soft bg-background-elevated';
  const labelClass = isLight
    ? 'text-xs font-bold uppercase tracking-[0.08em] text-[#282c3f]'
    : 'text-xs font-bold uppercase tracking-[0.08em] text-foreground-primary';
  const sectionClass = isLight ? 'border-t border-[#edebf0] px-4 py-4' : 'border-t border-border-soft px-4 py-4';
  const selectClass = isLight
    ? 'mt-3 w-full rounded-[4px] border border-[#d4d5d9] bg-white px-3 py-2.5 text-sm text-[#282c3f] outline-none transition focus:border-[#ff3f6c]'
    : 'mt-3 w-full border border-border-strong bg-transparent px-3 py-2.5 text-sm text-foreground-primary outline-none transition placeholder:text-foreground-muted focus:border-accent-primary';

  return (
    <aside className={containerClass}>
      <div className={isLight ? 'flex items-center justify-between px-4 py-4' : 'flex items-center justify-between px-4 py-4'}>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className={isLight ? 'text-[#282c3f]' : 'text-foreground-primary'} />
          <h2 className={labelClass}>Filters</h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          className={isLight ? 'text-xs font-semibold uppercase tracking-[0.08em] text-[#ff3f6c]' : 'text-xs font-semibold uppercase tracking-[0.08em] text-accent-primary'}
        >
          Clear
        </button>
      </div>

      {mode === 'drawer' && activeSummary.length ? (
        <p className={isLight ? 'px-4 pb-4 text-xs leading-5 text-[#7e818c]' : 'px-4 pb-4 text-xs leading-5 text-foreground-muted'}>
          {activeSummary.join(' / ')}
        </p>
      ) : null}

      <div className={sectionClass}>
        <div className="flex items-center justify-between gap-3">
          <span className={labelClass}>Collection</span>
          <ChevronDown size={14} className={isLight ? 'text-[#7e818c]' : 'text-foreground-muted'} />
        </div>
        <select
          value={filters.audience}
          onChange={(event) => onChange('audience', event.target.value)}
          className={selectClass}
        >
          <option value="">All Collections</option>
          {collectionAudiences.map((audience) => (
            <option key={audience.value} value={audience.value}>
              {audience.label}{audience.status ? ` - ${audience.status}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className={sectionClass}>
        <div className="flex items-center justify-between gap-3">
          <span className={labelClass}>Categories</span>
          <ChevronDown size={14} className={isLight ? 'text-[#7e818c]' : 'text-foreground-muted'} />
        </div>
        <select
          value={filters.category}
          onChange={(event) => onChange('category', event.target.value)}
          className={selectClass}
        >
          <option value="">All Categories</option>
          {categoryOptions.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div className={sectionClass}>
        <div className="flex items-center justify-between gap-3">
          <span className={labelClass}>Availability</span>
          <ChevronDown size={14} className={isLight ? 'text-[#7e818c]' : 'text-foreground-muted'} />
        </div>
        <select
          value={filters.availability}
          onChange={(event) => onChange('availability', event.target.value)}
          className={selectClass}
        >
          {availabilityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {mode === 'drawer' ? (
        <div className={sectionClass}>
          <div className="flex items-center justify-between gap-3">
            <span className={labelClass}>Sort</span>
            <ChevronDown size={14} className={isLight ? 'text-[#7e818c]' : 'text-foreground-muted'} />
          </div>
          <select
            value={filters.sort}
            onChange={(event) => onChange('sort', event.target.value)}
            className={selectClass}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </aside>
  );
}
