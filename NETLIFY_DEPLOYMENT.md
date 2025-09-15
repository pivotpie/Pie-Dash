# 🚀 Netlify Deployment Guide for Pie-Dash

This comprehensive guide will walk you through deploying your Pie-Dash application to Netlify.

## 📋 Prerequisites

### Required Accounts & Services
- **Netlify Account**: [Sign up at netlify.com](https://netlify.com) (free tier is sufficient)
- **GitHub Account**: Your repository is already at `https://github.com/pivotpie/Pie-Dash.git`
- **Supabase Project**: You'll need your production Supabase URL and anon key
- **PPQ API Key**: Your PivotPie Query API key for production

### Required Information
Before starting, gather these environment variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_PPQ_API_KEY=your_production_ppq_api_key
```

## 🛠️ Deployment Steps

### Step 1: Push Changes to GitHub

The repository has been optimized for production with:
- ✅ Enhanced Vite configuration with code splitting
- ✅ Security headers and caching in `netlify.toml`
- ✅ Environment variable templates
- ✅ All recent features committed

Push the latest changes to GitHub:
```bash
git push origin main
```

### Step 2: Connect to Netlify

1. **Log in to Netlify**: Go to [app.netlify.com](https://app.netlify.com)

2. **Import from Git**:
   - Click "New site from Git"
   - Choose "GitHub" as your Git provider
   - Authorize Netlify to access your GitHub account
   - Select the `Pie-Dash` repository

3. **Configure Build Settings**:
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build` (auto-detected)
   - **Publish directory**: `dist` (auto-detected)
   - Click "Deploy site"

### Step 3: Configure Environment Variables

1. **Go to Site Settings**:
   - After deployment, click on your site
   - Go to "Site settings" > "Environment variables"

2. **Add Required Variables**:
   ```
   Key: VITE_SUPABASE_URL
   Value: https://your-project.supabase.co

   Key: VITE_SUPABASE_ANON_KEY
   Value: your_production_anon_key

   Key: VITE_PPQ_API_KEY
   Value: your_production_ppq_api_key

   Key: VITE_APP_ENV
   Value: production
   ```

3. **Save and Redeploy**:
   - Click "Save"
   - Go to "Deploys" and click "Trigger deploy" > "Deploy site"

### Step 4: Custom Domain (Optional)

1. **Add Custom Domain**:
   - Go to "Site settings" > "Domain management"
   - Click "Add custom domain"
   - Enter your domain (e.g., `pie-dash.yourdomain.com`)

2. **Configure DNS**:
   - Add a CNAME record pointing to your Netlify subdomain
   - Or use Netlify DNS for easier management

3. **Enable HTTPS**:
   - Netlify automatically provisions SSL certificates
   - Force HTTPS redirects are already configured in `netlify.toml`

## 🔧 Technical Configuration

### Build Settings (Already Configured)

The project is pre-configured with optimal settings:

**netlify.toml features:**
- ✅ Security headers (XSS protection, content type, frame options)
- ✅ Cache control for static assets
- ✅ SPA routing for React Router
- ✅ Node.js 20 environment

**vite.config.ts optimizations:**
- ✅ Code splitting for better performance
- ✅ Vendor chunk separation (React, Plotly, Leaflet, UI)
- ✅ CSS code splitting
- ✅ Production minification with esbuild

### Performance Features
- **Static Asset Caching**: 1 year cache for CSS/JS/images
- **HTML Cache Control**: No cache for HTML to ensure updates
- **Chunk Optimization**: Separate chunks for different libraries
- **Compression**: Gzip compression enabled

## 🚀 Expected Results

After successful deployment, your site will have:

### ✅ Core Features
- **Dashboard Analytics**: All executive overview features
- **Interactive Maps**: Leaflet maps with clustering
- **AI Chat Interface**: Modern glass morphism chat with deep-dive questions
- **Data Visualizations**: Plotly charts with proper formatting
- **Responsive Design**: Works on desktop, tablet, and mobile

### ✅ Enhanced Features
- **Deep-Dive Questions**: Contextual AI-generated questions after each analysis
- **Memory Service**: Session context and cross-analysis insights
- **Enhanced Markdown**: Rich table formatting in analysis artifacts
- **Voice Commands**: Browser-based voice interaction (if supported)
- **Command Palette**: Quick actions with keyboard shortcuts

### ✅ Performance
- **Fast Loading**: Optimized chunks and caching
- **SEO Ready**: Proper meta tags and security headers
- **PWA Features**: Service worker for tile caching
- **Mobile Optimized**: Responsive design with touch support

## 🔍 Testing Your Deployment

### 1. Basic Functionality Test
- ✅ Homepage loads correctly
- ✅ Navigation works (all routes)
- ✅ Maps display properly
- ✅ Charts render without errors

### 2. AI Features Test
- ✅ Chat interface opens
- ✅ Query processing works
- ✅ Deep-dive questions appear after analysis
- ✅ Table formatting displays correctly
- ✅ View Analysis buttons load historical data

### 3. Data Integration Test
- ✅ Supabase connection works
- ✅ CSV data loads from public folder
- ✅ API calls succeed
- ✅ No console errors

## 🐛 Troubleshooting

### Common Issues

**Build Fails:**
- Check environment variables are set correctly
- Ensure Node.js version is 20 (configured in netlify.toml)
- Check for TypeScript errors in build logs

**Environment Variables Not Working:**
- Ensure all VITE_ prefixed variables are set
- Check spelling and case sensitivity
- Redeploy after adding variables

**404 Errors on Refresh:**
- Netlify.toml redirects should handle this automatically
- Check the redirects configuration is present

**Charts/Maps Not Loading:**
- Verify all assets are in the public folder
- Check browser console for CORS errors
- Ensure API keys are correctly set

### Performance Issues
- Monitor bundle size in build logs
- Use Chrome DevTools to check loading times
- Verify CDN caching is working

## 📞 Support

If you encounter issues:
1. Check the Netlify deploy logs
2. Review browser console errors
3. Verify environment variables
4. Test the build locally with `npm run build && npm run preview`

## 🎉 Success!

Once deployed, your Pie-Dash application will be available at:
- **Netlify URL**: `https://yoursite.netlify.app`
- **Custom Domain**: `https://your-custom-domain.com` (if configured)

Enjoy your production-ready analytics dashboard with AI-powered insights! 🚀