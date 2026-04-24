import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, MessageCircle, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '../components/layout/page-shell';
import Button from '../components/ui/button';
import PriceBlock from '../components/ui/price-block';
import LoadingState from '../components/ui/loading-state';
import EmptyState from '../components/ui/empty-state';
import ProductGallery from '../features/product/components/product-gallery';
import SizeSelector from '../features/product/components/size-selector';
import QuantityStepper from '../features/product/components/quantity-stepper';
import NotifyMeModal from '../features/product/components/notify-me-modal';
import ProductCard from '../features/collection/components/product-card';
import { fetchProductBySlug } from '../services/products-service';
import { useCartStore } from '../features/cart/cart-store';
import { siteConfig } from '../config/site-config';
import { addWishlistItem } from '../services/wishlist-service';

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
        throw new Error('This size is currently unavailable.');
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
      <PageShell>
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <LoadingState label="Loading product..." />
        </section>
      </PageShell>
    );
  }

  if (state.error || !product) {
    return (
      <PageShell>
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
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-[#756c63]">
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

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <ProductGallery media={product.media || []} />

          <div className="space-y-6 rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl md:p-8">
            <div className="space-y-3">
              <p className="text-xs uppercase  text-[#756c63]">
                {product.categoryName || 'USE YOUR DATA HERE'}
              </p>

              <h1 className="text-3xl font-semibold tracking-tight text-[#171412] md:text-5xl">
                {product.name}
              </h1>

              <p className="max-w-2xl text-sm leading-7 text-[#756c63] md:text-base">
                {product.description || 'USE YOUR DATA HERE'}
              </p>
            </div>

            <PriceBlock
              size="large"
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
              <div className="rounded-[8px] border border-[#171412]/10 bg-[#f4efe8] px-4 py-4 text-sm text-[#756c63]">
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    Size: <strong className="text-[#171412]">{selectedSizeOption.size}</strong>
                  </span>
                  <span>
                    Stock:{' '}
                    <strong className="text-[#171412]">
                      {selectedSizeOption.stock}
                    </strong>
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

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                onClick={handleAddToCart}
                className="w-full gap-2"
              >
                <ShoppingBag size={16} />
                Add To Cart
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleWhatsAppOrder}
                className="w-full gap-2"
              >
                <MessageCircle size={16} />
                WhatsApp Order
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleAddToWishlist}
                className="rounded-full border border-[#171412]/10 bg-[#f4efe8] px-6 py-3 text-sm font-medium text-[#574f48] transition hover:bg-[#171412]/5 hover:text-[#171412]"
              >
                <span className="inline-flex items-center gap-2">
                  <Heart size={16} />
                  Save To Wishlist
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setNotifyModal({
                    open: true,
                    size: selectedSize || 'USE YOUR DATA HERE',
                  })
                }
                className="rounded-full border border-[#171412]/10 bg-[#f4efe8] px-6 py-3 text-sm font-medium text-[#574f48] transition hover:bg-[#171412]/5 hover:text-[#171412]"
              >
                Notify Me
              </button>
            </div>
          </div>
        </div>

        <section className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6 backdrop-blur-xl">
            <h2 className="text-2xl font-semibold tracking-tight text-[#171412]">
              Product Details
            </h2>
            <div className="mt-5 space-y-3 text-sm leading-7 text-[#756c63]">
              <p>{product.description || 'USE YOUR DATA HERE'}</p>
              <p>{product.materialDetails || 'USE YOUR DATA HERE'}</p>
              <p>{product.shippingNotes || 'USE YOUR DATA HERE'}</p>
            </div>
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
                      <span className="text-sm text-[#756c63]">
                        {review.rating}/5
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[#756c63]">
                      {review.comment || 'USE YOUR DATA HERE'}
                    </p>
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

        <section className="mt-16">
          <div className="mb-8">
            <p className="text-xs uppercase  text-[#756c63]">
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
                <ProductCard key={item.id || item.slug} product={item} />
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