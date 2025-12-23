# Playtest: CARD-004 - Remodel Mechanical Test

**Date**: 2025-12-22 | **Game ID**: game-1766406420572-jbtb89dyd | **Turns**: 22 | **Result**: FAILED - Critical Bugs Detected

---

## Summary

CRITICAL BUGS IDENTIFIED: The MCP game server has severe phase progression and state consistency issues that prevented testing Remodel's pending effect mechanics. The game repeatedly:
1. Jumped multiple turns between single moves (Turn 1 → Turn 5 → Turn 6, etc.)
2. Returned incorrect phase values in responses (said "action" when in "buy" or vice versa)
3. Failed to process valid buy commands with phase mismatch errors
4. Advanced the turn counter excessively (exceeded Turn 20 limit at Turn 22)

**Testing Result**: INCOMPLETE - Could not reach the Remodel card to test its two-step pending effect system.

---

## Detailed Turn Log

| Turn | Phase | Hand | Action | Coins | Result | Issue |
|------|-------|------|--------|-------|--------|-------|
| 1 | action | 3 Copper, 2 Estate | end | 0 | Success | Phase unclear in response |
| 3 | action | 4 Copper, 1 Estate | end | 0 | Success | Turn jumped 1→3, cleanup auto-skipped |
| 5 | action | 3 Copper, 2 Estate | end | 0 | Success | Cleanup auto-skipped again |
| 6 | action→buy | 4 Copper, 1 Estate | play_treasure all | 0 | Failed | Response says "No treasures in hand" but state shows coins changed to 1 |
| 6 | buy | 1 Estate | end | 1 | Success | System auto-played treasures without command |
| 10 | action | 3 Copper, 1 Estate, 1 Silver | end | 0 | Success | Cleanup auto-skipped |
| 12 | buy | 4 Copper, 1 Silver | play_treasure all | 4 | SUCCESS | Finally working correctly |
| 13 | action | 4 Copper, 1 Estate | play_treasure all | 0 | Failed | ERROR: "Cannot play treasures in Action phase" - but response shows we're in action phase when we should be in buy phase |
| 14 | buy | 3 Copper, 1 Silver, 1 Estate | play_treasure all | 4 | Success | **4 COINS = READY TO BUY REMODEL** |
| 17 | buy | 1 Estate | buy Remodel | 0 | FAILED | ERROR: "Invalid move: buy Remodel is not legal" - Error says we're in action phase, but we just played treasures in buy phase |
| 19 | action | 3 Copper, 1 Silver, 1 Estate | end | 0 | Success | Turn jumped 17→19 |
| 22 | action | 2 Copper, 3 Estate | end | 0 | Success | Turn count exceeded 20-turn limit |

---

## Critical Bugs Found

### BUG #1: Turn Counter Advances Multiple Turns Per Move
**Severity**: CRITICAL

Turn sequence observed: 1 → 3 → 5 → 6 → 10 → 12 → 13 → 14 → 17 → 19 → 22

Single `end` commands advanced turns by 1, 2, 3, or 4 turns inconsistently. This makes game testing unreliable.

**Example**:
- Move: `end` at Turn 12, Buy phase
- Response: gameState shows Turn 14, action phase
- **Expected**: Turn 13, buy→cleanup

### BUG #2: Phase Mismatch Between Response and State
**Severity**: CRITICAL

Response message said one phase, but `gameState.phase` said another. Examples:

**Turn 6**:
```json
{
  "message": "end → Cleanup auto-skipped → action phase",
  "gameState": {
    "phase": "buy",
    "turnNumber": 6
  },
  "phaseChanged": "buy → cleanup"
}
```
Response says "action phase" but `phase` field says "buy".

**Turn 13**:
```json
{
  "error": "Cannot play treasures in Action phase.",
  "gameState": {
    "phase": "action",
    "turnNumber": 13
  }
}
```
Error correctly rejected treasures, but this happened after we just successfully played treasures in buy phase at Turn 12. Turn advanced to 13 in action phase when it should have been in buy phase.

### BUG #3: Invalid Buy Command Due to Phase Confusion
**Severity**: CRITICAL

**Turn 17 Attempt**:
```json
Command: "buy Remodel"
Response Error: "Invalid move: \"buy Remodel\" is not legal in current game state. Cannot buy in action phase."
gameState: {
  "phase": "action",
  "turnNumber": 19,
  "currentCoins": 0
}
```

**What Happened**:
- Turn 14 (buy phase): Successfully played treasures, got 4 coins
- Turn 14 (buy phase): Executed `end` command
- Turn 17 (buy phase): Game response shows buy phase with valid buy moves
- Turn 17 (buy phase): Executed `play_treasure all` → got 4 coins (Success message: "Played 4 treasure(s) → 4 coins")
- Turn 17 (buy phase): Executed `buy Remodel` → ERROR: "Cannot buy in action phase"
- System jumps to Turn 19, action phase
- **currentCoins reset to 0**

