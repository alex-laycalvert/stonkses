import { Navigate, Outlet } from "react-router";
import { DEFAULT_REDIRECTS } from "~/global/constants/routes";
import { useAuth } from "../public";
import { signOut } from "../services/authClient";

/**
 * Protected layout - requires authentication
 * Redirects to login if user is not authenticated
 */
export default function ProtectedLayout() {
    const { isAuthenticated, isPending, user } = useAuth();

    // Show loading state while checking authentication
    if (isPending) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
        return <Navigate to={DEFAULT_REDIRECTS.UNAUTHENTICATED} replace />;
    }

    // Render protected routes
    return (
        <div className="min-h-screen">
            <header className="border-b p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold">Welcome {user.name}</h1>
                    <LogoutButton />
                </div>
            </header>
            <main className="container mx-auto p-4">
                <Outlet />
            </main>
        </div>
    );
}

function LogoutButton() {
    const handleLogout = async () => {
        await signOut();
    };

    return (
        <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
        >
            Logout
        </button>
    );
}
