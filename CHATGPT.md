# ChatGPT Integration Documentation

## Overview
This ChatGPT integration provides AI-powered chat functionality through both WebSocket and REST API endpoints. Users can have conversations with ChatGPT, maintain conversation history, and use different contexts for specialized responses.

## Features
- ✅ **Real-time AI chat** via WebSocket
- ✅ **RESTful API** for ChatGPT interactions
- ✅ **Conversation history** storage and retrieval
- ✅ **Multiple contexts** (general, health, support, technical)
- ✅ **Streaming responses** for real-time typing effect
- ✅ **Content moderation** using OpenAI's moderation API
- ✅ **Token usage tracking** for cost management
- ✅ **Session management** for persistent conversations

## Environment Setup
Add your OpenAI API key to the `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

## WebSocket API

### Message Types for ChatGPT

#### 1. Chat Query (`chat_query`)
Send a question to ChatGPT:
```json
{
  "type": "chat_query",
  "data": {
    "query": "What is artificial intelligence?",
    "context": "general",
    "sessionId": "session_123",
    "streaming": false
  }
}
```

#### 2. Chat Response (`chat_response`)
Receive ChatGPT's response:
```json
{
  "type": "chat_response",
  "data": {
    "sessionId": "session_123",
    "status": "completed",
    "response": "Artificial intelligence is...",
    "metadata": {
      "model": "gpt-3.5-turbo",
      "tokens_used": {
        "prompt_tokens": 15,
        "completion_tokens": 50,
        "total_tokens": 65
      },
      "response_time": 1500,
      "context": "general"
    },
    "timestamp": "2025-09-27T10:30:00.000Z"
  }
}
```

#### 3. Chat Streaming (`chat_streaming`)
Receive streaming response chunks:
```json
{
  "type": "chat_streaming",
  "data": {
    "sessionId": "session_123",
    "chunk": "Artificial",
    "fullResponse": "Artificial intelligence is a branch of computer science...",
    "timestamp": "2025-09-27T10:30:00.000Z"
  }
}
```

#### 4. Chat History (`chat_history`)
Request conversation history:
```json
{
  "type": "chat_history",
  "data": {
    "sessionId": "session_123",
    "limit": 20
  }
}
```

Response:
```json
{
  "type": "chat_history",
  "data": {
    "sessionId": "session_123",
    "messages": [
      {
        "role": "user",
        "content": "Hello",
        "timestamp": "2025-09-27T10:30:00.000Z"
      },
      {
        "role": "assistant",
        "content": "Hello! How can I help you today?",
        "timestamp": "2025-09-27T10:30:05.000Z"
      }
    ],
    "context": "general",
    "totalTokensUsed": 150
  }
}
```

#### 5. Chat Context Change (`chat_context_change`)
Change conversation context:
```json
{
  "type": "chat_context_change",
  "data": {
    "sessionId": "session_123",
    "context": "health"
  }
}
```

#### 6. Chat Error (`chat_error`)
Error responses:
```json
{
  "type": "chat_error",
  "data": {
    "sessionId": "session_123",
    "error": "Rate limit exceeded",
    "type": "rate_limit",
    "timestamp": "2025-09-27T10:30:00.000Z"
  }
}
```

## REST API Endpoints

All endpoints are prefixed with `/api/v1/chatgpt`

### Generate Chat Response
```http
POST /api/v1/chatgpt/chat
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "query": "What is machine learning?",
  "context": "technical",
  "sessionId": "session_123"
}
```

Response:
```json
{
  "statusCode": 200,
  "data": {
    "sessionId": "session_123",
    "response": "Machine learning is a subset of artificial intelligence...",
    "metadata": {
      "model": "gpt-3.5-turbo",
      "tokens_used": {
        "total_tokens": 75
      },
      "response_time": 1200
    },
    "totalTokensUsed": 225
  },
  "message": "Response generated successfully"
}
```

### Get Chat History
```http
GET /api/v1/chatgpt/history
Authorization: Bearer <jwt_token>
```

Get specific conversation:
```http
GET /api/v1/chatgpt/history/session_123?limit=50
Authorization: Bearer <jwt_token>
```

### Delete Conversation
```http
DELETE /api/v1/chatgpt/conversation/session_123
Authorization: Bearer <jwt_token>
```

### Update Context
```http
PUT /api/v1/chatgpt/context/session_123
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "context": "health"
}
```

### Get Available Models
```http
GET /api/v1/chatgpt/models
```

### Moderate Content
```http
POST /api/v1/chatgpt/moderate
Content-Type: application/json

