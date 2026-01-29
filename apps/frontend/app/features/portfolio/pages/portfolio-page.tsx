import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ROUTES } from "~/global/constants/routes";
import type { Result } from "~/global/utils";
import { Planner } from "../components/planner";
import { Portfolio } from "../components/portfolio";
import { SyncStatus } from "../components/sync-status";
import { PortfolioContext } from "../contexts/portfolio-context";
import { useHoldings } from "../hooks/use-holdings";
import {
    loadAndSyncCategories,
    loadCategories,
    saveCategories,
    updateMappedItemsInPlace,
} from "../services/storage";
import type { Category, Item } from "../types";
import { resetCategoryAmounts } from "../utils/reset-categories";

export default function PortfolioPage() {
    const { holdings, fetchStatus, error, dataUpdatedAt } = useHoldings({
        refetchOnWindowFocus: true,
        refetchInterval: 60 * 1_000,
    });
    console.log(holdings);
    const [isUpdating, setIsUpdating] = useState(false);

    // Local-first: Immediately load from localStorage
    const [categories, setCategories] = useState<Category[]>(() =>
        loadCategories(),
    );

    // Background sync after mount
    useEffect(() => {
        if (!holdings) {
            return;
        }

        // Check if this is the first time (no localStorage)
        const hasLocalStorage = localStorage.getItem("categories") !== null;
        setIsUpdating(true);
        if (!hasLocalStorage) {
            // First time - use full sync
            const syncedCategories = loadAndSyncCategories(holdings);
            setCategories(syncedCategories);
            saveCategories(syncedCategories);
        } else {
            // Subsequent - in-place update
            setCategories((current) => {
                const updated = updateMappedItemsInPlace(current, holdings);
                saveCategories(updated);
                return updated;
            });
        }
        setIsUpdating(false);
    }, [holdings]);

    const totals = useMemo(() => {
        let totalAmount = 0;
        let totalNonCashAmount = 0;

        for (const category of categories) {
            totalAmount += category.categoryAmount;

            // Calculate non-cash amount by summing only non-cash items
            const nonCashAmount = category.items
                .filter((item) => !item.isCash)
                .reduce((sum, item) => sum + item.amount, 0);

            totalNonCashAmount += nonCashAmount;
        }

        return {
            totalAmount,
            totalNonCashAmount,
        };
    }, [categories]);

    function getCategory(categoryName: string): Category | null {
        return categories.find((c) => c.name === categoryName) || null;
    }

    function onAddCategory(categoryName: string): Result {
        if (isUpdating) {
            return {
                accepted: false,
                reason: "Cannot add category while updating holdings",
            };
        }

        categoryName = categoryName.trim();
        if (!categoryName) {
            return { accepted: false, reason: "Category name cannot be empty" };
        }

        if (getCategory(categoryName)) {
            return {
                accepted: false,
                reason: `Category with name "${categoryName}" already exists`,
            };
        }

        const category: Category = {
            name: categoryName,
            categoryAmount: 0,
            items: [],
        };

        const newCategories = [...categories, category];
        setCategories(newCategories);
        saveCategories(newCategories);

        return { accepted: true };
    }

    function onRemoveCategory(categoryName: string): Result {
        if (isUpdating) {
            return {
                accepted: false,
                reason: "Cannot remove category while updating holdings",
            };
        }

        const newCategories = resetCategoryAmounts(
            categories.filter((c) => c.name !== categoryName),
        );
        setCategories(newCategories);
        saveCategories(newCategories);

        return { accepted: true };
    }

    function onUpdateCategory(
        categoryName: string,
        category: Category,
    ): Result {
        if (isUpdating) {
            return {
                accepted: false,
                reason: "Cannot update category while updating holdings",
            };
        }

        const newCategoryName = category.name.trim();
        if (!newCategoryName) {
            return { accepted: false, reason: "Category name cannot be empty" };
        }

        const existingCategory = getCategory(newCategoryName);
        if (categoryName !== newCategoryName && existingCategory) {
            return {
                accepted: false,
                reason: `Category with name "${newCategoryName}" already exists`,
            };
        }

        const newCategories = resetCategoryAmounts(
            categories.map((c) => {
                if (c.name === categoryName) {
                    return {
                        ...category,
                        name: newCategoryName,
                    };
                }
                return c;
            }),
        );

        setCategories(newCategories);
        saveCategories(newCategories);

        return { accepted: true };
    }

    function onAddCategoryItem(itemName: string, categoryName: string): Result {
        if (isUpdating) {
            return {
                accepted: false,
                reason: "Cannot add item while updating holdings",
            };
        }

        itemName = itemName.trim();
        if (!itemName) {
            return { accepted: false, reason: "Item name cannot be empty" };
        }
        const category = getCategory(categoryName);
        if (!category) {
            return {
                accepted: false,
                reason: `Category "${categoryName}" does not exist`,
            };
        }

        if (category.items.some((i) => i.name === itemName)) {
            return {
                accepted: false,
                reason: `Item with name "${itemName}" already exists in this category`,
            };
        }

        const newItems = [...category.items];
        newItems.push({
            name: itemName,
            amount: 0,
        });

        return onUpdateCategory(categoryName, {
            ...category,
            items: newItems,
        });
    }

    function onRemoveCategoryItem(
        itemName: string,
        categoryName: string,
    ): Result {
        if (isUpdating) {
            return {
                accepted: false,
                reason: "Cannot remove item while updating holdings",
            };
        }

        const category = getCategory(categoryName);
        if (!category) {
            return { accepted: true };
        }

        const newItems = category.items.filter((i) => i.name !== itemName);

        return onUpdateCategory(categoryName, {
            ...category,
            items: newItems,
        });
    }

    function onUpdateCategoryItem(
        itemName: string,
        categoryName: string,
        item: Item,
    ): Result {
        if (isUpdating) {
            return {
                accepted: false,
                reason: "Cannot update item while updating holdings",
            };
        }

        const newItemName = item.name.trim();
        if (!newItemName) {
            return { accepted: false, reason: "Item name cannot be empty" };
        }

        const category = getCategory(categoryName);
        if (!category) {
            return {
                accepted: false,
                reason: `Category "${categoryName}" does not exist`,
            };
        }

        const index = category.items.findIndex((i) => i.name === itemName);
        if (index === -1) {
            return {
                accepted: false,
                reason: `Item "${itemName}" does not exist in category "${categoryName}"`,
            };
        }

        const newItems = [...category.items];
        if (
            newItemName !== itemName &&
            newItems.some((i) => i.name === newItemName)
        ) {
            return {
                accepted: false,
                reason: `Item with name "${newItemName}" already exists in this category`,
            };
        }

        newItems[index] = {
            ...item,
            name: newItemName,
        };

        return onUpdateCategory(categoryName, {
            ...category,
            items: newItems,
        });
    }

    function onReorderCategories(reorderedCategories: Category[]) {
        if (isUpdating) {
            // Silently ignore reorder during state update
            return;
        }

        const priceAdjustedCategories =
            resetCategoryAmounts(reorderedCategories);

        setCategories(priceAdjustedCategories);
        saveCategories(priceAdjustedCategories);
    }

    return (
        <div>
            <div className="bg-white py-3 flex justify-between items-center">
                <h1 className="text-xl font-semibold">Portfolio</h1>
                <Link
                    to={ROUTES.PORTFOLIO.SETUP}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                    Reconfigure Robinhood Token
                </Link>
            </div>
            <PortfolioContext
                value={{
                    categories,
                    totalPortfolioAmount: totals.totalAmount,
                    totalPortfolioAmountNonCash: totals.totalNonCashAmount,
                    isSyncing: isUpdating,
                    onAddCategory,
                    onRemoveCategory,
                    onUpdateCategory,
                    onReorderCategories,
                    onAddCategoryItem,
                    onRemoveCategoryItem,
                    onUpdateCategoryItem,
                    getCategory,
                }}
            >
                <Planner />
                <br />
                <div className="mb-4">
                    <SyncStatus
                        status={fetchStatus}
                        dataUpdatedAt={dataUpdatedAt}
                        error={error}
                    />
                </div>
                <Portfolio />
            </PortfolioContext>
        </div>
    );
}
