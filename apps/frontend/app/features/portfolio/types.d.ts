export type Item = {
    name: string;
    amount: number;
    /** If set, this item is mapped to a Robinhood position with this symbol */
    mappedSymbol?: string;
    isCash?: boolean;
};

export type Category = {
    name: string;
    /** Sum of all item amounts in this category */
    categoryAmount: number;
    items: Item[];
    isDefault?: boolean;
    isCash?: boolean;
};

export type NewCategoryPlannerProps = {
    categories: Category[];
    categoryBreakdowns: Record<string, CategoryInfo>;
};

export type AllocationResult = {
    name: string;
    amount: number;
    percentage: number;
    requiredChange?: number;
};

export type PlannerCategory = {
    name: string;
    currentAmount: number;
    currentPercentage: number;
    inputMode: "percentage" | "amount";
    desiredPercentage?: number;
    desiredAmount?: number;
    isCash?: boolean;
    includingCash?: boolean;
};
