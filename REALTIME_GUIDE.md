# 🔄 Real-time Connectivity Guide for Cancer Support App

## ❌ WebSocket Limitation on Vercel

**Important**: Traditional WebSockets **DO NOT WORK** on Vercel because:
- Vercel uses serverless functions (stateless)
- No persistent connections are maintained
- Functions have execution time limits
- No server-side memory between requests

## ✅ Real-time Alternatives Available

### **1. Server-Sent Events (SSE) - Recommended**

**Best for**: Real-time updates from server to client

```javascript
// Client-side SSE connection
const eventSource = new EventSource('https://beat-cancer-server.vercel.app/api/v1/realtime/events?userId=patient123&sessionId=session_123');

eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received update:', data);
    
    // Handle different message types
    switch(data.type) {
        case 'new_message':
            displayMessage(data.message);
            break;
        case 'heartbeat':
            updateConnectionStatus('connected');
            break;
    }
};

eventSource.onerror = function(error) {
    console.error('SSE Error:', error);
    updateConnectionStatus('disconnected');
};
```

**Advantages:**
- ✅ Works on Vercel
- ✅ Real-time server-to-client updates  
- ✅ Automatic reconnection
- ✅ Simple to implement

**Limitations:**
- ❌ Server-to-client only (no client-to-server real-time)
- ❌ Limited concurrent connections

### **2. Polling - Most Compatible**

**Best for**: Checking for updates periodically

```javascript
// Client-side polling
async function pollForUpdates() {
    try {
        const response = await fetch(
            `https://beat-cancer-server.vercel.app/api/v1/realtime/poll?userId=patient123&sessionId=session_123&lastTimestamp=${lastUpdate}`
        );
        const data = await response.json();
        
        if (data.data.hasUpdates) {
            data.data.newMessages.forEach(message => {
                displayMessage(message);
            });
            lastUpdate = data.data.lastUpdate;
        }
    } catch (error) {
        console.error('Polling error:', error);
    }
}

// Poll every 5 seconds
setInterval(pollForUpdates, 5000);
```

**Advantages:**
- ✅ Works everywhere (including Vercel)
- ✅ Simple and reliable
- ✅ Easy to debug

**Limitations:**
- ❌ Not truly real-time (5-30 second delays)
- ❌ More server requests

### **3. WebSocket (Local Development Only)**

**Only works**: When running locally (`http://localhost:9000`)

```javascript
// Only for local development
const ws = new WebSocket('ws://localhost:9000');

ws.onopen = function() {
    // Join as user
    ws.send(JSON.stringify({
        type: 'user_join',
        data: { userId: 'patient123' }
    }));
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    handleRealtimeMessage(data);
};

// Send chat message
ws.send(JSON.stringify({
    type: 'chat_query',
    data: {
        query: 'What are the side effects of chemotherapy?',
        context: 'cancer',
        sessionId: 'session_123'
    }
}));
```

## 🚀 Deployment and Testing

### Deploy Updated Code to Vercel:

```bash
cd /Users/ginnamann/Desktop/beat_cancer_server
vercel --prod
```

### Test Real-time Endpoints:

```bash
# Test SSE endpoint
curl -N https://beat-cancer-server.vercel.app/api/v1/realtime/events?userId=patient123

# Test polling endpoint  
curl "https://beat-cancer-server.vercel.app/api/v1/realtime/poll?userId=patient123&sessionId=session_123"

# Send a chat message (triggers updates)
curl -X POST https://beat-cancer-server.vercel.app/api/v1/chatgpt/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What are treatment options for breast cancer?", "context": "cancer", "userId": "patient123", "sessionId": "session_123"}'
```

## 🏥 Cancer Support App Integration

### React/Vue/Angular Example:

```javascript
// React hook for real-time cancer support chat
import { useState, useEffect } from 'react';

export function useCancerSupportChat(userId, sessionId) {
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // Use SSE for real-time updates
        const eventSource = new EventSource(
            `https://beat-cancer-server.vercel.app/api/v1/realtime/events?userId=${userId}&sessionId=${sessionId}`
        );

        eventSource.onopen = () => setConnected(true);
        eventSource.onclose = () => setConnected(false);
        
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'new_message') {
                setMessages(prev => [...prev, data.message]);
            }
        };

        return () => {
            eventSource.close();
            setConnected(false);
        };
    }, [userId, sessionId]);

    const sendMessage = async (query, context = 'cancer') => {
        // Add user message immediately
        const userMessage = {
            role: 'user',
            content: query,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);

        // Send to API
        try {
            const response = await fetch('https://beat-cancer-server.vercel.app/api/v1/chatgpt/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    context,
                    userId,
                    sessionId
                })
            });

            const data = await response.json();
            
            if (data.statusCode === 200) {
                // AI response will come through SSE
                // or add immediately if SSE is not connected
                if (!connected) {
                    const aiMessage = {
                        role: 'assistant',
                        content: data.data.response,
                        timestamp: new Date().toISOString()
                    };
                    setMessages(prev => [...prev, aiMessage]);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return {
        messages,
        connected,
        sendMessage
    };
}
```

### Mobile App (React Native/Flutter):

```javascript
// React Native WebSocket alternative
import { useEffect, useState } from 'react';

export function useCancerChatPolling(userId, sessionId) {
    const [messages, setMessages] = useState([]);
    const [lastUpdate, setLastUpdate] = useState(new Date().toISOString());

    useEffect(() => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(
                    `https://beat-cancer-server.vercel.app/api/v1/realtime/poll?userId=${userId}&sessionId=${sessionId}&lastTimestamp=${lastUpdate}`
                );
                const data = await response.json();
                
                if (data.data.hasUpdates) {
                    setMessages(prev => [...prev, ...data.data.newMessages]);
                    setLastUpdate(data.data.lastUpdate);
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [userId, sessionId, lastUpdate]);

    return { messages };
}
```

## 🧪 Test Your Real-time Setup

1. **Open the test page**: `https://beat-cancer-server.vercel.app/realtime-chat.html`
2. **Choose connection method**: Server-Sent Events (recommended)
3. **Connect with your user ID**
4. **Send cancer-related questions**
5. **See real-time responses**

## 🌟 Recommended Architecture

For production cancer support app:

```
Frontend (React/Vue/Mobile)
    ↓
REST API (Vercel) 
    ↓
Server-Sent Events for updates
    ↓
MongoDB (conversation history)
    ↓
OpenAI (cancer-specific responses)
```

## 📱 Alternative Real-time Services

If you need more advanced real-time features:

1. **Pusher** - Real-time channels
2. **Ably** - WebSocket alternative
3. **Socket.io with Redis** on Railway/Render  
4. **Firebase Realtime Database**
5. **Supabase Realtime**

Your cancer support app now has real-time capabilities that work on Vercel! 🎉