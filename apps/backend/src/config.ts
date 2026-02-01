// Centralized configuration for allowed origins
// This is used by both Fastify (local dev) and Vercel serverless functions

export function getAllowedOrigins(): string[] {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
    return [frontendUrl, ...(backendUrl !== frontendUrl ? [backendUrl] : [])];
}
