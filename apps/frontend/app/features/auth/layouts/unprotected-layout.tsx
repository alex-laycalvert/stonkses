import { Navigate, Outlet } from "react-router";
import { DEFAULT_REDIRECTS } from "~/global/constants/routes";
import { useAuth } from "../public";

/**
 * Unprotected layout - for authentication pages (login, register)
 * Redirects to app if user is already authenticated
 */
export default function UnprotectedLayout() {
    const { isAuthenticated, isPending } = useAuth();

    // Show loading state while checking authentication
    if (isPending) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    // Redirect to app home if already authenticated
    if (isAuthenticated) {
        return <Navigate to={DEFAULT_REDIRECTS.AFTER_LOGIN} replace />;
    }

    // Render auth pages
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-md">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
