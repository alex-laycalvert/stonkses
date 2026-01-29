# Portfolio Category & Robinhood Sync System

## Overview

The portfolio system now intelligently syncs Robinhood positions with user-customizable categories stored in localStorage. This allows users to:
- Have their real positions automatically updated from Robinhood
- Organize positions into custom categories
- Add custom items alongside real positions
- Preserve their category organization across sessions

## Key Concepts

### Mapped Items vs Custom Items

Every item in the portfolio can be one of two types:

1. **Mapped Item**: Contains a `mappedSymbol` property
   - Linked to a real Robinhood position
   - Amount is automatically synced from API
   - Amount field is read-only in UI (disabled with gray background)
   - Shows a 🔗 link icon in the UI

2. **Custom Item**: No `mappedSymbol` property
   - User-created manual entry
   - Amount can be freely edited
   - Not connected to any Robinhood position

### Data Flow

#### Initial Load (No localStorage Data)

When a user first visits the portfolio page or clears their localStorage:

1. Fetch positions from Robinhood API
2. Create a "Robinhood Holdings" category
3. Add all positions as mapped items:
   ```typescript
   {
     name: "AAPL",
     amount: 1234.56,
     mappedSymbol: "AAPL"  // Maps to position symbol
   }
   ```
4. Save to localStorage

#### Subsequent Loads (localStorage Exists)

On every page load after the initial one:

1. Fetch fresh positions from Robinhood API
2. Load categories from localStorage
3. **Sync Process**:
   - For each **mapped item**: Update `amount` from current API position
   - For each **custom item**: Keep the localStorage `amount` unchanged
   - Track which positions have been mapped
4. **Handle New Positions**:
   - Find any positions not yet mapped
   - Add them to "Robinhood Holdings" category as new mapped items
   - Create "Robinhood Holdings" category if it was deleted
5. Save synced categories back to localStorage

#### When Positions Disappear

If a mapped position no longer exists in Robinhood:
- The item's amount is set to `0`
- The item remains in the category
- User can manually delete it if desired

## Code Structure

### Type Definitions

```typescript
// apps/frontend/app/features/portfolio/types.d.ts
export type Item = {
    name: string;
    amount: number;
    mappedSymbol?: string;  // If set, synced with Robinhood
};
```

### Storage Service

```typescript
// apps/frontend/app/features/portfolio/services/storage.ts

// Main sync function
loadAndSyncCategories(positions: Position[]): Category[]

// Helper functions
createInitialCategories(positions: Position[]): Category[]
syncCategoriesWithPositions(stored: Category[], positions: Position[]): Category[]
addUnmappedPositions(categories: Category[], unmappedPositions: Position[]): Category[]
```

### Portfolio Page

```typescript
// apps/frontend/app/features/portfolio/pages/portfolio-page.tsx

// Loader fetches positions server-side (SSR with cookie forwarding)
export async function loader({ request }: { request: Request })

// Component syncs on mount
const [categories, setCategories] = useState<Category[]>(() => {
    const syncedCategories = loadAndSyncCategories(data.positions);
    saveCategories(syncedCategories);
    return syncedCategories;
});
```

### UI Components

```typescript
// apps/frontend/app/features/portfolio/components/portfolio.tsx

// EditableItem component:
// - Disables amount input for mapped items
// - Shows tooltip explaining the sync
// - Shows 🔗 icon for mapped items
<input
    disabled={!!props.item.mappedSymbol}
    title={props.item.mappedSymbol 
        ? `This amount is synced from Robinhood position: ${props.item.mappedSymbol}`
        : undefined
    }
/>
```

## User Workflows

### Scenario 1: First-Time User

1. User logs in and configures Robinhood token
2. Portfolio page loads with positions fetched from API
3. "Robinhood Holdings" category is auto-created
4. All positions appear as mapped items (read-only amounts)
5. Data saved to localStorage

### Scenario 2: Organizing Positions

1. User creates custom categories (e.g., "Tech Stocks", "Dividend Stocks")
2. User drags mapped items between categories
3. Categories are saved to localStorage
4. On next visit, positions stay in their custom categories
5. Amounts are still synced from Robinhood API

### Scenario 3: Adding Custom Items

1. User clicks "Add Item" in a category
2. Enters custom name and amount
3. Item is created without `mappedSymbol`
4. User can freely edit the amount
5. Custom item persists across sessions

### Scenario 4: New Position Acquired

1. User buys a new stock in Robinhood
2. Portfolio page reloads
3. New position is detected (not mapped in localStorage)
4. Automatically added to "Robinhood Holdings" as mapped item
5. User can move it to another category if desired

### Scenario 5: Position Sold

1. User sells a stock in Robinhood
2. Portfolio page reloads
3. Mapped item's amount updates to 0
4. Item remains visible in category
5. User can manually delete it

## Constants

- **ROBINHOOD_HOLDINGS_CATEGORY**: `"Robinhood Holdings"`
- **CATEGORY_STORAGE_KEY**: `"categories"`
- **PLANNER_STORAGE_KEY**: `"categoryPlanner"`

## Benefits

1. **Always Fresh Data**: Real positions always reflect current Robinhood values
2. **Persistent Organization**: Custom categories and organization preserved
3. **Flexibility**: Mix real and custom items in any category
4. **Automatic Discovery**: New positions automatically appear
5. **Visual Clarity**: Clear indicators show what's synced vs custom
6. **Data Safety**: Read-only amounts prevent accidental overwrites

## Future Enhancements

Potential improvements for the future:

1. **Bulk Import**: Allow importing multiple custom items at once
2. **Templates**: Save category structures as templates
3. **Historical Tracking**: Track position changes over time
4. **Sync Indicator**: Show last sync time in UI
5. **Conflict Resolution**: Handle edge cases when symbols are renamed
6. **Export/Import**: Allow backing up custom organization
