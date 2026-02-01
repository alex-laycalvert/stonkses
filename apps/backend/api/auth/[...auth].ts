import type { VercelRequest, VercelResponse } from "@vercel/node";
import { auth } from "../../src/auth";
import { setCorsHeaders } from "../_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {
        // Construct request URL
        const protocol = req.headers["x-forwarded-proto"] || "http";
        const host = req.headers.host || "localhost:3000";
        const url = new URL(req.url || "", `${protocol}://${host}`);

        // Convert Vercel headers to standard Headers object
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

        // Create Fetch API-compatible request
        const request = new Request(url.toString(), {
            method: req.method || "GET",
            headers,
            ...(req.body ? { body: JSON.stringify(req.body) } : {}),
        });

        // Process authentication request
        const response = await auth.handler(request);

        // Forward response to client
        res.status(response.status);
        response.headers.forEach((value, key) => res.setHeader(key, value));

        const text = await response.text();
        return res.send(text || null);
    } catch (error) {
        console.error("Authentication Error:", error);
        return res.status(500).json({
            error: "Internal authentication error",
            code: "AUTH_FAILURE",
        });
    }
}
