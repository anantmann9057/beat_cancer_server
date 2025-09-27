#!/bin/bash

echo "🚀 Preparing Beat Cancer Server for Render Deployment..."
echo

# Check git status
if ! git status &>/dev/null; then
    echo "❌ Not a git repository. Initializing..."
    git init
    git add .
    git commit -m "Initial commit: Cancer support server with WebSocket"
else
    echo "✅ Git repository found"
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "📝 Uncommitted changes found. Committing..."
    git add .
    git commit -m "Update cancer support server for Render deployment"
    echo "✅ Changes committed"
else
    echo "✅ No uncommitted changes"
fi

echo
echo "🌟 Your cancer support server is ready for Render!"
echo
echo "📋 Next Steps:"
echo "1. Go to https://render.com"
echo "2. Sign up/login with GitHub"
echo "3. Create new Web Service"
echo "4. Connect this repository"
echo "5. Configure deployment:"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo "   - Plan: Free"
echo
echo "🔧 Required Environment Variables to set in Render:"
echo "   NODE_ENV=production"
echo "   DB_URL=your_mongodb_atlas_connection_string"
echo "   OPENAI_API_KEY=your_openai_api_key"
echo "   ACCESS_TOKEN_SECRET=your_secret"
echo "   REFRESH_TOKEN_SECRET=your_secret"
echo "   CORS_ORIGIN=*"
echo
echo "✨ Benefits of Render vs Vercel:"
echo "   ✅ Full WebSocket support (real-time chat)"
echo "   ✅ Persistent server (maintains connections)"
echo "   ✅ No function timeouts"
echo "   ✅ Free tier available"
echo "   ✅ Perfect for your cancer support app"
echo
echo "🎉 Deploy at: https://render.com"

# Check if .env exists and warn about environment variables
if [ -f ".env" ]; then
    echo
    echo "⚠️  Don't forget to set environment variables in Render dashboard!"
    echo "   Your .env file is not deployed for security reasons."
fi