# Parsom Tech Stack

## Overview
This repository is a multi-app JavaScript monorepo for the Parsom commerce platform:
- `apps/web`: customer storefront
- `apps/admin`: internal admin panel
- `apps/api`: backend API

## Frontend Stack
### Storefront (`apps/web`)
- React `19.2.5`
- React DOM `19.2.5`
- React Router DOM `7.14.2`
- Vite `8.0.9`
- Tailwind CSS `4.2.4`
- Axios `1.15.1`
- Zustand `5.0.12`
- Framer Motion `12.38.0`
- Swiper `12.1.3`
- Lucide React `1.8.0`
- ESLint `9.39.4`

### Admin (`apps/admin`)
- React `19.2.5`
- React DOM `19.2.5`
- React Router DOM `7.14.2`
- Vite `8.0.9`
- Tailwind CSS `4.2.4`
- Axios `1.15.1`
- Zustand `5.0.12`
- Lucide React `1.8.0`
- ESLint `9.39.4`

## Backend Stack
### API (`apps/api`)
- Node.js
- Express `5.2.1`
- MySQL via `mysql2` `3.22.2`
- JWT auth via `jsonwebtoken` `9.0.3`
- Password hashing via `bcryptjs` `3.0.3`
- Input validation via `express-validator` `7.3.2`
- File uploads via `multer` `2.1.1`
- Image processing via `sharp` `0.34.5`
- Security headers via `helmet` `8.1.0`
- Cookies via `cookie-parser` `1.4.7`
- CORS via `cors` `2.8.6`
- Logging via `pino` `10.3.1` and `pino-http` `11.0.0`
- Rate limiting via `rate-limiter-flexible` `11.0.1`
- Redis client via `ioredis` `5.10.1`
- PDF generation via `pdfkit` `0.18.0`
- Google integrations via `googleapis` `171.4.0` and `google-auth-library` `10.6.2`
- Local development with `nodemon` `3.1.14`

## Architecture
### Repository Shape
- Root package coordinates lint/build/check scripts across apps.
- Frontends are separate Vite apps for customer and admin experiences.
- Backend is a modular Express app with route, controller, and service separation.

### API Module Areas
- Auth
- Products
- Orders
- Storefront settings
- Reviews
- Addresses
- Wishlist
- Contact submissions
- Coupons
- Uploads
- Admin products and orders
- Admin categories
- Admin coupons
- Admin reviews
- Admin analytics
- Admin tools
- Admin contact submissions
- Admin wishlist insights
- Health checks

### Data Layer
- MySQL connection pool using `mysql2/promise`
- SQL migration files under `apps/api/database/schema`
- No ORM currently in use

## Integrations
- Razorpay for payment order creation, signature verification, and refunds
- Google Sheets for appending order and notify-request data
- Google OAuth client configuration present in environment config
- Redis for shared rate-limiter storage when configured

## Security and Reliability
- JWT-based auth
- Permission-guarded admin routes
- CSRF middleware applied to `/api/admin` routes
- Request sanitization middleware
- Centralized error handling
- Health endpoints at `/api/health/live` and `/api/health/ready`
- Structured request IDs in API responses and logs
- Configurable request body size limits

## Tooling and Build
### Root Scripts
- `npm run check:api`
- `npm run lint:web`
- `npm run lint:admin`
- `npm run build:web`
- `npm run build:admin`
- `npm run start:api`
- `npm run ci`

### App Scripts
- Frontends: `dev`, `build`, `lint`, `preview`
- API: `dev`, `start`, `check`

## Deployment Assumptions
- Separate frontend and admin deployments, each built with Vite
- API deployed as a Node.js service
- Environment-based configuration with `.env.development` and `.env.production`
- Uploaded assets served from `/uploads`
- Reverse proxy support via `TRUST_PROXY_HOPS`

## Recommended Additions Over Time
- TypeScript across apps for stronger contracts
- Shared package for API types, validation schemas, and constants
- Automated tests for storefront, admin, and API flows
- OpenAPI or API reference docs
- CI checks for migrations, linting, and production builds
