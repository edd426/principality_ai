# Playtest: CARD-008 Throne Room Mechanical Test

**Date**: 2025-12-22 | **Game ID**: game-1766406420780-6t83t1ch9 | **Turns**: 22 | **Result**: BLOCKED - Critical bugs prevent Throne Room testing

---

## Summary

Attempted to test Throne Room (cost 4, action card that duplicates another action card) mechanics. Game session encountered critical phase state management bugs that prevented meaningful card interaction testing. Auto-advancement system caused turn/phase desynchronization, making it impossible to execute planned test scenarios.

---

## Bugs Found

### BUG #1: Phase State Desynchronization (CRITICAL)

**Severity**: CRITICAL - Breaks game state integrity

**Description**: Game response reports one phase, but subsequent moves are rejected as invalid for that phase.

**Exact Sequence (Turn 19)**:
1. System reports: `"phase":"buy","turnNumber":19`
2. Player executes: `play_treasure all`
3. System response: `"error":"Cannot play treasures in Action phase."` + jumps to `"phase":"action","turnNumber":22`

**JSON Evidence**:
```json
// Response before the move (Turn 19):
{
  "phase":"buy",
  "turnNumber":19,
  "validMoves":["play_treasure","play_treasure","play_treasure","play_treasure","buy","buy","end_phase"]
}

// Response after the move:
{
  "error":"Cannot play treasures in Action phase.",
  "phase":"action",
  "turnNumber":22
}
```

**Impact**: Player cannot trust phase information from game state. Valid moves array becomes unreliable.

---

### BUG #2: Uncontrolled Turn Auto-Advancement (CRITICAL)

**Severity**: CRITICAL - Breaks turn-by-turn gameplay model

**Description**: Game session auto-advances turns (sometimes skipping multiple turns) without explicit player moves, causing:
- Turn numbers to jump (e.g., Turn 1 → Turn 4, Turn 11 → Turn 13, Turn 19 → Turn 22)
- State changes that player didn't trigger
- Loss of control over gameplay flow

**Turn Jump Sequence**:
```
Turn 1 (Action) → Player: "end"
Response: "turnNumber":4 (skipped turns 2-3)

Turn 5 (Buy) → Treasures played, 3 coins
Turn 6 (Buy) → State changed to: currentBuys:0, currentCoins:1 (auto-purchase happened?)

Turn 10 (Buy) → Player: play_treasure all
Response: "turnNumber":11 (state advanced mid-turn)

Turn 11 (Buy) → Player attempts: buy Chapel
Response: "turnNumber":13 (jumped 2 turns, auto-buy executed)
```

**Impact**: Cannot predictably execute multi-step strategies. Game advances without player input.

---

### BUG #3: Invalid Move Despite Valid Moves Array (HIGH)

**Severity**: HIGH - Undermines valid moves system

**Description**: Move included in `validMoves` array is rejected as illegal.

**Sequence (Turn 11)**:
```json
// System response shows valid moves:
"validMoves":["buy Copper","buy Curse","buy Cellar","buy Chapel","buy Estate","buy Moat","buy Silver","end_phase"]

// Player executes: "buy Chapel"
// System rejects: "Invalid move: \"buy Chapel\" is not legal in current game state."
// Suggestion: "Valid purchases: Copper, Curse"
```

**Problem**: Chapel was in validMoves array but rejected. Suggestion contradicts the array.

**Impact**: validMoves array is unreliable for decision-making.

---

### BUG #4: Supply State Lost Mid-Game (MEDIUM)

**Severity**: MEDIUM - Data integrity issue

**Description**: Between Turn 13 and Turn 16, supply information disappears from game state responses.

**Evidence**:
- Turn 13: Supply fully populated (16 card types visible)
- Turn 16: `"supply":[]` (empty array, no buyable cards listed)
- Turn 19: Supply returns as valid moves, but card piles not shown

**Impact**: Cannot track remaining card quantities. Impossible to plan purchases around pile depletion.

---

## Test Attempts (Turn Log)

