import chatGPTService from '../services/chatgpt.service.js';
import { ChatConversation } from '../models/chat.models.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Generate ChatGPT response via REST API (no authentication required)
export const generateChatResponse = asyncHandler(async (req, res) => {
  const { query, context = 'general', sessionId, userId = 'anonymous' } = req.body;

  if (!query) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Query is required')
    );
  }

  try {
    // Generate session ID if not provided
    const chatSessionId = sessionId || `session_${userId}_${Date.now()}`;
    
    // Find or create conversation
    const conversation = await ChatConversation.findOrCreateConversation(
      userId.toString(), 
      `api_${Date.now()}`, 
      chatSessionId, 
      context
    );

    // Add user message to conversation
    conversation.addMessage('user', query);
    
    // Get conversation history
    const history = conversation.getConversationHistory();

    // Generate response
    const response = await chatGPTService.generateResponse(query, context, history);
    
    if (response.success) {
      // Add AI response to conversation
      conversation.addMessage('assistant', response.content, response.metadata);
      if (response.metadata?.tokens_used) {
        conversation.totalTokensUsed += response.metadata.tokens_used.total_tokens || 0;
      }
      await conversation.save();

      return res.status(200).json(
        new ApiResponse(200, {
          sessionId: chatSessionId,
          response: response.content,
          metadata: response.metadata,
          totalTokensUsed: conversation.totalTokensUsed
        }, 'Response generated successfully')
      );
    } else {
      return res.status(500).json(
        new ApiResponse(500, {
          error: response.error,
          type: response.type
        }, 'Failed to generate response')
      );
    }

  } catch (error) {
    console.error('Error generating chat response:', error);
    return res.status(500).json(
      new ApiResponse(500, null, 'Internal server error')
    );
  }
});

// Get chat conversation history (no authentication required)
export const getChatHistory = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { limit = 50, userId = 'anonymous' } = req.query;

  try {
    if (sessionId) {
      // Get specific conversation
      const conversation = await ChatConversation.findOne({
        userId: userId.toString(),
        sessionId: sessionId
      });
      
      if (!conversation) {
        return res.status(404).json(
          new ApiResponse(404, null, 'Conversation not found')
        );
      }

      return res.status(200).json(
        new ApiResponse(200, {
          sessionId: sessionId,
          messages: conversation.messages.slice(-parseInt(limit)),
          context: conversation.context,
          totalTokensUsed: conversation.totalTokensUsed,
          messageCount: conversation.messages.length,
          createdAt: conversation.createdAt,
          lastActivity: conversation.lastActivity
        }, 'Chat history retrieved successfully')
      );
    } else {
      // Get all user conversations
      const conversations = await ChatConversation.getUserConversations(userId.toString());
      
      return res.status(200).json(
        new ApiResponse(200, conversations, 'User conversations retrieved successfully')
      );
    }
    
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return res.status(500).json(
      new ApiResponse(500, null, 'Failed to fetch chat history')
    );
  }
});

// Delete chat conversation (no authentication required)
export const deleteChatConversation = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { userId = 'anonymous' } = req.query;

  try {
    const conversation = await ChatConversation.findOneAndDelete({
      userId: userId.toString(),
      sessionId: sessionId
    });

    if (!conversation) {
      return res.status(404).json(
        new ApiResponse(404, null, 'Conversation not found')
      );
    }

    return res.status(200).json(
      new ApiResponse(200, null, 'Conversation deleted successfully')
    );
    
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return res.status(500).json(
      new ApiResponse(500, null, 'Failed to delete conversation')
    );
  }
});

// Update chat context (no authentication required)
export const updateChatContext = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { context, userId = 'anonymous' } = req.body;

  if (!context) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Context is required')
    );
  }

  try {
    const conversation = await ChatConversation.findOne({
      userId: userId.toString(),
      sessionId: sessionId
    });

    if (!conversation) {
      return res.status(404).json(
        new ApiResponse(404, null, 'Conversation not found')
      );
    }

    conversation.context = context;
    await conversation.save();

    return res.status(200).json(
      new ApiResponse(200, {
        sessionId: sessionId,
        context: context
      }, 'Context updated successfully')
    );
    
  } catch (error) {
    console.error('Error updating context:', error);
    return res.status(500).json(
      new ApiResponse(500, null, 'Failed to update context')
    );
  }
});

// Get available ChatGPT models (public endpoint)
export const getAvailableModels = asyncHandler(async (req, res) => {
  try {
    const models = await chatGPTService.getAvailableModels();
    
    return res.status(200).json(
      new ApiResponse(200, models, 'Available models retrieved successfully')
    );
    
  } catch (error) {
    console.error('Error fetching models:', error);
    return res.status(500).json(
      new ApiResponse(500, null, 'Failed to fetch available models')
    );
  }
});

// Moderate content (public endpoint)
export const moderateContent = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Content is required')
    );
  }

  try {
    const moderation = await chatGPTService.moderateContent(content);
    
    return res.status(200).json(
      new ApiResponse(200, moderation, 'Content moderation completed')
    );
    
  } catch (error) {
    console.error('Error moderating content:', error);
    return res.status(500).json(
      new ApiResponse(500, null, 'Failed to moderate content')
    );
  }
});

// Get system prompts (public endpoint)
export const getSystemPrompts = asyncHandler(async (req, res) => {
  try {
    const prompts = chatGPTService.getSystemPrompts();
    
    return res.status(200).json(
      new ApiResponse(200, prompts, 'System prompts retrieved successfully')
    );
    
  } catch (error) {
    console.error('Error fetching system prompts:', error);
    return res.status(500).json(
      new ApiResponse(500, null, 'Failed to fetch system prompts')
    );
  }
});

// Update system prompt (public endpoint - in production you might want to restrict this)
export const updateSystemPrompt = asyncHandler(async (req, res) => {
  const { context, prompt } = req.body;

  if (!context || !prompt) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Context and prompt are required')
    );
  }

  try {
    chatGPTService.updateSystemPrompt(context, prompt);
    
    return res.status(200).json(
      new ApiResponse(200, {
        context: context,
        prompt: prompt
      }, 'System prompt updated successfully')
    );
    
  } catch (error) {
    console.error('Error updating system prompt:', error);
    return res.status(500).json(
      new ApiResponse(500, null, 'Failed to update system prompt')
    );
  }
});