{
  "content": "Text to moderate"
}
```

### Get System Prompts
```http
GET /api/v1/chatgpt/prompts
```

### Update System Prompt
```http
PUT /api/v1/chatgpt/prompts
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "context": "health",
  "prompt": "You are a healthcare AI assistant..."
}
```

## Context Types

### General
Default context for general questions and conversations.

### Health
Specialized for health and wellness topics. Always reminds users to consult healthcare professionals.

### Support
Provides emotional support and guidance with empathy.

### Technical
Focused on technical information and solutions.

## Client Implementation Examples

### WebSocket Client (JavaScript)
```javascript
const ws = new WebSocket('ws://localhost:9000');

// Send chat query
function askChatGPT(question, context = 'general') {
  ws.send(JSON.stringify({
    type: 'chat_query',
    data: {
      query: question,
      context: context,
      streaming: true
    }
  }));
}

// Handle responses
ws.onmessage = function(event) {
  const message = JSON.parse(event.data);
  
  switch(message.type) {
    case 'chat_response':
      console.log('ChatGPT Response:', message.data.response);
      break;
    case 'chat_streaming':
      console.log('Streaming:', message.data.chunk);
      break;
    case 'chat_error':
      console.error('Chat Error:', message.data.error);
      break;
  }
};

// Example usage
askChatGPT('What is the weather like today?', 'general');
```

### REST API Client (JavaScript)
```javascript
async function chatWithGPT(query, context = 'general') {
  try {
    const response = await fetch('/api/v1/chatgpt/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: query,
        context: context
      })
    });
    
    const data = await response.json();
    return data.data.response;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example usage
chatWithGPT('Explain quantum computing', 'technical')
  .then(response => console.log(response));
```

## Error Handling

### Common Error Types
- `quota_exceeded`: API quota limit reached
- `rate_limit`: Rate limit exceeded
- `config_error`: Invalid API configuration
- `general_error`: General processing error
- `streaming_error`: Streaming response error

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "type": "error_type"
}
```

## Token Usage and Cost Management

The system tracks token usage for each conversation:
- Prompt tokens (input)
- Completion tokens (output)
- Total tokens used per conversation
- Cost estimation based on OpenAI pricing

## Security Considerations

1. **API Key Protection**: Store OpenAI API key securely in environment variables
2. **Authentication**: All REST endpoints require JWT authentication
3. **Content Moderation**: Use OpenAI's moderation API to filter inappropriate content
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Input Validation**: Validate all user inputs before processing
6. **Token Limits**: Monitor and limit token usage per user/session

## Testing

1. Start the server: `npm start`
2. Open `http://localhost:9000/websocket-test.html`
3. Connect and join as a user
4. Use the ChatGPT integration section to test AI chat
5. Try different contexts and streaming mode

## Database Schema

### ChatConversation Model
```javascript
{
  userId: String,          // User identifier
  clientId: String,        // WebSocket client ID
  sessionId: String,       // Conversation session ID
  title: String,           // Conversation title
  context: String,         // Context type
  messages: [{             // Message history
    role: String,          // 'user' | 'assistant' | 'system'
    content: String,       // Message content
    timestamp: Date,       // Message timestamp
    metadata: Object       // Additional metadata
  }],
  isActive: Boolean,       // Conversation status
  totalTokensUsed: Number, // Total tokens consumed
  lastActivity: Date,      // Last activity timestamp
  createdAt: Date,         // Creation timestamp
  updatedAt: Date          // Last update timestamp
}
```

## Performance Optimization

1. **Conversation History Limiting**: Only send last 10 messages to ChatGPT for context
2. **Token Management**: Track and limit token usage per user
3. **Streaming Responses**: Use streaming for better user experience
4. **Caching**: Consider caching frequent responses
5. **Database Indexing**: Proper indexing for conversation queries

## Monitoring and Logging

- All ChatGPT requests and responses are logged
- Token usage is tracked per conversation
- Error rates and response times are monitored
- API quota usage is tracked

This integration provides a comprehensive ChatGPT solution with both real-time WebSocket and REST API access, complete with conversation management, context switching, and proper error handling.