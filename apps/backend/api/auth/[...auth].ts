import { auth } from "../../src/auth";
import { setCorsHeaders } from "../_utils";

export default async function handler(req: Request): Promise<Response> {
    const corsHeaders = setCorsHeaders(req);

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // Process authentication request
        const response = await auth.handler(req);

        // Forward response to client with CORS headers
        const headers = new Headers(response.headers);
        Object.entries(corsHeaders).forEach(([key, value]) => {
            headers.set(key, value);
        });

        const text = await response.text();
        return new Response(text || null, {
            status: response.status,
            headers,
        });
    } catch (error) {
        console.error("Authentication Error:", error);
        return new Response(
            JSON.stringify({
                error: "Internal authentication error",
                code: "AUTH_FAILURE",
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders,
                },
            },
        );
    }
}
