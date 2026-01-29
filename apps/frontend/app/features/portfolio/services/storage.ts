import { type Holding, holdingName } from "@repo/robinhood";
import { capitalize } from "~/global/utils";
import type { Category, Item, PlannerCategory } from "../types";

const CATEGORY_STORAGE_KEY = "categories";
const ROBINHOOD_HOLDINGS_CATEGORY = "Robinhood Holdings";

export function saveCategories(categories: Category[]) {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
}

/**
 * Loads and syncs categories with Robinhood holdings.
 *
 * Initial load (no localStorage data):
 * - Creates "Robinhood Holdings" category
 * - Adds all holdings as mapped items
 *
 * Subsequent loads (localStorage exists):
 * - Preserves all existing categories and custom items
 * - Updates mapped items with current holding data
 * - Adds new holdings to "Robinhood Holdings" (creates if needed)
 */
export function loadAndSyncCategories(holdings: Holding[]): Category[] {
    const storedData = localStorage.getItem(CATEGORY_STORAGE_KEY);

    // Initial load: No localStorage data
    if (!storedData) {
        return createInitialCategories(holdings);
    }

    // Subsequent load: Sync with API data
    return syncCategoriesWithHoldings(
        JSON.parse(storedData) as Category[],
        holdings,
    );
}

/**
 * Creates initial categories when no localStorage data exists.
 * Generates "Robinhood Holdings" with all holdings as mapped items.
 */
function createInitialCategories(holdings: Holding[]): Category[] {
    if (holdings.length === 0) {
        return [];
    }

    const mappedItems = holdings.map<Item>((holding) => {
        const name = holdingName(holding);
        if (holding.type === "account") {
            return {
                name: capitalize(holdingName(holding)),
                amount: holding.amount,
                mappedSymbol: name,
                isCash: holding.accountType === "individual",
            };
        }

        return {
            name,
            amount: holding.amount,
            mappedSymbol: name,
        };
    });

    const categoryAmount = mappedItems.reduce(
        (acc, item) => acc + item.amount,
        0,
    );

    return [
        {
            name: ROBINHOOD_HOLDINGS_CATEGORY,
            categoryAmount,
            items: mappedItems,
        },
    ];
}

/**
 * Syncs stored categories with current holding data.
 * - Mapped items: Update amount from API
 * - Custom items: Keep localStorage amount
 * - New holdings: Add to "Robinhood Holdings"
 */
function syncCategoriesWithHoldings(
    storedCategories: Category[],
    holdings: Holding[],
): Category[] {
    // Create a map of symbols to holdings for quick lookup
    const holdingMap = new Map<string, Holding>();
    for (const holding of holdings) {
        holdingMap.set(holdingName(holding), holding);
    }

    // Track which holdings have been mapped
    const mappedSymbols = new Set<string>();

    // Sync each category
    const syncedCategories = storedCategories.map((category) => {
        const syncedItems = category.items.map((item) => {
            if (item.mappedSymbol) {
                // This is a mapped item - update from API
                const holding = holdingMap.get(item.mappedSymbol);
                if (holding) {
                    mappedSymbols.add(item.mappedSymbol);
                    return {
                        ...item,
                        amount: holding.amount,
                    };
                }
                // Holding no longer exists - keep item but with 0 amount
                // User can delete it manually if they want
                return {
                    ...item,
                    amount: 0,
                };
            }
            // Custom item - keep as is
            return item;
        });

        const categoryAmount = syncedItems.reduce(
            (acc, item) => acc + item.amount,
            0,
        );

        return {
            ...category,
            items: syncedItems,
            categoryAmount,
        };
    });

    // Find unmapped holdings (new holdings)
    const unmappedHoldings = holdings.filter(
        (holding) => !mappedSymbols.has(holdingName(holding)),
    );

    if (unmappedHoldings.length === 0) {
        return syncedCategories;
    }

    // Add unmapped holdings to "Robinhood Holdings" category
    return addUnmappedHoldings(syncedCategories, unmappedHoldings);
}

/**
 * Adds new unmapped holdings to the "Robinhood Holdings" category.
 * Creates the category if it doesn't exist.
 */
