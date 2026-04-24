import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const collectionItems = [
  {
    title: 'Editorial Outerwear',
    tag: 'Outerwear',
    image:
      'https://images.unsplash.com/photo-1771919383240-d0a30993fc38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
  {
    title: 'Archive Denim',
    tag: 'Denim',
    image:
      'https://images.unsplash.com/photo-1735480222193-3fe22ffd70b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
  {
    title: 'Minimal Tailoring',
    tag: 'Tailoring',
    image:
      'https://images.unsplash.com/photo-1757439402190-99b73ac8e807?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
];

export default function TopCollection() {
  return (
    <section className="bg-background-base py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="mb-4 block text-label text-accent-primary">Curated</span>
            <h2 className="text-display-2 text-foreground-primary">Seasonal Essentials</h2>
            <p className="mt-6 text-body-lg text-foreground-secondary">
              A collection of timeless silhouettes designed for the modern individual.
              Quality over quantity, always.
            </p>
          </div>

          <Link
            to="/collection"
            className="group flex items-center gap-3 text-label text-accent-primary transition-colors hover:text-foreground-primary"
          >
            Explore All <ArrowRight size={18} className="transition-transform group-hover:translate-x-2" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {collectionItems.map((item, index) => (
            <Link
              key={index}
              to={`/collection?category=${item.tag.toLowerCase()}`}
              className={index === 0 ? 'md:col-span-2 lg:col-span-1' : ''}
            >
              <motion.article
                whileHover={{ y: -8 }}
                className="group relative aspect-[3/4] overflow-hidden bg-background-elevated"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background-base/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80" />

                <div className="absolute bottom-0 left-0 w-full translate-y-4 p-8 transition-transform duration-500 group-hover:translate-y-0 md:p-12">
                  <span className="mb-4 block text-label text-accent-primary opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    Featured
                  </span>
                  <h3 className="text-display-3 text-foreground-primary md:text-display-2">
                    {item.title}
                  </h3>
                  <p className="mt-4 max-w-xs text-body-sm text-foreground-secondary opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    Discover the curated selection of {item.tag.toLowerCase()} essentials.
                  </p>
                </div>
              </motion.article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
