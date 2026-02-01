import cors from "@fastify/cors";
import type { Holding } from "@repo/robinhood";
import { eq } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";
import Fastify from "fastify";
import { auth } from "./auth";
import { db } from "./db";
import { user as userTable } from "./db/schema";
import { RobinhoodClient } from "./robinhood";

const fastify = Fastify({
    logger:
        process.env.NODE_ENV === "production"
            ? true
            : {
                  transport: {
                      target: "pino-pretty",
                      options: {
                          translateTime: "HH:MM:ss Z", // Format the timestamp
                          ignore: "pid,hostname", // Hide unnecessary fields
                      },
                  },
              },
});

// Parse allowed origins from environment variable
// Uses FRONTEND_URL as the primary allowed origin
// Falls back to localhost origins for development
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

// Log environment variables in production for debugging
if (process.env.NODE_ENV === "production") {
    console.log("CORS Configuration:");
    console.log("FRONTEND_URL:", frontendUrl);
    console.log("BACKEND_URL:", backendUrl);
}

// Support both single frontend URL and additional origins
const allowedOrigins = [frontendUrl];
// Allow backend URL for auth callbacks
if (backendUrl !== frontendUrl) {
    allowedOrigins.push(backendUrl);
}

console.log("Allowed CORS origins:", allowedOrigins);

fastify.register(cors, {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    maxAge: 86_400,
});

// Debug endpoint to check environment configuration
fastify.get("/api/debug/config", async (request, reply) => {
    return {
        frontendUrl: process.env.FRONTEND_URL || "not set",
        backendUrl: process.env.BACKEND_URL || "not set",
        nodeEnv: process.env.NODE_ENV || "not set",
        allowedOrigins,
    };
});

// Authentication middleware
async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
    try {
        const headers = new Headers();
        Object.entries(request.headers).forEach(([key, value]) => {
            if (value) headers.append(key, value.toString());
        });

        const session = await auth.api.getSession({ headers });

        if (!session) {
            reply.status(401).send({
                error: "Unauthorized",
                code: "AUTH_REQUIRED",
            });
            return;
        }

        // Attach session to request for use in handlers
        (request as typeof request & { session: typeof session }).session =
            session;
    } catch (error) {
        fastify.log.error({ error }, "Authentication Error");
        reply.status(401).send({
            error: "Invalid session",
            code: "AUTH_INVALID",
        });
    }
}

// Register authentication endpoint
fastify.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    async handler(request, reply) {
        try {
            // Construct request URL
            const url = new URL(request.url, `http://${request.headers.host}`);

            // Convert Fastify headers to standard Headers object
            const headers = new Headers();
            Object.entries(request.headers).forEach(([key, value]) => {
                if (value) headers.append(key, value.toString());
            });
            // Create Fetch API-compatible request
            const req = new Request(url.toString(), {
                method: request.method,
                headers,
                ...(request.body ? { body: JSON.stringify(request.body) } : {}),
            });
            // Process authentication request
            const response = await auth.handler(req);
            // Forward response to client
            reply.status(response.status);
            response.headers.forEach((value, key) => reply.header(key, value));
            reply.send(response.body ? await response.text() : null);
        } catch (error) {
            fastify.log.error({ error }, "Authentication Error");
            reply.status(500).send({
                error: "Internal authentication error",
                code: "AUTH_FAILURE",
            });
        }
    },
});

// Protected: Update Robinhood token
fastify.put(
    "/api/user/robinhood-token",
    { preHandler: requireAuth },
    async (request, reply) => {
        const session = (
            request as typeof request & {
                session: NonNullable<
                    Awaited<ReturnType<typeof auth.api.getSession>>
                >;
            }
        ).session;
        const body = request.body as { token: string };

        if (!body.token || typeof body.token !== "string") {
            return reply.status(400).send({
                error: "Token is required",
                code: "INVALID_INPUT",
            });
        }

        try {
            await db
                .update(userTable)
                .set({ robinhoodToken: body.token })
                .where(eq(userTable.id, session.user.id));

            return { success: true };
        } catch (error) {
            fastify.log.error({ error }, "Error updating robinhood token");
            return reply.status(500).send({
                error: "Failed to update token",
                code: "UPDATE_FAILED",
            });
        }
    },
);

// Protected: Get Holdings
fastify.get(
    "/api/holdings",
    { preHandler: requireAuth },
    async (request, reply) => {
        const session = (
            request as typeof request & {
                session: NonNullable<
                    Awaited<ReturnType<typeof auth.api.getSession>>
                >;
            }
        ).session;

        try {
            // Get user's robinhood token
            const [userData] = await db
                .select({ robinhoodToken: userTable.robinhoodToken })
                .from(userTable)
                .where(eq(userTable.id, session.user.id));

            if (!userData?.robinhoodToken) {
                return { positions: [] };
            }

            const rh = await RobinhoodClient.newClient(userData.robinhoodToken);

            // Get stock positions
            const positions = await rh.positions();

            const holdings: Holding[] = [];
            holdings.push(
                ...positions.map<Holding>((pos) => ({
                    type: "stock",
                    symbol: pos.symbol,
                    quantity: pos.quantity,
                    averageBuyPrice: pos.averageBuyPrice,
                    amount: pos.equity,
                })),
            );

            const cashAccounts = await rh.accounts();
            holdings.push(
                ...cashAccounts.map<Holding>((acc) => ({
                    type: "account",
                    accountType: acc.brokerageAccountType,
                    nickname: acc.nickname,
                    amount: acc.cash,
                })),
            );

            return { holdings };
        } catch (error) {
            fastify.log.error(
                { error: error?.toString() },
                "Error fetching positions",
            );
            return reply.status(500).send({
                error: "Failed to fetch positions",
                code: "FETCH_FAILED",
            });
        }
    },
);

fastify.listen({ port: 3000 }, (err, address) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }

    fastify.log.info(`Server listening at ${address}`);
});

// Only listen when running locally (not on Vercel)
if (!process.env.VERCEL) {
    fastify.listen({ port: 3000 }, (err, address) => {
        if (err) {
            fastify.log.error(err);
            process.exit(1);
        }

        fastify.log.info(`Server listening at ${address}`);
    });
}
