import { motion } from 'framer-motion';
import PageShell from '../components/layout/page-shell';
import { siteConfig } from '../config/site-config';

export default function AboutPage() {
  return (
    <PageShell>
      <div className="bg-background-base">
        <section className="relative flex h-[60vh] items-center justify-center overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1757439402190-99b73ac8e807?w=1600&q=80"
            className="absolute inset-0 h-full w-full object-cover grayscale"
            alt="About hero"
          />
          <div className="absolute inset-0 bg-background-base/60 backdrop-blur-[2px]" />
          <div className="relative z-10 px-4 text-center">
            <span className="mb-6 block text-label text-accent-primary">Legacy</span>
            <h1 className="text-display-1 text-foreground-primary">The Story of Parsom</h1>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-32 grid grid-cols-1 items-center gap-20 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-display-2 text-foreground-primary">Minimalism as a Language</h2>
              <p className="mt-8 text-body-lg leading-relaxed text-foreground-secondary">
                {siteConfig.aboutDescription}
              </p>
            </motion.div>
            <div className="aspect-square overflow-hidden rounded-lg bg-background-elevated">
              <img
                src="https://images.unsplash.com/photo-1770062422860-92c107ef02cc?w=800&q=80"
                alt="About visual"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 items-center gap-20 md:grid-cols-2">
            <div className="order-2 aspect-square overflow-hidden rounded-lg bg-background-elevated md:order-1">
              <img
                src="https://images.unsplash.com/photo-1735480222193-3fe22ffd70b6?w=800&q=80"
                alt="Craft visual"
                className="h-full w-full object-cover"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 md:order-2"
            >
              <h2 className="text-display-2 text-foreground-primary">The Craft / Process</h2>
              <p className="mt-8 text-body-lg leading-relaxed text-foreground-secondary">
                Every piece is shaped through small-batch development, careful fabric selection,
                and a silhouette-first approach that keeps the collection sharp and wearable.
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
