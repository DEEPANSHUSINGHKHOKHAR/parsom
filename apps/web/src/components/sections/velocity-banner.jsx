import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function VelocityBanner() {
  return (
    <div className="relative z-10 overflow-hidden border-y border-glass-stroke bg-accent-primary py-4 text-background-base">
      <motion.div
        animate={{ x: [0, -1000] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="flex items-center gap-20 whitespace-nowrap"
      >
        {[...Array(10)].map((_, index) => (
          <span
            key={index}
            className="flex items-center gap-8 text-label font-bold tracking-[0.4em]"
          >
            Archive Drop 001 <ArrowRight size={14} /> Early Access Open{' '}
            <ArrowRight size={14} /> 5% Discount for Members
          </span>
        ))}
      </motion.div>
    </div>
  );
}
