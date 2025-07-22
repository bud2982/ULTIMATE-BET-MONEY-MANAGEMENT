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

# Verify build output
echo "🔍 Verifying build output..."
echo "Contents of dist/:"
ls -la dist/ || echo "dist/ not found"
echo "Contents of dist/public/:"
ls -la dist/public/ || echo "dist/public/ not found"

if [ -f "dist/public/index.html" ]; then
    echo "✅ Frontend build successful - index.html found"
else
    echo "❌ Frontend build failed - index.html not found"
    exit 1
fi

echo "✅ Build completed successfully!"