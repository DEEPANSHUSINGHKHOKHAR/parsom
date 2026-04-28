import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bell, ChevronRight, Heart, MessageCircle, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '../components/layout/page-shell';
import Button from '../components/ui/button';
import PriceBlock from '../components/ui/price-block';
import LoadingState from '../components/ui/loading-state';
import EmptyState from '../components/ui/empty-state';
import StarRating from '../components/ui/star-rating';
import ProductGallery from '../features/product/components/product-gallery';
import SizeSelector from '../features/product/components/size-selector';
import QuantityStepper from '../features/product/components/quantity-stepper';
import NotifyMeModal from '../features/product/components/notify-me-modal';
import ProductCard, { ProductRating } from '../features/collection/components/product-card';
import { fetchProductBySlug } from '../services/products-service';
import { useCartStore } from '../features/cart/cart-store';
import { siteConfig } from '../config/site-config';
import { sizeChartRows } from '../config/size-chart';
import { addWishlistItem } from '../services/wishlist-service';
import Seo from '../components/seo/seo';
import { absoluteUrl, cleanText } from '../components/seo/seo-utils';

function buildWhatsAppMessage({ product, selectedSize, quantity }) {
  return [
    `Hello, I want to order:`,
    `Product: ${product?.name || 'USE YOUR DATA HERE'}`,
    `Size: ${selectedSize || 'USE YOUR DATA HERE'}`,
    `Quantity: ${quantity}`,
    `Price: ${product?.discountPrice ?? product?.price ?? 'USE YOUR DATA HERE'}`,
    `Customer Details: USE YOUR DATA HERE`,
    `Address: USE YOUR DATA HERE`,
  ].join('\n');
}

function ReviewMediaPreview({ item }) {
  if (!item?.url) return null;

  if (item.type === 'video') {
    return (
      <video
        src={item.url}
        controls
        className="aspect-square w-full rounded-[8px] border border-[#171412]/10 bg-[#171412] object-contain"
      />
    );
  }

  return (
    <img
      src={item.url}
      alt="Review media"
      className="aspect-square w-full rounded-[8px] border border-[#171412]/10 bg-[#ede8df] object-contain"
      loading="lazy"
    />
  );
}

