import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../../components/routing/protected-route';
import RouteSeo from '../../components/seo/route-seo';

const HomePage = lazy(() => import('../../pages/home-page'));
const AboutPage = lazy(() => import('../../pages/about-page'));
const CollectionPage = lazy(() => import('../../pages/collection-page'));
const StitchYourClothPage = lazy(() => import('../../pages/stitch-your-cloth-page'));
const ProductDetailPage = lazy(() => import('../../pages/product-detail-page'));
const ContactPage = lazy(() => import('../../pages/contact-page'));
const SizeChartPage = lazy(() => import('../../pages/size-chart-page'));
const CartPage = lazy(() => import('../../pages/cart-page'));
const CheckoutPage = lazy(() => import('../../pages/checkout-page'));
const ThankYouPage = lazy(() => import('../../pages/thank-you-page'));
const LoginPage = lazy(() => import('../../pages/login-page'));
const RegisterPage = lazy(() => import('../../pages/register-page'));
const ForgotPasswordPage = lazy(() => import('../../pages/forgot-password-page'));
const AccountPage = lazy(() => import('../../pages/account-page'));
const TermsPage = lazy(() => import('../../pages/terms-page'));
const PrivacyPage = lazy(() => import('../../pages/privacy-page'));
const ReturnsPage = lazy(() => import('../../pages/returns-page'));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-[#fffaf4] pt-28 text-center text-sm uppercase tracking-[0.18em] text-[#756c63]">
      Loading
    </div>
  );
}

export default function AppRouter() {
  return (
    <>
      <RouteSeo />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/stitch-your-cloth" element={<StitchYourClothPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/size-chart" element={<SizeChartPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/returns" element={<ReturnsPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<AccountPage />} />
          </Route>

          <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>
    </>
  );
}
