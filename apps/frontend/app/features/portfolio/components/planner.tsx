import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash } from "lucide-react";
import { useMemo, useState } from "react";
import { cn, formatPercentage } from "~/global/utils";
import { usePortfolio } from "../contexts/portfolio-context";
import {
    loadPlannerCategories,
    savePlannerCategories,
} from "../services/storage";
import type { AllocationResult, PlannerCategory } from "../types";
import { generateRequiredAllocations } from "../utils/allocations";
import { CashIndicator } from "./cash-indicator";

interface SortablePlannerCategoryRowProps {
    index: number;
    cat: PlannerCategory;
    allocation?: AllocationResult;
    currentPlannerTotal: number;
    onUpdateCategory: (
        index: number,
        updates: Partial<PlannerCategory>,
    ) => void;
    onRemoveCategory: (index: number) => void;
}

function SortablePlannerCategoryRow({
    index,
    cat,
    allocation,
    currentPlannerTotal,
    onUpdateCategory,
    onRemoveCategory,
}: SortablePlannerCategoryRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `planner-category-${index}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const currentPercentageInPlan =
        currentPlannerTotal > 0
            ? (cat.currentAmount / currentPlannerTotal) * 100
            : 0;

    const percentageChange =
        allocation && currentPercentageInPlan > 0
            ? allocation.percentage - currentPercentageInPlan
            : undefined;
    const amountChange = allocation?.requiredChange;

    return (
        <div ref={setNodeRef} style={style} className="flex gap-2 px-2 py-1">
            {/* Name */}
            <div className="flex h-12 gap-2 flex-2">
                {/* Drag Handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                >
                    <GripVertical size={16} />
                </button>

                <input
                    type="text"
                    className="w-full"
                    defaultValue={cat.name}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            onUpdateCategory(index, {
                                name: e.currentTarget.value,
                            });
                        }
                    }}
                    onBlur={(e) => {
                        onUpdateCategory(index, {
                            name: e.currentTarget.value,
                        });
                    }}
                    placeholder="Category name"
                />
            </div>

            {/* Percentage Column */}
            <div className="flex-[1.5] space-y-1">
                <div className="flex items-center gap-1">
                    <input
                        key={`percentage-${cat.name}-${cat.desiredPercentage}`}
                        type="number"
                        className={cn(
                            "w-full",
                            cat.inputMode === "amount" ? "opacity-50" : "",
                        )}
                        defaultValue={cat.desiredPercentage ?? ""}
                        onInput={(e) => {
                            // Limit to 2 decimal places
                            const input = e.currentTarget;
                            const value = input.value;
                            const match = value.match(/^(\d+\.?\d{0,2})/);
                            if (match && match[0] !== value) {
                                input.value = match[0];
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                const value = Number.isNaN(
                                    e.currentTarget.valueAsNumber,
                                )
                                    ? undefined
                                    : Math.round(
                                          e.currentTarget.valueAsNumber * 100,
                                      ) / 100;
                                onUpdateCategory(index, {
                                    desiredPercentage: value,
                                });
                            }
                        }}
                        onBlur={(e) => {
                            const value = Number.isNaN(
                                e.currentTarget.valueAsNumber,
                            )
                                ? undefined
                                : Math.round(
                                      e.currentTarget.valueAsNumber * 100,
                                  ) / 100;
                            onUpdateCategory(index, {
                                desiredPercentage: value,
                            });
                        }}
                        placeholder={
                            cat.currentPercentage > 0
                                ? cat.currentPercentage.toFixed(2)
                                : "%"
                        }
                        step="0.01"
                        min="0"
                        max="100"
                        disabled={cat.inputMode === "amount"}
                    />
                    <button
                        type="button"
                        onClick={() =>
                            onUpdateCategory(index, {
                                includingCash: !(cat.includingCash ?? true),
                            })
                        }
                        title={
                            (cat.includingCash ?? true)
                                ? "Including cash"
                                : "Excluding cash"
                        }
                        className="hover:bg-gray-100 rounded p-1 transition-colors"
                    >
                        <CashIndicator
                            includingCash={cat.includingCash ?? true}
                            size={14}
                        />
                    </button>
                    {percentageChange !== undefined &&
                        percentageChange !== 0 && (
                            <span
                                className={cn(
                                    "text-xs font-semibold whitespace-nowrap",
                                    percentageChange > 0
                                        ? "text-green-600"
                                        : "text-red-600",
                                )}
                            >
                                {percentageChange > 0 ? "+" : ""}
                                {percentageChange.toFixed(2)}%
                            </span>
                        )}
                </div>
                <button
                    type="button"
                    className={cn(
                        "text-xs px-2 py-0.5 rounded w-full",
                        cat.inputMode === "percentage"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-600",
                    )}
                    onClick={() =>
                        onUpdateCategory(index, {
                            inputMode: "percentage",
                        })
                    }
                >
                    Use %
                </button>
            </div>

            {/* Amount Column */}
            <div className="flex-[1.5] space-y-1">
                <div className="flex items-center gap-1">
                    <input
                        key={`amount-${cat.name}-${cat.desiredAmount}`}
                        type="number"
                        className={cn(
                            "w-full",
                            cat.inputMode === "percentage" ? "opacity-50" : "",
                        )}
                        defaultValue={cat.desiredAmount ?? ""}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                const value = Number.isNaN(
                                    e.currentTarget.valueAsNumber,
                                )
                                    ? undefined
                                    : e.currentTarget.valueAsNumber;
                                onUpdateCategory(index, {
                                    desiredAmount: value,
                                });
                            }
                        }}
                        onBlur={(e) => {
                            const value = Number.isNaN(
                                e.currentTarget.valueAsNumber,
                            )
                                ? undefined
                                : e.currentTarget.valueAsNumber;
                            onUpdateCategory(index, {
                                desiredAmount: value,
                            });
                        }}
                        placeholder={
                            cat.currentAmount > 0
                                ? `$${cat.currentAmount.toFixed(2)}`
                                : "$"
                        }
                        step="0.01"
                        min="0"
                        disabled={cat.inputMode === "percentage"}
                    />
                    {amountChange !== undefined && amountChange !== 0 && (
                        <span
                            className={cn(
                                "text-xs font-semibold whitespace-nowrap",
                                amountChange > 0
                                    ? "text-green-600"
                                    : "text-red-600",
                            )}
                        >
                            {amountChange > 0 ? "+$" : "-$"}
                            {Math.abs(amountChange).toFixed(2)}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    className={cn(
                        "text-xs px-2 py-0.5 rounded w-full",
                        cat.inputMode === "amount"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-600",
                    )}
                    onClick={() => {
                        onUpdateCategory(index, {
                            inputMode: "amount",
                            // Pre-fill with current amount if switching to amount mode
                            desiredAmount:
                                cat.desiredAmount !== undefined
                                    ? cat.desiredAmount
                                    : cat.currentAmount > 0
                                      ? cat.currentAmount
                                      : undefined,
                        });
                    }}
                >
                    Use $
                </button>
            </div>

            {/* Delete button */}
            <button
                type="button"
                className="w-12 h-12 flex items-center justify-center bg-errorLight text-error rounded-md"
                onClick={() => onRemoveCategory(index)}
            >
                <Trash />
            </button>
        </div>
    );
}

export function Planner() {
    const { categories, totalPortfolioAmount, getCategory } = usePortfolio();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
    );

    // Initialize planner state - first try loading from localStorage, then sync with actual categories
    const [plannerCategories, setPlannerCategories] = useState<
        PlannerCategory[]
    >(() => {
        const saved = loadPlannerCategories();

        if (saved && saved.length > 0) {
            return saved;
        }

        // No saved state, initialize from categories
        return categories.map((cat) => {
            const info = getCategory(cat.name);
            if (!info) {
                return {
                    name: cat.name,
                    currentAmount: 0,
                    currentPercentage: 0,
                    inputMode: "percentage" as const,
                    desiredPercentage: undefined,
                    desiredAmount: undefined,
                };
            }

            const percentage =
                totalPortfolioAmount === 0
                    ? 0
                    : (100 * info.categoryAmount) / totalPortfolioAmount;
            return {
                name: cat.name,
                currentAmount: info.categoryAmount,
                currentPercentage: percentage,
                inputMode: "percentage" as const,
                desiredPercentage:
                    percentage > 0
                        ? Math.round(percentage * 100) / 100
                        : undefined,
                desiredAmount: undefined,
            };
        });
    });

    const [allocations, setAllocations] = useState<AllocationResult[] | null>(
        null,
    );

    const handleAddCategory = () => {
        const newCategories = [
            ...plannerCategories,
            {
                name: "",
                currentAmount: 0,
                currentPercentage: 0,
                inputMode: "percentage" as const,
                desiredPercentage: undefined,
                desiredAmount: undefined,
            },
        ];
        setPlannerCategories(newCategories);
        savePlannerCategories(newCategories);
    };

    const handleRemoveCategory = (index: number) => {
        const newCategories = [...plannerCategories];
        newCategories.splice(index, 1);
        setPlannerCategories(newCategories);
        savePlannerCategories(newCategories);
        setAllocations(null);
    };

    const handleUpdateCategory = (
        index: number,
        updates: Partial<PlannerCategory>,
    ) => {
        const newCategories = [...plannerCategories];
        // @ts-expect-error This should work, I don't know why it's not
        newCategories[index] = { ...newCategories[index], ...updates };
        setPlannerCategories(newCategories);
        savePlannerCategories(newCategories);
        setAllocations(null);
    };

    const handleReset = () => {
        const resetCategories = categories.map((cat) => {
            const info = getCategory(cat.name);
            if (!info) {
                return {
                    name: cat.name,
                    currentAmount: 0,
                    currentPercentage: 0,
                    inputMode: "percentage" as const,
                    desiredPercentage: undefined,
                    desiredAmount: undefined,
                };
            }

            const percentage =
                totalPortfolioAmount === 0
                    ? 0
                    : (100 * info.categoryAmount) / totalPortfolioAmount;
            return {
                name: cat.name,
                currentAmount: info.categoryAmount || 0,
                currentPercentage: percentage,
                inputMode: "percentage" as const,
                desiredPercentage:
                    percentage > 0
                        ? Math.round(percentage * 100) / 100
                        : undefined,
                desiredAmount: undefined,
            };
        });
        setPlannerCategories(resetCategories);
        savePlannerCategories(resetCategories);
        setAllocations(null);
    };

    const handleReorderCategories = (
        activeIndex: number,
        overIndex: number,
    ) => {
        const reordered = arrayMove(plannerCategories, activeIndex, overIndex);
        setPlannerCategories(reordered);
        savePlannerCategories(reordered);
    };

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const activeIndex = plannerCategories.findIndex(
            (_, i) => `planner-category-${i}` === active.id,
        );
        const overIndex = plannerCategories.findIndex(
            (_, i) => `planner-category-${i}` === over.id,
        );

        if (activeIndex !== -1 && overIndex !== -1) {
            handleReorderCategories(activeIndex, overIndex);
        }
    }

    const handleGenerateAllocations = () => {
        // Filter out categories without desired values
        const validCategories = plannerCategories.filter((cat) => {
            if (cat.inputMode === "percentage") {
                return (
                    cat.desiredPercentage !== undefined &&
                    !Number.isNaN(cat.desiredPercentage)
                );
            } else {
                return (
                    cat.desiredAmount !== undefined &&
                    !Number.isNaN(cat.desiredAmount)
                );
            }
        });

        if (validCategories.length === 0) {
            return;
        }

        // Check that at least one category has an amount
        const hasAmountCategory = validCategories.some(
            (cat) => cat.inputMode === "amount",
        );
        if (!hasAmountCategory) {
            alert(
                "At least one category must have an amount specified to calculate allocations.",
            );
            return;
        }

        const input = validCategories.map((cat) => {
            if (cat.inputMode === "percentage") {
                return {
                    name: cat.name,
                    percentage: cat.desiredPercentage ?? 0,
                };
            }
            return {
                name: cat.name,
                amount: (cat.desiredAmount ?? 0).toString(),
            };
        });

        const results = generateRequiredAllocations(input);

        // Calculate required changes
        const resultsWithChanges: AllocationResult[] = results.map((result) => {
            const plannerCat = plannerCategories.find(
                (c) => c.name === result.name,
            );
            if (!plannerCat) {
                return result;
            }

            return {
                ...result,
                requiredChange: result.amount - plannerCat.currentAmount,
            };
        });

        setAllocations(resultsWithChanges);
    };

    // Calculate if generate button should be disabled
    const isGenerateDisabled = useMemo(() => {
        if (plannerCategories.length === 0) {
            return true;
        }

        const validCategories = plannerCategories.filter((cat) => {
            if (cat.inputMode === "percentage") {
                return (
                    cat.desiredPercentage !== undefined &&
                    !Number.isNaN(cat.desiredPercentage)
                );
            } else {
                return (
                    cat.desiredAmount !== undefined &&
                    !Number.isNaN(cat.desiredAmount)
                );
            }
        });

        if (validCategories.length === 0) {
            return true;
        }

        // Require at least one category with an amount
        const hasAmountCategory = validCategories.some(
            (cat) => cat.inputMode === "amount",
        );

        return !hasAmountCategory;
    }, [plannerCategories]);

    return (
        <div>
            <h2 className="font-bold text-xl">Investment Planner</h2>

            <p>
                The Investment Planner allows you to plan out allocations
                (percentages and/or dollar amounts) for new/existing
                investments.
            </p>

            <div className="space-y-1">
                {/* Header */}
                <div className="flex gap-2 px-2 pb-1 border-b font-medium text-sm items-center">
                    <div className="w-4"></div> {/* Space for drag handle */}
                    <div className="flex-2 flex items-center gap-2">
                        <span>Name</span>
                        <button
                            type="button"
                            onClick={() => {
                                const allIncludingCash =
                                    plannerCategories.every(
                                        (c) => c.includingCash ?? true,
                                    );
                                const newCategories = plannerCategories.map(
                                    (c) => ({
                                        ...c,
                                        includingCash: !allIncludingCash,
                                    }),
                                );
                                setPlannerCategories(newCategories);
                                savePlannerCategories(newCategories);
                                setAllocations(null);
                            }}
                            title="Toggle cash inclusion for all categories"
                            className="hover:bg-gray-100 rounded p-1 transition-colors"
                        >
                            <CashIndicator
                                includingCash={plannerCategories.every(
                                    (c) => c.includingCash ?? true,
                                )}
                                size={14}
                            />
                        </button>
                    </div>
                    <div className="flex-[1.5]">Percentage</div>
                    <div className="flex-[1.5]">Amount</div>
                    <div className="w-10"></div>
                </div>

                {/* Category rows with drag-and-drop */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={plannerCategories.map(
                            (_, i) => `planner-category-${i}`,
                        )}
                        strategy={verticalListSortingStrategy}
                    >
                        {plannerCategories.map((cat, index) => {
                            const allocation = allocations?.find(
                                (a) => a.name === cat.name,
                            );

                            // Calculate current percentage in context of planner categories only
                            // Filter by cash/non-cash based on the category's includingCash toggle
                            const currentPlannerTotal = plannerCategories
                                .filter(
                                    (c) =>
                                        (cat.includingCash ?? true) ||
                                        c.isCash === undefined ||
                                        !c.isCash,
                                )
                                .reduce((sum, c) => sum + c.currentAmount, 0);

                            return (
                                <SortablePlannerCategoryRow
                                    key={`${cat.name}-${index}`}
                                    index={index}
                                    cat={cat}
                                    allocation={allocation}
                                    currentPlannerTotal={currentPlannerTotal}
                                    onUpdateCategory={handleUpdateCategory}
                                    onRemoveCategory={handleRemoveCategory}
                                />
                            );
                        })}
                    </SortableContext>
                </DndContext>
            </div>

            <div className="flex gap-2">
                <button
                    type="button"
                    className="bg-successLight text-success rounded-md px-4 py-2 font-medium flex items-center gap-2"
                    onClick={handleAddCategory}
                >
                    <Plus size={16} />
                    Add Category
                </button>
                <button
                    type="button"
                    className="bg-gray-500 text-white rounded-md px-4 py-2 font-medium"
                    onClick={handleReset}
                >
                    Reset
                </button>
                <button
                    type="button"
                    className="bg-blue-500 text-white rounded-md px-4 py-2 font-medium disabled:opacity-50"
                    onClick={handleGenerateAllocations}
                    disabled={isGenerateDisabled}
                >
                    Generate Allocations
                </button>
            </div>

            {allocations && allocations.length > 0 && (
                <div className="pt-4">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">Total Portfolio:</span> $
                        {allocations
                            .reduce((sum, a) => sum + a.amount, 0)
                            .toFixed(2)}{" "}
                        | All percentages sum to{" "}
                        {formatPercentage(
                            allocations.reduce(
                                (sum, a) => sum + a.percentage,
                                0,
                            ),
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
