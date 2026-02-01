import type { IncomingMessage, ServerResponse } from "node:http";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { serve } from "bun";

// Import all API handlers
import authHandler from "./auth/[...auth]";
import debugConfigHandler from "./debug/config";
import holdingsHandler from "./holdings";
import robinhoodTokenHandler from "./user/robinhood-token";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

console.log(`Starting dev server on http://localhost:${PORT}`);

// Helper to convert Web Request to VercelRequest-like object
function createMockVercelRequest(req: Request): VercelRequest {
    const url = new URL(req.url);

    // Parse headers into plain object
    const headers: Record<string, string | string[]> = {};
    req.headers.forEach((value, key) => {
        headers[key] = value;
    });

    return {
        method: req.method,
        url: url.pathname + url.search,
        headers,
        body: undefined, // Will be set async if needed
        // biome-ignore lint: Mock VercelRequest for local dev
    } as unknown as VercelRequest;
}

// Helper to create mock VercelResponse that collects the response
function createMockVercelResponse(): {
    res: VercelResponse;
    getResponse: () => Promise<Response>;
} {
    let statusCode = 200;
    const headers: Record<string, string> = {};
    // biome-ignore lint: Response body can be any type
    let body: unknown = null;

    const resolvers: Array<() => void> = [];
    const promise = new Promise<Response>((resolve) => {
        resolvers.push(() => {
            const responseBody = body
                ? typeof body === "string"
                    ? body
                    : JSON.stringify(body)
                : null;
            resolve(
                new Response(responseBody, {
                    status: statusCode,
                    headers,
                }),
            );
        });
    });

    const res = {
        status: (code: number) => {
            statusCode = code;
            return res;
        },
        setHeader: (name: string, value: string) => {
            headers[name] = value;
            return res;
        },
        // biome-ignore lint: Response data can be any type
        json: (data: unknown) => {
            headers["Content-Type"] = "application/json";
            body = data;
            resolvers.forEach((r) => r());
            return res;
        },
        // biome-ignore lint: Response data can be any type
        send: (data: unknown) => {
            body = data;
            resolvers.forEach((r) => r());
            return res;
        },
        end: () => {
            resolvers.forEach((r) => r());
            return res;
        },
        // biome-ignore lint: Mock VercelResponse for local dev
    } as unknown as VercelResponse;

    return {
        res,
        getResponse: () => promise,
    };
}

serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);

        // Create mock Vercel request/response
        const mockReq = createMockVercelRequest(req);

        // Parse body if present
        if (req.method !== "GET" && req.method !== "HEAD") {
            try {
                mockReq.body = await req.json();
            } catch {
                // No body or invalid JSON
            }
        }

        // Route to appropriate handler
        if (url.pathname.startsWith("/api/auth/")) {
            const { res, getResponse } = createMockVercelResponse();
            await authHandler(mockReq, res);
            return getResponse();
        }

        if (url.pathname === "/api/holdings") {
            const { res, getResponse } = createMockVercelResponse();
            await holdingsHandler(mockReq, res);
            return getResponse();
        }

        if (url.pathname === "/api/user/robinhood-token") {
            const { res, getResponse } = createMockVercelResponse();
            await robinhoodTokenHandler(mockReq, res);
            return getResponse();
        }

        if (url.pathname === "/api/debug/config") {
            const { res, getResponse } = createMockVercelResponse();
            await debugConfigHandler(mockReq, res);
            return getResponse();
        }

        // 404 for unknown routes
        return new Response("Not Found", { status: 404 });
    },
});

console.log(`Server listening on http://localhost:${PORT}`);
