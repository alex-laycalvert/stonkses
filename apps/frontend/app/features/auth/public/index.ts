/**
 * Public exports from the auth domain
 * Other domains should import from this barrel file
 */

export { signIn, signOut, signUp } from "../services/authClient";
export { AuthProvider, useAuth } from "./auth-context";
export type { AuthContextValue, AuthSession, User } from "./types";
