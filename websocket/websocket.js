import { WebSocket } from 'ws';
import chatGPTService from '../services/chatgpt.service.js';
import { ChatConversation } from '../models/chat.models.js';

// Store connected clients
const clients = new Map();

// WebSocket message types
export const WS_MESSAGE_TYPES = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  MESSAGE: 'message',
  BROADCAST: 'broadcast',
  USER_JOIN: 'user_join',
  USER_LEAVE: 'user_leave',
  NOTIFICATION: 'notification',
  ERROR: 'error',
  // ChatGPT related types
  CHAT_QUERY: 'chat_query',
  CHAT_RESPONSE: 'chat_response',
  CHAT_STREAMING: 'chat_streaming',
  CHAT_ERROR: 'chat_error',
  CHAT_HISTORY: 'chat_history',
  CHAT_CONTEXT_CHANGE: 'chat_context_change'
};

export function setupWebSocket(wss) {
  console.log('Setting up WebSocket server...');

  wss.on('connection', (ws, request) => {
    const clientId = generateClientId();
    
    // Store client connection
    clients.set(clientId, {
      ws: ws,
      id: clientId,
      userId: null, // Will be set when user authenticates
      connectedAt: new Date(),
      lastActivity: new Date()
    });

    console.log(`New WebSocket connection: ${clientId}`);
    console.log(`Total connected clients: ${clients.size}`);

    // Send welcome message
    sendMessage(ws, {
      type: WS_MESSAGE_TYPES.CONNECTION,
      data: {
        clientId: clientId,
        message: 'Connected to WebSocket server',
        timestamp: new Date().toISOString()
      }
    });

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const rawMessage = data.toString();
        console.log(`[WebSocket] Raw message from ${clientId}:`, rawMessage);
        
        // Try to parse JSON
        let message;
        try {
          message = JSON.parse(rawMessage);
        } catch (parseError) {
          console.error(`[WebSocket] JSON parse error from ${clientId}:`, parseError.message);
          console.error(`[WebSocket] Raw data:`, rawMessage);
          
          sendError(ws, {
            error: 'Invalid JSON format',
            details: parseError.message,
            received: rawMessage.substring(0, 100) // First 100 chars for debugging
          });
          return;
        }
        
        // Validate message structure
        if (!message || typeof message !== 'object') {
          sendError(ws, {
            error: 'Message must be a valid JSON object',
            received: typeof message
          });
          return;
        }
        
        if (!message.type) {
          sendError(ws, {
            error: 'Message must have a "type" field',
            received: message
          });
          return;
        }
        
        console.log(`[WebSocket] Valid message from ${clientId}:`, message);
        handleMessage(clientId, message);
        
      } catch (error) {
        console.error(`[WebSocket] Unexpected error handling message from ${clientId}:`, error);
        sendError(ws, {
          error: 'Internal server error processing message',
          details: error.message
        });
      }
    });

    // Handle connection close
    ws.on('close', (code, reason) => {
      console.log(`WebSocket connection closed: ${clientId}, Code: ${code}, Reason: ${reason}`);
      
      const client = clients.get(clientId);
      if (client && client.userId) {
        // Notify other clients that user left
        broadcastToOthers(clientId, {
          type: WS_MESSAGE_TYPES.USER_LEAVE,
          data: {
            userId: client.userId,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      clients.delete(clientId);
      console.log(`Total connected clients: ${clients.size}`);
    });

    // Handle connection errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      clients.delete(clientId);
    });

    // Update last activity
    ws.on('pong', () => {
      const client = clients.get(clientId);
      if (client) {
        client.lastActivity = new Date();
      }
    });
  });

  // Heartbeat to keep connections alive
  const heartbeat = setInterval(() => {
    const now = new Date();
    clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        // Check if client is still responsive (30 seconds timeout)
        if (now - client.lastActivity > 30000) {
          console.log(`Terminating inactive client: ${clientId}`);
          client.ws.terminate();
          clients.delete(clientId);
        } else {
          client.ws.ping();
        }
      } else {
        clients.delete(clientId);
      }
    });
  }, 10000); // Check every 10 seconds

  // Cleanup on server shutdown
  process.on('SIGTERM', () => {
    clearInterval(heartbeat);
    clients.forEach((client) => {
      client.ws.close();
    });
  });
}

// Handle different types of messages
function handleMessage(clientId, message) {
  const client = clients.get(clientId);
  if (!client) return;

  // Update last activity
  client.lastActivity = new Date();

  console.log(`Message from ${clientId}:`, message);

  switch (message.type) {
    case WS_MESSAGE_TYPES.USER_JOIN:
      handleUserJoin(clientId, message.data);
      break;
    
    case WS_MESSAGE_TYPES.MESSAGE:
      handleChatMessage(clientId, message.data);
      break;
    
    case WS_MESSAGE_TYPES.BROADCAST:
      handleBroadcast(clientId, message.data);
      break;
    
    case WS_MESSAGE_TYPES.CHAT_QUERY:
      handleChatQuery(clientId, message.data);
      break;
    
    case WS_MESSAGE_TYPES.CHAT_HISTORY:
      handleChatHistoryRequest(clientId, message.data);
      break;
    
    case WS_MESSAGE_TYPES.CHAT_CONTEXT_CHANGE:
      handleChatContextChange(clientId, message.data);
      break;
    
    default:
      sendError(client.ws, `Unknown message type: ${message.type}`);
  }
}

