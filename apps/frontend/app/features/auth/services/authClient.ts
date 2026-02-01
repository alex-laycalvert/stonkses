import { createAuthClient } from "better-auth/react";
import { getApiBaseUrl } from "~/global/config/env";

export const authClient = createAuthClient({
    baseURL: getApiBaseUrl(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
