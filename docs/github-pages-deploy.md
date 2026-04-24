# GitHub Pages Deployment

This repository deploys the two Vite frontends to one GitHub Pages site:

- Customer storefront: `https://deepanshusinghkhokhar.github.io/parsom/web/`
- Admin panel: `https://deepanshusinghkhokhar.github.io/parsom/admin/`

The Express API cannot run on GitHub Pages because Pages only serves static files. Deploy `apps/api` to a backend host, then set this repository variable in GitHub:

```text
VITE_API_BASE_URL=https://YOUR_API_HOST/api
```

Go to repository settings, then `Secrets and variables` > `Actions` > `Variables`, and add `VITE_API_BASE_URL`.

After the first workflow run, make sure GitHub Pages is configured to deploy from GitHub Actions:

`Settings` > `Pages` > `Build and deployment` > `Source: GitHub Actions`
