import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

// Export schema
export * from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Check your .env file for the Neon PostgreSQL connection string.');
}

// PostgreSQL connection pool (Neon)
const poolConnection = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Drizzle database instance
export const db = drizzle(poolConnection, { schema });

// Export pool for raw queries if needed
export const pool = poolConnection;
