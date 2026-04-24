import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const reviews = [
  {
    name: 'Marcus Thorne',
    platform: 'Instagram',
    review:
      "The quality of the archive drop is unmatched. The fabric weight and the cut are exactly what I've been looking for in high-end streetwear.",
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    link: 'https://instagram.com/parsomattire',
  },
  {
    name: 'Elena Rossi',
    platform: 'Twitter',
    review:
      'parsom has mastered the minimal luxury aesthetic. Every piece feels like a curated work of art.',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    link: 'https://x.com/parsomattire',
  },
  {
    name: 'Julian Chen',
    platform: 'WhatsApp',
    review:
      'Support was incredible. They helped me find my size perfectly using the measuring guide.',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    link: 'https://wa.me/919289854887',
  },
];

const sectionReveal = {
  hidden: { opacity: 0, y: 34 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
};

const cardsReveal = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.08,
    },
  },
};

const cardReveal = {
  hidden: { opacity: 0, y: 34 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: 'easeInOut' },
  },
};

export default function SocialProof() {
  return (
    <section className="relative overflow-hidden bg-background-base py-32">
      <motion.div
        animate={{ x: [0, 50, 0], y: [0, 30, 0], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-accent-primary/5 blur-[100px]"
      />
      <motion.div
        animate={{ x: [0, -50, 0], y: [0, -40, 0], opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute -right-20 bottom-0 h-[500px] w-[500px] rounded-full bg-accent-secondary/5 blur-[120px]"
      />

      <motion.div
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        className="relative z-10 mx-auto mb-20 max-w-7xl px-4 text-center sm:px-6 lg:px-8"
      >
        <span className="mb-4 block text-label tracking-[0.3em] text-accent-primary">
          Community
        </span>
        <h2 className="text-display-2 text-foreground-primary">What People Say</h2>
        <div className="mx-auto mb-8 mt-6 h-px w-24 bg-accent-primary opacity-30" />
        <p className="mx-auto max-w-2xl text-body-lg italic text-foreground-secondary">
          Trust and quality defined by our growing community of enthusiasts.
        </p>
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={cardsReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {reviews.map((item, index) => (
            <motion.a
              key={index}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              variants={cardReveal}
              whileHover={{
                y: -8,
                scale: 1.03,
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(231, 222, 210, 0.1)',
                transition: { duration: 0.25, ease: 'easeInOut' },
              }}
              className="group flex flex-col gap-6 rounded-2xl border border-glass-stroke bg-glass-soft p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_16px_48px_rgba(0,0,0,0.36)] backdrop-blur-[20px] transition-shadow duration-300 ease-in-out"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-border-soft bg-background-panel">
                  <img src={item.avatar} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div>
                  <h3 className="text-body font-bold text-foreground-primary">{item.name}</h3>
                  <p className="text-caption text-foreground-muted">{item.platform}</p>
                </div>
                <Quote
                  className="ml-auto text-accent-primary/20 transition-colors group-hover:text-accent-primary"
                  size={24}
                />
              </div>

              <p className="text-body italic leading-relaxed text-foreground-secondary">
                "{item.review}"
              </p>

              <div className="mt-auto flex items-center justify-between border-t border-glass-stroke pt-6 text-caption text-foreground-muted">
                <span>Verified Purchase</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent-primary group-hover:underline">
                  View Post
                </span>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
