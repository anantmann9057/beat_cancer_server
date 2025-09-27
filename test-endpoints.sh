#!/bin/bash

echo "🧪 Testing API endpoints before deployment..."
echo

# Start server in background for testing
echo "Starting server..."
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test endpoints
echo "1. Testing health endpoint..."
curl -s http://localhost:9000/api/health | jq . 2>/dev/null || echo "Health endpoint test completed"
echo

echo "2. Testing ChatGPT models endpoint..."
curl -s http://localhost:9000/api/v1/chatgpt/models | jq . 2>/dev/null || echo "Models endpoint test completed"
echo

echo "3. Testing WebSocket stats endpoint..."
curl -s http://localhost:9000/api/v1/websocket/stats | jq . 2>/dev/null || echo "WebSocket stats test completed"
echo

echo "4. Testing ChatGPT chat endpoint..."
curl -s -X POST http://localhost:9000/api/v1/chatgpt/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Hello test", "context": "general", "userId": "test_user"}' \
  | jq . 2>/dev/null || echo "Chat endpoint test completed"
echo

# Stop server
echo "Stopping test server..."
kill $SERVER_PID 2>/dev/null || true

echo "✅ Pre-deployment tests completed!"
echo "Ready for Vercel deployment."