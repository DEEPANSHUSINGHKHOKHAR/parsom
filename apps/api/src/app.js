const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const crypto = require('crypto');
const path = require('path');

const env = require('./config/env');
const { logger } = require('./config/logger');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const authRoutes = require('./modules/auth/auth.routes');
const productRoutes = require('./modules/products/products.routes');
const orderRoutes = require('./modules/orders/orders.routes');
const notifyRoutes = require('./modules/notify/notify.routes');
const reviewRoutes = require('./modules/reviews/reviews.routes');
const addressRoutes = require('./modules/addresses/addresses.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const adminCategoriesRoutes = require('./modules/admin-categories/admin-categories.routes');
const adminCouponsRoutes = require('./modules/admin-coupons/admin-coupons.routes');
const adminReviewsRoutes = require('./modules/admin-reviews/admin-reviews.routes');
const adminAnalyticsRoutes = require('./modules/admin-analytics/admin-analytics.routes');
const adminToolsRoutes = require('./modules/admin-tools/admin-tools.routes');
const wishlistRoutes = require('./modules/wishlist/wishlist.routes');
const contactRoutes = require('./modules/contact/contact.routes');
const adminContactRoutes = require('./modules/admin-contact/admin-contact.routes');
const adminWishlistRoutes = require('./modules/admin-wishlist/admin-wishlist.routes');
const couponRoutes = require('./modules/coupons/coupons.routes');
const uploadRoutes = require('./modules/uploads/uploads.routes');
const healthRoutes = require('./modules/health/health.routes');

const app = express();

app.set('isShuttingDown', false);

if (env.TRUST_PROXY_HOPS > 0) {
  app.set('trust proxy', env.TRUST_PROXY_HOPS);
}

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = env.CORS_ORIGINS.length
        ? env.CORS_ORIGINS
        : [env.FRONTEND_URL, env.ADMIN_FRONTEND_URL];

      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS.'));
    },
    credentials: true,
  })
);

app.use(helmet());

app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const existing = req.headers['x-request-id'];
      const requestId =
        typeof existing === 'string' && existing.trim()
          ? existing.trim()
          : crypto.randomUUID();

      res.setHeader('x-request-id', requestId);
      return requestId;
    },
    customProps: (req) => ({
      route: req.originalUrl,
    }),
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/health', healthRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notify-requests', notifyRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/contact-submissions', contactRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/uploads', uploadRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/admin/categories', adminCategoriesRoutes);
app.use('/api/admin/coupons', adminCouponsRoutes);
app.use('/api/admin/reviews', adminReviewsRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/tools', adminToolsRoutes);
app.use('/api/admin/contact-submissions', adminContactRoutes);
app.use('/api/admin/wishlist-insights', adminWishlistRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
