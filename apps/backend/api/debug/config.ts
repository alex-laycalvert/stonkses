import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCorsHeaders } from "../_utils.ts";

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

const allowedOrigins = [frontendUrl];
if (backendUrl !== frontendUrl) {
    allowedOrigins.push(backendUrl);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    return res.json({
        frontendUrl: process.env.FRONTEND_URL || "not set",
        backendUrl: process.env.BACKEND_URL || "not set",
        nodeEnv: process.env.NODE_ENV || "not set",
        allowedOrigins,
    });
}
