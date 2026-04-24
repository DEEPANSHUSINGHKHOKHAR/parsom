const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'orders', label: 'Orders' },
  { key: 'addresses', label: 'Addresses' },
  { key: 'wishlist', label: 'Wishlist' },
  { key: 'notify', label: 'Notify Requests' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'invoices', label: 'Invoices' },
];

export default function AccountSidebar({ activeTab, onChange }) {
  return (
    <aside className="border border-border-soft bg-background-elevated p-5">
      <p className="mb-5 text-label text-accent-primary">Dashboard</p>

      <div className="space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`w-full px-4 py-4 text-left text-label transition ${
              activeTab === tab.key
                ? 'bg-accent-primary text-background-base'
                : 'border border-border-soft bg-background-panel text-foreground-secondary hover:border-accent-primary hover:text-foreground-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