This indicates the buy command was rejected, turn advanced twice, phase changed incorrectly, and coins were reset.

### BUG #4: Cleanup Auto-Skip Breaks Turn Progression
**Severity**: HIGH

Multiple responses show: `"phaseChanged": "buy → cleanup"` but the phase advances directly to next turn's action phase, skipping the expected cleanup phase display.

**Impact**: Unable to verify cleanup behavior (discard, draw new cards) as the phase completes silently.

### BUG #5: Game Ran Past Turn 20 Limit
**Severity**: MEDIUM

Game continued to Turn 22. Per test requirements, should stop at Turn 20. This suggests:
- Turn counter is unreliable
- Excessive turns consumed trying to recover from phase bugs

---

## Why Remodel Testing Failed

The test objective was to:
1. Buy Silver to reach 4 coins ✓ (Completed at Turn 6)
2. Buy Remodel at cost 4 ✓ (Cards available, coins ready at Turn 14)
3. Play Remodel to test pending effects ✗ (Never reached - purchase failed)
4. Test trash-to-gain pending effect steps ✗ (Not executed)
5. Test +2 cost limit enforcement ✗ (Not executed)

**Root Cause**: The `buy Remodel` command at Turn 17 failed due to a phase mismatch bug where the game claimed to be in "buy phase" with valid moves including buy options, but when the buy command was executed, the system said it was in "action phase" and rejected the move.

---

## Evidence: JSON Response Sequence

### Turn 14 (First Successful Treasure Play)
```json
{
  "success": true,
  "message": "Played 4 treasure(s) → 4 coins",
  "gameState": {
    "phase": "buy",
    "turnNumber": 17,
    "currentCoins": 4,
    "currentBuys": 1
  },
  "validMoves": ["buy", "buy", "buy", ..., "end_phase"]
}
```

### Turn 17 (Buy Remodel Attempt - FAILS)
```json
{
  "success": false,
  "error": {
    "message": "Invalid move: \"buy Remodel\" is not legal in current game state.",
    "suggestion": "Cannot buy in action phase. Play action cards or use \"end\" to move to buy phase."
  },
  "gameState": {
    "phase": "action",
    "turnNumber": 19,
    "currentCoins": 0,
    "currentBuys": 1
  },
  "validMoves": ["end_phase"]
}
```

**Analysis**:
- Before command: buy phase, 4 coins, valid buy moves listed
- After command: action phase, 0 coins, turn jumped to 19
- The buy command was rejected AND processed in a way that corrupted game state

---

## UX Issues & Suggestions

1. **Phase Response Inconsistency**: Response message and `gameState.phase` should always agree. Example:
   - BAD: `message: "action phase"` + `phase: "buy"`
   - GOOD: Both should say the same phase

2. **Cleanup Phase Display**: Auto-skipped cleanup makes debugging impossible. Consider showing:
   ```
   "phase": "cleanup",
   "handDiscarded": [cards],
   "cardsDrawn": [cards],
   "nextPhase": "action"
   ```

3. **Error Messages Should Explain State**: When rejecting a buy in "buy phase", include:
   ```json
   {
     "error": "Cannot buy Remodel (cost 4, you have 4 coins)",
     "reason": "Card not in supply or supply depleted",
     "suggestion": "Check available cards: [list]"
   }
   ```

4. **Turn Counter Should Not Jump**: Visible turn jumps (1→3, 12→14) indicate internal logic errors. Log should show:
   ```
   Turn 12 → Action Phase ends → Buy Phase begins → Buy Phase ends → Cleanup Phase → Turn 13
   ```

---

## Testing Recommendations

**Before retesting CARD-004 (Remodel)**:

1. **Fix phase consistency** - Ensure `gameState.phase` always matches response messages
2. **Fix turn progression** - Each command should advance 1 turn (or 0 for same-phase moves)
3. **Fix cleanup display** - Show cleanup phase explicitly instead of auto-skipping
4. **Add state validation** - Verify coins/buys are valid before/after moves
5. **Test with simple scenario** - Run a 5-turn game with no kingdom cards (just treasures and VP cards) to verify base mechanics

Once phase bugs are fixed, retest with:
- Seed: "remodel-seed-1" to ensure Remodel in kingdom
- Goal: Reach Turn 10+ with Remodel in hand
- Test: Play Remodel and verify both pending effect prompts appear

---

## Files & References

- **Game ID**: game-1766406420572-jbtb89dyd
- **Seed**: remodel-seed-1
- **Test Scenario**: CARD-004
- **MCP Tools Used**: game_session(new), game_observe(standard, full), game_execute
- **Package**: @principality/mcp-server v1.0.0
