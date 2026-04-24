import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../components/routing/protected-route';
import AdminShell from '../../components/layout/admin-shell';
import LoginPage from '../../pages/login-page';
import DashboardPage from '../../pages/dashboard-page';
import ProductsPage from '../../pages/products-page';
import ProductEditorPage from '../../pages/product-editor-page';
import OrdersPage from '../../pages/orders-page';
import OrderDetailPage from '../../pages/order-detail-page';
import NotifyRequestsPage from '../../pages/notify-requests-page';
import CategoriesPage from '../../pages/categories-page';
import CouponsPage from '../../pages/coupons-page';
import ReviewsPage from '../../pages/reviews-page';
import ToolsPage from '../../pages/tools-page';
import ContactSubmissionsPage from '../../pages/contact-submissions-page';
import WishlistInsightsPage from '../../pages/wishlist-insights-page';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/new" element={<ProductEditorPage />} />
          <Route path="/products/:productId/edit" element={<ProductEditorPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/coupons" element={<CouponsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:orderNumber" element={<OrderDetailPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/notify-requests" element={<NotifyRequestsPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/contact-submissions" element={<ContactSubmissionsPage />} />
          <Route path="/wishlist-insights" element={<WishlistInsightsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}