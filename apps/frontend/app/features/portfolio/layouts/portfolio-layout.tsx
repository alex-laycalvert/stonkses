import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "~/features/auth/public";

/**
 * Portfolio layout - requires both authentication and Robinhood configuration
 * Redirects to /portfolio/setup if token is not configured
 */
export default function PortfolioLayout() {
    const { isRobinhoodConfigured, isPending } = useAuth();
    const location = useLocation();

    // Show loading state while checking configuration
    if (isPending) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    // Redirect to robinhood setup if not configured
    // But don't redirect if we're already on the setup page
    if (!isRobinhoodConfigured && location.pathname !== "/portfolio/setup") {
        return <Navigate to="/portfolio/setup" replace />;
    }

    // Render portfolio routes
    return <Outlet />;
}
