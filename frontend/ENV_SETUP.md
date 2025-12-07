# Frontend Environment Variables Configuration Guide

## Development Setup
Create a file named `.env.local` in the frontend directory with:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Production Setup
Create a file named `.env.production` in the frontend directory with:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Important Notes
- Never commit `.env.local` or `.env.production` to version control
- The `NEXT_PUBLIC_` prefix makes the variable available in the browser
- Update `yourdomain.com` with your actual production domain
