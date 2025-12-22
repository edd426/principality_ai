# Playtest: CARD-002 - Throne Room Doubling

**Date**: 2025-12-21 | **Game ID**: game-1766324333653-lbgc24899 | **Turns**: 12 | **Result**: STUCK - Critical Parser Bug

## Summary

Playtest was unable to complete because of a critical parser bug in the Mine card choice mechanism. The game displays `validMoves` in a format that the command parser cannot accept, causing the test to become stuck on Turn 12.

## Turn Log

| Turn | Phase | Hand | Actions | Moves | Coins | Result |
|------|-------|------|---------|-------|-------|--------|
| 1 | action | 4 Copper, 1 Estate | 1 | end | 0 | Moved to cleanup |
| 2 | buy | 4 Copper, 1 Estate | 1 | (auto-advanced) | 0 | Buy phase skipped |
| 3 | action | 4 Copper, 1 Estate | 1 | end | 0 | Moved to cleanup |
| 4 | buy | 3 Copper, 1 Estate | 1 | play_treasure all → buy Copper | 4→1 | Bought Copper |
| 5 | action | (N/A) | 1 | (auto-advanced to buy) | - | Auto-skipped |
| 6 | buy | 4 Copper, 1 Estate | 1 | play_treasure all → buy Silver | 5→2 | Bought Silver (cost 3) |
| 7 | action | 3 Copper, 2 Estate | 1 | (auto-advanced) | 0 | Auto-skipped |
| 8 | buy | 4 Copper, 1 Silver | 1 | play_treasure all → buy Gold | 6→0 | Bought Gold (cost 6) |
| 9 | action | 1 Estate, 2 Copper, 1 Silver, 1 Gold | 1 | (error) | 0 | BUG: Auto-advanced instead of buy |
| 10 | action | 3 Copper, 2 Estate | 1 | end | 0 | Moved to cleanup |
| 11 | action | 1 Silver, 3 Copper, 1 Estate | 1 | end | 0 | Moved to cleanup |
| 12 | action | 1 Mine, 1 Silver, 1 Estate, 2 Copper | 1 | play_action Mine → STUCK | 0 | **CRITICAL BUG** |

## Bugs Found

### BUG #1: CRITICAL - Mine Card Choice Parser Mismatch
**Status**: BLOCKING TEST

**Location**: Turn 12, Action Phase - Mine card

**Description**: When Mine action card is played, the game returns:
```
"pendingEffect": {
  "card": "Mine",
  "effect": "select_treasure_to_trash",
  "step": 1,
  "options": [
    {"index": 1, "description": "Trash: Silver ($3) → Can gain up to $6", "command": "select_treasure_to_trash Silver"},
    ...
  ]
}
"validMoves": [
  {"type": "select_treasure_to_trash", "card": "Silver"},
  {"type": "select_treasure_to_trash", "card": "Copper"}
]
```

**Problem**:
- The `validMoves` array shows `{"type": "select_treasure_to_trash", "card": "Silver"}` but provides no `command` field
- When attempting to send commands in formats suggested by the pendingEffect:
  - `select_treasure_to_trash Silver` → "Cannot parse move"
  - `select Silver` → "Cannot parse move"
  - `play 0` → "Card at index 0 is not playable"
  - `select_treasure_to_trash` → "Cannot parse move"

**Impact**: Game becomes completely stuck. Player cannot proceed past the Mine card choice. Turn cannot be ended (`end` is not legal).

**Error Message**:
```
"Cannot parse move: \"select_treasure_to_trash Silver\". Invalid format.
Suggestion: Examples: \"play 0\" (action), \"play_treasure Copper\" (buy phase), \"buy Village\", \"end\""
```

**Fix Required**:
1. Update game_execute parser to accept `select_treasure_to_trash` command format OR
2. Return a valid command syntax in the `validMoves` array that matches what the parser accepts OR
3. Add a `command` field to each validMove object with the correct syntax

---

### BUG #2: Buy Phase Auto-Skip
**Status**: MODERATE - Blocks normal gameplay flow

**Location**: Multiple turns (appears after some turns, inconsistent)

**Description**: The buy phase is being completely skipped in several turns, transitioning directly from action phase to cleanup phase without allowing any buy actions.

**Example**:
- Turn 6: Ended action phase → message says "buy → cleanup" but never displays buy phase
- Turn 9: Had treasures to play but was in action phase when should have been in buy phase

**Impact**: Players cannot buy cards during skipped buy phases, breaking the normal turn structure (Action → Buy → Cleanup).

**Pattern**: Seems to occur after certain card plays or when no action cards are in hand, but pattern is not consistent.

---

### BUG #3: Missing Kingdom Cards
**Status**: MINOR - Strategy limitation

**Location**: Kingdom card selection

**Description**: The playtest was designed to test Throne Room doubling with Village (cost 3). However, Village was never available in the supply, so the primary test scenario could not be executed.

**Kingdom Cards Present**: Mine, Workshop, Spy, Laboratory, Moat, Militia, Market, Adventurer, Council Room, Chancellor

**Kingdom Cards Missing**: Village, Smithy (both key to the Throne Room doubling test)

---

## What Was Not Tested

Due to the critical bugs, the following scenarios could not be tested:

1. **Throne Room Doubling** - The main objective of CARD-002
   - Play Throne Room in action phase
   - Select action card to double (Village or Smithy)
   - Verify effect triggers twice

2. **Village Chain Strategy** - Village (cost 3) was not available in supply

3. **Throne Room + Smithy Interaction** - Smithy was not available in supply

4. **Normal Turn Flow** - Disrupted by buy phase auto-skip bug

---

## Recommendations

**PRIORITY 1**: Fix the Mine card choice parser (BUG #1)
- This is a complete blocker for testing
- Affects any card with a pending choice effect
- Suggest: Add explicit syntax like `select 0` for treasure index, or fix validMoves command field

**PRIORITY 2**: Debug buy phase auto-skip (BUG #2)
- Breaks normal game flow
- Prevents meaningful strategy testing
- Check phase transition logic in game engine

**PRIORITY 3**: Verify kingdom card selection for CARD-002
- Ensure Village and Smithy are in supply for Throne Room testing
- Consider fixed kingdom for this specific playtest scenario

---

## Environment

- Game ID: game-1766324333653-lbgc24899
- Seed: Same as game ID
- SDK Version: MCP Principality
- Test Agent: game-tester
