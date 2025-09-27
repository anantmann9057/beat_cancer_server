import OpenAI from 'openai';

class ChatGPTService {
  constructor() {
    // Initialize OpenAI client only if API key is available
    
    this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    // Default configuration
    this.defaultConfig = {
      model: 'gpt-3.5-turbo',
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    // System prompts for different contexts
    this.systemPrompts = {
      general: "You are a helpful AI assistant. Provide clear, accurate, and helpful responses to user questions.",
      health: "You are a helpful AI assistant specialized in health and wellness topics. Always remind users to consult healthcare professionals for medical advice.",
      support: "You are a compassionate AI assistant providing emotional support and guidance. Be empathetic and understanding.",
      technical: "You are a technical AI assistant. Provide detailed, accurate technical information and solutions.",
      cancer: "You are a helpful AI assistant specialized in cancer-related topics. Provide accurate information and support to users affected by cancer."
    };
  }

  /**
   * Generate a response using ChatGPT
   * @param {string} userMessage - The user's message
   * @param {string} context - Context type (general, health, support, technical)
   * @param {Array} conversationHistory - Previous messages in the conversation
   * @param {Object} customConfig - Custom configuration for the API call
   * @returns {Promise<Object>} Response object with content and metadata
   */
  async generateResponse(userMessage, context = 'general', conversationHistory = [], customConfig = {}) {
    try {
      // Check if OpenAI client is available
      if (!this.openai) {
        return {
          success: false,
          error: 'ChatGPT service is not available. Please check API key configuration.',
          type: 'config_error'
        };
      }

      // Validate input
      if (!userMessage || typeof userMessage !== 'string') {
        throw new Error('User message is required and must be a string');
      }

      // Prepare configuration
      const config = { ...this.defaultConfig, ...customConfig };
      
      // Prepare messages array
      const messages = [
        {
          role: 'system',
          content: this.systemPrompts[context] || this.systemPrompts.general
        }
      ];

      // Add conversation history
      if (conversationHistory && conversationHistory.length > 0) {
        // Limit history to last 10 exchanges to manage token usage
        const recentHistory = conversationHistory.slice(-10);
        messages.push(...recentHistory);
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      console.log(`[ChatGPT] Generating response for: "${userMessage.substring(0, 50)}..."`);
      
      // Make API call
      const startTime = Date.now();
      const completion = await this.openai.chat.completions.create({
        ...config,
        messages: messages
      });

      const responseTime = Date.now() - startTime;
      const response = completion.choices[0]?.message?.content;

      if (!response) {
        throw new Error('No response generated from ChatGPT');
      }

      console.log(`[ChatGPT] Response generated in ${responseTime}ms`);

      return {
        success: true,
        content: response,
        metadata: {
          model: completion.model,
          tokens_used: completion.usage,
          response_time: responseTime,
          context: context,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('[ChatGPT] Error generating response:', error);
      
      // Handle specific OpenAI errors
      if (error.code === 'insufficient_quota') {
        return {
          success: false,
          error: 'API quota exceeded. Please try again later.',
          type: 'quota_exceeded'
        };
      } else if (error.code === 'rate_limit_exceeded') {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again in a moment.',
          type: 'rate_limit'
        };
      } else if (error.code === 'invalid_api_key') {
        return {
          success: false,
          error: 'Invalid API configuration.',
          type: 'config_error'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to generate response',
        type: 'general_error'
      };
    }
  }

  /**
   * Generate a streaming response
   * @param {string} userMessage - The user's message
   * @param {string} context - Context type
   * @param {Array} conversationHistory - Previous messages
   * @param {Function} onChunk - Callback for streaming chunks
   * @returns {Promise<Object>} Final response object
   */
  async generateStreamingResponse(userMessage, context = 'general', conversationHistory = [], onChunk) {
    try {
      const messages = [
        {
          role: 'system',
          content: this.systemPrompts[context] || this.systemPrompts.general
        }
      ];

      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-10);
        messages.push(...recentHistory);
      }

      messages.push({
        role: 'user',
        content: userMessage
      });

      const stream = await this.openai.chat.completions.create({
        ...this.defaultConfig,
        messages: messages,
        stream: true
      });

      let fullResponse = '';
      const startTime = Date.now();

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          if (onChunk) {
            onChunk(content, fullResponse);
          }
        }
      }

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        content: fullResponse,
        metadata: {
          model: 'gpt-3.5-turbo',
          response_time: responseTime,
          context: context,
          timestamp: new Date().toISOString(),
          streaming: true
        }
      };

    } catch (error) {
      console.error('[ChatGPT] Streaming error:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate streaming response',
        type: 'streaming_error'
      };
    }
  }

  /**
   * Moderate content using OpenAI's moderation API
   * @param {string} content - Content to moderate
   * @returns {Promise<Object>} Moderation result
   */
  async moderateContent(content) {
    try {
      const moderation = await this.openai.moderations.create({
        input: content
      });

      const result = moderation.results[0];
      
      return {
        flagged: result.flagged,
        categories: result.categories,
        category_scores: result.category_scores
      };

    } catch (error) {
      console.error('[ChatGPT] Moderation error:', error);
      return {
        flagged: false,
        error: 'Moderation check failed'
      };
    }
  }

  /**
   * Get available models
   * @returns {Promise<Array>} List of available models
   */
  async getAvailableModels() {
    try {
      const models = await this.openai.models.list();
      return models.data
        .filter(model => model.id.includes('gpt'))
        .map(model => ({
          id: model.id,
          created: model.created,
          owned_by: model.owned_by
        }));
    } catch (error) {
      console.error('[ChatGPT] Error fetching models:', error);
      return [];
    }
  }

  /**
   * Update system prompt for a specific context
   * @param {string} context - Context type
   * @param {string} prompt - New system prompt
   */
  updateSystemPrompt(context, prompt) {
    this.systemPrompts[context] = prompt;
  }

  /**
   * Get current system prompts
   * @returns {Object} Current system prompts
   */
  getSystemPrompts() {
    return { ...this.systemPrompts };
  }
}

// Export the class instead of an instance
export default ChatGPTService;