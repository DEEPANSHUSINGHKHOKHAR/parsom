import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { fetchStorefrontSettings } from '../../services/storefront-service';

export default function VelocityBanner() {
  const [entries, setEntries] = useState([
    'Archive Drop 001',
    'Early Access Open',
    '5% Discount For Members',
  ]);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const data = await fetchStorefrontSettings();
        if (ignore) return;
        const nextEntries = data?.velocityBanner?.entries || [];
        if (nextEntries.length > 0) {
          setEntries(nextEntries);
        }
      } catch {
        // fallback to defaults
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, []);

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
            {entries.map((entry) => (
              <span key={`${index}-${entry}`} className="flex items-center gap-8">
                <span>{entry}</span>
                <ArrowRight size={14} />
              </span>
            ))}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
