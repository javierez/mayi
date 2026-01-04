import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
};

// Disable prefetch for Supabase Transaction Pooler
// Use smaller pool size to avoid exhausting Supabase's session mode limits
const client =
  globalForDb.client ??
  postgres(env.POSTGRES_URL, {
    prepare: false,
    max: 3, // Reduced pool size for Supabase session mode
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10, // Timeout for new connections
  });

if (env.NODE_ENV !== "production") {
  globalForDb.client = client;
}

export { client };
export const db = drizzle(client, { schema });
