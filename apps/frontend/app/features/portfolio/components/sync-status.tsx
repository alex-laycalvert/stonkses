import type { RequestError } from "~/global/utils/request-error";

export function SyncStatus(props: {
    status: "fetching" | "idle" | "paused";
    dataUpdatedAt: number | null;
    error: RequestError | null;
}) {
    if (props.status === "fetching") {
        return (
            <div className="flex items-center gap-2 text-blue-600 text-sm">
                {/* biome-ignore lint: I don't know what to do here */}
                <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
                <span>Syncing...</span>
            </div>
        );
    }

    if (props.error) {
        return (
            <div className="text-red-600 text-sm">
                Error syncing data: {props.error.message}
            </div>
        );
    }

    if (props.dataUpdatedAt === null) {
        return (
            <div className="text-gray-600 text-sm">No sync data available.</div>
        );
    }

    return (
        <div className="text-gray-600 text-sm">
            Last synced at{" "}
            {new Date(props.dataUpdatedAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            })}
        </div>
    );
}
