/**
 * Environment configuration for the application
 *
 * This module centralizes all environment variable access to ensure
 * type safety and provide sensible defaults for development.
 *
 * Uses Turborepo globalEnv for FRONTEND_URL and BACKEND_URL
 */

/**
 * Get the backend API base URL
 *
 * In development: http://localhost:3000
 * In production: Should be set via BACKEND_URL environment variable
 */
export function getApiBaseUrl(): string {
    // Turborepo globalEnv variables are available in both frontend and backend
    // Vite requires VITE_ prefix, so we support both naming conventions
    const backendUrl =
        import.meta.env.VITE_BACKEND_URL || import.meta.env.BACKEND_URL;

    // Default to localhost:3000 for development
    return (backendUrl as string | undefined) || "http://localhost:3000";
}

/**
 * Get the frontend application URL
 *
 * In development: http://localhost:5173
 * In production: Should be set via FRONTEND_URL environment variable
 */
export function getAppUrl(): string {
    // Turborepo globalEnv variables are available in both frontend and backend
    // Vite requires VITE_ prefix, so we support both naming conventions
    const frontendUrl =
        import.meta.env.VITE_FRONTEND_URL || import.meta.env.FRONTEND_URL;

    // Default to localhost:5173 for development
    return (frontendUrl as string | undefined) || "http://localhost:5173";
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
    return import.meta.env.PROD;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
    return import.meta.env.DEV;
}
