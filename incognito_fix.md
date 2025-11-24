# Incognito Mode Fix

## Issue
Incognito mode was saving conversation history to localStorage, defeating its purpose of private browsing.

## Root Cause
The persistence `useEffect` (lines 149-163 in App.tsx) was unconditionally saving all state including `tabs`, `archivedTabs`, and `globalHistory` to localStorage, regardless of the `isIncognito` flag.

While there was a check preventing new history items from being added to `globalHistory` (line 458), the existing conversation data was still being persisted.

## Solution
Modified the persistence logic to conditionally save data based on `isIncognito` state:

### When Incognito is **ON**:
- **Saved**: `bookmarks`, `downloads`, `customBackdrop`, `customInstructions`, `isIncognito`
- **NOT Saved**: `tabs`, `archivedTabs`, `activeTabId`, `globalHistory`

### When Incognito is **OFF**:
- **Saved**: All data including conversation history

### Additional Changes:
1. Added `isIncognito` to the saved data so the preference persists across sessions
2. Added `isIncognito` to the persistence `useEffect` dependency array
3. Load `isIncognito` state from localStorage on initialization

## Testing
To verify the fix works:
1. Enable incognito mode in Settings
2. Have a conversation
3. Reload the page
4. The conversation should NOT be restored (fresh start)
5. Disable incognito mode
6. Have a conversation
7. Reload the page
8. The conversation SHOULD be restored

## Files Modified
- `App.tsx` (lines 121, 131, 144, 151-163)
