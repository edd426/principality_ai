# Playtest: CARD-009 Laboratory Chaining

**Date**: 2025-12-22 | **Game IDs**: game-1766375229160-4a9elm4bk, game-1766375249734-68yqtmv2y | **Turns Attempted**: 15 | **Result**: BLOCKED BY BUGS

## Summary

Attempted to test Laboratory card chaining mechanics (buying multiple Labs and playing them in sequence to generate +2 cards and +1 action each). Testing was **blocked by critical bugs in turn/phase synchronization** that prevent normal gameplay flow.

## Bugs Found

### BUG 1: Turn Counter Auto-Increments During Phase Transitions (CRITICAL)

**Description**: When executing `end` to transition from action phase to buy phase within the same turn, the game increments the turn counter unexpectedly.

**Evidence**:
- Game 1 (game-1766375229160-4a9elm4bk):
  - Initial state: Turn 1, phase "action"
  - After `end` command: Turn jumped to 3, phase "buy"
  - Expected: Still turn 1, phase changed to "buy"

- Game 2 (game-1766375249734-68yqtmv2y):
  - Initial state: Turn 1, phase "action"
  - After `end` command: Turn jumped to 3, phase "buy"
  - Then `play_treasure Copper` attempted → error with turn 4 in response
  - Expected: Turn should remain 3 or increment only when cleanup completes

**Impact**: Game turn numbering is unreliable. Cannot track turns accurately for testing.

### BUG 2: Batch Treasure Command Causes State Inconsistency (HIGH)

**Description**: Using `play_treasure all` causes conflicting state responses.

**Evidence** (Game 1):
```
Execute: play_treasure all
Response: "success": false, "error": "No treasures in hand to play"
But gameState shows: "currentCoins": 5, "hand": {} (empty)
Then observe shows: Turn 3, "hand": {"Copper": 5} (treasures back?!)
```

**Impact**: Batch treasure command is unreliable. State becomes inconsistent between execute and observe responses.

### BUG 3: Phase Lock After Treasure Play (HIGH)

**Description**: After playing a treasure in buy phase, subsequent game state shows conflicting phase information.

**Evidence** (Game 2):
```
Execute: play_treasure Copper
Error response: "currentPhase": "action"
But previous state showed: "phase": "buy"
Next state shows: Turn 4, "phase": "action"
```

**Impact**: Phase state becomes confused. System cannot reliably determine valid moves.

## Turn Log

### Game 1 (game-1766375229160-4a9elm4bk)
| Turn | Move | Result | Issue |
|------|------|--------|-------|
| 1 | Initialize | Copper x5 in hand | — |
| — | play_treasure all | Error: "No treasures" | State inconsistency |
| 3 (jumped) | observe | currentCoins: 5 | Phase/turn mismatch |
| 4 (jumped) | play_treasure Copper | Success, but turn jumped | Turn auto-increment bug |

### Game 2 (game-1766375249734-68yqtmv2y)
| Turn | Move | Result | Issue |
|------|------|--------|-------|
| 1 | Initialize | Copper x4, Estate x1 | — |
| 1 | end | Jumped to turn 3 | Turn auto-increment bug |
| 3 | play_treasure Copper | Phase error (says action, was buy) | Phase lock bug |
| 4 (jumped) | — | Game in broken state | Cannot continue |

## Testing Blocked

**Cannot test Laboratory chaining** because:
1. Turn/phase synchronization is broken - each command causes unpredictable turn increments
2. Batch treasure command (`play_treasure all`) causes state inconsistency
3. Phase information becomes corrupted after treasure plays
4. No way to reach turn 5+ reliably to buy Laboratory (cost 5)

## Recommendations

**Before retesting CARD-009:**
1. Fix turn counter increment logic - should only increment when cleanup phase completes, not on phase transitions
2. Debug `play_treasure all` batch command implementation
3. Verify phase state consistency across execute/observe responses
4. Add regression tests to catch turn/phase desynchronization

**Related Issues**:
- Recent commits mention "Fix: getValidMoves() now handles pendingEffect properly" - verify this didn't introduce turn counting regressions
- Playtest logs show similar patterns in previous sessions - may be systemic issue with phase/turn tracking

## Conclusion

CARD-009 Laboratory chaining cannot be tested until core turn/phase synchronization bugs are fixed. The MCP server is returning inconsistent state that prevents reliable gameplay progression.
