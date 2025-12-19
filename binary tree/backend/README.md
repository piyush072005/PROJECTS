# Algo Playground Backend API

Backend API server for Algo Playground with MongoDB database.

## Features

- ✅ User registration and authentication
- ✅ JWT token-based authentication
- ✅ Secure password hashing with bcrypt
- ✅ User history tracking
- ✅ RESTful API endpoints
- ✅ MongoDB database integration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A strong random string for JWT signing
   - `FRONTEND_URL` - Your frontend URL (for CORS)

3. **Start MongoDB:**
   - Local: Make sure MongoDB is running on your machine
   - Atlas: Use your MongoDB Atlas connection string

4. **Run the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout user (requires auth)

### History

- `POST /api/history` - Add history entry (requires auth)
- `GET /api/history` - Get user history (requires auth)
- `GET /api/history/stats` - Get user statistics (requires auth)
- `DELETE /api/history/:id` - Delete specific entry (requires auth)
- `DELETE /api/history` - Clear all history (requires auth)

## Example API Calls

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Add History Entry
```bash
curl -X POST http://localhost:3000/api/history \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "sort",
    "data": {
      "algorithm": "quick",
      "arrayLength": 10,
      "comparisons": 25,
      "swaps": 8
    }
  }'
```

## MongoDB Setup

### Local MongoDB

1. Install MongoDB: https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/algo_playground`

### MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string from Atlas dashboard
4. Update `MONGODB_URI` in `.env`

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- CORS is configured for frontend domain
- Input validation using express-validator
- Passwords are never returned in API responses

## Environment Variables

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/algo_playground
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5500
```

## Project Structure

```
backend/
├── config/
│   └── database.js       # MongoDB connection
├── middleware/
│   └── auth.js          # JWT authentication middleware
├── models/
│   └── User.js          # User model with history
├── routes/
│   ├── auth.js          # Authentication routes
│   └── history.js       # History routes
├── .env                 # Environment variables (not in git)
├── .env.example         # Example environment file
├── .gitignore
├── package.json
├── server.js            # Main server file
└── README.md
```

