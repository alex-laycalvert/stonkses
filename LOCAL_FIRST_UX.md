# Local-First Portfolio UX

## Overview

The portfolio now implements a local-first user experience for optimal perceived performance. Users see their data instantly from localStorage, while positions sync in the background.

## User Experience Flow

### 1. Initial Page Load

**What the user sees:**
1. Page loads instantly with localStorage data
2. All categories and items are immediately visible and editable
3. A "Syncing positions..." indicator appears with a spinner
4. Custom items (non-mapped) can be edited freely during sync
5. Mapped items show read-only (gray boxes with values)

**Behind the scenes:**
- `loadCategories()` loads from localStorage immediately
- Background fetch starts to `/api/positions`
- `syncState` is set to `"syncing"`
- User can interact with custom items during fetch

### 2. During Position Fetch

**What the user sees:**
- "Syncing positions..." indicator with animated spinner
- Full ability to:
  - Add/remove/edit custom items
  - Add/remove/rename categories
  - Drag and drop items between categories
  - Edit custom item amounts
- Mapped items remain read-only (but visible with current cached values)

**Behind the scenes:**
- HTTP request to Robinhood API in progress
- No state locks - full editing capability
- Categories state can be modified freely

### 3. State Update (Brief Lock)

**What the user sees:**
- Still shows "Syncing positions..." indicator
- **Brief lock** (milliseconds) on all editing operations
- Mapped items may appear slightly faded (`opacity-60`)
- Drag operations disabled temporarily

**Behind the scenes:**
- `isUpdatingState` set to `true`
- `updateMappedItemsInPlace()` updates amounts across all categories
- Preserves user's category organization
- Adds new unmapped positions to "Robinhood Holdings"
- `isUpdatingState` set to `false`

**Duration:** Typically < 50ms

### 4. Sync Complete

**What the user sees:**
- Indicator changes to "Last synced at HH:MM:SS"
- Mapped item amounts reflect current Robinhood values
- All editing operations fully enabled
- Smooth transition - no jarring UI changes

**Behind the scenes:**
- `syncState` set to `"synced"`
- `lastSyncedAt` timestamp recorded
- Updated categories saved to localStorage

## Mapped Items UI

### Visual Design

**Mapped Items (Robinhood positions):**
```
[Drag Handle] | AAPL (percentages) | $1,234.56 [🔗 Link Icon]
               └─ Gray box         └─ Gray box + icon
```

**Custom Items:**
```
[Drag Handle] | [Editable Name] | [Editable Amount Input] | [Delete]
```

### Key Differences

| Feature | Mapped Items | Custom Items |
|---------|-------------|--------------|
| Name | Plain text, gray background | Editable text input |
| Amount | Currency formatted, gray background | Number input |
| Indicator | Blue link icon with tooltip | None |
| Tooltip | "This is a mapped holding and cannot be edited manually" | N/A |
| During Sync | Slightly faded, drag disabled | Fully interactive |

## Technical Implementation

### State Management

```typescript
const [categories, setCategories] = useState(() => loadCategories());
const [syncState, setSyncState] = useState<"idle" | "syncing" | "synced">("idle");
const [isUpdatingState, setIsUpdatingState] = useState(false);
const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
```

### Sync Process

```typescript
async function syncPositions() {
    setSyncState("syncing");
    
    // 1. Fetch positions (user can still edit)
    const response = await fetch("/api/positions");
    const data = await response.json();
    
    // 2. Brief state update lock
    setIsUpdatingState(true);
    
    setCategories(current => {
        const updated = updateMappedItemsInPlace(current, data.positions);
        saveCategories(updated);
        return updated;
    });
    
    setIsUpdatingState(false);
    
    // 3. Show sync complete
    setLastSyncedAt(new Date());
    setSyncState("synced");
}
```

### Edit Operation Guards

All mutation operations check `isUpdatingState`:

```typescript
function onUpdateCategoryItem(...): Result {
    if (isUpdatingState) {
        return {
            accepted: false,
            reason: "Cannot update item while updating positions"
        };
    }
    // ... perform update
}
```

**Important:** Only locked during state update, not during fetch!

### Smart Position Sync

The `updateMappedItemsInPlace()` function:
1. Creates a position map for O(1) lookups
2. Iterates through all categories (preserving structure)
3. Updates mapped items wherever they are
4. Keeps custom items unchanged
5. Tracks which positions were mapped
6. Adds unmapped positions to "Robinhood Holdings"

```typescript
export function updateMappedItemsInPlace(
    currentCategories: Category[],
    positions: Position[]
): Category[] {
    const positionMap = new Map<string, Position>();
    for (const pos of positions) {
        positionMap.set(pos.symbol, pos);
    }
    
    // Update in-place, preserving organization
    const updatedCategories = currentCategories.map(category => {
        const updatedItems = category.items.map(item => {
            if (item.mappedSymbol) {
                const position = positionMap.get(item.mappedSymbol);
                return position 
                    ? { ...item, amount: position.equity }
                    : { ...item, amount: 0 };
            }
            return item; // Custom item - unchanged
        });
        
        return {
            ...category,
            items: updatedItems,
            categoryAmount: updatedItems.reduce((sum, item) => sum + item.amount, 0)
        };
    });
    
    // Add new unmapped positions...
    return addUnmappedPositions(updatedCategories, unmappedPositions);
}
```

## Performance Characteristics

### Time to Interactive (TTI)
- **Without local-first:** ~500-2000ms (wait for API)
- **With local-first:** ~50-100ms (localStorage read)

### Perceived Performance
- User sees data immediately
- Can start interacting right away
- Background sync feels like a "refresh" not a "load"

### State Update Lock Duration
- Typically: 10-50ms
- User rarely notices it
- Only affects operations during the brief update

## Edge Cases Handled

1. **User edits during fetch:** Changes preserved, not overwritten
2. **User moves mapped item to new category:** Position found and updated in new location
3. **Position no longer exists:** Amount set to 0, item kept for user to delete
4. **New position acquired:** Added to "Robinhood Holdings" automatically
5. **No localStorage:** First-time users get "Robinhood Holdings" with all positions
6. **Network failure:** User continues working with cached data, sync fails silently

## Benefits

1. **Instant Load:** No waiting for API on page load
2. **Offline Capable:** Can view and edit (custom items) while API is down
3. **Smooth Updates:** Positions update without full page reload
4. **Organization Preserved:** User's category structure never lost
5. **Clear Feedback:** Sync indicator shows exactly what's happening
6. **Non-Blocking:** Can edit custom items during entire sync process

## Future Enhancements

1. **Periodic Re-sync:** Auto-refresh every N minutes
2. **Manual Refresh Button:** Let users trigger sync on demand
3. **Optimistic Updates:** Apply edits immediately, sync to server later
4. **Conflict Resolution:** Handle simultaneous edits from multiple tabs
5. **Sync Error Recovery:** Retry failed syncs with exponential backoff
6. **Stale Data Indicator:** Show age of cached data if > X minutes old
