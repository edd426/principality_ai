# Playtest: CARD-010 Festival Economy

**Date**: 2025-12-22 | **Game ID**: game-1766375228520-raeq1xnjl | **Turns**: 6 (aborted) | **Result**: CRITICAL BUG - State Corruption

## Summary

Game session encountered critical state management bug where phase transitions caused gameState rollback/corruption. After successfully executing moves in buy phase (Turn 6), subsequent move in same phase failed with error "Cannot play treasures in Action phase" and gameState rolled back to Turn 1, losing all progress.

## Turn Log

| Turn | Phase Sequence | Status | Notes |
|------|----------------|--------|-------|
| 1 | action → end | SUCCESS | Ended action phase (no action cards) |
| 1-2 | buy phase attempt | FAILED | Sent `play_treasure all`, got phase error response |
| 2-3 | auto-advance | UNCLEAR | Game advanced turns without explicit moves |
| 4 | action phase | SUCCESS | Chapel drawn in hand, executed `play 3` (Chapel) successfully |
| 6 | buy phase (post-Chapel) | FAILED | Sent `play_treasure all` after Chapel play, got error + state rollback to Turn 1 |

## Moves Attempted

1. **Turn 1, Action Phase**: `end` → SUCCESS
   - Response: Transitioned to buy phase, hand = 5 Copper, coins = 0
   - validMoves showed play_treasure options

2. **Turn 1, Buy Phase**: `play_treasure all` → FAILED
   - Error: "Cannot play treasures in Action phase"
   - Expected: Should play treasures in buy phase
   - Got: Error message referring to wrong phase

3. **Turn 4, Action Phase**: `play 3` → SUCCESS
   - Executed Chapel at index 3
   - Response: Jumped to Turn 6 buy phase with gameState = {Silver:1, Copper:3, coins:1}

4. **Turn 6, Buy Phase**: `play_treasure all` → CRITICAL FAILURE
   - Sent command while in buy phase
   - Error: "Cannot play treasures in Action phase"
   - gameState response showed: phase="action", turnNumber=1 (ROLLBACK)
   - New game seed generated (game-1766375250585-j825wfckb)

## Bugs Found

### CRITICAL BUG #1: State Rollback on Invalid Treasure Play
- **Severity**: CRITICAL (game unplayable)
- **Trigger**: Send `play_treasure all` in buy phase after certain action plays
- **Symptom**:
  - Move fails with phase error
  - gameState rolls back from Turn 6 to Turn 1
  - Hand changes: {Silver:1, Copper:3} → {Copper:4, Estate:1}
  - All progress lost
- **Steps to Reproduce**:
  1. Start game
  2. End Turn 1 action phase
  3. Eventually reach Turn 4 action phase with Chapel
  4. Play Chapel with `play 3`
  5. System advances to Turn 6 buy phase
  6. Send `play_treasure all`
  7. Observe: Error + rollback to Turn 1

### BUG #2: Phase State Inconsistency
- **Severity**: HIGH (prevents treasure playing)
- **Issue**: After `end` command in action phase (Turn 1), subsequent response showed buy phase was available, but then error claimed we were in action phase
- **Context**: May be related to response deserialization or phase transition logic

### BUG #3: Game State Deserialization Error
- **Severity**: MEDIUM (confusing UX)
- **Issue**: Index validation failed with message "Must be 0--1" (malformed range string)
- **When**: After first `play 0` attempt on Turn 3
- **Suggests**: Off-by-one error or negative index in validation logic

## Turn Flow Analysis

The game appears to be auto-advancing turns without explicit player moves between Turns 1-6. After `play 3` (Chapel) succeeded, response jumped from Turn 4 action to Turn 6 buy, skipping Turn 5 entirely. This suggests either:
- Auto-phase transitions are happening unexpectedly
- Cleanup phase is triggering automatic turn advancement
- Response gameState is not reflecting actual server state

## Strategy Notes

Festival card was available in supply (cost 5), but game became unplayable before reaching the 5+ coins milestone needed to purchase it.

## Recommendations

1. **Immediate**: Debug phase transition logic - `play_treasure all` should not fail in buy phase
2. **Urgent**: Prevent gameState rollback - when a move fails, don't mutate server state
3. **High**: Verify auto-phase advancement - turns 2-3 appear to have been skipped
4. **High**: Fix index validation error message format (0--1 should be 0-4 or similar)
5. **Medium**: Clarify expected behavior for batch treasure command (`play_treasure all`)

## Game Metadata

- **Scenario**: CARD-010 (Festival Economy - test buying & using Festival)
- **Kingdom Cards Selected**: Woodcutter, Moneylender, Workshop, Cellar, Remodel, Moat, Chapel, Council Room, Festival, Village
- **Starting Deck**: 7 Copper, 3 Estate (per Dominion rules)
- **Test Purpose**: Verify Festival card mechanics (+2 actions, +1 buy, +2 coins during action phase)
- **Result**: BLOCKED - Could not reach Festival purchase due to state corruption
