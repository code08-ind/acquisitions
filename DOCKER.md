# Docker Setup Guide

This guide explains how to run the Acquisitions API using Docker with different configurations for development and production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Setup (with Neon Local)](#development-setup-with-neon-local)
- [Production Setup (with Neon Cloud)](#production-setup-with-neon-cloud)
- [Architecture Overview](#architecture-overview)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker Desktop (Mac/Windows) or Docker Engine (Linux)
- Docker Compose v2.0+
- Neon account with API key (get from [Neon Console](https://console.neon.tech))
- Arcjet API key (get from [Arcjet Dashboard](https://app.arcjet.com))

## Quick Start

### Development (Local with Neon Local)

```bash
# 1. Install ws package for WebSocket support
npm install ws

# 2. Copy and configure environment file
cp .env.development .env.local
# Edit .env.local with your Neon API credentials

# 3. Start development environment
docker-compose -f docker-compose.dev.yml --env-file .env.local up --build

# Application will be available at http://localhost:3000
```

### Production (with Neon Cloud Database)

```bash
# 1. Configure production environment
cp .env.production .env.prod
# Edit .env.prod with your Neon Cloud DATABASE_URL and secrets

# 2. Start production environment
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Application will be available at http://localhost:3000
```

## Development Setup (with Neon Local)

### What is Neon Local?

Neon Local is a Docker-based proxy that creates **ephemeral database branches** on your Neon Cloud project. This means:

- ✅ **True isolation**: Each container gets its own database branch
- ✅ **No schema drift**: Always uses your actual Neon schema
- ✅ **Fast setup**: No need to restore dumps or seed data
- ✅ **Auto cleanup**: Branches are deleted when containers stop
- ✅ **CI/CD friendly**: Perfect for automated testing

### Step-by-Step Development Setup

#### 1. Get Your Neon Credentials

Visit the [Neon Console](https://console.neon.tech):

1. Navigate to your project
2. Go to **Settings → API Keys** and create an API key
3. Note your **Project ID** from **Settings → General**

#### 2. Configure Development Environment

Edit `.env.development` with your credentials:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# JWT Secret (change in production!)
JWT_SECRET=dev-jwt-secret-change-in-production

# Neon Local Configuration
DATABASE_URL=postgres://neon:npg@db:5432/neondb

# Neon API Configuration (REQUIRED for Neon Local)
NEON_API_KEY=your_neon_api_key_here
NEON_PROJECT_ID=your_neon_project_id_here

# Arcjet Security
ARCJET_KEY=your_arcjet_key_here
```

#### 3. Install WebSocket Support

```bash
npm install ws
```

This is required for the Neon serverless driver to work with Neon Local.

#### 4. Start Development Environment

```bash
# Start with logs
docker-compose -f docker-compose.dev.yml --env-file .env.development up --build

# Or start in detached mode
docker-compose -f docker-compose.dev.yml --env-file .env.development up -d --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

#### 5. Run Database Migrations

```bash
# Generate migration files (if schema changed)
docker-compose -f docker-compose.dev.yml exec app npm run db:generate

# Apply migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate
```

#### 6. Development Workflow

The development setup includes:

- **Hot reload**: Source code changes are reflected immediately (via volume mount)
- **Ephemeral database**: Fresh branch created on startup, deleted on shutdown
- **Logs**: Written to `./logs` directory on host

```bash
# Stop services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes
docker-compose -f docker-compose.dev.yml down -v

# Restart after code changes
docker-compose -f docker-compose.dev.yml restart app
```

## Production Setup (with Neon Cloud)

### Step-by-Step Production Setup

#### 1. Get Your Neon Cloud Database URL

From the [Neon Console](https://console.neon.tech):

1. Select your project
2. Navigate to **Connection Details**
3. Copy the connection string (should look like):
   ```
   postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

#### 2. Configure Production Environment

Edit `.env.production`:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your-secure-random-jwt-secret-here

# Neon Cloud Database URL
DATABASE_URL=postgresql://neondb_owner:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Arcjet Security
ARCJET_KEY=your_production_arcjet_key_here
```

**🔒 Security Notes:**
- Never commit `.env.production` with real secrets
- Use a strong, randomly generated JWT secret
- Rotate secrets regularly

#### 3. Build and Deploy

```bash
# Build the production image
docker-compose -f docker-compose.prod.yml --env-file .env.production build

# Start in production mode
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Check health
curl http://localhost:3000/health
```

#### 4. Run Production Migrations

```bash
# Apply migrations to production database
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate

# Check application logs
docker-compose -f docker-compose.prod.yml logs -f app
```

#### 5. Production Management

```bash
# View running containers
docker-compose -f docker-compose.prod.yml ps

# Restart application
docker-compose -f docker-compose.prod.yml restart app

# Stop production
docker-compose -f docker-compose.prod.yml down

# View resource usage
docker stats acquisitions-app-prod
```

## Architecture Overview

### Development Architecture

```
┌─────────────────┐
│   Your Code     │
│  (Host Machine) │
└────────┬────────┘
         │ Volume Mount
         ▼
┌─────────────────────────────────────┐
│      Docker Container (app)         │
│  ┌──────────────────────────────┐   │
│  │   Express Application        │   │
│  │   (with hot reload)          │   │
│  └──────────┬───────────────────┘   │
└─────────────┼───────────────────────┘
              │ DATABASE_URL
              │ postgres://neon:npg@db:5432/neondb
              ▼
┌─────────────────────────────────────┐
│   Docker Container (Neon Local)     │
│  ┌──────────────────────────────┐   │
│  │     Neon Local Proxy         │   │
│  │  (creates ephemeral branch)  │   │
│  └──────────┬───────────────────┘   │
└─────────────┼───────────────────────┘
              │ NEON_API_KEY
              │ NEON_PROJECT_ID
              ▼
     ┌────────────────┐
     │  Neon Cloud    │
     │  (Your Branch) │
     └────────────────┘
```

### Production Architecture

```
┌─────────────────────────────────────┐
│      Docker Container (app)         │
│  ┌──────────────────────────────┐   │
│  │   Express Application        │   │
│  │   (production build)         │   │
│  └──────────┬───────────────────┘   │
└─────────────┼───────────────────────┘
              │ DATABASE_URL (full Neon connection string)
              ▼
     ┌────────────────────┐
     │  Neon Cloud        │
     │  (Production DB)   │
     └────────────────────┘
```

## Environment Variables

### Required Variables (All Environments)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Application port | `3000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `JWT_SECRET` | Secret for JWT signing | `your-secret-key` |
| `DATABASE_URL` | Database connection string | See below |
| `ARCJET_KEY` | Arcjet API key | `ajkey_xxx` |

### Development-Specific Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEON_API_KEY` | Neon API key for creating branches | [Neon Console → Settings → API Keys](https://console.neon.tech) |
| `NEON_PROJECT_ID` | Your Neon project ID | [Neon Console → Settings → General](https://console.neon.tech) |

### DATABASE_URL Formats

**Development (Neon Local):**
```bash
DATABASE_URL=postgres://neon:npg@db:5432/neondb
```

**Production (Neon Cloud):**
```bash
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require&channel_binding=require
```

## Database Migrations

### Development

```bash
# Generate migration from schema changes
docker-compose -f docker-compose.dev.yml exec app npm run db:generate

# Apply migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Open Drizzle Studio (database GUI)
docker-compose -f docker-compose.dev.yml exec app npm run db:studio
```

### Production

```bash
# Apply migrations (run this after deployment)
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate
```

**⚠️ Important:** Always test migrations in development first!

## Troubleshooting

### Common Issues

#### 1. "Cannot connect to database"

**Symptom:** Application fails to connect to database

**Development:**
```bash
# Check if Neon Local is running
docker-compose -f docker-compose.dev.yml ps

# Check Neon Local logs
docker-compose -f docker-compose.dev.yml logs db

# Verify credentials
echo $NEON_API_KEY
echo $NEON_PROJECT_ID
```

**Production:**
```bash
# Test database connection
docker-compose -f docker-compose.prod.yml exec app node -e "const {sql} = require('./src/config/database.js'); sql\`SELECT 1\`.then(console.log).catch(console.error)"
```

#### 2. "Branch creation failed"

**Cause:** Invalid Neon credentials or API limits

**Solution:**
- Verify `NEON_API_KEY` has proper permissions
- Check your Neon project isn't at branch limit
- Ensure project ID is correct

#### 3. "Module 'ws' not found"

**Cause:** WebSocket package not installed

**Solution:**
```bash
npm install ws
```

Then rebuild:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

#### 4. "Port 3000 already in use"

**Solution:**
```bash
# Stop conflicting service
lsof -ti:3000 | xargs kill -9

# Or change port in .env file
PORT=3001
```

#### 5. Hot Reload Not Working (Development)

**Check volume mounts:**
```bash
docker-compose -f docker-compose.dev.yml exec app ls -la /app/src
```

If files aren't visible, restart Docker Desktop or check volume permissions.

### Debugging Commands

```bash
# Enter running container
docker-compose -f docker-compose.dev.yml exec app sh

# Check environment variables
docker-compose -f docker-compose.dev.yml exec app env

# Test database connection
docker-compose -f docker-compose.dev.yml exec app npm run db:studio

# View all logs
docker-compose -f docker-compose.dev.yml logs

# Follow specific service logs
docker-compose -f docker-compose.dev.yml logs -f app
docker-compose -f docker-compose.dev.yml logs -f db
```

### Performance Tuning

**Development:**
- Neon Local creates small ephemeral branches, so performance should be good
- If slow, check your internet connection to Neon Cloud

**Production:**
- Adjust resource limits in `docker-compose.prod.yml`
- Monitor with: `docker stats acquisitions-app-prod`
- Check Neon dashboard for database metrics

## CI/CD Integration

### Example GitHub Actions Workflow

```yaml
name: Test with Neon Local

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start Neon Local
        run: |
          docker-compose -f docker-compose.dev.yml up -d
        env:
          NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
          NEON_PROJECT_ID: ${{ secrets.NEON_PROJECT_ID }}
      
      - name: Run migrations
        run: |
          docker-compose -f docker-compose.dev.yml exec -T app npm run db:migrate
      
      - name: Run tests
        run: |
          docker-compose -f docker-compose.dev.yml exec -T app npm test
      
      - name: Cleanup
        if: always()
        run: docker-compose -f docker-compose.dev.yml down -v
```

## Additional Resources

- [Neon Local Documentation](https://neon.com/docs/local/neon-local)
- [Neon Console](https://console.neon.tech)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## Support

For issues specific to:
- **Neon Local**: Check [Neon Discord](https://discord.gg/neon)
- **Application**: Create an issue in this repository
- **Docker**: Consult [Docker Documentation](https://docs.docker.com)
