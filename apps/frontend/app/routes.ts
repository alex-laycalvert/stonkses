import {
    index,
    layout,
    prefix,
    type RouteConfig,
    route,
} from "@react-router/dev/routes";
import { portfolioRoutes } from "./features/portfolio/routes";

export default [
    layout("./global/layouts/app-layout.tsx", [
        index("./routes/index.tsx"),

        // Unprotected routes (auth pages - redirects to /portfolio if authenticated)
        layout("./features/auth/layouts/unprotected-layout.tsx", [
            ...prefix("auth", [
                route("login", "./features/auth/pages/login-page.tsx"),
                route("register", "./features/auth/pages/register-page.tsx"),
            ]),
        ]),

        // Protected routes (requires authentication - redirects to /auth/login if not authenticated)
        layout("./features/auth/layouts/protected-layout.tsx", [
            // Portfolio routes (includes setup and main portfolio page)
            ...prefix("portfolio", portfolioRoutes),

            // App routes (other protected routes that don't require Robinhood)
            ...prefix("app", [index("./routes/home.tsx")]),
        ]),
    ]),
] satisfies RouteConfig;
