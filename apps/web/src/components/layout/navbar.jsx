import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { siteConfig } from '../../config/site-config';
import { useCartStore } from '../../features/cart/cart-store';
import { useAuthStore } from '../../features/auth/auth-store';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
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
  }, [location.pathname]);

  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        isScrolled
          ? 'border-b border-glass-stroke bg-background-base/70 py-4 shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-[20px]'
          : 'bg-transparent py-6'
      )}
    >
      <div className="mx-auto w-full px-5 sm:px-8 lg:px-10">
        <div className="relative flex min-h-12 items-center justify-between">
          <button
            className="text-foreground-primary transition hover:text-accent-primary md:hidden"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/" className="flex min-w-[128px] flex-col items-center text-center md:items-start md:text-left">
            <span className="font-display text-xl leading-none tracking-[0.02em] text-foreground-primary">
              parsooom
            </span>
            <span className="mt-2 text-[8px] uppercase leading-none tracking-[0.48em] text-foreground-secondary">
              USE YOUR DATA HERE
            </span>
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 md:flex">
            {siteConfig.navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    'text-[0.8rem] font-medium uppercase leading-none tracking-[0.08em] transition hover:text-foreground-primary',
                    isActive ? 'text-foreground-primary' : 'text-foreground-secondary'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-5 text-foreground-secondary md:gap-6">
            <Link
              to="/collection"
              className="transition hover:text-foreground-primary"
              aria-label="Search collection"
            >
              <Search size={22} strokeWidth={2} />
            </Link>

            <Link
              to={token ? '/account' : '/login'}
              className="transition hover:text-foreground-primary"
              aria-label="Account"
            >
              <User size={22} strokeWidth={2} />
            </Link>

            <Link
              to="/cart"
              className="relative transition hover:text-foreground-primary"
              aria-label={`Cart with ${itemCount} items`}
            >
              <ShoppingBag size={22} strokeWidth={2} />
              <span className="absolute -right-3 -top-3 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-primary px-1 text-[10px] font-semibold leading-none text-background-base">
                {itemCount}
              </span>
            </Link>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed inset-x-0 top-[84px] z-40 border-t border-glass-stroke bg-background-base/95 px-6 py-10 text-foreground-primary shadow-2xl backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-4">
              {siteConfig.navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.href}
                  className="font-display text-display-3 text-foreground-primary"
                >
                  {item.label}
                </NavLink>
              ))}

              <NavLink
                to="/cart"
                className="text-body text-foreground-secondary"
              >
                Cart {itemCount > 0 ? `(${itemCount})` : ''}
              </NavLink>

              <NavLink
                to={token ? '/account' : '/login'}
                className="text-body text-foreground-secondary"
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
