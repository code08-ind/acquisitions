import 'dotenv/config';

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Configure Neon for local development with Neon Local
if (process.env.NODE_ENV === 'development') {
  // For HTTP-based queries (used by neon() function)
  neonConfig.fetchEndpoint = 'http://neon-local:5432/sql';
  
  // For WebSocket connections (used by Pool if needed)
  neonConfig.poolQueryViaFetch = true;
  neonConfig.useSecureWebSocket = false;
}

const sql = neon(process.env.DATABASE_URL);

const db = drizzle(sql);

export { db, sql };
