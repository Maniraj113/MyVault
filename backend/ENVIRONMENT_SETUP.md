# MyVault Environment Configuration

This document explains how to configure MyVault for different environments using environment variables.

## Environment Files

### Backend Environment Files

#### Local Development (.env)
```bash
ENV=local
FIRESTORE_DATABASE_ID=myvault
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
PORT=8000
HOST=127.0.0.1
```

#### Production (.env.production)
```bash
ENV=production
FIRESTORE_DATABASE_ID=myvaultdb
CORS_ORIGINS=https://myvault-frontend-219371541860.asia-south1.run.app
PORT=8000
HOST=0.0.0.0
```

### Frontend Environment Files

#### Local Development (.env)
```bash
VITE_API_URL=http://localhost:8000/api
VITE_ENABLE_DEBUG=true
```

#### Production (.env.production)
```bash
VITE_API_URL=https://myvault-backend-219371541860.asia-south1.run.app/api
VITE_ENABLE_DEBUG=false
```

## Required Environment Variables

### Backend Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ENV` | Environment name | Yes | `local` |
| `FIRESTORE_DATABASE_ID` | Firestore database name | Yes | `myvault` |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID | Yes | `myvault-f3f99` |
| `CORS_ORIGINS` | Comma-separated CORS origins | Yes | Auto-detected |
| `PORT` | Server port | No | `8000` |
| `HOST` | Server host | No | `127.0.0.1` (local) / `0.0.0.0` (prod) |

### Frontend Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | Yes | `http://localhost:8000/api` |
| `VITE_APP_NAME` | Application name | No | `MyVault` |
| `VITE_ENABLE_DEBUG` | Enable debug mode | No | `true` (local) / `false` (prod) |

## Quick Start

### Local Development
```bash
# Use start_services.bat (Windows) or run manually:
cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
cd frontend/apps/web && npm run dev
```

### Production Deployment
```bash
# Use deploy_production.bat to set up production environment
scripts/deploy_production.bat

# Then deploy to Cloud Run with environment variables
```

## Cloud Run Environment Variables

When deploying to Cloud Run, set these environment variables:

### Backend Service
```bash
ENV=production
FIRESTORE_DATABASE_ID=myvaultdb
CORS_ORIGINS=https://myvault-frontend-219371541860.asia-south1.run.app
GOOGLE_CLOUD_PROJECT=myvault-f3f99
```

### Frontend Service
```bash
VITE_API_URL=https://myvault-backend-219371541860.asia-south1.run.app/api
VITE_ENABLE_DEBUG=false
```

## Scripts

### start_services.bat
- **Purpose**: Local development only
- **Database**: Uses `myvault` (test database)
- **CORS**: Allows localhost origins

### deploy_production.bat
- **Purpose**: Production deployment setup
- **Database**: Switches to `myvaultdb`
- **CORS**: Allows production frontend origins
- **Usage**: Run before deploying to Cloud Run

## Database Switching

The application automatically uses the correct database based on `FIRESTORE_DATABASE_ID`:

- **Local/Test**: `myvault` database
- **Production**: `myvaultdb` database

## CORS Configuration

CORS origins are configured via the `CORS_ORIGINS` environment variable:

- **Local**: `http://localhost:5173,http://localhost:3000`
- **Production**: `https://myvault-frontend-219371541860.asia-south1.run.app`

## Verification

Check the current configuration:

```bash
# Health check endpoint
curl http://localhost:8000/health

# Root endpoint  
curl http://localhost:8000/
```

Both endpoints show the current environment and database configuration.
