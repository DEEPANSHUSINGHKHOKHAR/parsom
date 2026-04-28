import { Ruler, Shirt, Sparkles } from 'lucide-react';
import PageShell from '../components/layout/page-shell';
import {
  fitTips,
  kurtaTopRows,
  measurementNotes,
  pantRows,
  sizeGuideImage,
} from '../config/size-chart';

function SizeTable({ title, subtitle, columns, rows }) {
  return (
    <section className="min-w-0 overflow-hidden border border-border-soft bg-background-elevated">
      <div className="flex flex-col gap-3 border-b border-border-soft bg-background-panel px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="text-label text-accent-primary">{subtitle}</p>
          <h2 className="mt-2 text-display-3 text-foreground-primary">{title}</h2>
        </div>
        <p className="text-body-sm text-foreground-muted">Measurements in inches</p>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-background-base">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="whitespace-nowrap border-b border-border-soft px-4 py-4 text-label text-foreground-muted sm:px-5"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.size} className="border-b border-border-soft last:border-b-0">
                {columns.map((column) => (
                  <td
                    key={`${row.size}-${column.key}`}
                    className={`whitespace-nowrap px-4 py-4 text-body-sm sm:px-5 ${
                      column.key === 'size'
                        ? 'font-semibold text-foreground-primary'
                        : 'text-foreground-secondary'
                    }`}
                  >
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const kurtaColumns = [
  { key: 'size', label: 'Size' },
  { key: 'bust', label: 'Bust' },
  { key: 'upperWaist', label: 'Upper Waist' },
  { key: 'lowerWaist', label: 'Lower Waist' },
  { key: 'hip', label: 'Hip' },
  { key: 'armhole', label: 'Armhole' },
];

const pantColumns = [
  { key: 'size', label: 'Size' },
  { key: 'waistRelaxed', label: 'Waist Relaxed' },
  { key: 'waistStretched', label: 'Waist Stretched' },
  { key: 'hip', label: 'Hip' },
  { key: 'length', label: 'Length' },
  { key: 'cuff', label: 'Cuff' },
];

export default function SizeChartPage() {
  return (
    <PageShell>
      <section className="overflow-x-hidden bg-background-base pb-20 pt-6 md:pt-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid min-w-0 items-end gap-6 border-b border-border-soft pb-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
            <div className="min-w-0">
              <p className="text-label text-accent-primary">Fit Guide</p>
              <h1 className="mt-4 max-w-full break-words font-display text-[2.35rem] leading-none text-foreground-primary sm:text-display-2">
                Women's Size Guide
              </h1>
              <p className="mt-5 max-w-3xl text-body text-foreground-secondary">
                Find your PARSOM fit for kurtas, tops, pants, and co-ord sets.
                Measure close to the body, then choose the garment size that gives
                your preferred comfort and drape.
              </p>
            </div>

            <div className="grid min-w-0 grid-cols-3 gap-2 text-center sm:gap-3">
              {[
                { icon: Ruler, label: 'Inches' },
                { icon: Shirt, label: 'Kurta + Pant' },
                { icon: Sparkles, label: 'Relaxed Fit' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="min-w-0 border border-border-soft bg-background-elevated px-2 py-4 sm:px-3"
                >
                  <item.icon className="mx-auto h-5 w-5 text-accent-primary" />
                  <p className="mt-3 break-words text-[0.62rem] font-medium uppercase leading-tight tracking-[0.08em] text-foreground-secondary sm:text-[0.68rem] sm:tracking-[0.16em]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <figure className="overflow-hidden border border-border-soft bg-[#f6efe5] lg:self-start">
              <img
                src={sizeGuideImage}
                alt="Women's kurta and pant measurement guide"
                className="block h-auto w-full object-contain"
                width="1024"
                height="1467"
              />
            </figure>

            <div className="min-w-0 space-y-8">
              <SizeTable
                title="Kurta / Top"
                subtitle="Body + garment guide"
                columns={kurtaColumns}
                rows={kurtaTopRows}
              />

              <SizeTable
                title="Pant"
                subtitle="Bottom wear guide"
                columns={pantColumns}
                rows={pantRows}
              />
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="border border-border-soft bg-background-elevated p-6 md:p-8">
              <p className="text-label text-accent-primary">How To Measure</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {measurementNotes.map((note) => (
                  <div key={note.term} className="border border-border-soft bg-background-panel p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground-primary">
                      {note.term}
                    </h3>
                    <p className="mt-2 text-body-sm text-foreground-secondary">
                      {note.copy}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="border border-border-soft bg-background-elevated p-6 md:p-8">
              <p className="text-label text-accent-primary">Fit Notes</p>
              <h2 className="mt-3 text-display-3 text-foreground-primary">
                Choose Your Best Size
              </h2>
              <ul className="mt-6 space-y-4">
                {fitTips.map((tip) => (
                  <li key={tip} className="flex gap-3 text-body-sm text-foreground-secondary">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent-primary" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 border border-border-soft bg-background-panel p-4">
                <p className="text-body-sm text-foreground-secondary">
                  For a tailored order, share bust, waist, hip, shoulder, armhole,
                  top length, pant waist, inseam, and outseam measurements with
                  support before checkout.
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
