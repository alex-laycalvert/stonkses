import {
    index,
    layout,
    type RouteConfigEntry,
    route,
} from "@react-router/dev/routes";

/**
 * Portfolio domain routes
 * All routes here require authentication AND Robinhood configuration
 */
export const portfolioRoutes: RouteConfigEntry[] = [
    // Portfolio layout checks for Robinhood configuration
    layout("./features/portfolio/layouts/portfolio-layout.tsx", [
        // Setup page (shown when isRobinhoodConfigured is false)
        route("setup", "./features/portfolio/pages/robinhood-config-page.tsx"),

        // Main portfolio page
        index("./features/portfolio/pages/portfolio-page.tsx"),
    ]),
];
