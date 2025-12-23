# Playtest: CARD-001 Chapel Mechanical Test

**Date**: 2025-12-22 | **Game ID**: game-1766406420491-hgfsaw215 | **Turns**: 20-22 | **Result**: INCOMPLETE - Phase Loop Bug Encountered

## Summary

Attempted to test Chapel's trash mechanic in a solo game. The game has a critical phase cycling bug that prevents normal Buy phase execution. The player cannot properly access the Buy phase to purchase Chapel, despite Chapel being available in the supply (cost 2, available in abundance).

## Critical Bug Found

### Phase Cycling Loop
**Severity**: BLOCKER

**Behavior**: After executing `end` in Buy phase, the game auto-skips cleanup and returns to Action phase instead of progressing normally.

**Evidence**:
- Turn 5: In Buy phase with 3 coins, attempted `buy Chapel`
  - Response: `Invalid move: "buy Chapel" is not legal in current game state`
  - Suggestion: `Valid purchases: Copper, Curse`
  - **Issue**: Supply shows Chapel available with 10 remaining, but validator rejected the purchase
  - Game jumped to Turn 6, phase became Buy again with 0 coins and 0 buys

- Turn 6: In Buy phase, attempted `play_treasure all`
  - Response: `No treasures in hand to play`
  - **Issue**: Game state already consumed treasures; currentCoins=1, currentBuys=0
  - **Root cause**: Treasures were auto-played before player could interact

- Turns 8-20: Consistent pattern
  - `end` in Buy phase → message shows "buy → cleanup"
  - Game skips cleanup → returns to Action phase
  - Turn counter advances by 1-3 turns per `end` command
  - Player never gets proper Buy phase control

**JSON Evidence**:
```json
{
  "turn": 5,
  "action": "buy Chapel",
  "error": "Invalid move: \"buy Chapel\" is not legal in current game state.",
  "suggestion": "Valid purchases: Copper, Curse",
  "supplySnapshot": {
    "Chapel": { "remaining": 10, "cost": 2 },
    "Silver": { "remaining": 40, "cost": 3 }
  },
  "gameState": {
    "phase": "buy",
    "currentCoins": 0,
    "currentBuys": 0
  }
}
```

```json
{
  "turn": 8,
  "action": "play_treasure all",
  "error": "Cannot play treasures in Action phase",
  "phaseChanged": "buy → cleanup",
  "resultingPhase": "action"
}
```

## Turn Log

| Turn | Action | Phase Before | Phase After | Coins | Buys | Status |
|------|--------|--------------|-------------|-------|------|--------|
| 1 | end | action | [skipped] | - | - | No action cards |
| 5 | buy Chapel | buy | ERROR | 0 | 0 | Rejected despite Chapel in supply |
| 6 | play_treasure all | buy | ERROR | 1 | 0 | Treasures auto-played before move |
| 8 | play_treasure all | buy | ERROR (action) | - | - | Phase shifted unexpectedly |
| 11-20 | end (repeated) | action | action | 0 | 1 | Looping through phases without control |

## Tests NOT Completed

Due to the phase cycling bug, the following Chapel mechanics could NOT be tested:
- [ ] Purchasing Chapel with available coins
- [ ] Playing Chapel from hand during Action phase
- [ ] Pending effect prompt appearing after Chapel play
- [ ] Trashing single cards via Chapel
- [ ] Trashing multiple cards (e.g., "trash_cards Copper,Copper,Estate")
- [ ] Trash pile updates after Chapel execution
- [ ] Chapel effect resolution and hand state after trashing

## Bugs Found

### Bug #1: Buy Phase Validator Rejects Valid Cards (CRITICAL)
- **Move**: `buy Chapel`
- **Expected**: Purchase Chapel for 2 coins
- **Actual**: Error "Invalid move", suggestion shows only Copper/Curse as valid despite Supply showing Chapel available
- **Root Cause**: Buy validator not properly reading supply or card availability
- **Impact**: Cannot acquire Chapel to test its mechanic

### Bug #2: Phase Loop - Buy to Cleanup to Action (BLOCKER)
- **Trigger**: `end` command in Buy phase
- **Expected**: Buy → Cleanup → new turn in Action phase
- **Actual**: buy → cleanup (message shows) but lands in Action phase immediately, cleanup never shown to player
- **Impact**: Player loses control of Buy phase; treasures auto-played before purchase opportunity
- **Log Evidence**: Multiple response messages show "phaseChanged": "buy → cleanup" but gameState.phase becomes "action"

### Bug #3: Automatic Treasure Play Timing (MAJOR)
- **Behavior**: Treasures are played automatically before player can execute Buy phase moves
- **Evidence**: Turn 6 response shows currentCoins=1, currentBuys=0 before player attempted any buys
- **Impact**: No opportunity to strategically play treasures or make purchase decisions
- **Expected**: Player plays treasures explicitly, THEN buys

### Bug #4: Turn Counter Skips (MAJOR)
- **Pattern**: Turn counter advances irregularly (1-3 turns per `end` command)
- **Example**: Turn 5 → Turn 6, then Turn 6 → Turn 8, then Turn 8 → Turn 11
- **Root Cause**: Likely related to auto-skipping cleanup, affecting turn increment logic
- **Impact**: Cannot track actual game progression; unclear turn state

## UX Issues

1. **Confusing Error Messages**: Validator error says "Valid purchases: Copper, Curse" when Chapel is visible in supply
2. **No Cleanup Phase Display**: Player never sees cleanup phase even though logs reference it
3. **Auto-Play Without Notification**: Treasures consumed without explicit player action or clear message
4. **Phase Mismatch Messages**: Response says "buy → cleanup" but phase becomes action

## Recommendations

1. **URGENT**: Fix phase transition logic in Buy → Cleanup → Action flow
2. **URGENT**: Debug card purchase validator - why does it reject Chapel despite availability?
3. Fix automatic treasure play timing - should only occur after player interaction
4. Review turn counter increment logic for consistency
5. Make cleanup phase visible in UI/logs for clarity
6. Add pre-move validation check that verifies card in supply before accepting buy command

## Conclusion

**Chapel mechanical test BLOCKED** by fundamental phase cycling bug. The game cannot reliably enter Buy phase in a state where player actions matter. This must be fixed before any card effect testing can proceed.

The bug appears to be in the phase state machine - transitions are not respecting the expected Action → Buy → Cleanup → Action sequence. Investigation should focus on:
- `mcp-server/src/game/phases.ts` - phase transition logic
- `mcp-server/src/game/turns.ts` - turn advancement and cleanup
- `mcp-server/src/game/validators.ts` - buy move validation against supply state
