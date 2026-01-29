import { createContext, useContext } from "react";
import type { Result } from "~/global/utils";
import type { Category, Item } from "../types";

export type PortfolioContextType = {
    // Portfolio data
    categories: Category[];
    totalPortfolioAmount: number;
    totalPortfolioAmountNonCash: number;

    // Sync state
    isSyncing: boolean;

    // Category operations
    onAddCategory: (categoryName: string) => Result;
    onRemoveCategory: (categoryName: string) => Result;
    onUpdateCategory: (categoryName: string, category: Category) => Result;
    onReorderCategories: (categories: Category[]) => void;

    // Category Item operations
    onAddCategoryItem: (itemName: string, categoryName: string) => Result;
    onRemoveCategoryItem: (itemName: string, categoryName: string) => Result;
    onUpdateCategoryItem: (
        itemName: string,
        categoryName: string,
        item: Item,
    ) => Result;

    // Helper functions
    getCategory: (categoryName: string) => Category | null;
};

export const PortfolioContext = createContext<PortfolioContextType | null>(
    null,
);

export function usePortfolio() {
    const portfolio = useContext(PortfolioContext);

    if (!portfolio) {
        throw new Error(
            "usePortfolio must be used within a PortfolioContext provider",
        );
    }

    return portfolio;
}
