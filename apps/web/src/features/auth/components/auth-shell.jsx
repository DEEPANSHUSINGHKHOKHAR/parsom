import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '../../../components/layout/page-shell';
import { siteConfig } from '../../../config/site-config';

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
  sideTitle,
  sideDescription,
  sideLinks = [],
}) {
  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden border border-border-soft bg-background-elevated p-8 md:p-10"
          >
            <p className="text-label text-accent-primary">
              {eyebrow}
            </p>

            <h1 className="mt-4 text-display-2 text-foreground-primary">
              {title}
            </h1>

            <p className="mt-4 max-w-xl text-body text-foreground-secondary">
              {description}
            </p>

            <div className="mt-8 grid gap-5">
              {children}
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="flex min-h-[520px] flex-col justify-between border border-border-soft bg-background-panel p-8 md:p-10"
          >
            <div>
              <p className="text-label text-accent-primary">
                {siteConfig.brandName}
              </p>

              <h2 className="mt-4 text-display-3 text-foreground-primary md:text-display-2">
                {sideTitle}
              </h2>

              <p className="mt-4 max-w-lg text-body text-foreground-secondary">
                {sideDescription}
              </p>
            </div>

            <div className="space-y-4">
              {sideLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="flex items-center justify-between border border-border-soft bg-background-elevated px-5 py-4 text-body-sm text-foreground-secondary transition hover:border-accent-primary hover:text-foreground-primary"
                >
                  <span>{item.label}</span>
                  <span className="text-foreground-muted">-&gt;</span>
                </Link>
              ))}
            </div>
          </motion.aside>
        </div>
      </section>
    </PageShell>
  );
}
