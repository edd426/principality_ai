# Web UI Bug Report - 2026-01-22

## Test Session
- **Game ID**: `game-1769108261439-c17pe9v51`
- **Mode**: Manual AI Mode enabled
- **URL**: http://localhost:5174

---

## Confirmed Bugs

### BUG-001: Clicking treasure cards in hand does not play them
**Severity**: High
**Component**: Hand.tsx / GameBoard.tsx

**Steps to reproduce**:
1. Start game with Manual AI Mode
2. End Action phase to enter Buy phase
3. Click on a Copper card in hand

**Expected**: Copper should be played, coins should increase
**Actual**: Nothing happens, card remains in hand

**Analysis**: The hand cards ARE buttons (verified via accessibility tree), but clicking them doesn't trigger the `onPlayCard` handler. The `handlePlayCard` function exists and sends `play ${card}` format, but something prevents the click from reaching the handler.

---

### BUG-002: "Play All Treasures" button not showing
**Severity**: Medium
**Component**: PhaseIndicator.tsx

**Root cause**: The `canPlayAllTreasures()` function checks for `move.type === 'play_all_treasures'` but the API returns individual `play_treasure` moves, not a `play_all_treasures` aggregate move.

**Fix needed**: Either:
1. Add `play_all_treasures` to valid moves returned by API, OR
2. Change `canPlayAllTreasures()` to check if ANY `play_treasure` moves exist

---

### BUG-003: web_game_execute expects index, not card name
**Severity**: Low
**Component**: MCP Server / API

**Observation**:
- `web_game_execute(move: "play Copper")` returns error: "Invalid index: copper. Must be 0-4"
- `web_game_execute(move: "play 2")` works correctly

**Impact**: Test documentation says to use card names, but indexes are required.

---

### BUG-004: Manual AI Mode doesn't prevent AI auto-play via web_game_execute
**Severity**: High
**Component**: API Server / Game Logic

**Steps to reproduce**:
1. Create game with Manual AI Mode checkbox checked
2. Play human turn via web_game_execute MCP tool
3. End human turn with `end` command

**Expected**: Game should pause at AI's turn, allowing manual AI control via web_game_execute
**Actual**: AI turn is automatically played (all Coppers played, Silver bought, turn ended)

**Evidence from game log**:
```
Player 1 ended buy phase
Turn 1 begins
Player 2 ended action phase
Player 2 played Copper
Player 2 played Copper
Player 2 played Copper
Player 2 bought Silver
Player 2 ended buy phase
Turn 2 begins
```

**Impact**: Cannot test AI turn control via MCP tools - the entire test purpose is defeated.

---

## Improvements / UX Issues

### IMP-001: Missing "Play All Treasures" button (see BUG-002)
User requested this be noted as missing from the UI.

### IMP-002: No visual feedback on card click
When clicking a card that can't be played, there's no feedback to indicate why.

### IMP-003: In Play area could be more prominent
The "In Play" section is easy to miss at the top of the player info area.

---

## What's Working

- [x] Manual AI Mode checkbox on home page
- [x] Game creation navigates to game page
- [ ] ~~AI turn does NOT auto-play~~ **BROKEN** - see BUG-004
- [x] web_game_observe MCP tool returns correct state
- [x] web_game_execute MCP tool can play moves (with index format)
- [x] UI updates correctly when refreshed after API changes
- [x] End Actions button works
- [ ] Clicking hand cards to play them - **BROKEN** see BUG-001
- [ ] Supply pile clicking for buying - not fully tested

---

## Summary

**4 bugs found, 2 high severity:**
1. **BUG-001 (High)**: Treasure clicking broken
2. **BUG-002 (Medium)**: Play All Treasures button missing
3. **BUG-003 (Low)**: Move format expects index not card name
4. **BUG-004 (High)**: Manual AI Mode doesn't work

---

## Next Steps

1. Debug why hand card clicks don't trigger handlers (BUG-001)
2. Fix Play All Treasures button logic (BUG-002)
3. Debug why manualAI flag isn't preventing auto-play (BUG-004)
4. Update test docs with correct move format
