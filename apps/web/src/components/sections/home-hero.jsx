import { motion } from 'framer-motion';
import Button from '../ui/button';
import { siteConfig } from '../../config/site-config';

export default function HomeHero() {
  return (
    <section className="relative h-screen overflow-hidden bg-background-base">
      <img
        src="/images/home-hero-parsom.png"
        alt={siteConfig.brandName}
        className="absolute inset-0 h-full w-full object-cover object-[68%_center] sm:object-[52%_center]"
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,11,0.84)_0%,rgba(10,10,11,0.58)_42%,rgba(10,10,11,0.08)_72%,rgba(10,10,11,0.2)_100%)] sm:bg-[linear-gradient(90deg,rgba(10,10,11,0.82)_0%,rgba(10,10,11,0.66)_24%,rgba(10,10,11,0.24)_48%,rgba(10,10,11,0.08)_72%,rgba(10,10,11,0.28)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,0.16)_0%,rgba(10,10,11,0.08)_44%,rgba(10,10,11,0.72)_100%)]" />

      <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 pt-20 text-left sm:px-6 sm:pt-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-[295px] sm:max-w-[680px] lg:-ml-6 xl:-ml-12"
        >
          <p className="mb-5 text-[0.68rem] uppercase leading-none tracking-[0.36em] text-accent-primary sm:mb-6 sm:text-label">
            {siteConfig.heroLabel}
          </p>

          <h1 className="font-display text-[3rem] font-normal leading-[0.92] tracking-[0.01em] text-foreground-primary sm:text-[clamp(3.4rem,6vw,6.8rem)] sm:leading-[0.88]">
            {siteConfig.heroTitle.split('\n').map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-[290px] text-[0.98rem] leading-7 text-[#ddd5ca] sm:mt-8 sm:max-w-2xl sm:text-body-lg">
            {siteConfig.heroDescription}
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:mt-10 sm:flex-row">
            <Button
              as="a"
              href="/collection"
              variant="secondary"
              className="w-full max-w-[295px] border-white/35 bg-transparent px-5 text-white backdrop-blur-[2px] hover:bg-white/12 hover:text-white sm:w-auto sm:max-w-none sm:px-8"
            >
              Explore Collection
            </Button>
          </div>

          <div className="mt-10 grid max-w-[295px] grid-cols-1 gap-3 border-y border-white/18 py-5 text-[0.9rem] leading-6 text-[#d5ccc0] sm:mt-12 sm:max-w-3xl sm:grid-cols-3 sm:gap-4 sm:divide-x sm:divide-white/18 sm:py-6 sm:text-body-sm">
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
