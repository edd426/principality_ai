# Playtest: CARD-002 - Cellar Mechanical Test

**Date**: 2025-12-22 | **Game ID**: game-1766406419755-dj6jwvb5a | **Turns Played**: 22 | **Result**: Incomplete - Critical bugs encountered

## Summary

Attempted to test Cellar card mechanics (discard + draw effects), but encountered critical state management bugs that prevented proper testing. The `play_treasure all` command and individual `play` commands in buy phase repeatedly triggered invalid phase errors and caused unintended turn advancement.

## Test Objectives

1. Purchase Cellar (cost 2) in early game
2. Play Cellar in action phase to trigger pending effect
3. Test discard mechanics with multiple cards
4. Verify draw happens after discard
5. Confirm action count preservation (+1 action from Cellar)

## Critical Bugs Found

### BUG #1: play_treasure all Causes Phase Jump and Error

**Trigger**: Executed `play_treasure all` when in buy phase (turn 13)

**Expected**: Treasures should be played, coins calculated, stay in buy phase

**Actual**:
- Command rejected with error: "Cannot play treasures in Action phase"
- Game state jumped from turn 13 → turn 15 (action phase)
- Response showed conflicting phase information

**Error Response**:
```json
{
  "success": false,
  "error": {
    "message": "Cannot play treasures in Action phase.",
    "suggestion": "Use \"end\" to move to Buy phase first, then play treasures."
  },
  "gameState": {
    "phase": "action",
    "turnNumber": 15,
    "hand": {"Estate": 1, "Copper": 3, "Silver": 1},
    "currentCoins": 0
  }
}
```

**Pattern**: This occurred multiple times:
- Turn 7 buy phase → `play_treasure all` → Error → Turn 9 action phase
- Turn 13 buy phase → `play_treasure all` → Error → Turn 15 action phase
- Turn 17 buy phase → `play 0` (treasure) → Error → Turn 19 action phase

**Severity**: CRITICAL - Prevents normal buy phase gameplay

---

### BUG #2: Misleading Phase Error in Buy Phase

**Trigger**: System reports "Cannot play treasures in Action phase" when response shows we're already in action phase

**Issue**: The error message suggests transitioning to buy phase, but the game state shows we're already in action phase. This is confusing for player decision-making.

**Root Cause Hypothesis**: The `play_treasure` commands may be executing during an invalid internal state, or there's a phase transition bug in the command parser.

---

### BUG #3: Turn Counter Advancing Unexpectedly

**Pattern Observed**:
- Most buy phase commands caused +2 turn advancement
- Turn 13 → Issue → Turn 15 (consistent)
- Turn 7 → Issue → Turn 9 (consistent)
- Turn 17 → Issue → Turn 19 (consistent)

**Severity**: HIGH - Makes the game unplayable as turns advance too quickly and no purchases occur

---

## Turn Log

| Turn | Attempted Move | Result | Notes |
|------|---|---|---|
| 1 | `end` (action) | ✓ Success | Moved to buy phase |
| 1 | `play_treasure all` | ✗ Error + Jump | "Cannot play treasures in Action phase" - turned 1→5 |
| 5 | `game_observe` | ✓ Success | Confirmed buy phase, 3 coins, Cellar in supply |
| 5 | `buy Cellar` | ✗ Error | "Invalid move: buy Cellar is not legal" - turn 5→6 |
| 6 | `end` (buy) | ✓ Success | Moved to cleanup |
| 7 | `end` (action) | ✓ Success | Moved to buy phase |
| 7 | `play_treasure all` | ✗ Error + Jump | Phase error - turn 7→9 |
| 9 | `end` (action) | ✓ Success | Moved to buy phase |
| 13 | `play_treasure all` | ✗ Error + Jump | Phase error - turn 13→15 |
| 15 | `end` (action) | ✓ Success | Moved to buy phase |
| 17 | `play 0` (treasure) | ✗ Error + Jump | Invalid move - turn 17→19 |
| 19 | `end` (action) | ✓ Success | Moved to cleanup |
| 21+ | Game continued auto-advancing | Stopped at turn 21 | Exceeded turn 20 limit |

## Cellar Card Status

**Good News**: Cellar WAS successfully added to the kingdom supply:
- Confirmed in `game_observe` output on turn 5
- Kingdom cards: ["Remodel", "Moneylender", "Chapel", "Throne Room", "Smithy", "Moat", "Mine", "Cellar", "Bureaucrat", "Militia"]
- Supply remaining: 10 copies

**Could Not Test**: Never successfully purchased Cellar due to buy phase errors

## Recommendations

1. **Investigate buy phase command handler**: The `play_treasure` and `play` commands are causing unexpected phase transitions when executed in buy phase.

2. **Check phase state management**: Verify that phase transitions are atomic and don't skip phases or advance turns unexpectedly.

3. **Add command validation before execution**: Validate that the command is legal in the current phase before executing (not after).

4. **Retry test after fixes**: Once phase transitions are fixed, re-run CARD-002 to test actual Cellar mechanics (pending effect, discard, draw).

## Files to Check

- `/packages/core/src/game-engine.ts` - executeMove() method
- `/packages/mcp-server/src/handlers/` - Buy phase command handlers
- `/packages/core/src/phases/` - Phase transition logic

## Test Status

**BLOCKED**: Cannot proceed with Cellar mechanics testing until buy phase command execution is fixed.
