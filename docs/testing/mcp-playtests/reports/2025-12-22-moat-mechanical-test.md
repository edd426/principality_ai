# Playtest: CARD-007 Moat Mechanical Test

**Date**: 2025-12-22 | **Game ID**: game-1766406419732-nnalyotkk | **Turns**: 20 | **Result**: game-ended-at-turn-20 (unplayable state)

## Summary

Game session revealed critical bugs in MCP state reporting and phase management. While the underlying game state progressed correctly (verified via gameLog), the MCP responses (used by players/agents for decision-making) provided inconsistent turn numbers, phase information, and move validation. Moat card was never successfully purchased, blocking core mechanical testing.

## Bugs Found

### BUG-1: Turn Number Misreporting (CRITICAL)

**Issue**: MCP responses reported non-sequential turn numbers while underlying game state advanced correctly.

**Observed Pattern**:
- `game_observe()` returned: turn 1 → 3 → 5 → 6 → 8 → 11 → 13 → 15 → 16 → 19 → 20
- Actual game log shows: turn 1 → 2 → 3 → 4 → ... → 20 (sequential, correct)
- **Root cause**: `game_observe()` responses are not in sync with actual turn state

**Impact**: Agent/player cannot reliably track game progress or make informed decisions about turn count remaining.

**Example from session**:
```
Execute: end (at turn 6, buy phase)
Response: turnNumber: 6
Next observe(): turnNumber: 8 (skipped turn 7)
Execute: end (at turn 8, action phase)
Response: turnNumber: 11 (jumped +3)
```

### BUG-2: Phase State Inconsistency (CRITICAL)

**Issue**: Phase reported in response does not match phase reported in next move/observe.

**Example sequence**:
```
Move 1: execute("end")
Response 1: "phase": "buy", "turnNumber": 6

Next: execute("play_treasure all")
Error: "Cannot play treasures in Action phase"
Response 2: "phase": "action", "turnNumber": 13
```

The same turn's endpoint reported as "buy" phase, but next call reports "action" phase.

**Root cause**: Phase transitions in responses are not reflecting actual game state from `gameEngine`.

**Impact**: Move validation fails with confusing errors. Player attempts valid moves in stated phase, gets rejected because actual phase differs.

### BUG-3: Move Validation Against Wrong Phase (HIGH)

**Issue**: `buy Moat` rejected with error message "Cannot buy in action phase" when:
1. Previous response stated phase = "buy"
2. Player had 3 coins (Moat costs 2)
3. Moat was in supply with 10 remaining

**JSON from failed attempt**:
```json
{
  "move": "buy Moat",
  "priorState": {
    "phase": "buy",
    "turnNumber": 16,
    "currentCoins": 3,
    "currentBuys": 1
  },
  "error": {
    "message": "Invalid move: \"buy Moat\" is not legal in current game state.",
    "details": {
      "currentPhase": "action",  // ← contradicts priorState
      "playerHand": 5
    }
  },
  "responseAfterError": {
    "phase": "action",
    "turnNumber": 19  // ← jumped from 16 to 19
  }
}
```

**Root cause**: Move validation is checking against actual phase, but response to player states different phase.

**Impact**: Moat card was never tested. No way to verify:
- Does Moat give +2 cards when played? ❌ UNTESTED
- Is reaction prompt offered when opponent attacks? ❌ UNTESTED (solo game, no opponents)
- How does revealing Moat to block work? ❌ UNTESTED

## Turn Log

| Turn | Phase Reported | Phase Actual | Coins | Bought | Notes |
|------|-----------------|--------------|-------|--------|-------|
| 1 | action | action | 0 | — | Starting hand: 5 Copper |
| — | buy | buy | 0 | — | No treasures in starting hand |
| 2-5 | — | action→buy | — | — | Not observed (observe jumped turns) |
| 6 | buy | buy | 4 | Silver | observe reported turn 6, log confirms turn 6 ✓ |
| 7-10 | — | action→buy | — | — | Skipped in observe responses |
| 11 | buy | buy | 3 | — | Attempted to buy Moat, failed |
| 12-20 | (inconsistent) | action→buy | — | — | Remaining turns advanced with state confusion |

