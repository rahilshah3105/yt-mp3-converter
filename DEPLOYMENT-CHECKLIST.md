# ⚡ Quick Railway Deployment Checklist

## Before Deployment
- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] Both services configured

## Backend Deployment
- [ ] Root Directory: `backend`
- [ ] Start Command: `npm start`
- [ ] Environment Variables:
  ```
  PORT=5000
  NODE_ENV=production
  FRONTEND_URL=<your-frontend-url>
  ```
- [ ] Domain generated
- [ ] Backend URL copied

## Frontend Deployment  
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm run build`
- [ ] Start Command: `npx serve -s dist -l $PORT`
- [ ] Environment Variables:
  ```
  VITE_BACKEND_URL=<your-backend-url>
  ```
- [ ] Domain generated
- [ ] Frontend URL copied

## Post-Deployment
- [ ] Update backend FRONTEND_URL with actual frontend domain
- [ ] Update frontend VITE_BACKEND_URL with actual backend domain
- [ ] Redeploy both services
- [ ] Test complete workflow
- [ ] Add URLs to GitHub repo description

## Commands to Run Locally After Updates

### Install new frontend dependency:
```bash
cd frontend
npm install
```

### Test locally:
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Push to trigger auto-deploy:
```bash
git add .
git commit -m "Updated for Railway deployment"
git push origin main
```

## Railway URLs Format
- Backend: `https://[project-name]-backend.up.railway.app`
- Frontend: `https://[project-name]-frontend.up.railway.app`

## Estimated Deployment Time
- Initial setup: 10-15 minutes
- Each deployment: 2-5 minutes
- Auto-deployment on git push: 2-3 minutes