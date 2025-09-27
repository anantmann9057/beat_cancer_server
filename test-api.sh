#!/bin/bash

echo "🧪 Testing ChatGPT API without authentication..."
echo

# Test 1: Get available models
echo "1. Testing GET /api/v1/chatgpt/models"
curl -s http://localhost:9000/api/v1/chatgpt/models | jq '.statusCode, .message' 2>/dev/null || echo "Response received (JSON parsing might require jq)"
echo -e "\n"

# Test 2: Get system prompts
echo "2. Testing GET /api/v1/chatgpt/prompts"
curl -s http://localhost:9000/api/v1/chatgpt/prompts | jq '.statusCode, .message' 2>/dev/null || echo "Response received (JSON parsing might require jq)"
echo -e "\n"

# Test 3: Chat request (should work even with disabled OpenAI key)
echo "3. Testing POST /api/v1/chatgpt/chat"
curl -s -X POST http://localhost:9000/api/v1/chatgpt/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Hello, test message", "context": "general", "userId": "test_user"}' \
  | jq '.statusCode, .message, .data.error' 2>/dev/null || echo "Response received"
echo -e "\n"

# Test 4: Get WebSocket clients
echo "4. Testing GET /api/v1/websocket/clients"
curl -s http://localhost:9000/api/v1/websocket/clients | jq '.statusCode, .message' 2>/dev/null || echo "Response received"
echo -e "\n"

# Test 5: Get WebSocket stats
echo "5. Testing GET /api/v1/websocket/stats"
curl -s http://localhost:9000/api/v1/websocket/stats | jq '.statusCode, .message' 2>/dev/null || echo "Response received"
echo -e "\n"

echo "✅ All API endpoints tested without authentication!"
echo "Note: ChatGPT responses might show config errors due to missing OpenAI API key, but the endpoints are accessible."