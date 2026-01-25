# Railway Deployment Guide for YouTube to MP3 Converter

## 🚀 Step-by-Step Deployment on Railway

### Prerequisites
- ✅ GitHub account
- ✅ Railway account (sign up at https://railway.app)
- ✅ Your code pushed to GitHub

---

## 📋 Deployment Steps

### Step 1: Prepare Your GitHub Repository

1. **Initialize Git** (if not already done):
```bash
git init
git add .
git commit -m "Initial commit: YouTube to MP3 Converter"
```

2. **Create a new repository on GitHub**:
   - Go to https://github.com/new
   - Repository name: `youtube-to-mp3-converter`
   - Description: Add the description from README
   - Choose Public (better for portfolio)
   - Don't initialize with README (you already have one)
   - Click "Create repository"

3. **Push your code to GitHub**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/youtube-to-mp3-converter.git
git branch -M main
git push -u origin main
```

---

### Step 2: Set Up Railway Account

1. Go to **https://railway.app**
2. Click **"Start a New Project"** or **"Login with GitHub"**
3. Authorize Railway to access your GitHub repositories
4. You'll get $5 free credit per month (hobby plan)

---

### Step 3: Deploy Backend Service

1. **Create New Project**:
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your `youtube-to-mp3-converter` repository

2. **Configure Backend**:
   - Railway will auto-detect your Node.js project
   - Click on the service that was created
   - Go to **"Settings"** tab
   - Under **"Root Directory"**, set to: `backend`
   - Under **"Start Command"**, it should be: `npm start`

3. **Add Environment Variables**:
   - Go to **"Variables"** tab
   - Add the following variables:
     ```
     PORT=5000
     NODE_ENV=production
     ```
   - Railway automatically assigns PORT, but adding it ensures compatibility

4. **Deploy**:
   - Railway will automatically deploy
   - Wait for deployment to complete (2-5 minutes)
   - Once deployed, click on the service
   - Go to **"Settings"** > **"Networking"**
   - Click **"Generate Domain"** to get your backend URL
   - Copy this URL (e.g., `https://your-backend-name.up.railway.app`)

---

### Step 4: Deploy Frontend Service

1. **Add New Service**:
   - In the same project, click **"+ New"**
   - Select **"GitHub Repo"**
   - Choose the same repository

2. **Configure Frontend**:
   - Click on the new service
   - Go to **"Settings"** tab
   - Under **"Root Directory"**, set to: `frontend`
   - Under **"Build Command"**, set to: `npm run build`
   - Under **"Start Command"**, set to: `npx serve -s dist -l $PORT`

3. **Install serve package**:
   - You need to add `serve` to your frontend dependencies
   - Update `frontend/package.json` dependencies section:
   ```json
   "dependencies": {
     "react": "^18.2.0",
     "react-dom": "^18.2.0",
     "axios": "^1.5.0",
     "lucide-react": "^0.263.1",
     "serve": "^14.2.0"
   }
   ```

4. **Add Environment Variables**:
   - Go to **"Variables"** tab
   - Add:
     ```
     VITE_BACKEND_URL=https://your-backend-name.up.railway.app
     ```
   - Replace with your actual backend URL from Step 3

5. **Generate Frontend Domain**:
   - Go to **"Settings"** > **"Networking"**
   - Click **"Generate Domain"**
   - Copy your frontend URL

6. **Update Backend CORS**:
   - Go back to **Backend service**
   - Go to **"Variables"** tab
   - Add:
     ```
     FRONTEND_URL=https://your-frontend-name.up.railway.app
     ```
   - Replace with your actual frontend URL

7. **Redeploy Both Services**:
   - Click **"Deploy"** or trigger redeploy from GitHub

---

### Step 5: Verify Deployment

1. **Test Backend**:
   - Visit: `https://your-backend-name.up.railway.app`
   - You should see: "YouTube to MP3 Converter API is running!"

2. **Test Frontend**:
   - Visit: `https://your-frontend-name.up.railway.app`
   - Try converting a YouTube video
   - Check if download works

---

## 🔧 Troubleshooting

### Issue: Backend timeout errors
**Solution**: Railway hobby plan has 10-minute request timeout, should be enough. If issues persist:
- Check backend logs in Railway dashboard
- Verify FFmpeg is working (check logs)

### Issue: CORS errors
**Solution**: 
- Verify FRONTEND_URL is set correctly in backend variables
- Check if both services are deployed

### Issue: Build fails
**Solution**:
- Check Railway logs for specific error
- Verify `package.json` has all dependencies
- Ensure Node version compatibility

### Issue: Download not working
**Solution**:
- Check backend logs when clicking download
- Verify backend URL is correct in frontend environment variables
- Test backend endpoint directly

---

## 📊 Monitoring

1. **View Logs**:
   - Click on service > "Deployments" tab
   - Click on latest deployment
   - View real-time logs

2. **Check Usage**:
   - Go to project settings
   - View "Usage" tab to monitor your $5 credit

3. **Custom Domain** (Optional):
   - Go to service > "Settings" > "Networking"
   - Add your custom domain if you have one

---

## 🔄 Continuous Deployment

Railway automatically redeploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Your commit message"
git push origin main
# Railway will automatically deploy!
```

---

## 💡 Pro Tips

1. **Environment Separation**: Create separate Railway projects for development and production
2. **Logs**: Always check logs first when debugging
3. **Cost Management**: Monitor usage to stay within $5 free credit
4. **Backups**: Railway doesn't persist files, consider using external storage for downloads
5. **Performance**: Railway provides good performance for hobby projects

---

## 🎉 You're Done!

Your app is now live! Share your links:
- Frontend: `https://your-frontend-name.up.railway.app`
- Backend: `https://your-backend-name.up.railway.app`

Add these links to your:
- ✅ GitHub repository description
- ✅ Resume/Portfolio
- ✅ LinkedIn projects
- ✅ README.md file

---

## 📞 Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Your project logs in Railway dashboard
