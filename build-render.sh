#!/bin/bash

# Build script for Render deployment
echo "🚀 Starting Render build process..."

# Set npm config for legacy peer deps
echo "⚙️ Setting npm configuration..."
npm config set legacy-peer-deps true
npm config set auto-install-peers true

# Clean installation to ensure all dependencies are available
echo "📦 Installing dependencies..."
npm ci --include=dev --legacy-peer-deps

# Verify vite is installed
echo "🔍 Verifying vite installation..."
if ! npm list vite > /dev/null 2>&1; then
    echo "❌ Vite not found, installing explicitly..."
    npm install vite @vitejs/plugin-react --save --legacy-peer-deps
fi

# Build the project
echo "🏗️ Building project..."
npx vite build

echo "✅ Build completed successfully!"