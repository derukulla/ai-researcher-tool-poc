#!/bin/bash

# AI Researcher Evaluation Tool - Quick Start Script

echo "🤖 AI Researcher Evaluation Tool - Quick Start"
echo "=============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo ""

echo "Installing root dependencies..."
npm install

echo "Installing server dependencies..."
cd server
npm install

echo "Installing client dependencies..."
cd ../client
npm install
cd ..

echo ""
echo "✅ All dependencies installed!"
echo ""

# Check for .env file
if [ ! -f "server/.env" ]; then
    echo "⚠️  Environment file not found. Creating from template..."
    cp server/.env.example server/.env
    echo ""
    echo "📝 Please edit server/.env with your API keys:"
    echo "   - SERPAPI_API_KEY (required)"
    echo "   - PDL_API_KEY (required)"
    echo "   - GITHUB_TOKEN (required)"
    echo "   - GEMINI_API_KEY (optional)"
    echo ""
else
    echo "✅ Environment file found"
fi

echo "🚀 Setup complete! To start the application:"
echo ""
echo "Option 1: Full application (Frontend + Backend)"
echo "   npm run dev"
echo ""
echo "Option 2: Backend only"
echo "   npm run server"
echo ""
echo "Option 3: Terminal testing"
echo "   npm run test-linkedin <username>"
echo "   npm run test-cv <path-to-cv>"
echo "   # OR run directly:"
echo "   node tests/testLinkedInEvaluation.js <username>"
echo "   node tests/testCVEvaluation.js <path-to-cv>"
echo ""
echo "Visit http://localhost:3000 for the web interface"
echo "API available at http://localhost:5000"
echo ""
echo "🎉 Happy evaluating!"

