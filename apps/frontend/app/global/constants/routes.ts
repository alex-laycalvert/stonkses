/**
 * Global route path constants
 * These define the top-level route structure that cross-cutting concerns
 * (like auth) need to reference for redirects
 */

export const ROUTES = {
    // Unprotected routes (public access)
    AUTH: {
        LOGIN: "/auth/login",
        REGISTER: "/auth/register",
    },

    // Protected routes (requires authentication)
    APP: {
        HOME: "/app",
    },

    // Portfolio routes (requires authentication + Robinhood config)
    PORTFOLIO: {
        HOME: "/portfolio",
        SETUP: "/portfolio/setup",
    },

    // Landing/marketing
    LANDING: "/",
} as const;

/**
 * Route path prefixes for layout matching
 */
export const ROUTE_PREFIXES = {
    AUTH: "/auth",
    APP: "/app",
    PORTFOLIO: "/portfolio",
} as const;

/**
 * Default redirect paths
 */
export const DEFAULT_REDIRECTS = {
    AFTER_LOGIN: ROUTES.PORTFOLIO.HOME,
    AFTER_LOGOUT: ROUTES.AUTH.LOGIN,
    UNAUTHENTICATED: ROUTES.AUTH.LOGIN,
} as const;
