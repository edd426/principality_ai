# CLI Playtest: Exploratory Turn-Based Mode Testing

**Date**: 2025-12-26
**Seed**: mixed-test-0
**Edition**: mixed
**Duration**: Turn 1 - Turn 2 (game ended early due to bugs)
**Session Log**: `/tmp/cli-test-game.json.session.log` (4246 lines)

---

## Executive Summary

Exploratory playtest of the Dominion CLI in turn-based mode (`--init` and `--move` flags) revealed **critical bugs in turn progression and phase management**. The game exhibits immediate and severe issues that make normal gameplay impossible without workarounds.

**Severity**: CRITICAL - Game is unusable in current state
**Test Status**: BLOCKED - Multiple blockers prevent completing 20 turns

---

## Bug Detection

### Q1: Game initialized successfully?
**Answer**: YES

Game initialized correctly with:
- Correct seed (mixed-test-0)
- Correct edition (mixed)
- All 10 kingdom cards present
- Correct starting hand and resources
- Proper state file creation and session logging

### Q2: All moves executed without errors?
**Answer**: NO - Multiple critical failures

**Failures encountered:**
1. **Turn progression bug**: Playing treasures advances turns unexpectedly
2. **Phase management bug**: "End Phase" doesn't end the phase correctly
3. **Buys counter bug**: Showed as 0 in some states, then correct as 1
4. **Pending action state**: Workshop card leaves game in unresolvable state
5. **Move system incompleteness**: No UI for completing multi-step actions (gain_card)

### Q3: Any unexpected behavior?
**Answer**: YES - Multiple critical issues

---

## Detailed Bug Report

### BUG #1: Turn Progression Advances Unexpectedly (CRITICAL)

**Severity**: CRITICAL - Breaks core game flow
**Reproducibility**: 100% - happens on first move

**Description**:
When playing the first Copper in Turn 1's Buy Phase, the game advances to Turn 2 instead of staying in Turn 1.

**Reproduction steps**:
1. Initialize game with mixed-test-0 seed
2. End Action Phase (move "1")
3. Play first Copper (move "1")
4. Check game state

**Expected**: Still on Turn 1, Buy Phase, with coins incremented
**Actual**: Jumped to Turn 2, Action Phase

**Session log evidence**:
```
[Turn 1 Action Phase] → move "1" → [Turn 1 Buy Phase, coins=$0]
[Turn 1 Buy Phase, coins=$0] → move "1" (play copper) → [Turn 2 Action Phase, coins=$1]
[Turn 2 Action Phase] → move "1" → [Turn 2 Buy Phase, coins=$2]
[Turn 2 Buy Phase] → move "1" (play copper) → [Turn 2 Buy Phase, coins=$3]
```

**Root cause suspicion**: Turn counter increments on first action after phase transition, not on phase transition itself.

**Impact**: Impossible to complete a normal turn sequence. Game skips entire turns, making strategy planning impossible.

---

### BUG #2: End Phase Command Doesn't End Buy Phase (CRITICAL)

**Severity**: CRITICAL - Phase management failure

**Description**:
Running move "end" while in Buy Phase does not transition to Cleanup Phase as expected. Instead, the game remains in Buy Phase but with no moves available.

**Reproduction steps**:
1. Complete Buy Phase normally (play all treasures)
2. Execute move "end"
3. Check phase

**Expected**: Cleanup Phase begins
**Actual**: Still in Buy Phase (or enters another Buy Phase state)

**Session log shows**:
```
Turn 2 Buy Phase → move "end" → Turn 2 Buy Phase (same phase)
```

**Impact**: Players cannot manually advance through phases, breaking the turn-based flow.

---

### BUG #3: Buys Counter Shows Zero (MEDIUM)

**Severity**: MEDIUM - Confusing but doesn't block play

**Description**:
After playing certain treasures, the Buys counter shows "0" even though the player should have 1 buy available.

**Evidence from playtest**:
```
Turn 1: Buys: 1 (initial)
After playing Copper: Buys: 0  ← Should stay 1
Turn 2: Buys: 1  ← Correct again
```

**Expected behavior**: Buys counter should remain 1 until a purchase is made, then decrease to 0.
**Actual behavior**: Counter decreases after playing treasures, not purchases.

**Impact**: Confusing UI - users may think they can't buy anything when they actually can.

---

### BUG #4: Workshop Creates Unresolvable Pending State (CRITICAL)

**Severity**: CRITICAL - Soft lock / unrecoverable state

**Description**:
When Workshop is played, the system indicates "waiting for gain_card move" but:
1. No UI option is provided to complete the action
2. The CLI doesn't recognize `gain_card` command
3. Player can only escape by ending the phase, losing the action's effect

**Observation from earlier playtest**:
```
✓ Player 1 played Workshop (gain card up to $4, waiting for gain_card move)
Turn 12 | Player 1 | VP: 3 VP (3E) | Action Phase

Available Moves:
  [1] End Phase

[No option to complete the gain action]
```

**Why this matters**:
- Workshop is in the kingdom cards for this seed
- The card is unplayable without a workaround
- Turn-based CLI is supposed to be deterministic and discoverable; missing actions violate this

**Impact**: Game becomes unplayable if Workshop is in the kingdom.

---

### BUG #5: Session Log Not Created (MINOR)

**Severity**: MINOR - Documentation/audit issue

