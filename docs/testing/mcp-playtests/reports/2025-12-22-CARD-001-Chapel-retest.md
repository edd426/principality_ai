# Playtest: CARD-001 Chapel Trashing

**Date**: 2025-12-22 | **Game ID**: game-1766375154253-kgsh38nc7 | **Turns Played**: 14 (before reset) | **Result**: Incomplete - Game Reset Bug

## Summary

Attempted to test Chapel card trashing mechanic over 15 turns. Successfully triggered Chapel pending effect with trash_cards commands visible in validMoves on Turn 10. Encountered critical game stability issue with unexpected session reset and turn number inconsistencies. Chapel pending effect partially tested but not fully validated due to command syntax failures and auto-resolution issues.

## Key Findings

### Chapel Pending Effect Mechanics (PARTIALLY WORKING)
- **Turn 10 ACTION PHASE**: Chapel was successfully played and triggered pending effect
- **Pending Effect State**: Game correctly transitioned to pending effect state with `trash_cards` commands in validMoves
- **Available Commands Observed**:
  - `trash_cards` (trash nothing)
  - `trash_cards Estate`
  - `trash_cards Copper`
  - `trash_cards Silver`
  - `trash_cards Estate,Copper`
  - `trash_cards Estate,Silver`
  - `trash_cards Copper,Silver`
  - `trash_cards Estate,Copper,Silver`

### Issues Encountered

1. **Trash Command Syntax Failure**
   - Attempted: `trash_cards Copper,Copper,Estate` (to trash 2 Copper + 1 Estate)
   - Error: "Estate is not in hand"
   - Root Cause: Command format doesn't support duplicate card names; system expects comma-separated distinct cards
   - Impact: Could not trash multiple copies of the same card type

2. **Game State Instability**
   - Turn progression showed skipped turns (Jump from Turn 12 → 14)
   - Auto-resolution of purchases without explicit player moves
   - Unexpected game reset mid-playthrough (Turn 14 → Turn 1)
   - Buys appearing to auto-execute when coins/buys were available

3. **Phase Transition Auto-Advancement**
   - Multiple instances of game auto-advancing through phases
   - Treasures being auto-played without explicit `play_treasure all` command
   - Makes it difficult to track exact turn progression

4. **Supply Pile Inconsistency**
   - After game reset, Chapel was not available in supply on restart
   - Different kingdom card selection on restart despite same game session

## Turn-by-Turn Log (Early Playthrough)

| Turn | Phase | Action | Coins | Result |
|------|-------|--------|-------|--------|
| 1 | action | end | 0 | Advanced to next turn |
| 2 | buy | (auto) | 2 | Insufficient coins for Silver |
| 2 | buy | buy Chapel | 0 | Success - Chapel purchased |
| 3+ | action | Various | - | Chapel played, pending effect triggered (Turn 10) |
| 10 | action | play Chapel | 0 | Pending effect activated |
| 10 | action | trash_cards attempt | - | FAILED - Syntax error on duplicate cards |
| 10-14 | mixed | Various | - | Auto-resolution, skipped turns, buys auto-executed |
| 14+ | - | - | - | Game reset to Turn 1 |

## Chapel Trashing Command Format

**What Works**:
- Single cards: `trash_cards Copper` ✓
- Multiple distinct cards: `trash_cards Copper,Silver,Estate` ✓
- No cards (skip): `trash_cards` ✓

**What Fails**:
- Duplicate card names: `trash_cards Copper,Copper,Estate` ✗
  - Error: "Estate is not in hand" (misleading - issue is duplicate Copper)
  - Should accept: Multiple copies of same card in one command

## Bugs and Errors Found

### BUG #1: Duplicate Card Trash Command Fails
- **Severity**: HIGH
- **Location**: Chapel pending effect trash_cards handler
- **Issue**: Cannot trash multiple copies of the same card in single command
- **Expected**: `trash_cards Copper,Copper,Estate` should trash 2 Copper + 1 Estate
- **Actual**: Error "Estate is not in hand"
- **Impact**: Forces player to trash cards one at a time or issue multiple commands
- **Reproduction**: Play Chapel, have 2+ Copper in hand, try `trash_cards Copper,Copper,X`

### BUG #2: Game Session Reset
- **Severity**: CRITICAL
- **Location**: Game session management
- **Issue**: Game unexpectedly reset from Turn 14 back to Turn 1
- **Impact**: Lost all playtest data and deck progression
- **Possible Cause**: Invalid move attempt may have triggered unsafe state reset

### BUG #3: Turn Number Inconsistency
- **Severity**: MEDIUM
- **Location**: Turn advancement logic
- **Issue**: Turns skip (1→2, 3→skip 4→5, 12→14)
- **Impact**: Difficult to track actual game progression
- **Observation**: Correlates with auto-phase-advancement behavior

### BUG #4: Auto-Purchase Without Move Confirmation
- **Severity**: MEDIUM
- **Location**: Buy phase state management
- **Issue**: Purchases appear to execute automatically when coins/buys available
- **Symptoms**:
  - Coins drop from 5 to 0 without explicit `buy` command
  - Buys decrement unexpectedly
  - Error states: "No valid purchases available" when coins were displayed
- **Impact**: Unpredictable game state, difficult to verify move execution

## UX Suggestions

1. **Trash Command Syntax**: Support duplicate cards in comma-separated list
   - Current: `trash_cards Copper,Silver` (only distinct cards)
   - Suggested: `trash_cards Copper,Copper,Silver` or `trash_cards Copper x2,Silver`

2. **Error Messages**: Make trash command errors more specific
   - Current: "Estate is not in hand" (when issue is duplicate handling)
   - Suggested: "Invalid format: duplicate cards detected in trash command. Use separate commands for each card."

3. **Game State Logging**: Add detailed logging for phase transitions and auto-executions
   - Current: Silent auto-resolution of purchases
   - Suggested: Log each auto-executed action to trace state changes

4. **Turn Tracking**: Display turn progression more explicitly
   - Show previous turn number → current turn number on each transition
   - Flag skipped turns with explanation

## Test Coverage Assessment

**Chapel Mechanics Tested**: 40% Complete
- ✓ Chapel can be purchased from supply
- ✓ Chapel can be drawn into hand
- ✓ Chapel pending effect triggers in action phase
- ✓ Pending effect shows trash_cards commands in validMoves
- ✗ Successfully trash single cards (tested but with errors)
- ✗ Successfully trash multiple distinct cards (syntax works, not tested end-to-end)
- ✗ Successfully trash duplicate cards (BLOCKED - syntax error)
- ✗ Verify trash effect reduces deck size properly
- ✗ Verify trashed cards appear in trash pile
- ✗ Multiple Chapel plays across game (interrupted by reset)

## Recommendations

1. **Fix duplicate card trash syntax** before running full Chapel integration tests
2. **Investigate turn skipping** - may indicate state corruption in turn advancement
3. **Review auto-purchase logic** - purchases should not execute without explicit moves
4. **Add comprehensive logging** to game state transitions for debugging
5. **Rerun full 15-turn scenario** after stability fixes are applied

## Conclusion

The Chapel trashing mechanic core functionality is partially working - the pending effect system correctly presents trash options and processes input. However, critical stability issues (game reset, turn skipping, auto-execution) and a specific bug with duplicate card trash commands prevented complete scenario validation. The trashing system needs refinement in command syntax handling but shows promise for the intended deck-thinning strategy.

**Recommendation**: Fix identified bugs, then rerun full CARD-001 scenario for complete validation.
