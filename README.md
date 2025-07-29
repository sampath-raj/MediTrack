# MediTrack - Medicine Management System

MediTrack is a comprehensive medicine management and alerting system that helps track inventory, expiration dates, and predicts demand based on seasonal and climate factors.

## Live Demo

<p align="center">
  <a href="http://medi-track-management.netlify.app/" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-Click%20Here-green?style=for-the-badge&logo=vercel" alt="Live Demo Badge"/>
  </a>
</p>

## 🔐 Demo Credentials

Use the following demo account to explore:

- **Email:** `medicinesystemadmins@gmail.com`
- **Password:** `Medicine@123`



## Features

- Medicine inventory management
- Automatic alerts for low stock and expiring items
- Climate and seasonal demand prediction
- Interactive reports and analytics
- User authentication and role-based access control

## Deployment Guide

### Backend Deployment (Render.com)

1. Create a new account on [Render.com](https://render.com) if you don't have one
2. From your dashboard, click "New Web Service"
3. Connect your GitHub repository
4. Use the following settings:
   - **Name**: medicine-management-backend
   - **Environment**: Node
   - **Build Command**: npm install
   - **Start Command**: node server.js
5. Add the following environment variables:
   - `NODE_ENV`: production
   - `PORT`: 10000
   - `MONGO_URI`: (your MongoDB connection string)
   - `JWT_SECRET`: (a secure random string)
   - `EMAIL_SERVICE`: (optional - for email notifications)
   - `EMAIL_USER`: (optional - for email notifications)
   - `EMAIL_PASS`: (optional - for email notifications)
6. Click "Create Web Service"

### Frontend Deployment (Netlify)

1. Create a new account on [Netlify](https://netlify.com) if you don't have one
2. From your dashboard, click "New site from Git"
3. Connect your GitHub repository
4. Use the following settings:
   - **Build command**: npm run build
   - **Publish directory**: build
5. Click "Deploy site"
6. After deployment, go to "Site settings" > "Build & deploy" > "Environment variables" and add:
   - `REACT_APP_API_URL`: (your Render.com backend URL)

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. Set up your `.env` file in the root directory
4. Start the backend: `cd backend && npm run dev`
5. Start the frontend: `cd frontend && npm start`

## License

MIT
