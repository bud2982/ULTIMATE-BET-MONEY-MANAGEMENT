#!/bin/bash

# Build script for Render deployment
echo "🚀 Starting Render build process..."

# Clean installation to ensure all dependencies are available
echo "📦 Installing dependencies..."
npm ci --include=dev

# Verify vite is installed
echo "🔍 Verifying vite installation..."
if ! npm list vite > /dev/null 2>&1; then
    echo "❌ Vite not found, installing explicitly..."
    npm install vite @vitejs/plugin-react --save
fi

# Build the project
echo "🏗️ Building project..."
npx vite build

echo "✅ Build completed successfully!"