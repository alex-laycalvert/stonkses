import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/features/auth/public";
import { API_BASE_URL } from "~/global/constants/base-url";
import { ROUTES } from "~/global/constants/routes";

export default function RobinhoodConfigPage() {
    const { refetch, isRobinhoodConfigured } = useAuth();
    const [token, setToken] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Check if this is initial setup or reconfiguration
    const isReconfiguring = isRobinhoodConfigured;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/user/robinhood-token`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ token }),
                },
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to save token");
            }

            // Refetch session to update isRobinhoodConfigured
            await refetch();

            // Navigate to portfolio
            navigate(ROUTES.PORTFOLIO.HOME);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to save token",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        if (isReconfiguring) {
            navigate(ROUTES.PORTFOLIO.HOME);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-2">
                    {isReconfiguring
                        ? "Reconfigure Robinhood Token"
                        : "Configure Robinhood"}
                </h1>
                <p className="text-gray-600 mb-6">
                    {isReconfiguring ? (
                        <>
                            Update your Robinhood API token. This will replace
                            your existing token.
                        </>
                    ) : (
                        <>
                            Please enter your Robinhood API token to continue.
                            This token will be stored securely and used to fetch
                            your portfolio data.
                        </>
                    )}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="token"
                            className="block text-sm font-medium mb-1"
                        >
                            Robinhood Token
                        </label>
                        <input
                            id="token"
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            required
                            disabled={isLoading}
                            placeholder="Enter your Robinhood API token"
                            className="w-full px-3 py-2 border rounded-md disabled:opacity-50"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            This will be stored securely and never shown again
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading
                                ? "Saving..."
                                : isReconfiguring
                                  ? "Update Token"
                                  : "Save Token"}
                        </button>
                        {isReconfiguring && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isLoading}
                                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
