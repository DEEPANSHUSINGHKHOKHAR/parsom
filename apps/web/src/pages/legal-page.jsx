import PageShell from '../components/layout/page-shell';

export default function LegalPage({ eyebrow, title, intro, sections }) {
  return (
    <PageShell>
      <section className="bg-background-base pb-24 pt-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="border border-border-soft bg-background-elevated p-8 md:p-12">
            <p className="text-label text-accent-primary">{eyebrow}</p>
            <h1 className="mt-5 text-display-2 text-foreground-primary">{title}</h1>
            <p className="mt-6 max-w-3xl text-body-lg text-foreground-secondary">{intro}</p>
          </div>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <article
                key={section.title}
                className="border border-border-soft bg-background-elevated p-8"
              >
                <h2 className="text-display-3 text-foreground-primary">{section.title}</h2>
                <div className="mt-6 space-y-4">
                  {section.points.map((point) => (
                    <p key={point} className="text-body text-foreground-secondary">
                      {point}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
