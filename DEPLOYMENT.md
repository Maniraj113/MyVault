# MyVault - Cloud Run Deployment Guide

This guide provides step-by-step instructions to deploy MyVault to Google Cloud Run.

## Prerequisites

1. **Google Cloud Platform Account**
   - Create a GCP account at [console.cloud.google.com](https://console.cloud.google.com)
   - Enable billing for your project

2. **Required Tools**
   ```bash
   # Install Google Cloud CLI
   # Windows: Download from https://cloud.google.com/sdk/docs/install
   # macOS: brew install --cask google-cloud-sdk
   # Linux: Follow instructions at https://cloud.google.com/sdk/docs/install
   
   # Install Docker
   # Download from https://www.docker.com/products/docker-desktop
   ```

3. **Firebase Project**
   - You already have project ID: `myvault-f3f99`
   - Ensure Firebase Storage and Messaging are enabled

## Step 1: Setup Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create myvault-production --name="MyVault Production"

# Set the project as default
gcloud config set project myvault-production

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable sql.googleapis.com
```

## Step 2: Setup Cloud SQL (PostgreSQL)

```bash
# Create Cloud SQL instance
gcloud sql instances create myvault-db \
    --database-version=POSTGRES_14 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --root-password=YOUR_SECURE_PASSWORD

# Create database
gcloud sql databases create myvault --instance=myvault-db

# Create user
gcloud sql users create myvault-user \
    --instance=myvault-db \
    --password=YOUR_USER_PASSWORD
```

## Step 3: Configure Environment Variables

Create `.env.production` file:

```env
# Database
DATABASE_URL=postgresql://myvault-user:YOUR_USER_PASSWORD@/myvault?host=/cloudsql/myvault-production:us-central1:myvault-db

# CORS
FRONTEND_ORIGIN=https://myvault-frontend-xxxxx-uc.a.run.app
PROD_FRONTEND_ORIGIN=https://your-custom-domain.com

# Environment
ENV=production

# Firebase (already configured in frontend)
# Your Firebase config is already in frontend/apps/web/src/service/firebase.ts
```

## Step 4: Update Backend for Production

### 4.1: Update Database Configuration

Create `backend/app/config/production.py`:

```python
import os
from .settings import Settings

class ProductionSettings(Settings):
    environment: str = "production"
    database_url: str = os.getenv("DATABASE_URL", "")
    cors_origins: list[str] = [
        os.getenv("FRONTEND_ORIGIN", ""),
        os.getenv("PROD_FRONTEND_ORIGIN", ""),
        "https://*.a.run.app",  # Allow all Cloud Run apps
    ]

def get_production_settings() -> ProductionSettings:
    return ProductionSettings()
```

### 4.2: Update main.py for production

```python
# Add to backend/main.py
import os

def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    if os.getenv("ENV") == "production":
        from app.config.production import get_production_settings
        settings = get_production_settings()
    else:
        settings = get_settings()
    
    # Rest of your existing code...
```

### 4.3: Add requirements for production

Add to `backend/requirements.txt`:

```txt
# Existing requirements...
psycopg2-binary==2.9.7
gunicorn==21.2.0
```

## Step 5: Update Dockerfiles

### 5.1: Backend Dockerfile

Update `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8080

# Run with gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--threads", "4", "--timeout", "120", "main:app", "-k", "uvicorn.workers.UvicornWorker"]
```

### 5.2: Frontend Dockerfile

Update `frontend/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/web/package*.json apps/web/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
WORKDIR /app/apps/web
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /usr/share/nginx/html
RUN chown -R nextjs:nodejs /var/cache/nginx
RUN chown -R nextjs:nodejs /var/log/nginx
RUN chown -R nextjs:nodejs /etc/nginx/conf.d

USER nextjs

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
```

### 5.3: Update nginx.conf

```nginx
user nextjs;
worker_processes auto;
pid /tmp/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    server {
        listen 8080;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API proxy - not needed for Cloud Run setup
        # Remove the /api proxy since backend will be separate service
    }
}
```

## Step 6: Deploy to Cloud Run

### 6.1: Deploy Backend

```bash
# Navigate to backend directory
cd backend

# Build and submit to Cloud Build
gcloud builds submit --tag gcr.io/myvault-production/backend

# Deploy to Cloud Run
gcloud run deploy myvault-backend \
    --image gcr.io/myvault-production/backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars ENV=production \
    --set-cloudsql-instances myvault-production:us-central1:myvault-db

