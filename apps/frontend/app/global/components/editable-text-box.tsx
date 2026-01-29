import { Check } from "lucide-react";
import { useState } from "react";
import { cn, type Result } from "../utils";

export function EditableTextBox(props: {
    value: string;
    /**
     * Additional optional text to show next to value when not editing
     */
    additionalLabel?: React.ReactNode;
    /**
     * Called when the input blurs or user clicks the save button or hits enter
     *
     * @returns If the change should be accepted, if false the input will remain in editing mode and show the reason
     */
    onChange: (value: string) => Result;
    /** If this input should start in editing mode */
    defaultEditing?: boolean;
    /** Type of input - text (default) or currency */
    type?: "text" | "currency";
    /** If this input should be disabled */
    disabled?: boolean;
}) {
    const [editing, setEditing] = useState(!!props.defaultEditing);
    const [error, setError] = useState<string | null>(null);
    const inputType = props.type ?? "text";

    function handleChange(value: string) {
        const result = props.onChange(value);
        if (result.accepted) {
            setEditing(false);
            return;
        }

        setError(result.reason);
    }

    function formatCurrency(value: string): string {
        const num = Number.parseFloat(value);
        if (Number.isNaN(num)) {
            return "$0.00";
        }
        return `$${num.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function handleCurrencyInput(e: React.FormEvent<HTMLInputElement>) {
        const input = e.currentTarget;
        const value = input.value;
        // Allow decimal point and up to 2 decimal places
        const match = value.match(/^(\d*\.?\d{0,2})/);
        if (match && match[0] !== value) {
            input.value = match[0];
        }
    }

    return (
        <>
            {editing ? (
                <div className="w-full">
                    <div className="h-12 flex items-center gap-2">
                        <input
                            // biome-ignore lint: this is fine
                            autoFocus
                            className={cn(
                                "w-full",
                                error ? "border-error" : "",
                            )}
                            type={inputType === "currency" ? "number" : "text"}
                            placeholder={
                                inputType === "currency" ? "$0.00" : "Item Name"
                            }
                            defaultValue={props.value}
                            onInput={
                                inputType === "currency"
                                    ? handleCurrencyInput
                                    : undefined
                            }
                            onKeyDown={(e) => {
                                if (e.key !== "Enter") {
                                    return;
                                }

                                handleChange(e.currentTarget.value);
                            }}
                            onBlur={(e) => {
                                handleChange(e.currentTarget.value);
                            }}
                            step={inputType === "currency" ? "0.01" : undefined}
                            min={inputType === "currency" ? "0" : undefined}
                        />
                        <button
                            className="w-12 h-12 grid place-items-center bg-successLight text-success rounded-md"
                            type="button"
                        >
                            <Check />
                        </button>
                    </div>
                    {error ? (
                        <div className="text-error text-sm">{error}</div>
                    ) : null}
                </div>
            ) : (
                <button
                    type="button"
                    className="w-full h-full flex items-center font-medium p-2"
                    onDoubleClick={() => {
                        if (!props.disabled) {
                            setEditing(true);
                        }
                    }}
                    disabled={props.disabled}
                >
                    {inputType === "currency"
                        ? formatCurrency(props.value)
                        : props.value}
                    {props.additionalLabel ? (
                        <> {props.additionalLabel}</>
                    ) : null}
                </button>
            )}
        </>
    );
}
