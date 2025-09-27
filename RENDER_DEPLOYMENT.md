# 🚀 Deploy to Render - Complete Guide

Render is the **perfect platform** for your WebSocket-enabled cancer support server!

## 🌟 Why Render is Better Than Vercel for Your Project

### ✅ **Render Advantages:**
- **Full WebSocket Support** - Real bidirectional communication works perfectly
- **Persistent Server** - Your Node.js app runs continuously (not serverless)
- **In-memory State** - Can maintain WebSocket client connections
- **No Timeouts** - Server runs 24/7 without function limits
- **Free Tier** - $0/month for personal projects
- **Simple Deployment** - Git-based deployment with auto-deploy
- **Perfect for Real-time** - Designed for persistent services like yours

### ❌ **Vercel Limitations:**
- No WebSocket support (serverless only)
- Can't maintain persistent connections
- Function timeouts (30 seconds max)
- Requires complex workarounds for real-time features

## 🔧 Deployment Steps

### **Step 1: Prepare Your Repository**

Your code is already ready! The current structure works perfectly with Render.

**Required files** (already present):
- ✅ `package.json` with start script
- ✅ `index.js` as entry point  
- ✅ WebSocket server setup
- ✅ Express app configuration
- ✅ Environment variable support

### **Step 2: Deploy to Render**

1. **Go to Render**: https://render.com
2. **Sign up/Login** (free account)
3. **Connect GitHub**: Link your GitHub account
4. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Choose: `/Users/ginnamann/Desktop/beat_cancer_server` repo

### **Step 3: Configure Deployment**

**Service Configuration:**
```
Name: beat-cancer-server
Environment: Node
Region: Oregon (US West) or your preferred region
Branch: main (or your default branch)
Build Command: npm install
Start Command: npm start
```

**Advanced Settings:**
```
Plan: Free ($0/month)
Node Version: 18.x (auto-detected)
Health Check Path: /api/health
```

### **Step 4: Set Environment Variables**

In Render dashboard, add these environment variables:

**Required:**
```
NODE_ENV=production
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/beat_cancer_db
OPENAI_API_KEY=your_openai_api_key_here
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
CORS_ORIGIN=*
```

**Optional (if using Cloudinary):**
```
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_SECRET_KEY=your_secret_key
CLOUDINARY_URL=your_cloudinary_url
```

### **Step 5: Deploy**

Click **"Create Web Service"** - Render will:
1. Clone your repository
2. Install dependencies (`npm install`)
3. Start your server (`npm start`)
4. Provide you with a live URL

## 🌐 Your Deployed URLs

After deployment, you'll get:
- **Main App**: `https://beat-cancer-server-abcd.onrender.com`
- **API Health**: `https://beat-cancer-server-abcd.onrender.com/api/health`
- **WebSocket**: `wss://beat-cancer-server-abcd.onrender.com`

## 🧪 Testing Your Deployed App

Once deployed, test all functionality:

```bash
# Replace with your actual Render URL
export RENDER_URL="https://beat-cancer-server-abcd.onrender.com"

# Test API health
curl $RENDER_URL/api/health

# Test ChatGPT endpoint
curl -X POST $RENDER_URL/api/v1/chatgpt/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What are treatment options for breast cancer?", "context": "cancer", "userId": "patient123"}'

# Test WebSocket (use browser or WebSocket client)
# wss://beat-cancer-server-abcd.onrender.com
```

## 🔌 WebSocket Connection Examples

### **JavaScript (Browser)**
```javascript
// Full WebSocket functionality works on Render!
const ws = new WebSocket('wss://beat-cancer-server-abcd.onrender.com');

ws.onopen = function() {
    console.log('Connected to cancer support chat');
    
    // Join as user
    ws.send(JSON.stringify({
        type: 'user_join',
        data: { userId: 'patient123' }
    }));
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
    
    if (data.type === 'chat_response') {
        displayMessage(data.data.response);
    }
};

// Send cancer support question
function askCancerQuestion(question) {
    ws.send(JSON.stringify({
        type: 'chat_query',
        data: {
            query: question,
            context: 'cancer',
            sessionId: 'session_123'
        }
    }));
}

askCancerQuestion('What are the side effects of chemotherapy?');
```