# Get the backend URL
gcloud run services describe myvault-backend --platform managed --region us-central1 --format 'value(status.url)'
```

### 6.2: Deploy Frontend

```bash
# Navigate to frontend directory
cd ../frontend

# Update vite.config.ts for production
```

Update `frontend/apps/web/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.NODE_ENV === 'production' 
        ? 'https://myvault-backend-xxxxx-uc.a.run.app/api'
        : '/api'
    ),
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
});
```

```bash
# Build and deploy frontend
gcloud builds submit --tag gcr.io/myvault-production/frontend

gcloud run deploy myvault-frontend \
    --image gcr.io/myvault-production/frontend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 256Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 5
```

## Step 7: Configure Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
    --service myvault-frontend \
    --domain your-domain.com \
    --region us-central1

# Map API subdomain
gcloud run domain-mappings create \
    --service myvault-backend \
    --domain api.your-domain.com \
    --region us-central1
```

## Step 8: Setup CI/CD with Cloud Build

Create `cloudbuild.yaml` in root:

```yaml
steps:
  # Build Backend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/backend', './backend']
    id: 'build-backend'

  # Build Frontend  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/frontend', './frontend']
    id: 'build-frontend'

  # Push images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/backend']
    id: 'push-backend'
    waitFor: ['build-backend']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/frontend']
    id: 'push-frontend'
    waitFor: ['build-frontend']

  # Deploy Backend
  - name: 'gcr.io/cloud-builders/gcloud'
    args: [
      'run', 'deploy', 'myvault-backend',
      '--image', 'gcr.io/$PROJECT_ID/backend',
      '--region', 'us-central1',
      '--platform', 'managed',
      '--allow-unauthenticated'
    ]
    id: 'deploy-backend'
    waitFor: ['push-backend']

  # Deploy Frontend
  - name: 'gcr.io/cloud-builders/gcloud'
    args: [
      'run', 'deploy', 'myvault-frontend',  
      '--image', 'gcr.io/$PROJECT_ID/frontend',
      '--region', 'us-central1',
      '--platform', 'managed',
      '--allow-unauthenticated'
    ]
    id: 'deploy-frontend'
    waitFor: ['push-frontend']

images:
  - 'gcr.io/$PROJECT_ID/backend'
  - 'gcr.io/$PROJECT_ID/frontend'

options:
  logging: CLOUD_LOGGING_ONLY
```

## Step 9: Environment Configuration Summary

### Backend Environment Variables:
```env
DATABASE_URL=postgresql://myvault-user:PASSWORD@/myvault?host=/cloudsql/PROJECT:REGION:INSTANCE
ENV=production
FRONTEND_ORIGIN=https://myvault-frontend-xxxxx-uc.a.run.app
```

### Frontend Environment Variables:
```env
VITE_API_URL=https://myvault-backend-xxxxx-uc.a.run.app/api
```

## Step 10: Post-Deployment Tasks

1. **Database Migration**: Run database migrations if needed
2. **Firebase Security Rules**: Configure Firebase Storage security rules
3. **Monitoring**: Setup Cloud Monitoring and Logging
4. **Backup**: Configure automated backups for Cloud SQL
5. **SSL/TLS**: Ensure HTTPS is enforced (automatic with Cloud Run)

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure frontend URL is in backend CORS origins
2. **Database Connection**: Verify Cloud SQL connection string
3. **Build Failures**: Check Dockerfile syntax and dependencies
4. **Memory Issues**: Increase Cloud Run memory limits if needed

### Useful Commands:

```bash
# View logs
gcloud run logs tail myvault-backend --region us-central1
gcloud run logs tail myvault-frontend --region us-central1

# Check service status
gcloud run services list --region us-central1

# Update environment variables
gcloud run services update myvault-backend \
    --set-env-vars NEW_VAR=value \
    --region us-central1
```

## Security Considerations

1. **Database Security**: Use strong passwords and limit access
2. **Firebase Rules**: Implement proper security rules
3. **API Security**: Consider implementing authentication
4. **HTTPS**: Always use HTTPS in production
5. **Environment Variables**: Never commit secrets to version control

## Cost Optimization

1. **Minimum Instances**: Set to 0 for development
2. **CPU Allocation**: Use minimum required CPU
3. **Memory**: Optimize memory allocation
4. **Request Timeout**: Set appropriate timeout values
5. **Cold Starts**: Consider keeping 1 minimum instance for better performance

This deployment guide should get your MyVault application running on Google Cloud Run with proper Firebase integration and production-ready configuration.
