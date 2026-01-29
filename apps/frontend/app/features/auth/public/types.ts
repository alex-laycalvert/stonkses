export interface User {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Session {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
}

export interface AuthSession {
    session: Session;
    user: User;
    isRobinhoodConfigured: boolean;
}

export interface AuthContextValue {
    session: AuthSession | null;
    user: User | null;
    isAuthenticated: boolean;
    isRobinhoodConfigured: boolean;
    isPending: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}
