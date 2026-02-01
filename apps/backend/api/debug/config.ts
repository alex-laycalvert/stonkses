import { setCorsHeaders } from "../_utils";

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

const allowedOrigins = [frontendUrl];
if (backendUrl !== frontendUrl) {
    allowedOrigins.push(backendUrl);
}

export default async function handler(req: Request): Promise<Response> {
    const corsHeaders = setCorsHeaders(req);

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    return new Response(
        JSON.stringify({
            frontendUrl: process.env.FRONTEND_URL || "not set",
            backendUrl: process.env.BACKEND_URL || "not set",
            nodeEnv: process.env.NODE_ENV || "not set",
            allowedOrigins,
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
}
