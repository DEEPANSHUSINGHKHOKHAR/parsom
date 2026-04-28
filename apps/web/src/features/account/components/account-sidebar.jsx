const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'orders', label: 'Orders' },
  { key: 'addresses', label: 'Addresses' },
  { key: 'wishlist', label: 'Wishlist' },
  { key: 'notify', label: 'Notify Requests' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'security', label: 'Change Password' },
];

export default function AccountSidebar({ activeTab, onChange }) {
  return (
    <aside className="border border-border-soft bg-background-elevated p-4 lg:sticky lg:top-32">
      <p className="mb-4 text-label text-accent-primary">Dashboard</p>

      <div className="grid gap-2 sm:grid-cols-2 lg:block lg:space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`w-full px-4 py-3 text-left text-label transition ${
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
