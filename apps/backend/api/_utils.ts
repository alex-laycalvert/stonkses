import { auth } from "../src/auth";

// Parse allowed origins from environment variable
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

const allowedOrigins = [frontendUrl];
if (backendUrl !== frontendUrl) {
    allowedOrigins.push(backendUrl);
}

export function setCorsHeaders(req: Request): Record<string, string> {
    const origin = req.headers.get("origin") || "";

    const headers: Record<string, string> = {
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
    };

    if (allowedOrigins.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
    }

    return headers;
}

export async function requireAuth(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });

        if (!session) {
            return {
                session: null,
                response: new Response(
                    JSON.stringify({
                        error: "Unauthorized",
                        code: "AUTH_REQUIRED",
                    }),
                    {
                        status: 401,
                        headers: {
                            "Content-Type": "application/json",
                            ...setCorsHeaders(req),
                        },
                    },
                ),
            };
        }

        return { session, response: null };
    } catch (error) {
        console.error("Authentication Error:", error);
        return {
            session: null,
            response: new Response(
                JSON.stringify({
                    error: "Invalid session",
                    code: "AUTH_INVALID",
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type": "application/json",
                        ...setCorsHeaders(req),
                    },
                },
            ),
        };
    }
}