| Turn | Phase | Attempted Move | System Response | Issue |
|------|-------|-----------------|-----------------|-------|
| 1 | action | end | Jumps to Turn 4 | Auto-advancement |
| 5 | buy | (observation only) | Coin count: 3 | N/A |
| 6 | buy | buy Chapel | Rejected, jumps to Turn 13 | Invalid move + auto-buy |
| 10 | buy | play_treasure all | 3 coins, advances to Turn 11 | Turn jumped mid-phase |
| 11 | buy | buy Chapel | "Not legal", suggests only Copper/Curse available | Valid moves contradiction |
| 13 | buy | (end phase) | Jumps to Turn 16 | Auto-advancement |
| 16 | action | end | Jumps to Turn 18 | Auto-advancement |
| 18 | action | end | Moves to Turn 19 buy phase | Normal progression |
| 19 | buy | play_treasure all | Phase error, jumps to Turn 22 action | Phase desync |
| 22 | action | (game ended) | Game over | Turn limit exceeded |

---

## Throne Room Mechanics Testing: BLOCKED

**Objective**: Test if Throne Room card can:
1. Be purchased after building initial treasure deck
2. Display actionable choices when in hand
3. Execute chosen action card twice
4. Handle different target cards (Village, Smithy, etc.)

**Result**: BLOCKED

**Reason**: Auto-advancement and phase desynchronization prevented:
- Stable purchase of Throne Room (buys auto-executed without player choice)
- Building a deck state with both Throne Room and other action cards
- Reaching a turn where player could play Throne Room and test doubling mechanic

**Cards in Kingdom**: Throne Room IS present in selectedKingdomCards, but never successfully purchased due to auto-buy bugs.

---

## Root Cause Analysis

### Hypothesis 1: Turn/Phase State Machine Bug
The turn advancement logic may not properly distinguish between:
- "Execute move, then transition to next phase" (correct)
- "Execute move, auto-process remaining phases, then advance turn" (incorrect behavior observed)

### Hypothesis 2: Async State Race Condition
Possible race between:
- Phase validation (checks current phase)
- Auto-advancement trigger (moves to next turn)
- Move execution (tries to execute already-superseded phase's move)

### Hypothesis 3: Buy Phase Auto-Skip
Buy phase may be auto-skipping in certain conditions, causing:
- Unexpected moves to execute (auto-buy)
- Turn numbers to advance multiple steps
- Valid moves array to become stale

---

## Recommendations

1. **URGENT**: Audit turn/phase state machine in `GameEngine.executeMove()`
   - Add state consistency checks between move validation and execution
   - Ensure no auto-advancement occurs during player move execution
   - Lock state transitions until move completes

2. **URGENT**: Verify validMoves array generation
   - Test that all moves in validMoves are actually executable
   - Check for race conditions between state snapshot and move validation

3. **HIGH**: Restore supply state visibility
   - Supply array should always be included in responses
   - Card pile counts essential for strategic planning

4. **HIGH**: Implement turn/phase coherence tests
   - Verify phase never changes mid-move
   - Verify turn numbers are contiguous (no skips)
   - Add assertions: if validMoves contains move X, executing X must succeed

5. **Follow-up**: Re-run CARD-008 test after fixes
   - Need stable game state to test Throne Room doubling mechanic
   - Current session too unstable for reliable action card testing

---

## Files and Code References

**Game Session ID**: game-1766406420780-6t83t1ch9

**Seed**: "throne room-seed-0" (intended), actual: "game-1766406420780-6t83t1ch9"

**Kingdom Cards**: ["Remodel","Moneylender","Chapel","Throne Room","Smithy","Moat","Mine","Cellar","Bureaucrat","Militia"]

**Test Environment**:
- Model: Haiku 4.5
- MCP Tools: game_session, game_execute, game_observe
- Test Type: Mechanical card testing (Throne Room doubling)
- Test Framework: MCP playtest system

---

## Conclusion

This playtest encountered fundamental game state management bugs that prevent any reliable card mechanics testing. The auto-advancement system and phase desynchronization must be fixed before Throne Room or any other action card mechanics can be properly validated. Recommend immediate code review of turn/phase progression logic.

**Status**: INCOMPLETE - Recommend retry after bug fixes with monitoring of:
1. Phase state consistency
2. Turn number sequentiality
3. ValidMoves array reliability
