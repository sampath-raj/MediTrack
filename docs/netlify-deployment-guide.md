# Netlify Deployment Guide for MediTrack Frontend

This guide walks you through deploying the MediTrack frontend to Netlify.

## Prerequisites

- A GitHub repository with your MediTrack code
- A Netlify account (free tier is sufficient)
- Your backend already deployed on Render.com

## Option 1: Deploy via Netlify Web Interface (Recommended for Beginners)

1. **Prepare your frontend for production**
   - Ensure your API URL in `src/index.jsx` is correctly pointing to your Render backend:
     ```javascript
     axios.defaults.baseURL = process.env.NODE_ENV === 'production'
       ? 'https://medicine-backend-zgtg.onrender.com'
       : 'http://localhost:5000';
     ```

2. **Log in to Netlify**
   - Go to [Netlify.com](https://netlify.com) and log in or create an account

3. **Create a new site**
   - Click the "Add new site" button and select "Import an existing project"
   - Choose "GitHub" as your Git provider
   - Authorize Netlify to access your GitHub repositories if prompted
   - Select your MediTrack repository

4. **Configure build settings**
   - Set the following options:
     - **Base directory**: `frontend` (if your frontend is in a subdirectory)
     - **Build command**: `npm run build`
     - **Publish directory**: `build` or `frontend/build` (depending on your project structure)

5. **Advanced build settings**
   - Click "Show advanced" and add the following environment variable:
     - Key: `CI`
     - Value: `false` (this prevents the build from failing on warnings)

6. **Deploy your site**
   - Click "Deploy site" and wait for the build process to complete
   - Netlify will provide you with a temporary URL (e.g., `https://random-name-123abc.netlify.app`)

7. **Set a custom domain (optional)**
   - Go to "Site settings" > "Domain management"
   - Click "Add custom domain" and follow the instructions

## Option 2: Deploy via Netlify CLI (For Developers)

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Log in to Netlify from CLI**
   ```bash
   netlify login
   ```

3. **Navigate to your frontend directory**
   ```bash
   cd d:\Medicine\frontend
   ```

4. **Initialize Netlify configuration**
   ```bash
   netlify init
   ```
   - This will guide you through linking your local project to a Netlify site
   - Choose to create a new site or use an existing one

5. **Deploy your site**
   ```bash
   netlify deploy --prod
   ```

## Configuring Continuous Deployment

Netlify automatically sets up continuous deployment from your GitHub repository. Every time you push changes to your repository, Netlify will automatically rebuild and redeploy your site.

To control when deployments happen:
1. Go to "Site settings" > "Build & deploy" > "Continuous deployment"
2. Configure your deployment settings according to your workflow

## Troubleshooting Common Issues

1. **Build failures**
   - Check your build logs in Netlify's dashboard
   - If the build fails due to ESLint warnings, add the `CI=false` environment variable

2. **API connectivity issues**
   - Ensure CORS is properly configured on your backend
   - Verify the API URL is correct in your frontend code

3. **Routing issues with React Router**
   - Your `netlify.toml` file should already include the redirect rule for SPA routing:
     ```toml
     [[redirects]]
       from = "/*"
       to = "/index.html"
       status = 200
     ```

4. **Environment variables**
   - Add any required environment variables in "Site settings" > "Build & deploy" > "Environment variables"
   - Remember that environment variables used in React must be prefixed with `REACT_APP_`

## Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/#netlify)
