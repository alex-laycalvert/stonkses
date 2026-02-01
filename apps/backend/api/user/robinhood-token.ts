import { eq } from "drizzle-orm";
import { db } from "../../src/db";
import { user as userTable } from "../../src/db/schema";
import { requireAuth, setCorsHeaders } from "../_utils";

export default async function handler(req: Request): Promise<Response> {
    const corsHeaders = setCorsHeaders(req);

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (req.method !== "PUT") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    const { session, response } = await requireAuth(req);
    if (response) return response;

    const body = (await req.json()) as { token?: string };

    if (!body.token || typeof body.token !== "string") {
        return new Response(
            JSON.stringify({
                error: "Token is required",
                code: "INVALID_INPUT",
            }),
            {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            },
        );
    }

    try {
        await db
            .update(userTable)
            .set({ robinhoodToken: body.token })
            .where(eq(userTable.id, session!.user.id));

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    } catch (error) {
        console.error("Error updating robinhood token:", error);
        return new Response(
            JSON.stringify({
                error: "Failed to update token",
                code: "UPDATE_FAILED",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            },
        );
    }
}
