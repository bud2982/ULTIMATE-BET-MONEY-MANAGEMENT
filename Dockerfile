# Ultimate Bet Money Management - Production Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S ultimate-bet -u 1001

# Change ownership
RUN chown -R ultimate-bet:nodejs /app
USER ultimate-bet

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 3000,
      path: '/health',
      method: 'GET',
      timeout: 5000
    };
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    });
    req.on('error', () => process.exit(1));
    req.on('timeout', () => process.exit(1));
    req.end();
  "

# Start the application
CMD ["node", "server.railway.js"]