### **React Hook**
```javascript
import { useState, useEffect } from 'react';

export function useCancerSupportWebSocket(userId) {
    const [ws, setWs] = useState(null);
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const websocket = new WebSocket('wss://beat-cancer-server-abcd.onrender.com');
        
        websocket.onopen = () => {
            setConnected(true);
            websocket.send(JSON.stringify({
                type: 'user_join',
                data: { userId }
            }));
        };
        
        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'chat_response') {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.data.response,
                    timestamp: data.data.timestamp
                }]);
            }
        };
        
        websocket.onclose = () => setConnected(false);
        
        setWs(websocket);
        
        return () => {
            websocket.close();
        };
    }, [userId]);

    const sendMessage = (query, context = 'cancer') => {
        if (ws && connected) {
            const userMessage = { role: 'user', content: query, timestamp: new Date().toISOString() };
            setMessages(prev => [...prev, userMessage]);
            
            ws.send(JSON.stringify({
                type: 'chat_query',
                data: { query, context, sessionId: `session_${userId}` }
            }));
        }
    };

    return { messages, connected, sendMessage };
}
```

### **Mobile (React Native)**
```javascript
// React Native WebSocket
import { useState, useEffect } from 'react';

export function useCancerChatWebSocket(userId) {
    const [ws, setWs] = useState(null);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const websocket = new WebSocket('wss://beat-cancer-server-abcd.onrender.com');
        
        websocket.onopen = () => {
            websocket.send(JSON.stringify({
                type: 'user_join',
                data: { userId }
            }));
        };
        
        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'chat_response') {
                setMessages(prev => [...prev, data.data]);
            }
        };
        
        setWs(websocket);
        
        return () => websocket.close();
    }, [userId]);

    return { ws, messages };
}
```

## 🏥 Cancer Support Features on Render

Your full feature set works perfectly on Render:

### **Real-time WebSocket Chat**
- ✅ Patient-AI conversations
- ✅ Real-time responses
- ✅ Multiple users simultaneously
- ✅ Connection management
- ✅ Heartbeat/reconnection

### **Cancer-Specific Contexts**
- ✅ `cancer` - Specialized cancer support
- ✅ `health` - General health topics  
- ✅ `support` - Emotional support
- ✅ `technical` - Medical information

### **Persistent Features**
- ✅ Conversation history storage
- ✅ User session management
- ✅ Real-time notifications
- ✅ Broadcasting capabilities

## 💰 Pricing Comparison

### **Render Free Tier:**
- ✅ **$0/month** for personal projects
- ✅ 750 hours/month (enough for continuous running)  
- ✅ Full WebSocket support
- ✅ Custom domains
- ✅ SSL certificates included
- ✅ Git-based deployment

### **Render Paid Plans:**
- **$7/month** - More compute resources
- **$25/month** - High performance
- **$85/month** - Enterprise features

## 🚀 Quick Start Commands

```bash
# If you haven't committed your code yet
git add .
git commit -m "Add cancer support server with WebSocket"
git push origin main

# Then deploy via Render dashboard (web interface)
# No CLI commands needed - just connect your repo!
```

## 🔧 Troubleshooting

### **Common Issues:**

1. **Build Failures**: Check Node.js version compatibility
2. **Database Connection**: Use MongoDB Atlas connection string
3. **Environment Variables**: Set all required vars in Render dashboard
4. **WebSocket Connection**: Use `wss://` (secure WebSocket) for HTTPS

### **Logs and Monitoring:**
- Access logs in Render dashboard
- Real-time log streaming available
- Built-in metrics and monitoring

## 🎯 Migration from Vercel to Render

If you want to migrate from Vercel:

1. **Keep Vercel for static sites** (if you have a frontend)
2. **Use Render for your API server** (this Node.js app)
3. **Update frontend API calls** to point to Render URL
4. **Full WebSocket functionality** will work perfectly

## 🌟 Conclusion

**Render is the perfect choice** for your cancer support server because:
- ✅ **Real WebSocket support** - No workarounds needed
- ✅ **Persistent server** - Maintains connections and state
- ✅ **Free tier** - Cost-effective for development
- ✅ **Easy deployment** - Git-based, automatic deployments
- ✅ **Better for real-time apps** - Designed for your use case

Your cancer support application will have **full real-time capabilities** on Render! 🎉

**Ready to deploy?** Go to https://render.com and connect your repository!