#!/bin/bash

# AI Tutor Game Deployment Script

echo "🚀 Deploying AI Tutor Game..."

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t ai-tutor-game .

# Stop any existing container
echo "🛑 Stopping existing container..."
docker stop ai-tutor-game || true
docker rm ai-tutor-game || true

# Run the container
echo "▶️  Starting the application..."
docker run -d \
  --name ai-tutor-game \
  -p 3000:3000 \
  --restart unless-stopped \
  ai-tutor-game

echo "✅ Deployment completed!"
echo "🌐 Your game is now running at http://localhost:3000"
echo ""
echo "To view logs: docker logs ai-tutor-game"
echo "To stop: docker stop ai-tutor-game"