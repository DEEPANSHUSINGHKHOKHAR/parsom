# Hostinger Deployment Notes

## Required Runtime Inputs

Set these in Hostinger before starting the API:

- `NODE_ENV=production`
- `PORT`
- `APP_URL`
- `FRONTEND_URL`
- `ADMIN_FRONTEND_URL`
- `CORS_ORIGINS`
- `TRUST_PROXY_HOPS`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `GOOGLE_OAUTH_CLIENT_ID` if Google sign-in is enabled
- `GOOGLE_SERVICE_ACCOUNT_*` and Sheets IDs if Sheets sync is enabled
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

## Pre-Deploy Checklist

- Apply SQL files in `apps/api/database/schema` in order.
- Build the storefront: `npm --prefix apps/web run build`
- Build the admin app: `npm --prefix apps/admin run build`
- Verify `apps/api/uploads` exists on persistent storage if uploads must survive deploys.
- Set `TRUST_PROXY_HOPS` correctly when the app sits behind Hostinger or another proxy.
- Confirm `CORS_ORIGINS` includes the final storefront and admin URLs.

## Post-Deploy Smoke Checks

- `GET /api/health/live`
- `GET /api/health/ready`
- Admin login/logout
- Storefront login with phone/password
- Google sign-in if enabled
- Review image upload
- Checkout and Razorpay verification if enabled

## Notes

- Do not commit `.env.production`.
- Use a long random `JWT_SECRET` with at least 32 characters.
- If uploads are stored on the app filesystem only, redeploys may remove them.