function ProductInfoRows({ product }) {
  const rows = [
    {
      label: 'Product details',
      value: product.description || 'USE YOUR DATA HERE',
    },
    {
      label: 'Construction',
      value: product.materialDetails || 'USE YOUR DATA HERE',
    },
    {
      label: 'Size guide',
      value: (
        <div className="overflow-hidden rounded-[8px] border border-[#171412]/10">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-[#f4efe8] text-[#574f48]">
              <tr>
                <th className="px-3 py-3 font-semibold uppercase">Size</th>
                <th className="px-3 py-3 font-semibold uppercase">Chest</th>
                <th className="px-3 py-3 font-semibold uppercase">Waist</th>
                <th className="px-3 py-3 font-semibold uppercase">Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171412]/10 bg-[#fffaf4]">
              {sizeChartRows.map((row) => (
                <tr key={row.size}>
                  <td className="px-3 py-3 font-semibold text-[#171412]">
                    {row.size}
                  </td>
                  <td className="px-3 py-3 text-[#756c63]">{row.chest}</td>
                  <td className="px-3 py-3 text-[#756c63]">{row.waist}</td>
                  <td className="px-3 py-3 text-[#756c63]">{row.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="bg-[#fffaf4] px-3 pb-3 text-xs text-[#756c63]">
            Measurements are in inches.
          </p>
        </div>
      ),
    },
    {
      label: 'Shipping and returns',
      value: product.shippingNotes || 'USE YOUR DATA HERE',
    },
    {
      label: 'Care',
      value: 'Dry clean or gentle cold wash recommended.',
    },
  ];

  return (
    <div className="divide-y divide-[#171412]/10 border-y border-[#171412]/10">
      {rows.map((row) => (
        <details key={row.label} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold text-[#171412]">
            <span>{row.label}</span>
            <ChevronRight
              size={16}
              className="shrink-0 text-[#756c63] transition group-open:rotate-90"
            />
          </summary>
          <div className="pb-5 text-sm leading-7 text-[#756c63]">
            {row.value}
          </div>
        </details>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const addItem = useCartStore((state) => state.addItem);

  const [state, setState] = useState({
    loading: true,
    error: '',
    product: null,
    relatedItems: [],
  });

  const [wishlistStatus, setWishlistStatus] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [notifyModal, setNotifyModal] = useState({
    open: false,
    size: '',
  });
  

  useEffect(() => {
    let ignore = false;

    const loadProduct = async () => {
      setState({
        loading: true,
        error: '',
        product: null,
        relatedItems: [],
      });

      try {
        const response = await fetchProductBySlug(slug);

        if (ignore) return;

        const product = response.item;

        setState({
          loading: false,
          error: '',
          product,
          relatedItems: Array.isArray(response.relatedItems)
            ? response.relatedItems
            : [],
        });

        const firstAvailableSize = Array.isArray(product?.sizes)
          ? product.sizes.find(
              (sizeOption) =>
                Number(sizeOption.stock ?? 0) > 0 &&
                sizeOption.status !== 'out_of_stock'
            )
          : null;

        setSelectedSize(firstAvailableSize?.size || '');
        setQuantity(1);
      } catch (error) {
        if (ignore) return;

        setState({
          loading: false,
          error:
            error?.response?.data?.message ||
            'Unable to load this product right now.',
          product: null,
          relatedItems: [],
        });
      }
    };

    loadProduct();

    return () => {
      ignore = true;
    };
  }, [slug]);

  const product = state.product;

  const productSeo = useMemo(() => {
    if (!product) return null;

    const price = product.discountPrice ?? product.price;
    const image =
      product.primaryImage ||
      product.media?.find((item) => item?.type !== 'video')?.url ||
      siteConfig.defaultSeoImage;
    const description = cleanText(
      product.description ||
        `${product.name} from ${siteConfig.brandName}, crafted for a minimal luxury streetwear wardrobe.`
    );
    const canonicalPath = `/products/${product.slug || slug}`;
    const inStock = Array.isArray(product.sizes)
      ? product.sizes.some(
          (sizeOption) =>
            Number(sizeOption.stock ?? 0) > 0 &&
            sizeOption.status !== 'out_of_stock'
        )
      : product.status !== 'out_of_stock';

    return {
      title: `${product.name} | ${siteConfig.brandName}`,
      description,
      image,
      canonicalPath,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description,
          image: [absoluteUrl(image)],
          brand: {
            '@type': 'Brand',
            name: siteConfig.brandName,
          },
          category: product.categoryName,
          sku: product.sku || product.slug || String(product.id || ''),
          offers: {
            '@type': 'Offer',
            url: absoluteUrl(canonicalPath),
            priceCurrency: 'INR',
            price: price ? String(price) : undefined,
            availability: inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
          },
          aggregateRating:
            Array.isArray(product.reviews) && product.reviews.length > 0
              ? {
                  '@type': 'AggregateRating',
                  ratingValue:
                    product.reviews.reduce(
                      (total, review) => total + Number(review.rating || 0),
                      0
                    ) / product.reviews.length,
                  reviewCount: product.reviews.length,
                }
              : undefined,
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: absoluteUrl('/'),
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Collection',
              item: absoluteUrl('/collection'),
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: product.name,
              item: absoluteUrl(canonicalPath),
            },
          ],
        },
      ],
    };
  }, [product, slug]);

  const selectedSizeOption = useMemo(() => {
    if (!product?.sizes?.length || !selectedSize) return null;
    return product.sizes.find((sizeOption) => sizeOption.size === selectedSize);
  }, [product, selectedSize]);

  const maxQuantity = useMemo(() => {
    return Number(selectedSizeOption?.stock ?? 1) || 1;
  }, [selectedSizeOption]);

  const handleAddToCart = () => {
    setFeedback('');

    try {
      if (!selectedSize) {
        throw new Error('Please select a size before adding to cart.');
      }

      if (!selectedSizeOption || Number(selectedSizeOption.stock ?? 0) <= 0) {
        setNotifyModal({
          open: true,
          size: selectedSize,
        });
        return;
      }

      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.primaryImage,
        size: selectedSize,
        quantity,
        maxQuantity: selectedSizeOption.stock,
        status: product.status,
        price: product.discountPrice ?? product.price,
        originalPrice: product.originalPrice,
      });

      setFeedback('Added to cart successfully.');
    } catch (error) {
      setFeedback(error.message || 'Unable to add this item to cart.');
    }
  };

  const handleAddToWishlist = async () => {
    setWishlistStatus('');

    try {
      await addWishlistItem(product.id);
      setWishlistStatus('Added to wishlist.');
    } catch (error) {
      setWishlistStatus(
        error?.response?.data?.message || 'Unable to add to wishlist.'
      );
    }
  };

  const handleWhatsAppOrder = () => {
    const message = buildWhatsAppMessage({
      product,
      selectedSize,
      quantity,
    });

    const phone = `${siteConfig.whatsappNumber}`.replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (state.loading) {
    return (
      <PageShell tone="light">
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <LoadingState label="Loading product..." />
        </section>
      </PageShell>
    );
  }

  if (state.error || !product) {
    return (
      <PageShell tone="light">
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <EmptyState
            title="Product unavailable"
            description={state.error || 'This product could not be found.'}
          />
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell tone="light">
      {productSeo ? (
        <Seo
          title={productSeo.title}
          description={productSeo.description}
          image={productSeo.image}
          path={productSeo.canonicalPath}
          type="product"
          jsonLd={productSeo.jsonLd}
        />
      ) : null}
      <section className="mx-auto w-full px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto mb-6 flex max-w-[1600px] items-center gap-2 text-sm text-[#756c63]">
          <Link to="/" className="transition hover:text-[#171412]">
            Home
          </Link>
          <span>/</span>
          <Link to="/collection" className="transition hover:text-[#171412]">
            Collection
          </Link>
          <span>/</span>
          <span className="text-[#574f48]">{product.name}</span>
        </div>

        <div className="mx-auto grid max-w-[1600px] gap-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(420px,0.82fr)] xl:gap-12">
          <ProductGallery media={product.media || []} />

          <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="space-y-6 bg-[#f6f3ee] px-1 pb-8 md:px-3">
            <div className="space-y-3">
              <p className="text-xs uppercase text-[#756c63]">
                {product.categoryName || 'USE YOUR DATA HERE'}
              </p>

              <h1 className="text-4xl font-semibold leading-none tracking-tight text-[#171412] md:text-6xl">
                {product.name}
              </h1>

              <ProductRating
                rating={product.avgRating}
                count={product.reviewCount}
                tone="light"
              />

              <p className="max-w-2xl text-sm leading-7 text-[#756c63]">
                {product.description || 'USE YOUR DATA HERE'}
              </p>
            </div>

            <PriceBlock
              size="large"
              tone="light"
              price={product.discountPrice ?? product.price}
              originalPrice={product.originalPrice}
            />

            <SizeSelector
              sizes={product.sizes || []}
              selectedSize={selectedSize}
              onSelect={(size) => {
                setSelectedSize(size);
                setQuantity(1);
              }}
              onUnavailableSelect={(sizeOption) =>
                setNotifyModal({
                  open: true,
                  size: sizeOption.size,
                })
              }
            />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase  text-[#574f48]">
                Quantity
              </h3>

              <QuantityStepper
                value={quantity}
                max={maxQuantity}
                onChange={setQuantity}
              />
            </div>

            {selectedSizeOption ? (
              <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] px-4 py-4 text-sm text-[#756c63]">
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    Size: <strong className="text-[#171412]">{selectedSizeOption.size}</strong>
                  </span>
                  <span>
                    {selectedSizeOption.status === 'notify_only'
                      ? 'Notify me available for this size'
                      : Number(selectedSizeOption.stock || 0) <= 0
                      ? 'Out of stock - request a restock alert'
                      : Number(selectedSizeOption.stock || 0) === 1
                        ? 'Last piece'
                        : Number(selectedSizeOption.stock || 0) <= 5
                          ? 'Few left'
                          : 'Available'}
                  </span>
                </div>
              </div>
            ) : null}

            {feedback ? (
              <p className="text-sm text-[#574f48]">{feedback}</p>
            ) : null}

            {wishlistStatus ? (
              <p className="text-sm text-[#574f48]">{wishlistStatus}</p>
            ) : null}

            <div className="grid gap-3">
              <Button
                type="button"
                onClick={handleAddToCart}
                className="w-full rounded-full bg-[#171412] text-[#fffaf4] shadow-[0_14px_34px_rgba(23,20,18,0.12)] hover:bg-[#8f3d2f]"
              >
                <ShoppingBag size={16} />
                Add To Cart
              </Button>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAddToWishlist}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#171412]/15 bg-[#fffaf4] px-5 py-3 text-sm font-semibold text-[#574f48] shadow-[0_10px_26px_rgba(23,20,18,0.06)] transition hover:border-[#171412]/30 hover:bg-[#f4efe8] hover:text-[#171412]"
                >
                  <Heart size={16} />
                  Wishlist
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setNotifyModal({
                      open: true,
                      size: selectedSize || 'USE YOUR DATA HERE',
                    })
                  }
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#8f3d2f]/25 bg-[#f7e9e5] px-5 py-3 text-sm font-semibold text-[#8f3d2f] shadow-[0_10px_26px_rgba(143,61,47,0.08)] transition hover:border-[#8f3d2f]/40 hover:bg-[#efd7d0]"
                >
                  <Bell size={16} />
                  Notify Me
                </button>
              </div>

              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#171412]/10 bg-transparent px-5 py-3 text-sm font-semibold text-[#574f48] transition hover:border-[#171412]/25 hover:bg-[#fffaf4] hover:text-[#171412]"
              >
                <MessageCircle size={16} />
                WhatsApp Order
              </button>
            </div>

            <ProductInfoRows product={product} />
          </div>
          </div>
        </div>

        <section className="mx-auto mt-16 grid max-w-[1600px] gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase text-[#756c63]">After Purchase</p>
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-[#171412] md:text-5xl">
              Details, reviews, and fit notes stay right where shoppers expect them.
            </h2>
          </div>
          <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl">
            <h2 className="text-2xl font-semibold tracking-tight text-[#171412]">
              Reviews
            </h2>

            {Array.isArray(product.reviews) && product.reviews.length > 0 ? (
              <div className="mt-5 space-y-4">
                {product.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-medium text-[#171412]">
                        {review.userName || 'USE YOUR DATA HERE'}
                      </h3>
                      <StarRating rating={review.rating} size={14} />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[#756c63]">
                      {review.comment || 'USE YOUR DATA HERE'}
                    </p>
                    {review.media?.length ? (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {review.media.map((mediaItem, index) => (
                          <ReviewMediaPreview
                            key={`${review.id}-${mediaItem.url}-${index}`}
                            item={mediaItem}
                          />
                        ))}
                      </div>
                    ) : null}
                    {review.adminReply ? (
                      <div className="mt-4 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-4 text-sm leading-7 text-[#574f48]">
                        <p className="text-xs uppercase text-[#756c63]">
                          PARSOM ATTIRE
                        </p>
                        <p className="mt-2">{review.adminReply}</p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[8px] border border-dashed border-[#171412]/15 bg-[#f4efe8] p-6 text-sm text-[#756c63]">
                No reviews available yet.
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-[1600px]">
          <div className="mb-8">
            <p className="text-xs uppercase text-[#756c63]">
              Related Products
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
              More From The Collection
            </h2>
          </div>

          {state.relatedItems.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid gap-6 md:grid-cols-2 xl:grid-cols-4"
            >
              {state.relatedItems.map((item) => (
                <ProductCard key={item.id || item.slug} product={item} tone="light" />
              ))}
            </motion.div>
          ) : (
            <EmptyState
              title="No related products available"
              description="This area will automatically populate from your backend response."
            />
          )}
        </section>
      </section>

      <NotifyMeModal
        open={notifyModal.open}
        onClose={() => setNotifyModal({ open: false, size: '' })}
        productId={product.id}
        productName={product.name}
        size={notifyModal.size}
      />
    </PageShell>
  );
}
