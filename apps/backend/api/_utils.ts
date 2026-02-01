import type { VercelRequest, VercelResponse } from "@vercel/node";
import { auth } from "../src/auth.js";
import { getAllowedOrigins } from "../src/config.js";

// Re-export for convenience
export { getAllowedOrigins };

export function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
    const origin = (req.headers.origin as string) || "";
    const allowedOrigins = getAllowedOrigins();

    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With",
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "86400");
}

export async function requireAuth(req: VercelRequest, res: VercelResponse) {
    try {
        const headers = new Headers();
        Object.entries(req.headers).forEach(([key, value]) => {
            if (value) {
                if (Array.isArray(value)) {
                    value.forEach((v) => headers.append(key, v));
                } else {
                    headers.append(key, value);
                }
            }
        });

        const session = await auth.api.getSession({ headers });

        if (!session) {
            res.status(401).json({
                error: "Unauthorized",
                code: "AUTH_REQUIRED",
            });
            return null;
        }

        return session;
    } catch (error) {
        console.error("Authentication Error:", error);
        res.status(401).json({
            error: "Invalid session",
            code: "AUTH_INVALID",
        });
        return null;
    }
}
