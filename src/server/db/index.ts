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
const client =
  globalForDb.client ??
  postgres(env.POSTGRES_URL, {
    prepare: false,
    max: 10, // Connection pool size
  });

if (env.NODE_ENV !== "production") {
  globalForDb.client = client;
}

export { client };
export const db = drizzle(client, { schema });
