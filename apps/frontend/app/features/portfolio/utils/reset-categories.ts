import type { Category } from "../types";

export function resetCategoryAmounts(categories: Category[]): Category[] {
    return categories.map((category) => ({
        ...category,
        categoryAmount: category.items.reduce(
            (acc, item) => acc + item.amount,
            0,
        ),
    }));
}
