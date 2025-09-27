#!/bin/bash

echo "🚀 Deploying Beat Cancer Server to Vercel..."
echo

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "✅ Vercel CLI ready"

# Check for environment variables
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Make sure to set environment variables in Vercel dashboard:"
    echo "   - DB_URL (MongoDB connection string)"
    echo "   - OPENAI_API_KEY"
    echo "   - ACCESS_TOKEN_SECRET"
    echo "   - REFRESH_TOKEN_SECRET"
    echo "   - NODE_ENV=production"
    echo
fi

# Build check
echo "🔧 Running pre-deployment checks..."

# Check package.json
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

# Check vercel.json
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found"
    exit 1
fi

# Check API entry point
if [ ! -f "api/index.js" ]; then
    echo "❌ api/index.js not found"
    exit 1
fi

echo "✅ All required files present"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo
echo "🎉 Deployment complete!"
echo
echo "📝 Next steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Update MongoDB connection to use Atlas (cloud database)"
echo "3. Test your API endpoints"
echo
echo "⚠️  Note: WebSocket functionality is not available on Vercel"
echo "   Use the REST API endpoints for all functionality"
echo
echo "🧪 Test your deployed API:"
echo "   curl https://your-app.vercel.app/api/health"
echo "   curl https://your-app.vercel.app/api/v1/chatgpt/models"