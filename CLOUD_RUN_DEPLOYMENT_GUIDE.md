# MyVault Cloud Run Deployment Guide

## Overview
Complete step-by-step guide for deploying MyVault application (FastAPI backend + React frontend) to Google Cloud Run using Cloud Build. This guide covers all common issues and their solutions.

## Prerequisites
- Google Cloud Project with billing enabled
- Service account with proper IAM roles
- Artifact Registry repository
- Cloud Build and Cloud Run APIs enabled

## Architecture
- **Backend**: FastAPI application deployed to Cloud Run
- **Frontend**: React SPA served by nginx, deployed to Cloud Run
- **Database**: Firestore (configured separately)
- **Build**: Cloud Build with separate pipelines for each service

---

## Phase 1: Google Cloud Console Setup

### 1.1 Enable Required APIs
Navigate to **APIs & Services > Library** and enable:
- Cloud Build API
- Cloud Run API  
- Artifact Registry API
- Firestore API

**Why**: These APIs are required for the deployment pipeline to function.

### 1.2 Create Artifact Registry Repository
1. Go to **Artifact Registry** in Google Cloud Console
2. Click **"Create Repository"**
3. Configure:
   - **Name**: `myvault-repo`
   - **Format**: Docker
   - **Mode**: Standard  
   - **Region**: `asia-south1` (same as your Cloud Run region)
4. Click **"Create"**

**Why**: Artifact Registry stores your Docker images securely and integrates better with Cloud Build.

---

## Phase 2: Service Account Configuration

### 2.1 Required IAM Roles for `myvault-runner` Service Account
Your service account should have these roles:
- ✅ **Cloud Run Admin** 
- ✅ **Cloud Run Invoker**  
- ✅ **Artifact Registry Writer** 
- ✅ **Cloud Build Editor** 
- ✅ **Logs Writer** 
- ❌ **Service Account User** (ADD THIS)
- ❌ **Compute Instance Admin (v1)** (ADD THIS)
- ❌ **Service Account Token Creator** (ADD THIS)

### 2.2 Grant Permission to Default Compute Service Account
**Critical Step**: This is the most common cause of deployment failures.

1. In **IAM & Admin > IAM**, find the default compute service account: `[PROJECT_NUMBER]-compute@developer.gserviceaccount.com`
2. Click the **pencil/edit icon** next to it
3. Add this role: **Service Account User**
4. In the **Grant access** dialog, under **"Grant this service account access to"**, select **"myvault-runner@[PROJECT_ID].iam.gserviceaccount.com"**
5. Click **"Grant Access"**

**Why**: Cloud Run needs to create compute resources using the default compute service account, and your `myvault-runner` needs permission to act as it.

---

## Phase 3: Code Configuration Fixes

### 3.1 Backend Port Configuration
**Issue**: Backend was hardcoded to port 8000, but Cloud Run expects applications to use the `PORT` environment variable.

**Fix**: Updated `backend/main.py` and `backend/Dockerfile` to use dynamic port binding.

**Files Modified**:
- `backend/main.py`: Added `port = int(os.getenv("PORT", 8000))`
- `backend/Dockerfile`: Changed CMD to use `${PORT:-8000}`

### 3.2 Frontend nginx Configuration
**Issue**: nginx was hardcoded to listen on port 80 and tried to proxy to non-existent `backend` host.

**Fix**: 
- Updated `frontend/nginx.conf` to use `${PORT}` variable
- Removed backend proxy configuration
- Updated `frontend/Dockerfile` to use `envsubst` for environment variable substitution

**Files Modified**:
- `frontend/nginx.conf`: Changed `listen 80` to `listen ${PORT}`
- `frontend/Dockerfile`: Added `envsubst` command and updated Node.js version to 20

### 3.3 Node.js Version Update
**Issue**: Firebase packages required Node.js 20+, but Dockerfile used Node.js 18.

**Fix**: Changed `FROM node:18-alpine` to `FROM node:20-alpine` in frontend Dockerfile.

