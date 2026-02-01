import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAllowedOrigins, setCorsHeaders } from "../_utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    return res.json({
        frontendUrl: process.env.FRONTEND_URL || "not set",
        backendUrl: process.env.BACKEND_URL || "not set",
        nodeEnv: process.env.NODE_ENV || "not set",
        allowedOrigins: getAllowedOrigins(),
    });
}
