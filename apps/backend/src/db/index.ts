import { Database } from "bun:sqlite";
import { createClient } from "@libsql/client";
import { drizzle as drizzleBun } from "drizzle-orm/bun-sqlite";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Determine environment
const isDev = process.env.NODE_ENV !== "production";

// Use Bun SQLite for local development, Turso for production
let db: ReturnType<typeof drizzleBun> | ReturnType<typeof drizzleLibsql>;

if (isDev) {
    // Local development: use Bun's native SQLite
    console.log("Using local SQLite database (sqlite.db)");
    const sqlite = new Database("sqlite.db");
    db = drizzleBun(sqlite, { schema });
} else {
    // Production: use Turso (libsql)
    console.log("Using Turso database");
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });
    db = drizzleLibsql(client, { schema });
}

export { db };