---

## Phase 4: Cloud Build Configuration

### 4.1 Backend Cloud Build (`backend/cloudbuild.yaml`)
```yaml
# Key Configuration Points:
- Builds Docker image from backend directory
- Pushes to Artifact Registry
- Deploys to Cloud Run with port 8080
- Sets production environment variables
- Configures resource limits (512Mi memory, 1 CPU)
```

### 4.2 Frontend Cloud Build (`frontend/cloudbuild.yaml`)
```yaml
# Key Configuration Points:
- Builds Docker image with build arguments for API URL
- Pushes to Artifact Registry  
- Deploys to Cloud Run (no port specification - uses PORT env var)
- Sets resource limits (256Mi memory, 1 CPU)
- Build args: VITE_API_URL points to backend service
```

**Important**: Frontend build includes `VITE_API_URL=https://myvault-backend-$PROJECT_ID.${_REGION}.run.app/api` to ensure frontend can communicate with backend.

---

## Phase 5: Deployment Process

### 5.1 Deploy Backend First
1. Go to **Cloud Build > Triggers**
2. Create trigger: `myvault-backend-deploy`
3. Configure:
   - **Event**: Manual invocation
   - **Source**: Connect your repository
   - **Configuration**: `backend/cloudbuild.yaml`
   - **Substitution variables**:
     - `_REGION`: `asia-south1`
     - `_REPOSITORY`: `myvault-repo`
4. Run the trigger manually
5. Monitor build in **Cloud Build > History**

**Expected Result**: Backend available at `https://myvault-backend-[PROJECT_ID].asia-south1.run.app`

### 5.2 Deploy Frontend
1. Create trigger: `myvault-frontend-deploy`
2. Configure:
   - **Event**: Manual invocation
   - **Source**: Same repository
   - **Configuration**: `frontend/cloudbuild.yaml`
   - **Substitution variables**: Same as backend
3. Run the trigger manually
4. Monitor build progress

**Expected Result**: Frontend available at `https://myvault-frontend-[PROJECT_ID].asia-south1.run.app`

---

## Phase 6: Verification & Testing

### 6.1 Check Cloud Run Services
Go to **Cloud Run** and verify both services:
- **Status**: ✓ (green checkmark)
- **Traffic**: 100% to latest revision
- **URL**: Accessible and responding

### 6.2 Test Endpoints
- Backend health: `https://myvault-backend-[PROJECT_ID].asia-south1.run.app/health`
- Backend API docs: `https://myvault-backend-[PROJECT_ID].asia-south1.run.app/api/docs`
- Frontend: `https://myvault-frontend-[PROJECT_ID].asia-south1.run.app`

### 6.3 Check Logs (if issues occur)
In **Cloud Run > [service] > Logs**, look for:
- Application startup messages
- Port binding confirmation
- Any error messages

---

## Common Issues & Solutions

### Issue 1: "Container failed to start and listen on port"
**Symptoms**: Container fails to start, port binding errors
**Root Cause**: Application hardcoded to specific port instead of using Cloud Run's PORT environment variable
**Solution**: Update application to use `os.getenv("PORT")` and configure Dockerfile accordingly

### Issue 2: "Permission 'iam.serviceAccounts.actAs' denied"
**Symptoms**: Deployment fails with service account permission errors
**Root Cause**: Service account lacks permission to act as default compute service account
**Solution**: Grant "Service Account User" role to your service account on the default compute service account

### Issue 3: "--no-traffic not supported when creating new service"
**Symptoms**: Frontend deployment fails with traffic management error
**Root Cause**: `--no-traffic` flag cannot be used for new service creation
**Solution**: Remove `--no-traffic` flag for first deployment, add back for updates

### Issue 4: "host not found in upstream 'backend'"
**Symptoms**: nginx fails to start, container startup timeout
**Root Cause**: nginx configuration tries to proxy to non-existent backend host
**Solution**: Remove backend proxy configuration from nginx, let frontend make direct HTTP requests

