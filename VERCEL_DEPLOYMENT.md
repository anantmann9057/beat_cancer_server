# Beat Cancer Server - Vercel Deployment Guide

## 🚀 Deployment Status

This Node.js server with WebSocket and ChatGPT integration has been configured for Vercel deployment.

## ⚠️ Important Notes

### WebSocket Limitations on Vercel
- **Traditional WebSockets are not supported** on Vercel's serverless platform
- The WebSocket functionality has been **converted to REST API endpoints** for compatibility
- Real-time features can be implemented using **Server-Sent Events (SSE)** or **polling**

### What Works on Vercel:
✅ **REST API Endpoints** - All your API routes work perfectly
✅ **ChatGPT Integration** - Full ChatGPT functionality via REST API
✅ **Database Connection** - MongoDB connection works
✅ **Authentication** - JWT auth system works
✅ **Static File Serving** - Your HTML test files are served

### What Doesn't Work on Vercel:
❌ **WebSocket Server** - Real-time bidirectional communication
❌ **Persistent Connection Management** - In-memory client storage
❌ **Real-time Broadcasting** - Live message broadcasting

## 🌐 Deployment Steps

### 1. Environment Variables
Set these in your Vercel dashboard:

```bash
NODE_ENV=production
DB_URL=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=1d
CORS_ORIGIN=*
```

### 2. MongoDB Configuration
- Update your MongoDB connection to use **MongoDB Atlas** (cloud database)
- Ensure your connection string supports serverless functions
- Add your Vercel deployment URLs to MongoDB Atlas IP whitelist

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

Or deploy via GitHub integration:
1. Push your code to GitHub
2. Connect repository to Vercel
3. Deploy automatically

## 📡 API Endpoints (Available on Vercel)

### ChatGPT API
- `POST /api/v1/chatgpt/chat` - Generate ChatGPT response
- `GET /api/v1/chatgpt/history` - Get chat history
- `GET /api/v1/chatgpt/models` - Available models
- `POST /api/v1/chatgpt/moderate` - Content moderation

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

### WebSocket Alternative (REST-based)
- `GET /api/v1/websocket/clients` - Get connected clients info
- `GET /api/v1/websocket/stats` - WebSocket statistics
- `POST /api/v1/websocket/notify/user` - Send notification to user
- `POST /api/v1/websocket/notify/broadcast` - Broadcast notification

## 🔄 Real-time Alternatives

Since WebSockets don't work on Vercel, here are alternatives:

### 1. Server-Sent Events (SSE)
```javascript
// Client-side
const eventSource = new EventSource('/api/v1/events');
eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### 2. Polling
```javascript
// Poll for updates every 5 seconds
setInterval(async () => {
  const response = await fetch('/api/v1/chatgpt/history/latest');
  const data = await response.json();
  // Update UI with new data
}, 5000);
```

### 3. Webhook Integration
Set up webhooks to receive real-time updates from external services.

## 🧪 Testing Your Deployed API

After deployment, test with:

```bash
# Test ChatGPT endpoint
curl -X POST https://your-app.vercel.app/api/v1/chatgpt/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Hello!", "context": "general", "userId": "test_user"}'

# Test health check
curl https://your-app.vercel.app/api/health
```

## 🛠️ Local Development vs Production

### Local Development (with WebSockets):
```bash
npm run dev
# Full WebSocket functionality available
# Test at: http://localhost:9000
```

### Production (Vercel - REST only):
```bash
vercel dev
# REST API endpoints only
# WebSocket test pages show connection errors (expected)
```

## 📁 File Structure for Vercel

```
beat_cancer_server/
├── api/
│   └── index.js          # Vercel serverless entry point
├── vercel.json           # Vercel configuration
├── package.json          # Updated with engines
├── routes/               # API routes (work on Vercel)
├── controllers/          # API controllers
├── models/              # Database models
├── services/            # Business logic
└── public/              # Static files (served by Vercel)
```

## 🔧 Troubleshooting

### Common Issues:

1. **Database Connection Timeout**
   - Use MongoDB Atlas with proper connection pooling
   - Set shorter connection timeouts

2. **Function Timeout**
   - Vercel functions have a 30-second limit
   - Optimize your ChatGPT API calls

3. **Environment Variables**
   - Set all required env vars in Vercel dashboard
   - Don't include `.env` file in deployment

4. **CORS Issues**
   - Configure CORS properly for your domain
   - Set `CORS_ORIGIN=*` for development

## 🚀 Recommended Architecture for Production

For a production system, consider:

1. **Vercel for API** - Host your REST API endpoints
2. **Separate WebSocket Service** - Use Railway, Render, or DigitalOcean for WebSocket server
3. **Database** - MongoDB Atlas or PlanetScale
4. **Real-time Communication** - Use services like Pusher, Ably, or Socket.io with Redis

## 📞 Need Real-time Features?

If you need real-time WebSocket functionality, consider these platforms:
- **Railway** - Supports WebSockets
- **Render** - Full Node.js server support  
- **DigitalOcean App Platform** - WebSocket support
- **Heroku** - Traditional hosting with WebSocket support

Your REST API will work perfectly on Vercel, but for WebSockets, you'll need a different hosting solution.