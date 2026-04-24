import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../../components/routing/protected-route';
import HomePage from '../../pages/home-page';
import AboutPage from '../../pages/about-page';
import CollectionPage from '../../pages/collection-page';
import ProductDetailPage from '../../pages/product-detail-page';
import ContactPage from '../../pages/contact-page';
import SizeChartPage from '../../pages/size-chart-page';
import CartPage from '../../pages/cart-page';
import CheckoutPage from '../../pages/checkout-page';
import ThankYouPage from '../../pages/thank-you-page';
import LoginPage from '../../pages/login-page';
import RegisterPage from '../../pages/register-page';
import ForgotPasswordPage from '../../pages/forgot-password-page';
import AccountPage from '../../pages/account-page';
import TermsPage from '../../pages/terms-page';
import PrivacyPage from '../../pages/privacy-page';
import ReturnsPage from '../../pages/returns-page';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/collection" element={<CollectionPage />} />
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
  );
}
