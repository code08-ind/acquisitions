# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Node.js Express API with authentication capabilities, secured by Arcjet middleware for bot detection, rate limiting, and shield protection. It uses Drizzle ORM with a Neon PostgreSQL database.

## Development Commands

### Running the Application (Local)
```bash
npm run dev      # Development mode with auto-reload (--watch flag)
npm start        # Production mode
```

### Running with Docker
```bash
# Development with Neon Local (ephemeral branches)
docker-compose -f docker-compose.dev.yml --env-file .env.development up --build

# Production with Neon Cloud
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# See DOCKER.md for complete Docker setup guide
```

### Code Quality
```bash
npm run lint            # Run ESLint to check for issues
npm run lint:fix        # Automatically fix ESLint issues
npm run format          # Format code with Prettier
npm run format:check    # Check if code is formatted correctly
```

### Database Operations
```bash
npm run db:generate     # Generate Drizzle migration files from schema changes
npm run db:migrate      # Apply migrations to the database
npm run db:studio       # Open Drizzle Studio for database management
```

## Architecture

### Application Entry Flow
- **index.js** → Loads environment variables and imports server.js
- **server.js** → Starts the Express server on the configured PORT
- **app.js** → Main Express application with middleware setup and route registration

### Middleware Stack (applied in order)
1. **helmet** - Security headers
2. **cors** - Cross-origin resource sharing
3. **cookieParser** - Parse cookies
4. **bodyParser** - Parse request bodies
5. **express.json/urlencoded** - JSON and form parsing
6. **morgan** - HTTP request logging (logs to Winston)
7. **securityMiddleware** - Arcjet security layer (globally applied)

### Security Layer (Arcjet)
The application uses Arcjet for comprehensive security:
- **Shield protection** - Blocks common attacks
- **Bot detection** - Allows search engines, blocks other bots
- **Rate limiting** - Role-based limits applied via `securityMiddleware`:
  - Guest: 5 requests/minute
  - User: 10 requests/minute  
  - Admin: 20 requests/minute
- All security decisions are logged via Winston

### Database Architecture
- **ORM**: Drizzle with Neon PostgreSQL (serverless HTTP connection)
- **Schema location**: `src/models/*.js` (auto-discovered by Drizzle config)
- **Migrations**: Generated in `drizzle/` directory
- **Current models**:
  - `users` table: id, name, email, password (hashed), role, timestamps

### Authentication Flow
1. **Signup/Signin** → Validates with Zod schemas in `src/validations/`
2. **Service layer** (`src/services/auth.service.js`) → Handles password hashing (bcrypt), user creation/retrieval
3. **JWT generation** → 7-day expiry tokens via `src/utils/jwt.js`
4. **Cookie storage** → HTTPOnly, secure (in production), SameSite strict, 15-minute maxAge

### Code Organization Pattern
The codebase follows a layered architecture:
```
Routes (src/routes/) 
  → Controllers (src/controllers/) - Request/response handling + validation
    → Services (src/services/) - Business logic + database operations
      → Models (src/models/) - Drizzle schema definitions
```

**Shared utilities**:
- `src/utils/jwt.js` - JWT signing and verification
- `src/utils/cookies.js` - Cookie management with secure defaults
- `src/utils/format.js` - Validation error formatting
- `src/config/` - Database connection, logger (Winston), Arcjet client

### Logging
Winston logger configured in `src/config/logger.js`:
- Logs to `logs/error.log` (errors only) and `logs/combined.log` (all levels)
- Console logging enabled in production
- Default log level: `info` (configurable via `LOG_LEVEL` env var)
- Service name: `aquisitions-api`

## Environment Configuration

Required environment variables (in `.env`):
```
PORT=3000
NODE_ENV=development|production
LOG_LEVEL=info
JWT_SECRET=<your-secret>
DATABASE_URL=<neon-postgresql-connection-string>
ARCJET_KEY=<your-arcjet-key>
```

## Code Style

### ESLint Rules
- 2-space indentation
- Single quotes
- Unix line endings
- Semicolons required
- No var declarations (use const/let)
- Prefer arrow callbacks
- Unused vars allowed if prefixed with `_`

### Prettier Configuration
- Print width: 80 characters
- Arrow function parens: avoid (e.g., `x => x`)
- Tab width: 2 spaces

## API Structure

Current endpoints:
- `GET /` - Root health check
- `GET /health` - Detailed health status with uptime
- `GET /api` - API status check
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-out` - User logout

## Development Notes

### Adding New Routes
1. Create route handler in `src/routes/`
2. Create controller in `src/controllers/`
3. Create service functions in `src/services/` if database operations are needed
4. Add Zod validation schemas in `src/validations/`
5. Register route in `src/app.js`

### Database Schema Changes
1. Modify or create models in `src/models/`
2. Run `npm run db:generate` to create migration files
3. Run `npm run db:migrate` to apply changes
4. Commit both the model changes and generated migration files

### Working with Drizzle
- Import `db` from `src/config/database.js` for queries
- Import table definitions from `src/models/`
- Use Drizzle query methods: `.select()`, `.insert()`, `.update()`, `.delete()`
- Use `.where(eq(column, value))` for filtering
- Use `.returning()` to get inserted/updated data

### Security Considerations
- All routes pass through Arcjet security middleware
- Rate limits are role-based (check `req.user.role` in middleware)
- Passwords are always hashed with bcrypt (salt rounds: 10)
- JWTs expire after 7 days
- Cookies are HTTPOnly and use SameSite strict in production