**Description**:
Initially, session logs were not being created. Later observations showed logs ARE being created (4246 lines captured), but this is inconsistent.

**Status**: RESOLVED - Session logs are working, documentation may be unclear

---

## UX Evaluation

### Q4: Phase Clarity (1-5)
**Score**: 2/5

**Comments**:
- Phase IS displayed clearly in header (e.g., "Buy Phase")
- BUT: Turn numbers are WRONG due to bugs, making phase display confusing
- Unexpected phase transitions (Action Phase appears when user expects Buy Phase)
- No clear indication when actions are pending (Workshop case)

---

### Q5: Move Clarity (1-5)
**Score**: 3/5

**Comments**:
- Available Moves are clearly numbered and described
- HOWEVER: Moves don't always do what expected (play treasure advances turn)
- Missing moves for multi-step actions (no way to provide gain_card)
- No indication that move "1" has different meanings in different phases (confusing)
  - In Action Phase: "End Phase"
  - In Buy Phase: "Play Copper" (or first available treasure)
  - This ambiguity causes the turn progression bug

---

### Q6: Feedback Clarity (1-5)
**Score**: 4/5

**Comments**:
- Successful moves show "✓ Player 1 [action]" which is clear
- Error messages exist and indicate failures
- Game state is displayed after each move (good for turn-based debugging)
- Missing: indication of move consequences (e.g., "Playing Copper will advance to next turn")

---

### Q7: Error Handling (1-5)
**Score**: 2/5

**Comments**:
- Invalid moves produce error messages
- HOWEVER: No recovery guidance (just "Invalid move command")
- Some errors are silent (Workshop pending state)
- No indication that turn has advanced (discovered only by reading state)
- Missing validation:
  - Should warn: "Playing this move will advance to Turn 2"
  - Should block: Playing treasures that will cause turn advancement

---

## Summary

**Overall UX Score**: 2.75/5 (Poor)

**Bugs Found**: 5 major bugs, 1 critical-tier, 2 blocking gameplay

**Recommendations**:

1. **IMMEDIATE FIX REQUIRED**: Debug turn progression logic
   - Turn counter should not increment on treasure play
   - Each move should have clearly defined effects
   - Consider adding `--verbose` flag to show what each move will do

2. **URGENT FIX REQUIRED**: Implement CLI interface for pending actions
   - Add `gain_card`, `discard_card`, `trash_card` commands
   - Document which cards require additional moves
   - Block moves that lead to unresolvable states

3. **HIGH PRIORITY**: Fix phase management
   - "End Phase" should reliably transition to next phase
   - Add explicit move options for phase transitions
   - Consider: `--end-action-phase` instead of ambiguous "1"

4. **MEDIUM PRIORITY**: Fix Buys counter
   - Counter should only decrease on purchases, not treasure play
   - Verify counter resets at start of each turn

5. **DOCUMENTATION**:
   - Update CLI help to explain turn-based mode limitations
   - Document which cards are incompatible with turn-based mode
   - Provide troubleshooting guide for pending states

---

## Game Log

**Turns completed**: 1 (partial)

Turn 1:
- Action Phase: No actions available (no action cards in starting hand)
- Buy Phase: Started with $0 coins
  - Played Copper → Turn advanced to Turn 2 (BUG)
  - Game became confused about turn state

Turn 2:
- Action Phase: No actions available
- Buy Phase: Started with coins
  - Continued playing treasures from Turn 1's cleanup
  - Bought Copper with no strategic value (low coins)
  - (Playtest terminated due to bugs blocking normal progress)

**Outcome**: Test blocked by critical bugs. Unable to reach turn 20 target.

---

## Recommendations for Next Playtest

1. **Focus**: Debug turn progression before testing strategy
2. **Approach**: Implement explicit move format for each phase:
   - Action Phase: `--move="end-action"`
   - Buy Phase: `--move="end-buy"` instead of generic "1"
3. **Test cards**: Skip action cards initially (Chapel, Smithy, Village, Workshop, etc.)
4. **Session log**: Use session log actively to verify each move's effect
5. **Blockers**: Document which cards are currently unplayable (Workshop)

---

## Technical Notes

**CLI Command Format**:
```bash
# Initialize
node packages/cli/dist/index.js --seed=mixed-test-0 --edition=mixed --init --state-file=/tmp/game.json

# Execute move
node packages/cli/dist/index.js --state-file=/tmp/game.json --move="1"
node packages/cli/dist/index.js --state-file=/tmp/game.json --move="buy Silver"
node packages/cli/dist/index.js --state-file=/tmp/game.json --move="end"
```

**Session Log Location**: `<STATE_FILE>.session.log`
- Created automatically
- Contains full execution history with timestamps
- Useful for debugging move ordering issues

**Edition**: MUST use `--edition=mixed` for cards like Workshop, Chapel, Cellar, etc.
- Default (2E) excludes 1E cards
- Many kingdom cards unavailable without `mixed` edition

---

## Conclusion

The turn-based CLI mode shows promise for automated testing but currently has critical bugs that make it unsuitable for gameplay testing. The turn progression bug is a fundamental flaw that affects every game session.

**Recommendation**: Do not use for gameplay testing until critical bugs are fixed. Suitable only for unit-level interface testing at this time.

**Priority**: CRITICAL - Fix turn progression and phase management bugs before next test cycle.
