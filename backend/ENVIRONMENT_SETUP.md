# MyVault Environment Configuration

This document explains how to configure MyVault for different environments using environment variables set directly in deployment configuration.

## ⚠️ **Important: No .env Files in Production**

- **Local Development**: Can use .env files for convenience
- **Production Deployment**: Environment variables MUST be set directly in Cloud Run deployment configuration
- **No .env files in GitHub**: These files are not committed to the repository

## Environment Variables Configuration

### Backend Environment Variables (Cloud Run)

Set these directly in your `myvault-backend` Cloud Run service:

```bash
ENV=production
FIRESTORE_DATABASE_ID=myvaultdb
CORS_ORIGINS=https://myvault-frontend-219371541860.asia-south1.run.app
GOOGLE_CLOUD_PROJECT=myvault-f3f99
FIRESTORE_PROJECT_ID=myvault-f3f99
FIREBASE_PROJECT_ID=myvault-f3f99
FIREBASE_STORAGE_BUCKET=myvault-f3f99.firebasestorage.app
PORT=8000
HOST=0.0.0.0
```

### Frontend Environment Variables (Cloud Run)

Set these directly in your `myvault-frontend` Cloud Run service:

```bash
VITE_API_URL=https://myvault-backend-219371541860.asia-south1.run.app/api
VITE_APP_NAME=MyVault
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
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
| `VITE_API_URL` | Backend API URL | **Yes** | None (will fail if not set) |
| `VITE_APP_NAME` | Application name | No | `MyVault` |
| `VITE_ENABLE_DEBUG` | Enable debug mode | No | `false` |
| `VITE_ENABLE_ANALYTICS` | Enable analytics | No | `true` |

## Quick Start

### Local Development
```bash
# Set environment variables in your shell or use .env files locally
export ENV=local
export FIRESTORE_DATABASE_ID=myvault
export CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Start backend
cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Start frontend (in another terminal)
cd frontend/apps/web && npm run dev
```

### Production Deployment
1. **Backend**: Set environment variables in Cloud Run deployment
2. **Frontend**: Set environment variables in Cloud Run deployment
3. **No .env files needed**: All configuration comes from deployment environment

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

## Troubleshooting

### Frontend API Calls Going to Wrong URL
- **Symptom**: API calls going to `https://myvault-frontend-219371541860.asia-south1.run.app/api/...`
- **Cause**: `VITE_API_URL` environment variable not set in frontend deployment
- **Solution**: Set `VITE_API_URL=https://myvault-backend-219371541860.asia-south1.run.app/api` in frontend Cloud Run environment variables

### Backend CORS Errors
- **Symptom**: 405 Method Not Allowed or CORS errors
- **Cause**: `CORS_ORIGINS` not set correctly in backend deployment
- **Solution**: Set `CORS_ORIGINS=https://myvault-frontend-219371541860.asia-south1.run.app` in backend Cloud Run environment variables

### Environment Variables Not Loading
- **Cause**: .env files are not used in production
- **Solution**: Set all environment variables directly in Cloud Run deployment configuration
