import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../../services/products-service';

const fallbackItems = [
  {
    title: 'Women Ethnic Wear',
    tag: 'women-ethnic-wear',
    audience: 'women',
    image: '/images/home-hero-parsom.png',
  },
  {
    title: 'Topwear',
    tag: 'women-topwear',
    audience: 'women',
    image: '/images/home-hero-parsom.png',
  },
  {
    title: 'Coming Soon Drops',
    tag: '',
    audience: '',
    availability: 'coming_soon',
    image: '/images/home-hero-parsom.png',
  },
];

const buildCollectionUrl = (item) => {
  const params = new URLSearchParams();
  if (item.audience) params.set('audience', item.audience);
  if (item.tag) params.set('category', item.tag);
  if (item.availability) params.set('availability', item.availability);

  const query = params.toString();
  return query ? `/collection?${query}` : '/collection';
};

const getCategoryImage = (category, products) => {
  const matchedProduct = products.find((product) => (
    product.primaryImage &&
    product.categoryName &&
    product.categoryName.toLowerCase() === category.label.toLowerCase()
  ));

  return matchedProduct?.primaryImage || products.find((product) => product.primaryImage)?.primaryImage || '/images/home-hero-parsom.png';
};

export default function TopCollection() {
  const [collectionItems, setCollectionItems] = useState(fallbackItems);

  useEffect(() => {
    let ignore = false;

    const loadCollectionHighlights = async () => {
      try {
        const response = await fetchProducts({ sort: 'latest' });
        if (ignore) return;

        const products = Array.isArray(response.items) ? response.items : [];
        const categories = Array.isArray(response.filters?.categories)
          ? response.filters.categories
          : [];

        const categoryHighlights = categories
          .filter((category) => !category.parentId)
          .slice(0, 3)
          .map((category) => ({
            title: category.label || 'Collection',
            tag: category.value || '',
            audience: category.audience || 'women',
            badge: category.badge || '',
            image: getCategoryImage(category, products),
          }));

        if (categoryHighlights.length > 0) {
          setCollectionItems(categoryHighlights);
          return;
        }

        const productHighlights = products.slice(0, 3).map((product) => ({
          title: product.categoryName || product.name || 'Collection',
          tag: '',
          audience: 'women',
          image: product.primaryImage || product.secondaryImage || '/images/home-hero-parsom.png',
        }));

        setCollectionItems(productHighlights.length > 0 ? productHighlights : fallbackItems);
      } catch {
        if (!ignore) {
          setCollectionItems(fallbackItems);
        }
      }
    };

    loadCollectionHighlights();

    return () => {
      ignore = true;
    };
  }, []);

  const hasRealData = useMemo(
    () => collectionItems.some((item) => item.image !== '/images/home-hero-parsom.png'),
    [collectionItems]
  );

  return (
    <section className="bg-background-base py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="mb-4 block text-label text-accent-primary">Featured</span>
            <h2 className="text-display-2 text-foreground-primary">Shop PARSOM Collections</h2>
            <p className="mt-6 text-body-lg text-foreground-secondary">
              Explore our latest categories, handcrafted styles, and upcoming drops from PARSOM ATTIRE.
            </p>
          </div>

          <Link
            to="/collection"
            className="group flex items-center gap-3 text-label text-accent-primary transition-colors hover:text-foreground-primary"
          >
            Explore All <ArrowRight size={18} className="transition-transform group-hover:translate-x-2" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:gap-8">
          {collectionItems.map((item, index) => (
            <Link
              key={index}
              to={buildCollectionUrl(item)}
            >
              <motion.article
                whileHover={{ y: -8 }}
                className="group relative aspect-[4/5] overflow-hidden bg-background-elevated md:aspect-[3/4]"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background-base/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80" />

                <div className="absolute bottom-0 left-0 w-full p-3 transition-transform duration-500 group-hover:translate-y-0 sm:p-5 md:translate-y-4 md:p-8 lg:p-12">
                  <span className="mb-2 hidden text-label text-accent-primary opacity-0 transition-opacity duration-500 group-hover:opacity-100 sm:block md:mb-4">
                    {item.badge || (hasRealData ? 'From Store' : 'Featured')}
                  </span>
                  <h3 className="line-clamp-2 text-lg font-semibold leading-6 text-foreground-primary sm:text-2xl md:text-display-3 lg:text-display-2">
                    {item.title}
                  </h3>
                  <p className="mt-2 hidden max-w-xs text-body-sm text-foreground-secondary opacity-0 transition-opacity duration-500 group-hover:opacity-100 sm:line-clamp-2 md:mt-4">
                    Discover available pieces and latest updates from this PARSOM category.
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
