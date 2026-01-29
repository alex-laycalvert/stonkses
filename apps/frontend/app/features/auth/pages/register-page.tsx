import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ROUTES } from "~/global/constants/routes";
import { signUp } from "../services/authClient";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const result = await signUp.email({
                email,
                password,
                name,
            });

            if (result.error) {
                setError(result.error.message || "Registration failed");
            } else {
                // Successful registration, navigate to portfolio
                navigate(ROUTES.PORTFOLIO.HOME);
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Registration failed",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6">Register</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <div>
                    <label
                        htmlFor="name"
                        className="block text-sm font-medium mb-1"
                    >
                        Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2 border rounded-md disabled:opacity-50"
                    />
                </div>

                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium mb-1"
                    >
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full px-3 py-2 border rounded-md disabled:opacity-50"
                    />
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium mb-1"
                    >
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full px-3 py-2 border rounded-md disabled:opacity-50"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Registering..." : "Register"}
                </button>
            </form>

            <p className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link
                    to={ROUTES.AUTH.LOGIN}
                    className="text-blue-600 hover:underline"
                >
                    Login
                </Link>
            </p>
        </div>
    );
}
