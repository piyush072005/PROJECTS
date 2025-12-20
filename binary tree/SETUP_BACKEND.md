# Backend Setup Guide

## Quick Start

### 1. Install MongoDB

**Option A: Local MongoDB**
- Download and install from: https://www.mongodb.com/try/download/community
- Start MongoDB service on your system

**Option B: MongoDB Atlas (Cloud - Recommended)**
- Sign up at: https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Get your connection string from Atlas dashboard

### 2. Set Up Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env file with your MongoDB connection string
# MONGODB_URI=mongodb://localhost:27017/algo_playground
# Or for Atlas:

```

### 3. Configure Environment Variables

Edit `backend/.env`:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
FRONTEND_URL=http://localhost:5500
```

### 4. Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:3000`

### 5. Update Frontend API Configuration

Edit `scripts/api-config.js`:

```javascript
BASE_URL: 'http://localhost:3000/api'
```

For production, change to your backend URL:
```javascript
BASE_URL: 'https://your-api-domain.com/api'
```

## API Endpoints

### History
- `POST /api/history` - Add history entry (requires token)
- `GET /api/history` - Get user history (requires token)
- `GET /api/history/stats` - Get statistics (requires token)
- `DELETE /api/history/:id` - Delete entry (requires token)
- `DELETE /api/history` - Clear all history (requires token)

## Testing the API

## Frontend Integration

- `scripts/api-config.js` - API configuration

## Troubleshooting

### MongoDB Connection Issues
- Check MongoDB is running (local) or connection string is correct (Atlas)
- Verify network access in MongoDB Atlas if using cloud
- Check firewall settings

### CORS Errors
- Update `FRONTEND_URL` in `.env` to match your frontend URL
- Ensure backend CORS middleware is configured correctly


## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Update `FRONTEND_URL` to production domain
3. Use MongoDB Atlas or managed MongoDB service
4. Deploy backend to hosting service (Heroku, Railway, Render, etc.)
5. Update frontend `api-config.js` with production API URL