### Issue 5: Node.js version compatibility warnings
**Symptoms**: Build warnings about unsupported engine versions
**Root Cause**: Firebase packages require Node.js 20+, but using Node.js 18
**Solution**: Update Dockerfile to use `node:20-alpine` base image

---

## Key Configuration Files

### Backend Dockerfile
```dockerfile
# Key Points:
- Uses python:3.11-slim base
- Exposes port 8000 (fallback)
- Uses PORT environment variable from Cloud Run
- Health check uses dynamic port
```

### Frontend Dockerfile  
```dockerfile
# Key Points:
- Multi-stage build with Node.js 20
- nginx:alpine production image
- Environment variable substitution with envsubst
- Dynamic port binding for Cloud Run
```

### nginx.conf
```nginx
# Key Points:
- Listens on ${PORT} variable
- Serves static files from /usr/share/nginx/html
- Handles SPA routing with try_files
- No backend proxy (handled by frontend app)
```

---

## Best Practices

### 1. Separate Build Pipelines
- Keep frontend and backend builds separate for independent deployment
- Allows rolling back one service without affecting the other

### 2. Environment Variable Management
- Use build arguments for compile-time configuration
- Use Cloud Run environment variables for runtime configuration
- Never hardcode URLs or ports in production code

### 3. Resource Optimization
- Backend: 512Mi memory, 1 CPU (API processing)
- Frontend: 256Mi memory, 1 CPU (static file serving)
- Adjust based on actual usage patterns

### 4. Security
- Use service accounts with minimal required permissions
- Enable Cloud Audit Logs for deployment tracking
- Regular security updates for base images

---

## Troubleshooting Checklist

- [ ] All required APIs enabled
- [ ] Artifact Registry repository created in correct region
- [ ] Service account has all required IAM roles
- [ ] Permission granted to act as default compute service account
- [ ] Backend code uses PORT environment variable
- [ ] Frontend nginx configuration uses ${PORT}
- [ ] No hardcoded backend proxy in nginx
- [ ] Build arguments correctly set in cloudbuild.yaml
- [ ] Services deployed in correct order (backend first)
- [ ] Health checks passing
- [ ] Logs show successful startup

---

## Future Enhancements

### 1. Automated Deployments
- Set up Cloud Build triggers for automatic deployment on git push
- Implement gradual rollouts with traffic splitting

### 2. Monitoring & Observability
- Set up Cloud Monitoring dashboards
- Configure alerting for service health
- Implement structured logging

### 3. CI/CD Pipeline
- Add automated testing before deployment
- Implement blue-green deployments
- Add deployment approval workflows

---

## Support Resources

- [Cloud Run Troubleshooting Guide](https://cloud.google.com/run/docs/troubleshooting)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Artifact Registry Best Practices](https://cloud.google.com/artifact-registry/docs/best-practices)
- [IAM Service Account Permissions](https://cloud.google.com/iam/docs/service-accounts)

---

## Summary of All Fixes Applied

### Backend Fixes
1. ✅ Updated `main.py` to use `PORT` environment variable
2. ✅ Modified Dockerfile to use dynamic port binding
3. ✅ Fixed Cloud Build configuration for proper deployment

### Frontend Fixes
1. ✅ Updated nginx.conf to use `${PORT}` variable
2. ✅ Removed backend proxy configuration
3. ✅ Updated Dockerfile with `envsubst` for environment substitution
4. ✅ Upgraded Node.js version from 18 to 20
5. ✅ Fixed Cloud Build configuration (removed `--no-traffic`)

### Infrastructure Fixes
1. ✅ Created separate Cloud Build configurations for each service
2. ✅ Configured proper IAM roles and permissions
3. ✅ Set up Artifact Registry repository
4. ✅ Established proper service communication patterns

---

*Last Updated: August 13, 2025*
*Version: 1.0*
*Status: Complete with all issues resolved*
