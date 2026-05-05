# Parsom Attire Product Requirements Document

## Document Info
- Product: Parsom Attire
- Date: 2026-05-05
- Status: Draft
- Scope: `apps/web`, `apps/admin`, and `apps/api`

## Product Summary
Parsom Attire is a fashion commerce platform with three connected surfaces:
- A customer-facing storefront for browsing collections, ordering products, managing accounts, and requesting stitched clothing.
- An admin panel for catalog, order, coupon, review, contact, storefront, and wishlist operations.
- A backend API that powers commerce flows, customer accounts, payments, media handling, and admin workflows.

The current product appears designed for a boutique apparel brand that needs both direct online selling and assisted order operations.

## Problem Statement
Small fashion brands often need to manage catalog presentation, direct orders, customer inquiries, reviews, size guidance, return flows, and back-office fulfillment without a heavyweight enterprise stack. Parsom Attire solves this by combining a branded storefront with an operational admin console and a backend tailored to fashion commerce workflows.

## Goals
- Let customers discover and purchase products with a smooth mobile-friendly storefront.
- Support fashion-specific flows like size guidance, stitched-cloth requests, and notify-me requests.
- Give internal teams a fast admin workspace for products, orders, categories, coupons, reviews, and support queues.
- Provide reliable checkout, order tracking, and post-purchase account features.
- Protect the platform with auth, rate limiting, CSRF protection for admin actions, and input sanitization.

## Non-Goals
- Marketplace features with multiple external sellers.
- Native mobile apps.
- Complex ERP or warehouse automation.
- Headless content editing beyond the existing storefront settings and catalog tooling.

## Primary Users
- Shopper: browses collections, views product details, adds to cart, checks out, tracks orders, saves wishlist items, submits reviews, and manages addresses.
- Returning customer: logs in, views order history, submits return requests, manages account details, and accesses saved wishlist and addresses.
- Admin/operator: manages products, categories, orders, coupons, reviews, storefront settings, notify requests, contact submissions, and analytics.
- Brand owner/marketing team: reviews storefront content, promotions, and product demand signals such as wishlist and notify activity.

## Core User Journeys
### Storefront
- Land on homepage and browse featured collections.
- Explore collection pages and product detail pages.
- Review images, variants, sizes, and pricing.
- Add items to cart and proceed to checkout.
- Place an order and reach a thank-you page.
- Contact the brand, view policies, and access size charts.

### Account
- Register or log in.
- Manage saved addresses.
- View previous orders.
- Submit or track return requests.
- Manage wishlist items.
- Submit and manage product reviews where eligible.

### Fashion-Specific Support
- Request a restock or availability update through notify-me flows.
- Submit stitch-your-cloth requests.
- Use size-chart guidance before purchase.

### Admin Operations
- Log in to the admin dashboard.
- Create, edit, archive, restore, and delete products.
- Manage categories and storefront settings.
- Review and update orders and return requests.
- Manage coupons and promotions.
- Moderate reviews.
- Process notify requests and contact submissions.
- Review wishlist insights and analytics.
- Export operational data through admin tools.

## Functional Requirements
### Customer Storefront
- Public routes for home, about, collections, contact, size chart, legal pages, and product details.
- Cart and checkout flows.
- Auth flows for register, login, forgot password, and account access.
- Protected account area for customer data and order history.
- SEO support for route-level metadata.

### Commerce
- Product catalog and category browsing.
- Order creation and payment support.
- Coupon application.
- Order confirmation and thank-you flow.
- Return request submission and customer return history.

### Customer Engagement
- Wishlist add, remove, and listing.
- Notify-me request submission and customer request history.
- Contact submission handling.
- Review submission, editing, deletion, and eligibility checks.

### Admin
- Authenticated admin routes with protected access.
- Product CRUD with editor workflow.
- Category management.
- Coupon management including deleted coupon handling.
- Order list and order detail management.
- Return request handling.
- Review moderation and replies.
- Notify request operations.
- Contact submission management.
- Storefront settings management.
- Wishlist insights and analytics views.
- Tooling for exports and operational actions.

### Platform and Security
- JWT-based authentication.
- Role or permission-based admin access control.
- CSRF protection on admin API routes.
- Request validation and sanitization.
- Rate limiting for API, auth, OTP, uploads, orders, reviews, and notify actions.
- Structured request logging with request IDs.

## Success Metrics
- Storefront conversion rate.
- Cart-to-checkout completion rate.
- Successful payment completion rate.
- Order processing turnaround time.
- Review submission rate from eligible customers.
- Return request resolution time.
- Admin response time for notify and contact queues.
- Uptime and API readiness health checks.

## Suggested Future Enhancements
- Inventory reservation and low-stock automation.
- Marketing integrations beyond Google Sheets.
- Richer analytics dashboards with revenue cohorts and product performance trends.
- Email/SMS notification workflows.
- Search, filtering, and merchandising improvements.
- Dedicated CMS or editorial workflow for brand storytelling content.

## Assumptions
- Payments are processed through Razorpay.
- Data persistence is centered on MySQL schema migrations in `apps/api/database/schema`.
- Redis is optional but used when available for more durable rate limiting.
- Google Sheets sync is used for selected operational exports or team workflows.
