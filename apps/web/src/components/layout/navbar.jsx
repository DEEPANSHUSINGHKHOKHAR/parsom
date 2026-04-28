import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { siteConfig } from '../../config/site-config';
import { collectionAudiences, collectionFallbackCategories } from '../../config/collection-taxonomy';
import { useCartStore } from '../../features/cart/cart-store';
import { useAuthStore } from '../../features/auth/auth-store';
import { fetchCollectionCategories } from '../../services/categories-service';

export default function Navbar({ tone = 'dark' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [isMobileCollectionOpen, setIsMobileCollectionOpen] = useState(false);
  const [categories, setCategories] = useState(collectionFallbackCategories);
  const location = useLocation();
  const cartItems = useCartStore((state) => state.cartItems);
  const token = useAuthStore((state) => state.token);

  const itemCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);

    handleScroll();
    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setIsCollectionOpen(false);
    setIsMobileCollectionOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    let ignore = false;

    const loadCategories = async () => {
      try {
        const nextCategories = await fetchCollectionCategories();
        if (!ignore && nextCategories.length > 0) {
          setCategories(
            nextCategories.map((category) => ({
              label: category.name || 'Category',
              value: category.slug || '',
              audience: category.audience || 'women',
              parentId: category.parentId || null,
              parentSlug: category.parentSlug || '',
              badge: category.badge || '',
            }))
          );
        }
      } catch {
        if (!ignore) {
          setCategories(collectionFallbackCategories);
        }
      }
    };

    loadCategories();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isLight = tone === 'light';
  const headerClass = isLight
    ? isScrolled
      ? 'border-b border-[#ded5ca] bg-[#fffaf4]/92 py-5 shadow-[0_14px_36px_rgba(23,20,18,0.08)] backdrop-blur-[20px]'
      : 'border-b border-[#ded5ca] bg-[#fffaf4]/88 py-5 shadow-[0_10px_30px_rgba(23,20,18,0.06)] backdrop-blur-[18px]'
    : isScrolled
      ? 'border-b border-glass-stroke bg-background-base/70 py-5 shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-[20px]'
      : 'bg-transparent py-5';
  const primaryText = isLight ? 'text-[#171412]' : 'text-foreground-primary';
  const secondaryText = isLight ? 'text-[#756c63]' : 'text-foreground-secondary';
  const hoverText = isLight ? 'hover:text-[#8f3d2f]' : 'hover:text-foreground-primary';
  const collectionColors = {
    heading: '#282c3f',
    mainCategory: '#ff3f6c',
    subCategory: '#282c3f',
    badge: '#ff527b',
    badgeBorder: '#ffd1dc',
  };
  const hasDynamicCategories = categories.length > 0;
  const categoriesForAudience = (audience) => {
    const audienceCategories = categories.filter((category) => (
      (category.audience || audience) === audience
    ));
    const mainCategories = audienceCategories.filter((category) => !category.parentId);

    if (mainCategories.length === 0) {
      return audienceCategories.map((category) => ({ ...category, children: [] }));
    }

    return mainCategories.map((category) => ({
      ...category,
      children: audienceCategories.filter((item) => item.parentId && item.parentSlug === category.value),
    }));
  };
  const collectionHref = (audience, category) => {
    const params = new URLSearchParams({ audience });
    if (category) params.set('category', category);
    if (audience === 'men' || audience === 'kids') params.set('availability', 'coming_soon');
    return `/collection?${params.toString()}`;
  };

  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        headerClass
      )}
    >
      <div className="mx-auto w-full px-5 sm:px-8 lg:px-10">
        <div className="relative flex min-h-12 items-center justify-between">
          <button
            className={clsx(primaryText, 'transition hover:text-accent-primary md:hidden')}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/" className="flex min-w-[128px] flex-col items-center text-center md:items-start md:text-left">
            <span className={clsx('font-display text-xl leading-none tracking-[0.02em]', primaryText)}>
              {siteConfig.logoText}
            </span>
            <span className={clsx('mt-2 text-[8px] uppercase leading-none tracking-[0.48em]', secondaryText)}>
              Luxury Streetwear
            </span>
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex lg:gap-8">
            {siteConfig.navItems.map((item) => (
              item.label === 'Collection' ? (
                <div
                  key={item.label}
                  className="py-3"
                  onMouseEnter={() => setIsCollectionOpen(true)}
                  onMouseLeave={() => setIsCollectionOpen(false)}
                >
                  <NavLink
                    to={item.href}
                    onClick={(event) => {
                      if (!isCollectionOpen) {
                        event.preventDefault();
                        setIsCollectionOpen(true);
                      }
                    }}
                    className={({ isActive }) =>
                      clsx(
                        'text-[0.8rem] font-medium uppercase leading-none tracking-[0.08em] transition',
                        hoverText,
                        isActive || isCollectionOpen ? primaryText : secondaryText
                      )
                    }
                    aria-expanded={isCollectionOpen}
                  >
                    {item.label}
                  </NavLink>
                </div>
              ) : (
                <NavLink
                  key={item.label}
                  to={item.href}
                  className={({ isActive }) =>
                    clsx(
                      'text-[0.8rem] font-medium uppercase leading-none tracking-[0.08em] transition',
                      hoverText,
                      isActive ? primaryText : secondaryText
                    )
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    {item.label}
                    {item.status ? (
                      <span
                        className={clsx(
                          'border px-1.5 py-0.5 text-[0.48rem] font-semibold uppercase leading-none tracking-[0.12em]',
                          isLight
                            ? 'border-[#8f3d2f]/30 text-[#8f3d2f]'
                            : 'border-accent-primary/30 text-accent-primary'
                        )}
                      >
                        Soon
                      </span>
                    ) : null}
                  </span>
                </NavLink>
              )
            ))}
          </nav>

          <div className={clsx('flex items-center gap-5 md:gap-6', secondaryText)}>
            <Link
              to="/collection"
              className={clsx('transition', hoverText)}
              aria-label="Search collection"
            >
              <Search size={22} strokeWidth={2} />
            </Link>

            <Link
              to={token ? '/account' : '/login'}
              className={clsx('transition', hoverText)}
              aria-label="Account"
            >
              <User size={22} strokeWidth={2} />
            </Link>

            <Link
              to="/cart"
              className={clsx('relative transition', hoverText)}
              aria-label={`Cart with ${itemCount} items`}
            >
              <ShoppingBag size={22} strokeWidth={2} />
              <span className={clsx(
                'absolute -right-3 -top-3 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none',
                isLight ? 'bg-[#171412] text-[#fffaf4]' : 'bg-accent-primary text-background-base'
              )}>
                {itemCount}
              </span>
            </Link>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCollectionOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onMouseEnter={() => setIsCollectionOpen(true)}
            onMouseLeave={() => setIsCollectionOpen(false)}
            className="absolute inset-x-0 top-full hidden border-y border-[#ece9e6] bg-white text-[#0b1833] shadow-[0_18px_34px_rgba(18,24,38,0.12)] md:block"
          >
            <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-[#f0eeee] px-8 py-7">
              {collectionAudiences.map((group) => (
                <div key={group.value} className="min-w-0 px-7 first:pl-0 last:pr-0">
                  <Link
                    to={collectionHref(group.value)}
                    className="mb-5 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-[#282c3f] transition hover:text-[#282c3f]"
                    style={{ color: collectionColors.heading }}
                  >
                    {group.label}
                    {group.status ? (
                      <span
                        className="px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.08em]"
                        style={{ color: collectionColors.badge }}
                      >
                        Coming Soon
                      </span>
                    ) : null}
                  </Link>

                  <div className="space-y-4">
                    {hasDynamicCategories ? categoriesForAudience(group.value).map((category) => (
                      <div key={`${group.value}-${category.value}`} className="space-y-2 border-b border-[#ededed] pb-4 last:border-b-0 last:pb-0">
                        <Link
                          to={collectionHref(group.value, category.value)}
                          className="flex items-center gap-2 text-[0.95rem] font-bold leading-5 text-[#ff3f6c] transition hover:text-[#ff527b]"
                          style={{ color: collectionColors.mainCategory }}
                        >
                          {category.label}
                          {category.badge ? (
                            <span
                              className="text-[0.58rem] font-bold uppercase leading-none tracking-[0.08em]"
                              style={{ color: collectionColors.badge }}
                            >
                              {category.badge}
                            </span>
                          ) : null}
                        </Link>
                        {category.children?.length ? (
                          <div className="space-y-1.5">
                            {category.children.map((child) => (
                              <Link
                                key={`${group.value}-${category.value}-${child.value}`}
                                to={collectionHref(group.value, child.value)}
                                className="flex items-center gap-2 text-sm leading-5 text-[#282c3f] transition hover:text-[#ff3f6c]"
                                style={{ color: collectionColors.subCategory }}
                              >
                                {child.label}
                                {child.badge ? (
                                  <span
                                    className="text-[0.56rem] font-bold uppercase leading-none tracking-[0.08em]"
                                    style={{ color: collectionColors.badge }}
                                  >
                                    {child.badge}
                                  </span>
                                ) : null}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )) : (
                      <p className="text-sm text-[#6b7280]">Categories will appear here.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={clsx(
              'fixed inset-x-0 top-[84px] bottom-0 z-40 overflow-y-auto border-t px-6 py-10 shadow-2xl backdrop-blur-xl md:hidden',
              isLight
                ? 'border-[#ded5ca] bg-[#fffaf4]/98 text-[#171412]'
                : 'border-glass-stroke bg-background-base/95 text-foreground-primary'
            )}
          >
            <div className="flex flex-col gap-4">
              {siteConfig.navItems.map((item) => (
                item.label === 'Collection' ? (
                  <div key={item.label} className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setIsMobileCollectionOpen((current) => !current)}
                      className={clsx('flex w-full items-center justify-between text-left font-display text-display-3', primaryText)}
                      aria-expanded={isMobileCollectionOpen}
                    >
                      <span>{item.label}</span>
                      <span className={clsx('text-sm transition', isMobileCollectionOpen ? 'rotate-45' : '')}>+</span>
                    </button>
                    {isMobileCollectionOpen ? (
                      <div className="grid gap-4 border-y border-[#ded5ca]/70 py-4">
                        {collectionAudiences.map((group) => (
                          <div key={group.value}>
                            <Link
                              to={collectionHref(group.value)}
                              className="flex items-center gap-3 text-label text-[#282c3f]"
                              style={{ color: collectionColors.heading }}
                            >
                              {group.label}
                              {group.status ? (
                                <span
                                  className="border px-2 py-1 text-[0.58rem] font-semibold uppercase leading-none tracking-[0.16em]"
                                  style={{
                                    color: collectionColors.badge,
                                    borderColor: collectionColors.badgeBorder,
                                  }}
                                >
                                  Coming Soon
                                </span>
                              ) : null}
                            </Link>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {hasDynamicCategories ? categoriesForAudience(group.value).flatMap((category) => [
                                category,
                                ...(category.children || []),
                              ]).map((category) => (
                                  (() => {
                                    const isSubcategory = Boolean(category.parentId);
                                    return (
                                  <Link
                                    key={`${group.value}-${category.value}`}
                                    to={collectionHref(group.value, category.value)}
                                    className={clsx('inline-flex items-center gap-1.5 border px-3 py-2 text-xs')}
                                    style={{
                                      color: isSubcategory ? collectionColors.subCategory : collectionColors.mainCategory,
                                      borderColor: isSubcategory ? '#ded5ca' : collectionColors.badgeBorder,
                                    }}
                                  >
                                    {category.label}
                                    {category.badge ? (
                                      <span
                                        className="text-[0.5rem] font-semibold uppercase"
                                        style={{ color: collectionColors.badge }}
                                      >
                                        {category.badge}
                                      </span>
                                    ) : null}
                                  </Link>
                                    );
                                  })()
                              )) : (
                                <span className={clsx('text-sm', secondaryText)}>Categories will appear here.</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <NavLink
                    key={item.label}
                    to={item.href}
                    className={clsx('font-display text-display-3', primaryText)}
                  >
                    <span className="flex flex-wrap items-center gap-3">
                      {item.label}
                      {item.status ? (
                        <span
                          className={clsx(
                            'border px-2 py-1 text-[0.58rem] font-semibold uppercase leading-none tracking-[0.16em]',
                            isLight
                              ? 'border-[#8f3d2f]/30 text-[#8f3d2f]'
                              : 'border-accent-primary/30 text-accent-primary'
                          )}
                        >
                          Coming Soon
                        </span>
                      ) : null}
                    </span>
                  </NavLink>
                )
              ))}

              <NavLink
                to="/cart"
                className={clsx('text-body', secondaryText)}
              >
                Cart {itemCount > 0 ? `(${itemCount})` : ''}
              </NavLink>

              <NavLink
                to={token ? '/account' : '/login'}
                className={clsx('text-body', secondaryText)}
              >
                Account
              </NavLink>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
