# Security Sign-Off Checklist

## Auth And Sessions

- Strong production `JWT_SECRET` is configured.
- `TRUST_PROXY_HOPS` matches the production proxy chain.
- Admin cookie login works only over HTTPS in production.
- Phone login does not reveal whether an account exists before password entry.
- Google-based password setup is enabled only if `GOOGLE_OAUTH_CLIENT_ID` is configured.

## Network And Origins

- `CORS_ORIGINS` contains only approved storefront/admin origins.
- `APP_URL`, `FRONTEND_URL`, and `ADMIN_FRONTEND_URL` match deployed domains.
- Health endpoints are monitored.

## Data And Secrets

- `.env.production` is not committed.
- Database credentials are stored only in deployment secrets.
- Razorpay and Google credentials are stored only in deployment secrets.
- Logs do not expose auth headers, cookies, passwords, or OTPs.

## Uploads And Storage

- Upload directory exists and has expected permissions.
- Uploaded files are validated before processing.
- Persistent storage is used if uploads must survive redeploys.

## Release Gate

- `npm run ci` passes locally or in CI.
- `npm --prefix apps/api audit --audit-level=high` passes.
- `npm --prefix apps/web audit --audit-level=high` passes.
- `npm --prefix apps/admin audit --audit-level=high` passes.
