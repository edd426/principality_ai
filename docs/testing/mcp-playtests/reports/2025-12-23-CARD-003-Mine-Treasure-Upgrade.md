# Playtest: CARD-003 - Mine Treasure Upgrading

**Date**: 2025-12-23 | **Game ID**: game-1766469806848-y1sul9wwv | **Turns**: 20 | **Result**: BLOCKED - Critical Phase Transition Bugs

---

## Summary

Test CARD-003 attempted to validate Mine's trash-and-gain treasure mechanic (trashed treasure should go to HAND for immediate use this turn). However, **critical bugs in phase transition logic prevented meaningful testing**. The game could not execute buy phase moves, making it impossible to acquire or test the Mine card.

---

## Critical Bugs Found

### BUG #1: Buy Phase Moves Rejected with Wrong Phase Error
**Severity**: CRITICAL - Blocks all purchasing

**Description**: When attempting to execute `play_treasure all` or `buy [card]` while in buy phase, the system returns error "Cannot play treasures in Action phase" and jumps the game to the next action phase.

**Reproduction Steps**:
1. Reach buy phase (phase="buy" in gameState)
2. Execute any buy-phase move: `play_treasure all`, `play_treasure Copper`, or `buy [card]`
3. System rejects with error claiming "Action phase"
4. Game state jumps to next action phase unexpectedly

**Example Evidence** (Turn 6):
```
YOU: game_execute(move: "play_treasure all")
RESPONSE: {
  "success": false,
  "error": {
    "message": "Cannot play treasures in Action phase.",
    "suggestion": "Use \"end\" to move to Buy phase first, then play treasures."
  },
  "gameState": {
    "phase": "action",
    "turnNumber": 7,
    ...
  }
}
```

**Impact**: No player can buy any cards at all. The game becomes unplayable.

**Root Cause Hypothesis**: Phase state is being incorrectly tracked internally. Even though `validMoves` array shows buy-phase moves like `["play_treasure","play_treasure","buy","buy","end_phase"]`, the internal `phase` field says "action", creating a contradiction.

---

### BUG #2: Buy Phase Auto-Skips to Cleanup
**Severity**: CRITICAL - Blocks purchasing

**Description**: When ending action phase with `end`, the game sometimes auto-skips buy phase entirely and goes straight to cleanup, with message "buy → cleanup".

**Example Evidence** (Turns 3-4):
```
Turn 3 action → end
RESPONSE: {
  "message": "end → Cleanup auto-skipped → action phase",
  "phaseChanged": "buy → cleanup"
}
```

**Impact**: Players cannot execute buy phase moves. Purchasing is impossible. Game progression blocked.

---

### BUG #3: State Inconsistency - validMoves Don't Match Phase
**Severity**: HIGH - Confusing/contradictory states

**Description**: The `validMoves` array shows buy-phase moves (e.g., `["play_treasure","play_treasure","buy","buy","end_phase"]`), but the `phase` field reports "action", creating a contradictory state.

**Example**:
```
gameState: {
  "phase": "action",
  "turnNumber": 8,
  "validMoves": ["play_treasure","play_treasure","buy","buy","end_phase"]
}
```

This tells players they can buy, but the phase says they're in action phase. When they try to buy, the system says "Can't buy in action phase."

**Impact**: Players receive confusing error messages. UX breakdown.

---

## Mine Card Testing Status

**UNABLE TO TEST** - Could not acquire Mine card due to phase transition bugs blocking all purchases.

**What Was Attempted**:
- Reached turn 4 with 5 Copper in hand (enough to buy Mine for 5 coins)
- Attempted `buy Mine` while in buy phase
- Got error: "Invalid move: cannot buy in action phase"
- Game became unplayable after that

**Critical Check NOT Completed**: Could not verify whether gained treasures from Mine appear in HAND (not discard pile) as intended by the fix in issue #80.

---

## Turn Log

| Turn | Notes |
|------|-------|
| 1 | Game initialized, 7 Copper + 3 Estate starting deck. Moved through action/cleanup. |
| 2 | Attempted to buy; phase transition failed. |
| 3-4 | Buy phase auto-skipped to cleanup. |
| 4 | Had 5 coins (enough for Mine), but couldn't buy due to phase error. |
| 5-20 | Cycling through turns attempting workarounds. Only `end` commands worked. |
| 20 | Reached turn 20 limit. Game ended. No cards purchased. No Mine testing. |

---

## Cards Tested

- **Kingdom Cards Selected**: Festival, Library, Laboratory, Bureaucrat, Smithy, Mine, Chapel, Remodel, Workshop, Militia
- **Cards Actually Tested**: None - only starting deck (Copper, Estate) were in play
- **Mine Card**: Never acquired (purchase blocked by phase bugs)

---

## Treasure Placement Verification

**STATUS**: NOT TESTED

Could not test the critical requirement: "Gained treasure from Mine should appear in HAND, not discard pile, so it can be used immediately this turn."

This was the primary focus of CARD-003 and is directly related to the fix in issue #80.

---

## UX Issues

1. **Contradictory error messages**: System says "use end to move to buy phase" when already in buy phase
2. **Hidden state corruption**: `validMoves` array correctly shows buy options, but internal phase tracking is wrong
3. **No feedback on what went wrong**: When buy phase is auto-skipped, no clear message explains why
4. **Unplayable game state**: After first purchase attempt fails, game becomes stuck

---

## Recommendations

### Immediate Actions
1. **Fix phase transition logic** - The `phase` field and `validMoves` array are contradictory. One is lying.
2. **Debug buy phase auto-skip** - Determine why buy phase sometimes auto-advances to cleanup
3. **Add state validation** - Before executing a move, verify phase consistency between `phase` field and `validMoves`
4. **Add debug logging** - Include current phase, previous phase, and expected phase in error messages

### Investigation Questions
- Why does `validMoves` contain buy-phase moves when `phase="action"`?
- What triggers the "auto-skip cleanup" behavior?
- Is there a race condition or state mutation happening between phases?
- Are there multiple sources of truth for phase state?

### Testing Notes for Developers
This test uncovered **blocking issues** that prevent the entire game from functioning. Before retesting CARD-003:
1. Verify that a simple game can complete 5+ turns with successful purchases
2. Verify that buy phase reliably executes and doesn't auto-skip
3. Verify that `phase` field matches what moves are valid
4. Only then retry Mine card testing with focus on treasure placement

---

## Conclusion

**RESULT**: FAIL - Test cannot be completed due to critical blocking bugs.

The test environment is currently **unplayable**. The game cannot execute purchases, making it impossible to acquire or test the Mine card's treasure upgrading mechanic. The phase transition logic has catastrophic bugs that must be fixed before any card-specific testing can proceed.

**Primary blockers for CARD-003**:
1. Cannot buy cards (phase error blocks all purchases)
2. Cannot acquire Mine (blocked by above)
3. Cannot test treasure placement mechanic (blocked by above)

**Recommendation**: Fix phase transition bugs first (they block the entire game), then retest CARD-003.
