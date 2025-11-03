import { type Config } from "drizzle-kit";

export default {
  schema: "./src/server/db/schema.postgres.ts",
  dialect: "postgresql",
  dbCredentials: {
    // Use direct connection (non-pooling) for migrations
    // Set POSTGRES_URL_NON_POOLING in your environment
    url: process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL!,
  },
  migrations: {
    schema: "public",
  },
  out: "./supabase/migrations",
} satisfies Config;
