import { DollarSign } from "lucide-react";
import { cn } from "~/global/utils";

interface CashIndicatorProps {
    includingCash: boolean;
    size?: number;
}

export function CashIndicator({
    includingCash,
    size = 16,
}: CashIndicatorProps) {
    return (
        <div
            className={cn(
                "relative inline-flex items-center justify-center rounded-full",
                includingCash ? "bg-green-100" : "bg-red-100",
            )}
            style={{ width: size * 1.5, height: size * 1.5 }}
        >
            <DollarSign
                size={size}
                className={cn(
                    includingCash ? "text-green-600" : "text-red-600",
                )}
            />
            {!includingCash && (
                <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-px bg-red-600"
                    style={{
                        width: size * 2,
                        transform: "rotate(-45deg)",
                        transformOrigin: "center",
                    }}
                />
            )}
        </div>
    );
}
