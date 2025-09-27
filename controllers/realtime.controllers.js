import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ChatConversation } from '../models/chat.models.js';

// Server-Sent Events endpoint for real-time updates
export const streamEvents = asyncHandler(async (req, res) => {
  const { userId = 'anonymous', sessionId } = req.query;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

  // Initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'connection',
    message: 'Connected to real-time updates',
    userId: userId,
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    })}\n\n`);
  }, 30000); // Every 30 seconds

  // Listen for conversation updates (in a real app, you'd use Redis or a message queue)
  const checkForUpdates = setInterval(async () => {
    try {
      if (sessionId) {
        // Check for new messages in the conversation
        const conversation = await ChatConversation.findOne({
          userId: userId,
          sessionId: sessionId
        });

        if (conversation && conversation.messages.length > 0) {
          const lastMessage = conversation.messages[conversation.messages.length - 1];
          
          // Only send if it's a recent AI response (within last minute)
          const oneMinuteAgo = new Date(Date.now() - 60000);
          if (lastMessage.timestamp > oneMinuteAgo && lastMessage.role === 'assistant') {
            res.write(`data: ${JSON.stringify({
              type: 'new_message',
              sessionId: sessionId,
              message: lastMessage,
              timestamp: new Date().toISOString()
            })}\n\n`);
          }
        }
      }
    } catch (error) {
      console.error('SSE update check error:', error);
    }
  }, 5000); // Check every 5 seconds

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    clearInterval(checkForUpdates);
    console.log(`SSE connection closed for user: ${userId}`);
  });

  // Keep the connection open
  req.on('end', () => {
    clearInterval(heartbeat);
    clearInterval(checkForUpdates);
  });
});

// Polling endpoint for chat updates
export const pollUpdates = asyncHandler(async (req, res) => {
  const { userId = 'anonymous', sessionId, lastTimestamp } = req.query;
  
  try {
    const since = lastTimestamp ? new Date(lastTimestamp) : new Date(Date.now() - 60000);
    
    if (sessionId) {
      // Get conversation updates since last poll
      const conversation = await ChatConversation.findOne({
        userId: userId,
        sessionId: sessionId
      });

      if (conversation) {
        const newMessages = conversation.messages.filter(msg => 
          new Date(msg.timestamp) > since
        );

        return res.status(200).json(
          new ApiResponse(200, {
            sessionId: sessionId,
            newMessages: newMessages,
            lastUpdate: new Date().toISOString(),
            hasUpdates: newMessages.length > 0
          }, 'Updates retrieved successfully')
        );
      }
    }

    // No updates found
    return res.status(200).json(
      new ApiResponse(200, {
        sessionId: sessionId,
        newMessages: [],
        lastUpdate: new Date().toISOString(),
        hasUpdates: false
      }, 'No new updates')
    );

  } catch (error) {
    console.error('Error polling updates:', error);
    return res.status(500).json(
      new ApiResponse(500, null, 'Failed to poll updates')
    );
  }
});

// Notify endpoint for external services to trigger updates
export const notifyUpdate = asyncHandler(async (req, res) => {
  const { userId, sessionId, message, type = 'notification' } = req.body;

  if (!userId || !message) {
    return res.status(400).json(
      new ApiResponse(400, null, 'userId and message are required')
    );
  }

  // In a real implementation, you would:
  // 1. Store the notification in a database
  // 2. Use Redis pub/sub to notify all connected SSE clients
  // 3. Or use a real-time service like Pusher, Ably, etc.

  return res.status(200).json(
    new ApiResponse(200, {
      userId,
      sessionId,
      message,
      type,
      timestamp: new Date().toISOString()
    }, 'Notification queued for delivery')
  );
});