# Acquisitions API

A Node.js Express API with authentication, secured by Arcjet middleware, using Drizzle ORM with Neon PostgreSQL.

## Quick Start

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Configure environment
cp .env.development .env
# Edit .env with your credentials

# Run development server
npm run dev
```

### Docker Development (with Neon Local)

```bash
# Install WebSocket support
npm install ws

# Configure environment
cp .env.development .env.local
# Edit .env.local with your Neon API credentials

# Start with Docker Compose
docker-compose -f docker-compose.dev.yml --env-file .env.local up --build
```

**📖 For comprehensive Docker setup instructions, see [DOCKER.md](./DOCKER.md)**

## Features

- 🔐 JWT-based authentication
- 🛡️ Arcjet security (bot detection, rate limiting, shield protection)
- 🗄️ Neon PostgreSQL with Drizzle ORM
- 🐳 Docker support with Neon Local for development
- 📝 Request logging with Winston
- ✅ Input validation with Zod

## Documentation

- [WARP.md](./WARP.md) - Development guidelines and architecture
- [DOCKER.md](./DOCKER.md) - Complete Docker setup guide

## API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health status
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-out` - User logout

## Database Commands

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio
```

## Code Quality

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

Start From 04:42:06 Mins.