function addUnmappedHoldings(
    categories: Category[],
    unmappedHoldings: Holding[],
): Category[] {
    const newItems: Item[] = unmappedHoldings.map((holding) => {
        const name = holdingName(holding);
        return {
            name: holding.type === "account" ? capitalize(name) : name,
            amount: holding.amount,
            mappedSymbol: name,
            isCash:
                holding.type === "account" &&
                holding.accountType === "individual",
        };
    });

    const robinhoodCategoryIndex = categories.findIndex(
        (c) => c.name === ROBINHOOD_HOLDINGS_CATEGORY,
    );

    if (robinhoodCategoryIndex !== -1) {
        // Category exists - add new items
        const updatedCategories = [...categories];
        const existingCategory = updatedCategories[robinhoodCategoryIndex];

        if (!existingCategory) {
            // This should never happen, but satisfy TypeScript
            return categories;
        }

        const updatedItems = [...existingCategory.items, ...newItems];
        const categoryAmount = updatedItems.reduce(
            (acc, item) => acc + item.amount,
            0,
        );

        updatedCategories[robinhoodCategoryIndex] = {
            name: existingCategory.name,
            categoryAmount,
            items: updatedItems,
            ...(existingCategory.isDefault !== undefined && {
                isDefault: existingCategory.isDefault,
            }),
        };

        return updatedCategories;
    }

    // Category doesn't exist - create it
    const categoryAmount = newItems.reduce((acc, item) => acc + item.amount, 0);
    return [
        ...categories,
        {
            name: ROBINHOOD_HOLDINGS_CATEGORY,
            categoryAmount,
            items: newItems,
        },
    ];
}

/**
 * Smart sync for local-first UI: Updates mapped items in-place wherever they are.
 * This preserves user's category organization during background sync.
 *
 * @param currentCategories - Current categories from state (may have been reorganized)
 * @param holdings - Fresh holdings from API
 * @returns Updated categories with synced amounts, preserving organization
 */
export function updateMappedItemsInPlace(
    currentCategories: Category[],
    holdings: Holding[],
): Category[] {
    // Create a map of symbols to holdings for quick lookup
    const holdingMap = new Map<string, Holding>();
    for (const holding of holdings) {
        holdingMap.set(holdingName(holding), holding);
    }

    // Track which holdings have been mapped
    const mappedSymbols = new Set<string>();

    // Update each category, preserving structure
    const updatedCategories = currentCategories.map((category) => {
        const updatedItems = category.items.map((item) => {
            if (item.mappedSymbol) {
                // This is a mapped item - update from API
                const holding = holdingMap.get(item.mappedSymbol);
                if (holding) {
                    mappedSymbols.add(item.mappedSymbol);
                    return {
                        ...item,
                        amount: holding.amount,
                    };
                }
                // Holding no longer exists - set to 0
                return {
                    ...item,
                    amount: 0,
                };
            }
            // Custom item - keep as is
            return item;
        });

        const categoryAmount = updatedItems.reduce(
            (acc, item) => acc + item.amount,
            0,
        );

        return {
            ...category,
            items: updatedItems,
            categoryAmount,
        };
    });

    // Find unmapped holdings (new holdings)
    const unmappedHoldings = holdings.filter(
        (holding) => !mappedSymbols.has(holdingName(holding)),
    );

    if (unmappedHoldings.length === 0) {
        return updatedCategories;
    }

    // Add unmapped holdings to "Robinhood Holdings" category
    return addUnmappedHoldings(updatedCategories, unmappedHoldings);
}

/**
 * Legacy function for loading categories without holding sync.
 * Used when holdings are not available.
 */
export function loadCategories() {
    const categories = localStorage.getItem(CATEGORY_STORAGE_KEY);

    if (!categories) {
        return [];
    }

    const storedCategories = JSON.parse(categories) as Category[];
    return storedCategories.map((category) => {
        return {
            ...category,
            categoryAmount: category.items.reduce(
                (acc, item) => acc + item.amount,
                0,
            ),
        };
    });
}

const PLANNER_STORAGE_KEY = "categoryPlanner";

export function savePlannerCategories(plannerCategories: PlannerCategory[]) {
    localStorage.setItem(
        PLANNER_STORAGE_KEY,
        JSON.stringify(plannerCategories),
    );
}

export function loadPlannerCategories(): PlannerCategory[] | null {
    const planner = localStorage.getItem(PLANNER_STORAGE_KEY);
    if (!planner) {
        return null;
    }
    return JSON.parse(planner) as PlannerCategory[];
}
