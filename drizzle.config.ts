import { type Config } from "drizzle-kit";

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // Use pooler connection for migrations (direct connection not available)
    url: process.env.POSTGRES_URL!,
  },
  migrations: {
    schema: "public",
  },
  out: "./supabase/migrations",
} satisfies Config;