// Handle user joining (authentication)
function handleUserJoin(clientId, data) {
  const client = clients.get(clientId);
  if (!client) return;

  // Here you can add JWT token validation if needed
  // For now, we'll just accept the userId from the client
  if (data.userId) {
    client.userId = data.userId;
    
    sendMessage(client.ws, {
      type: WS_MESSAGE_TYPES.USER_JOIN,
      data: {
        success: true,
        userId: data.userId,
        message: 'Successfully joined',
        timestamp: new Date().toISOString()
      }
    });

    // Notify other clients
    broadcastToOthers(clientId, {
      type: WS_MESSAGE_TYPES.USER_JOIN,
      data: {
        userId: data.userId,
        timestamp: new Date().toISOString()
      }
    });
  } else {
    sendError(client.ws, 'userId is required');
  }
}

// Handle chat messages
function handleChatMessage(clientId, data) {
  const client = clients.get(clientId);
  if (!client) {
    sendError(client.ws, 'Client not found');
    return;
  }
  
  // Use clientId as fallback if no userId is set
  const userId = client.userId || clientId;

  const messageData = {
    type: WS_MESSAGE_TYPES.MESSAGE,
    data: {
      userId: userId,
      message: data.message,
      timestamp: new Date().toISOString(),
      clientId: clientId
    }
  };

  // Broadcast message to all other clients
  broadcastToOthers(clientId, messageData);
  
  // Send confirmation to sender
  sendMessage(client.ws, {
    type: WS_MESSAGE_TYPES.MESSAGE,
    data: {
      success: true,
      message: 'Message sent',
      timestamp: new Date().toISOString()
    }
  });
}

// Handle broadcast messages
function handleBroadcast(clientId, data) {
  const client = clients.get(clientId);
  if (!client) {
    sendError(client.ws, 'Client not found');
    return;
  }
  
  // Use clientId as fallback if no userId is set
  const userId = client.userId || clientId;

  broadcastToAll({
    type: WS_MESSAGE_TYPES.BROADCAST,
    data: {
      userId: userId,
      message: data.message,
      timestamp: new Date().toISOString()
    }
  });
}

// Utility functions
function generateClientId() {
  return 'client_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function sendMessage(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function sendError(ws, error) {
  const errorData = typeof error === 'string' 
    ? { error: error }
    : error;
    
  sendMessage(ws, {
    type: WS_MESSAGE_TYPES.ERROR,
    data: {
      ...errorData,
      timestamp: new Date().toISOString()
    }
  });
}

function broadcastToAll(message) {
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      sendMessage(client.ws, message);
    }
  });
}

function broadcastToOthers(excludeClientId, message) {
  clients.forEach((client, clientId) => {
    if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
      sendMessage(client.ws, message);
    }
  });
}

