import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession } from "better-auth/plugins";
import { db } from "./db";

// Get frontend URL for trusted origins
// Falls back to localhost for development
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

// Trusted origins should include the frontend URL
const trustedOrigins = [frontendUrl];
// Also trust backend URL if different (for same-domain deployments)
if (backendUrl !== frontendUrl) {
    trustedOrigins.push(backendUrl);
}

export const auth = betterAuth({
    trustedOrigins,
    database: drizzleAdapter(db, { provider: "sqlite" }),
    emailAndPassword: {
        enabled: true,
    },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: backendUrl,
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
