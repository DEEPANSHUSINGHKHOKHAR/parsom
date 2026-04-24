# Parsom API deployment checklist

- [ ] `.env.production` created on server
- [ ] Redis running with AOF enabled
- [ ] MySQL reachable from app host
- [ ] `pm2 start ecosystem.config.js --env production`
- [ ] `pm2 save`
- [ ] `pm2 startup`
- [ ] worker process running
- [ ] `/api/health/live` returns 200
- [ ] `/api/health/ready` returns 200
- [ ] backup script tested
- [ ] restore script tested
- [ ] uploads directory writable
