#!/bin/bash
set -e

echo "🚀 Setting up Code Editor..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Build the Docker image
echo "📦 Building the secure Docker execution environment (opencode-env)..."
docker build -t opencode-env .

# Install dependencies
echo "📥 Installing NPM dependencies..."
npm install --legacy-peer-deps

echo "✅ Setup complete!"
echo "💻 Starting the development server..."
npm run dev
