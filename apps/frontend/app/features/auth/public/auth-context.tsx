import { createContext, type ReactNode, useContext } from "react";
import { useSession } from "../services/authClient";
import type { AuthContextValue, AuthSession } from "./types";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, isPending, error, refetch } = useSession();

    const isRobinhoodConfigured = !!(
        session as { isRobinhoodConfigured?: boolean }
    )?.isRobinhoodConfigured;

    const value: AuthContextValue = {
        session: session
            ? { ...session, isRobinhoodConfigured }
            : (null as AuthSession | null),
        user: session?.user || null,
        isAuthenticated: !!session,
        isRobinhoodConfigured,
        isPending,
        error,
        refetch,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
