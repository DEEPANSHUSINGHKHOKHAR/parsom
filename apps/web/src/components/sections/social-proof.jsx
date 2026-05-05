import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import { fetchWebsiteReviews } from '../../services/reviews-service';

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
  const [reviewState, setReviewState] = useState({
    averageRating: 0,
    reviewCount: 0,
    items: [],
  });

  useEffect(() => {
    let ignore = false;

    fetchWebsiteReviews()
      .then((data) => {
        if (!ignore) {
          setReviewState({
            averageRating: Number(data.averageRating || 0),
            reviewCount: Number(data.reviewCount || 0),
            items: Array.isArray(data.items) ? data.items : [],
          });
        }
      })
      .catch(() => {
        if (!ignore) {
          setReviewState({ averageRating: 0, reviewCount: 0, items: [] });
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const communityRating = Number(reviewState.averageRating || 0);
  const communityReviewCount = Number(reviewState.reviewCount || 0);
  const reviews = reviewState.items;

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
        <div className="mx-auto mt-8 flex w-fit flex-col items-center gap-3 rounded-[8px] border border-glass-stroke bg-glass-soft px-6 py-5 text-center shadow-[0_12px_32px_rgba(0,0,0,0.22)] backdrop-blur-[20px] sm:flex-row sm:gap-4 sm:text-left">
          <div className="flex items-center gap-1 text-accent-primary">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} size={18} className="fill-current" />
            ))}
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground-primary">
              {communityRating.toFixed(1)} overall rating
            </p>
            <p className="text-sm text-foreground-secondary">
              {communityReviewCount} website reviews
            </p>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={cardsReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:gap-8"
        >
          {reviews.length === 0 ? (
            <div className="col-span-full rounded-[8px] border border-glass-stroke bg-glass-soft p-8 text-center text-foreground-secondary">
              Website reviews will appear here after customers share their experience.
            </div>
          ) : (
            reviews.map((item, index) => (
            <motion.div
              key={index}
              variants={cardReveal}
              whileHover={{
                y: -8,
                scale: 1.03,
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(231, 222, 210, 0.1)',
                transition: { duration: 0.25, ease: 'easeInOut' },
              }}
              className="group flex min-h-56 flex-col gap-3 rounded-[8px] border border-glass-stroke bg-glass-soft p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_16px_48px_rgba(0,0,0,0.36)] backdrop-blur-[20px] transition-shadow duration-300 ease-in-out sm:min-h-64 sm:gap-4 sm:p-5 lg:gap-6 lg:p-8"
            >
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                {item.reviewerAvatarUrl ? (
                  <img
                    src={item.reviewerAvatarUrl}
                    alt={item.reviewerName}
                    className="h-9 w-9 shrink-0 rounded-full border border-border-soft bg-background-panel object-cover sm:h-11 sm:w-11 lg:h-12 lg:w-12"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-soft bg-background-panel text-sm font-semibold uppercase text-accent-primary sm:h-11 sm:w-11 lg:h-12 lg:w-12">
                    {String(item.reviewerName || 'C').slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold leading-5 text-foreground-primary sm:text-body">
                    {item.reviewerName}
                  </h3>
                  <p className="text-caption text-foreground-muted">
                    {item.source === 'outside'
                      ? item.platform || 'Outside review'
                      : item.source === 'admin'
                        ? 'Featured review'
                        : 'Customer review'}
                  </p>
                </div>
                <Quote
                  className="ml-auto hidden shrink-0 text-accent-primary/20 transition-colors group-hover:text-accent-primary sm:block"
                  size={22}
                />
              </div>

              <p className="line-clamp-5 text-sm italic leading-6 text-foreground-secondary sm:line-clamp-6 sm:text-body">
                "{item.comment}"
              </p>

              <div className="mt-auto flex flex-col gap-2 border-t border-glass-stroke pt-3 text-caption text-foreground-muted sm:flex-row sm:items-center sm:justify-between sm:pt-4 lg:pt-6">
                <span>Website Rating</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent-primary">
                  {Number(item.rating || 0)}/5
                </span>
              </div>
            </motion.div>
          ))
          )}
        </motion.div>
      </div>
    </section>
  );
}
