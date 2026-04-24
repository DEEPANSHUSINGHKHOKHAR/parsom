import PageShell from '../components/layout/page-shell';

const rows = [
  { size: 'XS', chest: '34-36', waist: '28-30', length: '26' },
  { size: 'S', chest: '36-38', waist: '30-32', length: '27' },
  { size: 'M', chest: '38-40', waist: '32-34', length: '28' },
  { size: 'L', chest: '40-42', waist: '34-36', length: '29' },
  { size: 'XL', chest: '42-44', waist: '36-38', length: '30' },
];

export default function SizeChartPage() {
  return (
    <PageShell>
      <section className="bg-background-base pb-24 pt-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="border border-border-soft bg-background-elevated p-8 md:p-12">
            <p className="text-label text-accent-primary">Fit Guide</p>
            <h1 className="mt-4 text-display-2 text-foreground-primary">Size Chart</h1>
            <p className="mt-6 max-w-3xl text-body text-foreground-secondary">
              Use this as a starter size guide for your clothing brand. You can later replace these values with your exact garment measurements.
            </p>
          </div>

          <div className="mt-10 overflow-hidden border border-border-soft bg-background-elevated">
            <table className="min-w-full text-left">
              <thead className="border-b border-border-soft bg-background-panel">
                <tr>
                  <th className="px-6 py-4 text-label text-foreground-muted">Size</th>
                  <th className="px-6 py-4 text-label text-foreground-muted">Chest (in)</th>
                  <th className="px-6 py-4 text-label text-foreground-muted">Waist (in)</th>
                  <th className="px-6 py-4 text-label text-foreground-muted">Length (in)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.size} className="border-b border-border-soft">
                    <td className="px-6 py-4 text-foreground-primary">{row.size}</td>
                    <td className="px-6 py-4 text-foreground-secondary">{row.chest}</td>
                    <td className="px-6 py-4 text-foreground-secondary">{row.waist}</td>
                    <td className="px-6 py-4 text-foreground-secondary">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
