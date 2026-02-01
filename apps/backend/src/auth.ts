import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession } from "better-auth/plugins";
import { getAllowedOrigins } from "./config.js";
import { db } from "./db/index.js";

const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

let _auth: ReturnType<typeof betterAuth> | null = null;

function initAuth() {
    if (_auth) return _auth;

    _auth = betterAuth({
        trustedOrigins: getAllowedOrigins(),
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
                const robinhoodToken = (
                    user as { robinhoodToken?: string | null }
                ).robinhoodToken;
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

    return _auth;
}

export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
    get(_target, prop) {
        const instance = initAuth();
        return instance[prop as keyof typeof instance];
    },
});