// Handle ChatGPT query
async function handleChatQuery(clientId, data) {
  const client = clients.get(clientId);
  if (!client) {
    sendError(client.ws, 'Client not found');
    return;
  }

  // Use clientId as fallback if no userId is set
  const userId = client.userId || clientId;
  const { query, context = 'general', sessionId, streaming = false } = data;
  
  if (!query) {
    sendError(client.ws, 'Query is required');
    return;
  }

  try {
    // Generate session ID if not provided
    const chatSessionId = sessionId || `session_${clientId}_${Date.now()}`;
    
    // Find or create conversation
    const conversation = await ChatConversation.findOrCreateConversation(
      userId, 
      clientId, 
      chatSessionId, 
      context
    );

    // Add user message to conversation
    conversation.addMessage('user', query);
    
    // Get conversation history
    const history = conversation.getConversationHistory();

    // Send processing notification
    sendMessage(client.ws, {
      type: WS_MESSAGE_TYPES.CHAT_RESPONSE,
      data: {
        sessionId: chatSessionId,
        status: 'processing',
        message: 'Generating response...',
        timestamp: new Date().toISOString()
      }
    });

    if (streaming) {
      // Handle streaming response
      const response = await chatGPTService.generateStreamingResponse(
        query,
        context,
        history,
        (chunk, fullResponse) => {
          sendMessage(client.ws, {
            type: WS_MESSAGE_TYPES.CHAT_STREAMING,
            data: {
              sessionId: chatSessionId,
              chunk: chunk,
              fullResponse: fullResponse,
              timestamp: new Date().toISOString()
            }
          });
        }
      );

      if (response.success) {
        // Add AI response to conversation
        conversation.addMessage('assistant', response.content, response.metadata);
        if (response.metadata?.tokens_used) {
          conversation.totalTokensUsed += response.metadata.tokens_used.total_tokens || 0;
        }
        await conversation.save();

        // Send final response
        sendMessage(client.ws, {
          type: WS_MESSAGE_TYPES.CHAT_RESPONSE,
          data: {
            sessionId: chatSessionId,
            status: 'completed',
            response: response.content,
            metadata: response.metadata,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        sendMessage(client.ws, {
          type: WS_MESSAGE_TYPES.CHAT_ERROR,
          data: {
            sessionId: chatSessionId,
            error: response.error,
            type: response.type,
            timestamp: new Date().toISOString()
          }
        });
      }
    } else {
      // Handle regular response
      const response = await chatGPTService.generateResponse(query, context, history);
      
      if (response.success) {
        // Add AI response to conversation
        conversation.addMessage('assistant', response.content, response.metadata);
        if (response.metadata?.tokens_used) {
          conversation.totalTokensUsed += response.metadata.tokens_used.total_tokens || 0;
        }
        await conversation.save();

        // Send response
        sendMessage(client.ws, {
          type: WS_MESSAGE_TYPES.CHAT_RESPONSE,
          data: {
            sessionId: chatSessionId,
            status: 'completed',
            response: response.content,
            metadata: response.metadata,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        sendMessage(client.ws, {
          type: WS_MESSAGE_TYPES.CHAT_ERROR,
          data: {
            sessionId: chatSessionId,
            error: response.error,
            type: response.type,
            timestamp: new Date().toISOString()
          }
        });
      }
    }

  } catch (error) {
    console.error('Error handling chat query:', error);
    sendMessage(client.ws, {
      type: WS_MESSAGE_TYPES.CHAT_ERROR,
      data: {
        error: 'Failed to process chat query',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Handle chat history request
async function handleChatHistoryRequest(clientId, data) {
  const client = clients.get(clientId);
  if (!client) {
    sendError(client.ws, 'Client not found');
    return;
  }

  // Use clientId as fallback if no userId is set
  const userId = client.userId || clientId;

  try {
    const { sessionId, limit = 50 } = data;
    
    if (sessionId) {
      // Get specific conversation
      const conversation = await ChatConversation.findOne({
        userId: userId,
        sessionId: sessionId
      });
      
      if (conversation) {
        sendMessage(client.ws, {
          type: WS_MESSAGE_TYPES.CHAT_HISTORY,
          data: {
            sessionId: sessionId,
            messages: conversation.messages.slice(-limit),
            context: conversation.context,
            totalTokensUsed: conversation.totalTokensUsed,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        sendError(client.ws, 'Conversation not found');
      }
    } else {
      // Get all user conversations
      const conversations = await ChatConversation.getUserConversations(userId);
      
      sendMessage(client.ws, {
        type: WS_MESSAGE_TYPES.CHAT_HISTORY,
        data: {
          conversations: conversations,
          timestamp: new Date().toISOString()
        }
      });
    }
    
  } catch (error) {
    console.error('Error fetching chat history:', error);
    sendError(client.ws, 'Failed to fetch chat history');
  }
}

// Handle chat context change
async function handleChatContextChange(clientId, data) {
  const client = clients.get(clientId);
  if (!client) {
    sendError(client.ws, 'Client not found');
    return;
  }

  // Use clientId as fallback if no userId is set
  const userId = client.userId || clientId;

  try {
    const { sessionId, context } = data;
    
    if (!sessionId || !context) {
      sendError(client.ws, 'sessionId and context are required');
      return;
    }

    const conversation = await ChatConversation.findOne({
      userId: userId,
      sessionId: sessionId
    });

    if (conversation) {
      conversation.context = context;
      await conversation.save();

      sendMessage(client.ws, {
        type: WS_MESSAGE_TYPES.CHAT_CONTEXT_CHANGE,
        data: {
          sessionId: sessionId,
          context: context,
          message: `Context changed to ${context}`,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      sendError(client.ws, 'Conversation not found');
    }
    
  } catch (error) {
    console.error('Error changing chat context:', error);
    sendError(client.ws, 'Failed to change chat context');
  }
}

// Export functions for use in other parts of the application
export function getConnectedClients() {
  return Array.from(clients.values()).map(client => ({
    id: client.id,
    userId: client.userId,
    connectedAt: client.connectedAt,
    lastActivity: client.lastActivity
  }));
}

export function sendNotificationToUser(userId, notification) {
  clients.forEach((client) => {
    // Match by userId if set, otherwise match by clientId for anonymous users
    const clientUserId = client.userId || client.id;
    if (clientUserId === userId && client.ws.readyState === WebSocket.OPEN) {
      sendMessage(client.ws, {
        type: WS_MESSAGE_TYPES.NOTIFICATION,
        data: {
          ...notification,
          timestamp: new Date().toISOString()
        }
      });
    }
  });
}

export function sendNotificationToAll(notification) {
  broadcastToAll({
    type: WS_MESSAGE_TYPES.NOTIFICATION,
    data: {
      ...notification,
      timestamp: new Date().toISOString()
    }
  });
}