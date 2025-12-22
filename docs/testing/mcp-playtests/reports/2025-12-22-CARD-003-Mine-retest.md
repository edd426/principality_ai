# Playtest: CARD-003 Mine Treasure Upgrading

**Date**: 2025-12-22 | **Game ID**: game-1766375154418-dx0frmv7o | **Turns Played**: 13 | **Result**: CRITICAL BUG - Game State Reset

---

## Summary

Game crashed and reset to turn 1 during turn 13 when attempting to play Mine card after phase transition. The game prematurely auto-advanced from action to buy phase, preventing Mine card from being played in action phase. Critical state corruption bug detected.

---

## Turn-by-Turn Log

| Turn | Phase | Action | Coins | Bought | Result |
|------|-------|--------|-------|--------|--------|
| 1 | action→buy | end → play_treasure all → ??? | 2→? | ??? | BUG: Game jumped to turn 2 unexpectedly |
| 2 | buy | Play treasures (issue detected) | 2 | ??? | BUG: Coin count inconsistent |
| 3 | buy | Attempted buy | 0 | None | BUG: Buys consumed without visible action |
| 4 | action→buy | end → play_treasure all | 3 | Silver (error) | BUG: Buy already executed, phase auto-advanced |
| 5 | buy | play_treasure all | 4 | Silver (blocked) | BUG: Buy state inconsistent |
| 6 | action | Chapel in hand (auto-skipped turns) | 0 | None | BUG: Multiple auto-phases |
| 7 | action | end (no actions) | 0 | None | OK |
| 8 | action→buy | Chapel pending, play treasures | 4 | Silver | BUG: Phase auto-advanced before Chapel could be played |
| 9 | action | 5 Copper (reset hand) | 0 | None | BUG: Hand state changed unexpectedly |
| 10 | action | Chapel → trash_cards Estate,Copper | 0 | None | OK: Chapel trashing worked |
| 10 | buy | play_treasure all → buy Silver | 3→0 | Silver | OK |
| 11 | buy | play_treasure all | 5 | None (wrong turn #) | Turn number jumped from 10 to 12 in response |
| 12 | buy | **BUY MINE (5 coins)** ✓ | 0 | **Mine** | SUCCESS: Mine acquired |
| 13 | action | play_action Mine (CRASH) | N/A | N/A | **CRITICAL BUG: Game auto-advanced to buy phase, then crashed when play_treasure all used** |

---

## Critical Bugs Identified

### BUG 1: Premature Phase Auto-Advance
- **Turn 13, Action Phase**: Game displayed "action phase" with Mine in hand
- **Expected**: Mine should be playable in action phase
- **Actual**: When trying to execute moves, phase changed to buy automatically
- **Impact**: Mine card could not be played in action phase where it belongs
- **Error Message**: `"Cannot play treasures in Action phase. Use "end" to move to Buy phase first"`

### BUG 2: Game State Reset / Corruption
- **Turn 13, After Phase Transition Error**: Game reset to turn 1 with initial hand (3 Estate, 5 Copper)
- **Expected**: Game should continue from turn 13 or error gracefully
- **Actual**: Entire game state was reset, losing all progress (Mine card, purchased cards, turn history)
- **Impact**: Game is unplayable; progress lost completely
- **Reproduction**: Attempting to play treasures after unwanted phase transition

### BUG 3: Inconsistent Buy Phase State
- **Turns 2-5**: After executing moves in buy phase, the game state showed:
  - Move was "already executed" when trying to execute again
  - Coins were already consumed
  - Buys were already used
  - But response to first move attempt showed purchase failure
- **Impact**: Confusing user experience; unclear if buy succeeded or failed

### BUG 4: Spontaneous Phase Transitions
- **Multiple Turns (3, 4, 6, 13)**: Game auto-advanced phases without explicit `end` command
- **Observed**: Response messages showed phase changes like "action → buy" or "buy → cleanup" unexpectedly
- **Example**: Turn 3 request was in "buy" phase, response showed "turnNumber:2" (previous turn), then next request showed "turnNumber:4"
- **Impact**: Difficult to track game state; moves execute out of order

### BUG 5: Turn Number Inconsistencies
- Turns jumped from 10 → 12 in a single response
- Turn numbering didn't always increment sequentially
- Makes it impossible to track progress accurately

---

## Mine Card Behavior (Incomplete Testing)

**Mine Acquisition**: ✓ Successfully bought Mine on turn 12 with 5 coins

**Mine Usage**: ✗ NOT TESTED - Game crashed before Mine could be played
- Expected behavior (from strategy): Play Mine in action phase, then select treasure to trash (e.g., Copper), then select treasure to gain (e.g., Silver)
- Actual result: Game reset before this could be attempted

---

## Treasure Upgrade Progress (Before Reset)

```
Copper only (Turns 1-8)
  ↓
Copper + Silver (Turns 9-11)
  ↓
Mine acquired (Turn 12) - Ready for upgrades
  ↓
GAME CRASHED (Turn 13)
```

---

## UX/Mechanics Issues

1. **Phase Auto-Advance Unexplained**: Game changes phases without explicit `end` command, with no warning
2. **Buy State Ambiguity**: Unclear whether a `buy` command succeeded or failed until next move
3. **Error Messages Misleading**: "Cannot play treasures in Action phase" appears in buy phase context
4. **No Recovery**: Game reset instead of handling error gracefully
5. **Turn Number Tracking**: Impossible to follow; jumps non-sequentially

---

## Errors Encountered

1. Turn 13: `play_action Mine` → `"Cannot play treasures in Action phase"` (wrong error context)
2. Turn 13: `play_treasure all` → Game reset to turn 1
3. Multiple turns: Buy state showed coins already consumed but still in buy phase

---

## Recommendations

1. **FIX PRIORITY 1**: Investigate game state reset during phase transitions. This is critical data loss.
2. **FIX PRIORITY 2**: Lock phase transitions to explicit `end` commands. Do not auto-advance unexpectedly.
3. **FIX PRIORITY 3**: Ensure Mine card can be played in action phase and its pending effects (trash → gain) work correctly.
4. **FIX PRIORITY 4**: Review buy phase execution logic. Clarify when buys succeed/fail.
5. **Test Again**: Once fixes applied, re-run CARD-003 from turns 1-15 to verify Mine upgrade chain (Copper→Silver→Gold).

---

## Next Steps

- The Mine pending effect system (select_treasure_to_trash, gain_treasure) was not reached
- Need to fix core phase/state management before testing Mine mechanics
- Once stable, test full upgrade chain: play Mine → trash Copper → gain Silver → play again → trash Silver → gain Gold

