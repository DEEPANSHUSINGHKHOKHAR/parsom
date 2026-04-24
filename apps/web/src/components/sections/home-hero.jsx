import { motion } from 'framer-motion';
import Button from '../ui/button';
import { siteConfig } from '../../config/site-config';

export default function HomeHero() {
  return (
    <section className="relative h-screen overflow-hidden bg-background-base">
      <img
        src="https://images.unsplash.com/photo-1770062422860-92c107ef02cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=2000"
        alt={siteConfig.brandName}
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-overlay-hero-top to-overlay-hero-bottom" />

      <div className="relative mx-auto flex h-full max-w-7xl items-center justify-center px-4 pt-24 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <p className="mb-6 text-label text-accent-primary">{siteConfig.heroLabel}</p>

          <h1 className="text-display-1 text-foreground-primary">
            {siteConfig.heroTitle.split('\n').map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-body-lg text-foreground-secondary">
            {siteConfig.heroDescription}
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Button as="a" href="/collection">
              Explore Collection
            </Button>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 border-y border-border-soft py-6 text-body-sm text-foreground-secondary sm:grid-cols-3 sm:divide-x sm:divide-border-soft">
            <span>Limited archive drops</span>
            <span className="sm:pl-5">Premium fabric finish</span>
            <span className="sm:pl-5">Built for modern movement</span>
          </div>
        </motion.div>
      </div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 text-foreground-muted"
      >
        <div className="h-12 w-px bg-gradient-to-b from-transparent to-border-strong" />
      </motion.div>
    </section>
  );
}
