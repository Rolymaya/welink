# Production Deployment Guide

## Quick Start Checklist

### 1. Environment Setup
- [ ] Copy `.env.example` to `.env` in backend
- [ ] Update all placeholder values in `.env`
- [ ] Create `.env.production` in frontend
- [ ] Generate new JWT secrets for production

### 2. Database
- [ ] Set strong MySQL password
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Set up automated backups

### 3. Security
- [ ] Update Weaviate API key in docker-compose.yml
- [ ] Configure SMTP credentials
- [ ] Verify CORS settings

### 4. Build & Deploy
- [ ] Build backend: `npm run build`
- [ ] Build frontend: `npm run build`
- [ ] Test production builds locally
- [ ] Deploy to server

### 5. Post-Deployment
- [ ] Verify all services running
- [ ] Test critical flows
- [ ] Monitor error logs
- [ ] Set up SSL/HTTPS

## Detailed Instructions

See implementation_plan.md for complete deployment guide.
