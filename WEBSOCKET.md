# WebSocket Documentation

## Overview
This WebSocket implementation provides real-time bidirectional communication between clients and the server. It supports user authentication, message broadcasting, notifications, and connection management.

## Features
- Real-time messaging
- User authentication and identification
- Message broadcasting
- Push notifications
- Connection heartbeat and automatic cleanup
- RESTful API endpoints for WebSocket management
- Client statistics and monitoring

## WebSocket Connection
Connect to the WebSocket server using:
```
ws://localhost:9000  (development)
wss://yourdomain.com (production)
```

## Message Types

### 1. Connection (`connection`)
Sent automatically when a client connects:
```json
{
  "type": "connection",
  "data": {
    "clientId": "client_abc123",
    "message": "Connected to WebSocket server",
    "timestamp": "2025-09-27T10:30:00.000Z"
  }
}
```

### 2. User Join (`user_join`)
Send to authenticate and identify the user:
```json
{
  "type": "user_join",
  "data": {
    "userId": "user123"
  }
}
```

Response:
```json
{
  "type": "user_join",
  "data": {
    "success": true,
    "userId": "user123",
    "message": "Successfully joined",
    "timestamp": "2025-09-27T10:30:00.000Z"
  }
}
```

### 3. Message (`message`)
Send a message to other connected users:
```json
{
  "type": "message",
  "data": {
    "message": "Hello everyone!"
  }
}
```

### 4. Broadcast (`broadcast`)
Send a broadcast message to all connected users:
```json
{
  "type": "broadcast",
  "data": {
    "message": "Important announcement!"
  }
}
```

### 5. Notification (`notification`)
Receive notifications from the server:
```json
{
  "type": "notification",
  "data": {
    "title": "New Message",
    "message": "You have a new message",
    "type": "info",
    "id": "notif_xyz789",
    "timestamp": "2025-09-27T10:30:00.000Z"
  }
}
```

### 6. Error (`error`)
Error messages from the server:
```json
{
  "type": "error",
  "data": {
    "error": "User not authenticated",
    "timestamp": "2025-09-27T10:30:00.000Z"
  }
}
```

## REST API Endpoints

All API endpoints require JWT authentication and are prefixed with `/api/v1/websocket`

### Get Connected Clients
```
GET /api/v1/websocket/clients
```
Response:
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "client_abc123",
      "userId": "user123",
      "connectedAt": "2025-09-27T10:30:00.000Z",
      "lastActivity": "2025-09-27T10:35:00.000Z"
    }
  ],
  "message": "Connected clients retrieved successfully"
}
```

### Get WebSocket Statistics
```
GET /api/v1/websocket/stats
```
Response:
```json
{
  "statusCode": 200,
  "data": {
    "totalConnections": 5,
    "authenticatedUsers": 3,
    "anonymousConnections": 2,
    "averageConnectionTime": 120,
    "activeConnections": 4
  },
  "message": "WebSocket statistics retrieved successfully"
}
```

### Send User Notification
```
POST /api/v1/websocket/notify/user
Content-Type: application/json

{
  "userId": "user123",
  "title": "New Message",
  "message": "You have a new message",
  "type": "info"
}
```

### Send Broadcast Notification
```
POST /api/v1/websocket/notify/broadcast
Content-Type: application/json

{
  "title": "System Maintenance",
  "message": "Server will be down for maintenance at 2 AM",
  "type": "warning"
}
```

## Client Implementation Examples

### JavaScript (Browser)
```javascript
const ws = new WebSocket('ws://localhost:9000');

ws.onopen = function() {
  console.log('Connected to WebSocket');
  
  // Join as user
  ws.send(JSON.stringify({
    type: 'user_join',
    data: { userId: 'user123' }
  }));
};

ws.onmessage = function(event) {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

// Send a message
function sendMessage(text) {
  ws.send(JSON.stringify({
    type: 'message',
    data: { message: text }
  }));
}
```

### Node.js Client
```javascript
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:9000');

ws.on('open', () => {
  console.log('Connected');
  
  // Join as user
  ws.send(JSON.stringify({
    type: 'user_join',
    data: { userId: 'user123' }
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('Received:', message);
});
```

## Security Considerations

1. **Authentication**: Users should be authenticated via JWT tokens in production
2. **Rate Limiting**: Implement rate limiting for message sending
3. **Input Validation**: All incoming messages are validated
4. **Connection Limits**: Consider implementing per-user connection limits
5. **CORS**: Configure CORS appropriately for production

## Testing

1. Start the server: `npm start`
2. Open `http://localhost:9000/websocket-test.html` in your browser
3. Connect to the WebSocket server
4. Join as a user and test messaging functionality

## Production Deployment

For production deployment:

1. Use `wss://` (WebSocket Secure) instead of `ws://`
2. Configure SSL/TLS certificates
3. Set up proper authentication middleware
4. Implement rate limiting and DDoS protection
5. Monitor connection counts and performance
6. Set up logging and error tracking

## Error Handling

The WebSocket server handles various error scenarios:
- Invalid JSON messages
- Unauthenticated users trying to send messages
- Connection timeouts and cleanup
- Malformed message types

All errors are logged server-side and appropriate error messages are sent to clients.

## Performance Notes

- Connections are automatically cleaned up after 30 seconds of inactivity
- Heartbeat messages are sent every 10 seconds to maintain connections
- Messages are broadcasted efficiently to minimize server load
- Client statistics are calculated on-demand to reduce memory usage