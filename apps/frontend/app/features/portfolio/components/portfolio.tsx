import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    type DragOverEvent,
    DragOverlay,
    type DragStartEvent,
    PointerSensor,
    useDroppable,
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
import { GripVertical, Link2, Trash } from "lucide-react";
import { useState } from "react";
import { EditableTextBox } from "~/global/components/editable-text-box";
import { cn, formatPercentage, type Result } from "~/global/utils";
import { usePortfolio } from "../contexts/portfolio-context";
import type { Category, Item } from "../types";
import { CashIndicator } from "./cash-indicator";

export function Portfolio() {
    const {
        categories,
        onAddCategory,
        onRemoveCategory,
        onUpdateCategory,
        onReorderCategories,
    } = usePortfolio();
    console.log(categories);

    const [tempCategory, setTempCategory] = useState<Category | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
    );

    function handleAddCategory(category: Category): Result {
        const result = onAddCategory(category.name);
        if (result.accepted) {
            setTempCategory(null);
        }
        return result;
    }

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    function handleDragOver(event: DragOverEvent) {
        setOverId(event.over?.id as string | null);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);
        setOverId(null);

        if (!over || active.id === over.id) {
            return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;

        // Check if we're dragging categories (format: "category:categoryName")
        if (
            activeId.startsWith("category:") &&
            overId.startsWith("category:")
        ) {
            const activeCategoryName = activeId.replace("category:", "");
            const overCategoryName = overId.replace("category:", "");

            const activeIndex = categories.findIndex(
                (c) => c.name === activeCategoryName,
            );
            const overIndex = categories.findIndex(
                (c) => c.name === overCategoryName,
            );

            if (activeIndex === -1 || overIndex === -1) {
                return;
            }

            const reordered = arrayMove(categories, activeIndex, overIndex);
            onReorderCategories(reordered);
            return;
        }

        // Otherwise, we're dragging items (format: "categoryName-itemName" or "categoryName-__empty__")
        const [activeCategoryName, activeItemName] = activeId.split("-", 2);
        let [overCategoryName, overItemName] = overId.split("-", 2);

        // Handle special __empty__ drop zone
        if (overItemName === "__empty__") {
            overItemName = "";
        }

        const activeCategory = categories.find(
            (c) => c.name === activeCategoryName,
        );
        const overCategory = categories.find(
            (c) => c.name === overCategoryName,
        );

        if (!activeCategory || !overCategory) {
            return;
        }

        const activeItemIndex = activeCategory.items.findIndex(
            (item) => item.name === activeItemName,
        );
        const overItemIndex = overItemName
            ? overCategory.items.findIndex((item) => item.name === overItemName)
            : -1;

        if (activeItemIndex === -1) {
            return;
        }

        // Moving within the same category
        if (activeCategoryName === overCategoryName) {
            if (overItemIndex === -1) {
                return;
            }
            const reorderedItems = arrayMove(
                activeCategory.items,
                activeItemIndex,
                overItemIndex,
            );
            onUpdateCategory(activeCategory.name, {
                ...activeCategory,
                items: reorderedItems,
            });
        } else {
            // Moving between categories
            const [movedItem] = activeCategory.items.splice(activeItemIndex, 1);

            if (!movedItem) {
                return;
            }

            if (overItemIndex === -1) {
                // Drop at the end of the category (or into empty category)
                overCategory.items.push(movedItem);
            } else {
                // Drop at a specific position
                overCategory.items.splice(overItemIndex, 0, movedItem);
            }

            onUpdateCategory(activeCategory.name, {
                ...activeCategory,
                items: activeCategory.items,
            });
            onUpdateCategory(overCategory.name, {
                ...overCategory,
                items: overCategory.items,
            });
        }
    }

    return (
        <div className="space-y-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div>
                    <h2 className="font-bold text-xl">Portfolio</h2>
                    <p>
                        This is your current portfolio breakdown. You can add,
                        edit, remove, and reorder categories and items.
                        Double-click on names or amounts to edit them. Mapped
                        items from Robinhood cannot be edited.
                    </p>
                    <SortableContext
                        items={categories.map((c) => `category:${c.name}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        <ul className="space-y-4">
                            {categories.map((category) => {
                                return (
                                    <li key={category.name}>
                                        <SortableCategory
                                            category={category}
                                            overId={overId}
                                            onChange={(newCategory) => {
                                                return onUpdateCategory(
                                                    category.name,
                                                    newCategory,
                                                );
                                            }}
                                            onRemove={() => {
                                                return onRemoveCategory(
                                                    category.name,
                                                );
                                            }}
                                        />
                                    </li>
                                );
                            })}
                            <li>
                                {tempCategory !== null ? (
                                    <EditableCategory
                                        category={tempCategory}
                                        overId={overId}
                                        onChange={handleAddCategory}
                                        defaultEditing
                                        onRemove={() => {
                                            setTempCategory(null);
                                        }}
                                    />
                                ) : null}
                            </li>

                            <li>
                                <button
                                    type="button"
                                    className="bg-successLight text-success rounded-md px-4 py-2 font-medium disabled:opacity-50"
                                    onClick={() => {
                                        setTempCategory({
                                            name: "",
                                            categoryAmount: 0,
                                            items: [],
                                        });
                                    }}
                                    disabled={tempCategory !== null}
                                >
                                    Add Category
                                </button>
                            </li>
                        </ul>
                    </SortableContext>
                </div>
                <DragOverlay>
                    {activeId ? (
                        <div className="p-2 bg-white border-2 border-blue-500 rounded shadow-lg flex items-center gap-2">
                            <GripVertical size={20} className="text-gray-400" />
                            <span className="font-medium">
                                {activeId.split("-").slice(1).join("-")}
                            </span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

function SortableCategory(props: {
    category: Category;
    overId: string | null;
    onChange: (category: Category) => Result;
    onRemove: () => void;
}) {
    const categoryId = `category:${props.category.name}`;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: categoryId,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="space-y-2">
            <div className="flex items-start gap-2">
                <button
                    {...attributes}
                    {...listeners}
                    className="w-8 h-12 grid place-items-center text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                >
                    <GripVertical size={20} />
                </button>
                <div className="flex-1">
                    <EditableCategory
                        category={props.category}
                        overId={props.overId}
                        onChange={props.onChange}
                        onRemove={props.onRemove}
                    />
                </div>
            </div>
        </div>
    );
}

function EditableCategory(props: {
    category: Category;
    overId: string | null;
    onChange: (category: Category) => Result;
    onRemove: () => void;
    defaultEditing?: boolean;
}) {
    const {
        totalPortfolioAmount,
        totalPortfolioAmountNonCash,
        onAddCategoryItem,
        onRemoveCategoryItem,
        onUpdateCategoryItem,
        getCategory,
    } = usePortfolio();
    const categoryInfo: Category | null = getCategory(props.category.name);
    const percentageOfTotal = categoryInfo
        ? (categoryInfo.categoryAmount / totalPortfolioAmount) * 100
        : 0;

    // Calculate non-cash amount for this category
    const categoryNonCashAmount = categoryInfo
        ? categoryInfo.items
              .filter((item) => !item.isCash)
              .reduce((sum, item) => sum + item.amount, 0)
        : 0;

    const percentageOfNonCashTotal =
        categoryInfo && totalPortfolioAmountNonCash > 0
            ? (categoryNonCashAmount / totalPortfolioAmountNonCash) * 100
            : 0;
    const [tempItem, setTempItem] = useState<Item | null>(null);

    // Make the category a droppable target (use a special ID for empty drop zone)
    const dropId = `${props.category.name}-__empty__`;
    const { setNodeRef } = useDroppable({
        id: dropId,
    });

    // Determine if this category is being dragged over
    const overCategoryName = props.overId?.split("-")[0];
    const isOver = overCategoryName === props.category.name;

    function handleAddItem(item: Item): Result {
        const result = onAddCategoryItem(item.name, props.category.name);
        if (result.accepted) {
            setTempItem(null);
        }
        return result;
    }

    return (
        <div className="space-y-2 w-full">
            <div className="min-h-12 flex w-full gap-2">
                <div className="w-full">
                    <EditableTextBox
                        defaultEditing={props.defaultEditing}
                        value={props.category.name}
                        onChange={(name) => {
                            return props.onChange({
                                ...props.category,
                                name,
                            });
                        }}
                        additionalLabel={
                            <CategoryStats
                                category={categoryInfo}
                                percentageOfTotal={percentageOfTotal}
                                percentageOfNonCashTotal={
                                    percentageOfNonCashTotal
                                }
                            />
                        }
                    />
                </div>
                <button
                    type="button"
                    className="w-12 h-12 grid place-items-center bg-errorLight text-error rounded-md"
                    onClick={props.onRemove}
                >
                    <Trash />
                </button>
            </div>
            <div
                ref={setNodeRef}
                className={cn(
                    "transition-colors duration-200",
                    props.category.items.length === 0 ? "min-h-16" : "",
                    isOver ? "bg-blue-100 rounded-md -mx-2 px-2" : "",
                )}
            >
                <SortableContext
                    items={props.category.items.map(
                        (item) => `${props.category.name}-${item.name}`,
                    )}
                    strategy={verticalListSortingStrategy}
                >
                    <ul className="space-y-2 pl-8">
                        {props.category.items.length === 0 &&
                        tempItem === null ? (
                            <li className="text-gray-400 italic py-2">
                                No items
                            </li>
                        ) : null}
                        {props.category.items.map((item) => {
                            return (
                                <li key={`${props.category.name}-${item.name}`}>
                                    <EditableItem
                                        category={props.category.name}
                                        item={item}
                                        onChange={(newItem) => {
                                            return onUpdateCategoryItem(
                                                item.name,
                                                props.category.name,
                                                newItem,
                                            );
                                        }}
                                        onRemove={() => {
                                            return onRemoveCategoryItem(
                                                item.name,
                                                props.category.name,
                                            );
                                        }}
                                    />
                                </li>
                            );
                        })}
                        {tempItem !== null ? (
                            <li>
                                <EditableItem
                                    category={props.category.name}
                                    item={tempItem}
                                    onRemove={() => {
                                        setTempItem(null);
                                    }}
                                    onChange={handleAddItem}
                                    defaultEditing
                                />
                            </li>
                        ) : null}
                        <li>
                            <button
                                type="button"
                                className="bg-successLight text-success rounded-md px-4 py-2 font-medium disabled:opacity-50"
                                onClick={() => {
                                    setTempItem({
                                        name: "",
                                        amount: 0,
                                    });
                                }}
                                disabled={tempItem !== null}
                            >
                                Add Item
                            </button>
                        </li>
                    </ul>
                </SortableContext>
            </div>
        </div>
    );
}

function EditableItem(props: {
    category: string;
    item: Item;
    /**
     * @returns If the change should be accepted, if false the input will remain in editing mode and show the reason
     */
    onChange: (item: Item) => Result;
    onRemove: () => void;
    defaultEditing?: boolean;
}) {
    const {
        totalPortfolioAmount,
        totalPortfolioAmountNonCash,
        getCategory,
        isSyncing,
    } = usePortfolio();
    const categoryInfo: Category | null = getCategory(props.category);
    const percentageOfCategory = categoryInfo
        ? (props.item.amount / categoryInfo.categoryAmount) * 100
        : 0;
    const percentageOfTotal = categoryInfo
        ? (props.item.amount / totalPortfolioAmount) * 100
        : 0;
    const percentageOfNonCashTotal =
        !props.item.isCash && totalPortfolioAmountNonCash > 0
            ? (props.item.amount / totalPortfolioAmountNonCash) * 100
            : 0;

    const itemId = `${props.category}-${props.item.name}`;
    const shouldEnableDrag = !props.defaultEditing && props.item.name !== "";

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: itemId,
        disabled: !shouldEnableDrag || isSyncing,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isMapped = !!props.item.mappedSymbol;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex gap-2 w-full [&>div]:min-h-12 [&_input]:h-12! [&>div>*]:h-full",
                isSyncing && isMapped ? "opacity-60 pointer-events-none" : "",
            )}
        >
            <button
                {...attributes}
                {...listeners}
                className={cn(
                    "w-8 h-12 grid place-items-center",
                    shouldEnableDrag && !isSyncing
                        ? "text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                        : "text-gray-200 cursor-not-allowed",
                )}
                disabled={!shouldEnableDrag || isSyncing}
            >
                <GripVertical size={20} />
            </button>
            <button
                type="button"
                className="h-12 px-2 grid place-items-center hover:bg-gray-100 rounded transition-colors"
                onClick={() =>
                    props.onChange({
                        ...props.item,
                        isCash: !props.item.isCash,
                    })
                }
                title={props.item.isCash ? "Cash item" : "Non-cash item"}
            >
                <CashIndicator includingCash={!!props.item.isCash} size={16} />
            </button>
            <div className="w-1/2 whitespace-nowrap">
                {isMapped ? (
                    <div className="h-12 flex items-center px-3 bg-gray-50 rounded border border-gray-200">
                        <span className="font-medium">{props.item.name}</span>
                        {categoryInfo ? (
                            <span className="text-sm text-gray-500 ml-2">
                                <ItemStats
                                    percentageOfCategory={percentageOfCategory}
                                    percentageOfTotal={percentageOfTotal}
                                    percentageOfNonCashTotal={
                                        percentageOfNonCashTotal
                                    }
                                    isCash={!!props.item.isCash}
                                />
                            </span>
                        ) : null}
                    </div>
                ) : (
                    <EditableTextBox
                        key={`${props.item.name}-${props.item.amount}`}
                        value={props.item.name}
                        defaultEditing={props.defaultEditing}
                        onChange={(name) => {
                            return props.onChange({
                                ...props.item,
                                name,
                            });
                        }}
                        additionalLabel={
                            categoryInfo ? (
                                <span className="ml-2">
                                    <ItemStats
                                        isCash={false}
                                        percentageOfCategory={
                                            percentageOfCategory
                                        }
                                        percentageOfTotal={percentageOfTotal}
                                        percentageOfNonCashTotal={
                                            percentageOfNonCashTotal
                                        }
                                    />
                                </span>
                            ) : null
                        }
                    />
                )}
            </div>
            <div className="w-1/2 flex items-center gap-2">
                {isMapped ? (
                    <>
                        <div className="h-12 flex items-center px-3 bg-gray-50 rounded border border-gray-200 flex-1">
                            <span className="font-medium">
                                $
                                {props.item.amount.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                        </div>
                        <div
                            className="h-12 w-12 grid place-items-center text-blue-600 cursor-help"
                            title={`Synced from Robinhood (${props.item.mappedSymbol}). This holding is managed externally and cannot be edited manually.`}
                        >
                            <Link2 size={20} />
                        </div>
                    </>
                ) : (
                    <EditableTextBox
                        key={`${props.item.name}-amount-${props.item.amount}`}
                        value={props.item.amount.toString()}
                        type="currency"
                        onChange={(value) => {
                            const amount = Number.parseFloat(value);
                            if (Number.isNaN(amount)) {
                                return {
                                    accepted: false,
                                    reason: "Please enter a valid number",
                                };
                            }
                            return props.onChange({
                                ...props.item,
                                amount,
                            });
                        }}
                    />
                )}
            </div>
            <button
                type="button"
                className="w-12 h-12 grid place-items-center bg-errorLight text-error rounded-md"
                onClick={props.onRemove}
            >
                <Trash />
            </button>
        </div>
    );
}

function CategoryStats(props: {
    category: Category | null;
    percentageOfTotal: number;
    percentageOfNonCashTotal: number;
}) {
    const onlyCashItems = !!props.category?.items.every((item) => item.isCash);

    if (!props.category) {
        return null;
    }

    return (
        <div className="pl-2 flex items-center gap-2">
            <span>${props.category.categoryAmount.toFixed(2)} </span>
            <CashIndicator includingCash={true} size={12} />
            <span>{formatPercentage(props.percentageOfTotal)}</span>
            {onlyCashItems ? null : (
                <>
                    <CashIndicator includingCash={false} size={12} />
                    <span>
                        {formatPercentage(props.percentageOfNonCashTotal)}
                    </span>
                </>
            )}
        </div>
    );
}

function ItemStats(props: {
    isCash: boolean;
    percentageOfCategory: number;
    percentageOfTotal: number;
    percentageOfNonCashTotal: number;
}) {
    return (
        <div className="flex items-center gap-1">
            <span>({formatPercentage(props.percentageOfCategory)}</span>
            <CashIndicator includingCash={true} size={12} />
            <span>
                {formatPercentage(props.percentageOfTotal)}
                {props.isCash ? ")" : null}
            </span>
            {!props.isCash ? (
                <>
                    <CashIndicator includingCash={false} size={12} />
                    <span>
                        {formatPercentage(props.percentageOfNonCashTotal)})
                    </span>
                </>
            ) : null}
        </div>
    );
}
