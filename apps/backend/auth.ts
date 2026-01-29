import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession } from "better-auth/plugins";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
    trustedOrigins: ["http://localhost:5173", "http://localhost:3000"],
    database: drizzleAdapter(db, { provider: "sqlite" }),
    emailAndPassword: {
        enabled: true,
    },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    user: {
        additionalFields: {
            robinhoodToken: {
                type: "string",
                required: false,
                defaultValue: null,
                input: false, // don't allow setting on signup
            },
        },
    },
    plugins: [
        customSession(async ({ user, session }) => {
            const robinhoodToken = (user as { robinhoodToken?: string | null })
                .robinhoodToken;
            return {
                user,
                session,
                isRobinhoodConfigured: !!(
                    robinhoodToken && robinhoodToken.length > 0
                ),
            };
        }),
    ],
});
