---
description: Repository Information Overview
alwaysApply: true
---

# Ultimate Bet Money Management Information

## Summary
Professional bankroll management system for sports betting with advanced money management algorithms. Features multiple betting strategies (Kelly Criterion, D'Alembert, Masaniello, etc.), real-time analytics dashboard, intelligent bankroll allocation, and a responsive professional interface.

## Structure
- **client/**: React frontend application with components, pages, and hooks
- **server/**: Express.js backend with API routes, database connection, and authentication
- **shared/**: Common code including database schema definitions
- **dist/**: Build output directory for production deployment
- **.zencoder/**: Configuration directory for the Zencoder tool

## Language & Runtime
**Language**: TypeScript/JavaScript
**Version**: ES2022
**Build System**: Vite
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- React 18 with TypeScript
- Express.js for backend API
- Drizzle ORM with PostgreSQL
- Stripe for payment processing
- Tailwind CSS + Radix UI for styling
- Chart.js and Recharts for visualizations
- React Query for state management
- Wouter for routing

**Development Dependencies**:
- TypeScript 5.6.3
- Vite 6.0.1
- Drizzle Kit for database migrations
- Cross-env for environment variables
- TSX for TypeScript execution

## Build & Installation
```bash
# Development
npm install
npm run dev

# Production build
npm run build

# Start production server
npm start
```

## Docker
**Dockerfile**: Dockerfile
**Image**: node:18-alpine
**Configuration**: Multi-stage build with production optimization
**Run Command**:
```bash
docker build -t ultimate-bet .
docker run -p 3000:3000 ultimate-bet
```

## Database
**ORM**: Drizzle ORM
**Database**: PostgreSQL
**Schema**: Located in shared/schema.ts
**Migration**: 
```bash
npm run db:push
```

## Deployment
**Platforms**:
- Railway (Primary) - Uses server.railway.js
- Render (Backup) - Uses server.render.js
- Local development with Vite dev server

**Configuration Files**:
- railway.json - Railway platform configuration
- render.yaml - Render platform configuration

## Project Structure
**Frontend (client/src)**:
- Components in components/
- Pages in pages/
- Utility functions and hooks in lib/
- Main entry point: main.tsx

**Backend (server)**:
- API routes in routes.ts
- Database connection in db.ts
- Authentication in replitAuth.ts
- Server entry point: index.ts

**Shared Code**:
- Database schema in schema.ts
- Type definitions shared between frontend and backend