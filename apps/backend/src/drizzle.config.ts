import { defineConfig } from "drizzle-kit";

// Use Turso in production, local SQLite in dev
const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
    schema: "./db/schema.ts",
    out: "./drizzle",
    dialect: isProd ? "turso" : "sqlite",
    dbCredentials: isProd
        ? {
              url: process.env.TURSO_DATABASE_URL!,
              authToken: process.env.TURSO_AUTH_TOKEN,
          }
        : {
              url: "sqlite.db",
          },
});
