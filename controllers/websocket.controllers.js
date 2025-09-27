import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Mock function for serverless environment (WebSocket not available on Vercel)
function getMockClients() {
  return [];
}

// Get connected clients information (mock for serverless)
export const getWebSocketClients = asyncHandler(async (req, res) => {
  // In serverless environment, we can't maintain persistent WebSocket connections
  const clients = getMockClients();
  
  return res.status(200).json(
    new ApiResponse(200, {
      clients,
      notice: 'WebSocket functionality is not available in serverless deployment. Consider using Server-Sent Events or polling for real-time features.'
    }, 'WebSocket status retrieved (serverless mode)')
  );
});

// Send notification to a specific user (mock for serverless)
export const sendUserNotification = asyncHandler(async (req, res) => {
  const { userId, title, message, type = 'info' } = req.body;

  if (!userId || !message) {
    return res.status(400).json(
      new ApiResponse(400, null, 'userId and message are required')
    );
  }

  const notification = {
    title,
    message,
    type,
    id: generateNotificationId(),
    userId,
    timestamp: new Date().toISOString()
  };

  // In serverless environment, you would typically:
  // 1. Store notification in database
  // 2. Use a service like Pusher, Ably, or Socket.io with Redis
  // 3. Implement Server-Sent Events
  
  // For now, we'll just return the notification structure
  return res.status(200).json(
    new ApiResponse(200, {
      notification,
      notice: 'Notification prepared but not sent. WebSocket functionality requires persistent server. Consider using external real-time services.'
    }, 'Notification prepared (serverless mode)')
  );
});

// Send notification to all connected users (mock for serverless)
export const sendBroadcastNotification = asyncHandler(async (req, res) => {
  const { title, message, type = 'info' } = req.body;

  if (!message) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Message is required')
    );
  }

  const notification = {
    title,
    message,
    type,
    id: generateNotificationId(),
    timestamp: new Date().toISOString()
  };

  return res.status(200).json(
    new ApiResponse(200, {
      notification,
      notice: 'Broadcast prepared but not sent. WebSocket functionality requires persistent server. Consider using external real-time services.'
    }, 'Broadcast prepared (serverless mode)')
  );
});

// Get WebSocket server statistics (mock for serverless)
export const getWebSocketStats = asyncHandler(async (req, res) => {
  // Mock stats for serverless environment
  const stats = {
    serverType: 'serverless',
    totalConnections: 0,
    authenticatedUsers: 0,
    anonymousConnections: 0,
    averageConnectionTime: 0,
    activeConnections: 0,
    uptime: process.uptime(),
    notice: 'WebSocket statistics not available in serverless deployment'
  };

  return res.status(200).json(
    new ApiResponse(200, stats, 'Server statistics retrieved (serverless mode)')
  );
});

// Helper functions
function generateNotificationId() {
  return 'notif_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function calculateAverageConnectionTime(clients) {
  if (clients.length === 0) return 0;
  
  const now = new Date();
  const totalTime = clients.reduce((sum, client) => {
    return sum + (now - new Date(client.connectedAt));
  }, 0);
  
  return Math.round(totalTime / clients.length / 1000); // Return in seconds
}