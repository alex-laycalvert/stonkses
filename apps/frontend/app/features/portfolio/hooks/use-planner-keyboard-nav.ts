import { useRef } from "react";
import type { PlannerCategory } from "../types";

export function usePlannerKeyboardNav(plannerCategories: PlannerCategory[]) {
    const categoryRefs = useRef<{
        [key: number]: {
            name: HTMLInputElement | null;
            percentage: HTMLInputElement | null;
            amount: HTMLInputElement | null;
            deleteButton: HTMLButtonElement | null;
        };
    }>({});

    const addCategoryButtonRef = useRef<HTMLButtonElement>(null);

    // Initialize refs for each category
    const getCategoryRefs = (index: number) => {
        if (!categoryRefs.current[index]) {
            categoryRefs.current[index] = {
                name: null,
                percentage: null,
                amount: null,
                deleteButton: null,
            };
        }
        return categoryRefs.current[index];
    };

    // Helper to set a ref
    const setRef = (
        index: number,
        field: "name" | "percentage" | "amount" | "deleteButton",
        element: HTMLInputElement | HTMLButtonElement | null,
    ) => {
        if (!categoryRefs.current[index]) {
            getCategoryRefs(index);
        }
        if (categoryRefs.current[index]) {
            if (field === "deleteButton") {
                categoryRefs.current[index][field] =
                    element as HTMLButtonElement | null;
            } else {
                categoryRefs.current[index][field] =
                    element as HTMLInputElement | null;
            }
        }
    };

    const handleNavigate = (
        fromIndex: number,
        fromField: "name" | "percentage" | "amount",
        direction: "up" | "down" | "left" | "right",
    ) => {
        const currentCategory = plannerCategories[fromIndex];
        if (!currentCategory) return;

        // Handle left/right navigation
        if (direction === "left") {
            if (fromField === "percentage" || fromField === "amount") {
                // Go to name input
                categoryRefs.current[fromIndex]?.name?.focus();
            }
            // Do nothing if already on name
        } else if (direction === "right") {
            if (fromField === "name") {
                // Go to enabled input (percentage or amount)
                if (currentCategory.inputMode === "percentage") {
                    categoryRefs.current[fromIndex]?.percentage?.focus();
                } else {
                    categoryRefs.current[fromIndex]?.amount?.focus();
                }
            } else if (fromField === "percentage" || fromField === "amount") {
                // Go to delete button
                categoryRefs.current[fromIndex]?.deleteButton?.focus();
            }
        } else if (direction === "down") {
            if (fromField === "name") {
                // Go to name input below, or Add Category button if last
                if (fromIndex === plannerCategories.length - 1) {
                    addCategoryButtonRef.current?.focus();
                } else {
                    categoryRefs.current[fromIndex + 1]?.name?.focus();
                }
            } else if (fromField === "percentage" || fromField === "amount") {
                // Go to enabled input below
                if (fromIndex < plannerCategories.length - 1) {
                    const nextCategory = plannerCategories[fromIndex + 1];
                    if (nextCategory) {
                        if (nextCategory.inputMode === "percentage") {
                            categoryRefs.current[
                                fromIndex + 1
                            ]?.percentage?.focus();
                        } else {
                            categoryRefs.current[
                                fromIndex + 1
                            ]?.amount?.focus();
                        }
                    }
                } else {
                    // Last category, go to Add Category button
                    addCategoryButtonRef.current?.focus();
                }
            }
        } else if (direction === "up") {
            if (fromField === "name") {
                // Go to name input above (do nothing if first)
                if (fromIndex > 0) {
                    categoryRefs.current[fromIndex - 1]?.name?.focus();
                }
            } else if (fromField === "percentage" || fromField === "amount") {
                // Go to enabled input above
                if (fromIndex > 0) {
                    const prevCategory = plannerCategories[fromIndex - 1];
                    if (prevCategory) {
                        if (prevCategory.inputMode === "percentage") {
                            categoryRefs.current[
                                fromIndex - 1
                            ]?.percentage?.focus();
                        } else {
                            categoryRefs.current[
                                fromIndex - 1
                            ]?.amount?.focus();
                        }
                    }
                }
            }
        }
    };

    return {
        getCategoryRefs,
        setRef,
        addCategoryButtonRef,
        handleNavigate,
    };
}
