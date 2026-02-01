import { serve } from "bun";

// Import all API handlers
import authHandler from "./auth/[...auth]";
import debugConfigHandler from "./debug/config";
import holdingsHandler from "./holdings";
import robinhoodTokenHandler from "./user/robinhood-token";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

console.log(`Starting dev server on http://localhost:${PORT}`);

serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);

        // Route to appropriate handler
        if (url.pathname.startsWith("/api/auth/")) {
            return authHandler(req);
        }

        if (url.pathname === "/api/holdings") {
            return holdingsHandler(req);
        }

        if (url.pathname === "/api/user/robinhood-token") {
            return robinhoodTokenHandler(req);
        }

        if (url.pathname === "/api/debug/config") {
            return debugConfigHandler(req);
        }

        // 404 for unknown routes
        return new Response("Not Found", { status: 404 });
    },
});

console.log(`Server listening on http://localhost:${PORT}`);