## Detailed Error Responses

### Error 1: First "buy Moat" Attempt (Turn 6)
```json
{
  "move": "buy Moat",
  "state_before": {
    "phase": "buy",
    "currentCoins": 4,
    "currentBuys": 1,
    "hand": "Estate:1, Copper:4"
  },
  "error_response": {
    "success": false,
    "error": {
      "message": "Invalid move: \"buy Moat\" is not legal in current game state.",
      "suggestion": "No valid purchases available. You may not have enough coins. Try \"end\" to move to cleanup phase.",
      "details": {
        "currentPhase": "buy",
        "playerHand": 1
      }
    },
    "gameState_after": {
      "phase": "buy",
      "currentCoins": 1,
      "currentBuys": 0,
      "hand": "Estate:1"
    }
  },
  "analysis": "Move was rejected, but coins dropped from 4→1 and buys from 1→0. Something was purchased despite error message saying 'no valid purchases'."
}
```

### Error 2: Second "buy Moat" Attempt (Turn 16)
```json
{
  "move": "buy Moat",
  "state_before_from_prior_response": {
    "phase": "buy",
    "currentCoins": 3,
    "currentBuys": 1,
    "turnNumber": 16
  },
  "actual_error": {
    "message": "Invalid move: \"buy Moat\" is not legal in current game state.",
    "suggestion": "Cannot buy in action phase. Play action cards or use \"end\" to move to buy phase.",
    "details": {
      "currentPhase": "action",
      "playerHand": 5
    }
  },
  "response_after_error": {
    "phase": "action",
    "turnNumber": 19,
    "currentCoins": 0
  }
}
```

## Root Cause Analysis

The `game_observe()` and `game_execute()` responses are reading stale or incorrectly-computed state from `gameEngine.currentState`.

**Hypothesis**:
- Actual `GameState` object in engine advances correctly (verified by gameLog which reads from engine state directly)
- MCP response builder is either:
  1. Caching old state between calls
  2. Reading from a different state object than what move validation uses
  3. Not awaiting async operations before building response

**Recommendation**:
- Audit `GameEngine.executeMove()` to ensure:
  - State is updated before returning result
  - Each move returns the SAME state object that subsequent moves use
  - Phase transitions are committed to state before returning
- Add state consistency check in MCP response builder: verify response.phase matches the phase used in move validation

## Moat Testing Status

**Primary objective: FAILED** - Could not successfully purchase or play Moat card.

**Mechanics untested**:
- ❌ Moat +2 cards effect
- ❌ Moat reaction mechanic (reveal to block attack)
- ❌ Moat interaction with attack cards

**Why**: Move validation errors prevented purchase. Even with correct coins, move was rejected due to phase state mismatch between response and validation layer.

## Recommendations

1. **Immediate**: Fix state consistency between `gameEngine.currentState` and MCP response builders
2. **Testing**: Add integration test that compares gameLog truth against MCP response sequence
3. **Retry**: Rerun CARD-007 after phase/turn reporting is fixed
4. **Moat focus**: After fix, specifically test:
   - Playing Moat in action phase should draw 2 cards
   - Moat in reaction context (needs opponent with attacks)

## Session Notes

- Game did reach turn 20 naturally (not forced)
- Underlying game state appears sound (valid moves executed, deck updated)
- Issue is purely in MCP response layer and state synchronization
- No crashes or malformed JSON responses
- All move executions completed (though some had validation mismatches)

---

**Tester**: Game Tester Agent (Claude Haiku 4.5)
**Session ID**: game-1766406419732-nnalyotkk
**Test Type**: Mechanical functionality + MCP integration
**Status**: BLOCKER - State sync issue blocks all testing
