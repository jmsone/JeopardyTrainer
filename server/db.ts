import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  const error = new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  console.error("💥 DATABASE ERROR:", error.message);
  console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes('DB') || k.includes('DATABASE')));
  throw error;
}

console.log("📦 Initializing database connection...");
console.log("Database URL configured:", process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

let pool: Pool;
let db: ReturnType<typeof drizzle>;

try {
  pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
  });
  
  db = drizzle({ client: pool, schema });
  console.log("✅ Database connection initialized");
} catch (error) {
  console.error("💥 Failed to initialize database:", error);
  throw error;
}

export { pool, db };
