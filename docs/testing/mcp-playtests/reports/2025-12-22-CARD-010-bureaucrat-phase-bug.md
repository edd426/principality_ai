# Playtest Report: CARD-010 Bureaucrat Mechanical Test

**Date**: 2025-12-22 | **Game ID**: game-1766406420320-9tys6mg74 | **Turns Completed**: 16 | **Result**: BLOCKED BY PHASE STATE BUG

---

## Executive Summary

Critical bug found: **game_execute() responses report incorrect phase information that contradicts game_observe() responses**. This causes the game to become unplayable mid-test. The Bureaucrat card itself was not reached due to this blocker.

---

## Bug Details

### Phase State Inconsistency (CRITICAL)

**Problem**: When executing moves in the buy phase, `game_execute()` responses report `phase: "action"` even though:
1. The immediately preceding `game_observe()` call showed `phase: "buy"`
2. The move was legal in buy phase according to validMoves
3. The game log confirms the move executed successfully
4. The subsequent `game_observe()` call shows the correct phase

**Impact**:
- CLI player cannot reliably determine current phase
- Conditional logic that checks `gameState.phase` from execute responses will make wrong decisions
- Game becomes unplayable without rechecking state after every move

### Reproduction Steps

1. Start game (any seed)
2. Execute: `game_observe()` → see `phase: "buy"`
3. Execute: `game_execute(move: "end")` → response shows `phase: "action"` (WRONG)
4. Execute: `game_observe()` → see `phase: "buy"` (CORRECT)
5. Repeat: Phase oscillates incorrectly in execute responses

### Evidence

**Turn 5 Sequence**:

```json
// Step 1: Observe current state
game_observe(detail_level: "standard")
RESPONSE: {
  "phase": "buy",
  "turnNumber": 5,
  "validMoves": ["play_treasure", "buy", "end_phase"]
}

// Step 2: Execute move
game_execute(move: "end")
SUCCESS: true
RESPONSE: {
  "gameState": {
    "phase": "action",  // <-- BUG: Should be "cleanup" or next action phase
    "turnNumber": 6
  },
  "phaseChanged": "buy → cleanup"
}

// Step 3: Verify actual state
game_observe(detail_level: "standard")
RESPONSE: {
  "phase": "buy",     // <-- Contradicts execute response!
  "turnNumber": 6,
  "validMoves": ["play_treasure", "buy", "end_phase"]
}
```

**Turn 6-8 Sequence** (attempting to play treasures):

```json
// After game_observe shows phase: "buy", validMoves includes "play_treasure"
game_execute(move: "play_treasure all")
SUCCESS: false
ERROR: {
  "message": "Cannot play treasures in Action phase.",
  "gameState": {
    "phase": "action"  // <-- Contradicts the observe call that just showed "buy"
  }
}

// But when we check actual state:
game_observe()
RESPONSE: {
  "phase": "buy",
  "turnNumber": 8,
  "validMoves": ["play_treasure Copper", "play_treasure Copper", ...]
}
```

### Root Cause Analysis

The bug appears to be in how `game_execute()` constructs its response. Two possibilities:

1. **Response is built from stale state**: The function gets the pre-move state instead of post-move state
2. **Cleanup phase auto-advances but response doesn't reflect it**: The cleanup phase transitions the turn but the response object hasn't been updated

### Impact on Testing

This bug **completely blocks Bureaucrat testing** because:
- Cannot reliably play treasures in buy phase (core mechanic needed to get coins)
- Cannot reach 4+ coins to buy Bureaucrat
- Cannot test Bureaucrat's gain-to-deck mechanic
- CLI player would need to call game_observe() after EVERY move to work around this

---

## Turn-by-Turn Log

| Turn | Phase | Action | Result | Notes |
|------|-------|--------|--------|-------|
| 1 | action | end | ✓ | No action cards to play |
| 1 | buy | (blocked) | ISSUE | Cannot verify if moved to buy phase |
| 2-4 | (mixed) | end only | ~ | Phase inconsistencies prevent tracking |
| 5 | (mixed) | end | ✓ Logs confirm | But response shows wrong phase |
| 6 | buy | play_treasure Copper | ✗ ERROR | Error claims action phase, but observe shows buy |
| 6-8 | (mixed) | Multiple attempts | ✗ STUCK | Phase contradictions prevent progress |
| 9-16 | action | end only | ~ | Test halted |

**Game Log Confirms Execution**: Despite response contradictions, the game log shows moves executed:
- "Player 1 played Copper" (Turn 6)
- "Player 1 played Copper" (Turn 6, multiple times)
- "Player 1 bought Silver" (Turn 6)

This proves moves actually happened, but the phase in the response was wrong.

---

## Bureaucrat Card Status

**NOT TESTED** - Could not reach the point of buying Bureaucrat due to phase state bug blocking buy phase operations.

Target state: Buy Bureaucrat (cost 4, in supply at 10 remaining), test:
- Silver gained to deck (not hand/discard)
- Silver appears on top of deck
- Solo mode attack behavior (other players would put victory card on deck in multiplayer)

---

## Code Affected

**Likely location**: `/packages/mcp-server/src/handlers/game_execute.ts`

The response construction likely returns state before phase transitions complete, or doesn't apply cleanup-phase auto-advances to the response object.

**Test to add**:
```typescript
// Test: Execute response phase matches observe phase
const before = game_observe();
const executeResult = game_execute("play_treasure Copper");
const after = game_observe();

assert(executeResult.gameState.phase === after.phase,
  "Execute response phase should match subsequent observe phase");
```

---

## Blockers for Bureaucrat Testing

1. **CRITICAL**: Fix phase state in game_execute responses
2. After fix: Re-run test to reach Bureaucrat purchase
3. Verify gain-to-deck mechanic works correctly
4. Test attack behavior in solo mode

---

## Recommendations

1. **Immediate**: Fix game_execute() to return correct phase in response
2. **Add regression test**: Compare execute response phase vs next observe call
3. **Consider**: Return full post-move state in execute response (like observe does) to eliminate contradiction
4. **Document**: Clarify if CLI should trust execute response or re-call observe after moves

---

## Files Referenced

- Game session ID: `game-1766406420320-9tys6mg74`
- Selected kingdom cards: Bureaucrat (cost 4, was never purchased due to bug)
- Final game log shows Silver was bought on turn 6, but Bureaucrat remained in supply

---

## Next Steps

1. Fix the phase state bug in MCP server
2. Re-run CARD-010 test with corrected server
3. Verify Bureaucrat mechanics work as designed
4. Add regression tests to prevent phase state issues
