# Playtest: CARD-008 Council Room Draw

**Date**: 2025-12-22 | **Game ID**: game-1766375228694-i7fnz5u0p | **Turns**: 16 | **Result**: Completed

---

## Summary

Test attempted to verify Council Room card mechanics (cost 5, +4 cards, +1 buy, opponent draws 1). Game progressed 16 turns with player building treasure deck. Council Room card WAS present in supply but was never purchased due to game phase state management issues and rapid auto-advancement through turns.

---

## Observations

### Game State Issues
1. **Phase Auto-Advancement**: Game frequently auto-skipped from buy phase to cleanup to next action phase without explicit player moves
2. **Turn Number Jumps**: Turn numbers jumped irregularly (e.g., Turn 3 → Turn 4 → Turn 5 → Turn 6 → Turn 7 → Turn 8 skipped → Turn 9)
3. **Cleanup Phase Auto-Skip**: Cleanup phase consistently auto-skipped, jumping directly to next turn's action phase
4. **Move Validation Errors**: Received error "Cannot play treasures in action phase" when game state showed buy phase in previous response

### Treasure Acquisition
- **Turn 6**: First Silver card acquired (visible in hand: Estate x2, Silver x1, Copper x2)
- **Turn 14**: Had Copper x3, Silver x1, Estate x1 in buy phase (5 coins possible = enough for Council Room)
- **Turn 16**: Final state shows 4 coins available, mixed hand of Copper x4, Estate x1

### Council Room Availability
- **Supply Confirmed**: Council Room was present in supply with cost 5 and 10 copies available
- **Never Purchased**: Player never successfully bought Council Room despite reaching 5+ coins multiple times
- **Reason**: Game state management prevented clean buy phase execution before auto-advancing

### Turn Log Summary

| Turn | Phase | Hand Composition | Coins Generated | Action |
|------|-------|------------------|-----------------|--------|
| 3 | action | Copper x5 | 0 | end → auto-cleanup → Turn 4 |
| 4 | action | Copper x3, Estate x2 | 0 | end → auto-cleanup → Turn 5 |
| 5 | action | Copper x4, Estate x1 | 0 | end → auto-cleanup → Turn 6 |
| 6 | action | Estate x2, Silver x1, Copper x2 | 0 | end → auto-cleanup → Turn 7 |
| 7 | action | Copper x4, Estate x1 | 0 | end → buy → play_treasure attempted |
| 8 | buy | Copper x2, Silver x1, Estate x1 | 1 (1 Copper played) | auto-advanced |
| 9 | action | Estate x1, Copper x3, Silver x1 | 0 | end → auto-cleanup → Turn 11 |
| 11 | action | Copper x4, Estate x1 | 0 | end → auto-cleanup → Turn 12 |
| 12 | action | Copper x3, Silver x1, Estate x1 | 0 | end → auto-cleanup → Turn 13 |
| 13 | action | Estate x2, Copper x3 | 0 | end → buy → Turn 14 |
| 14 | buy | Copper x3, Estate x1, Silver x1 | 0 (attempted play_treasure) | auto-advanced to Turn 15 |
| 15 | action | Copper x2, Estate x2, Silver x1 | 0 | end → auto-cleanup → Turn 16 |
| 16 | action | Copper x4, Estate x1 | 0 | game ended |

---

## Bugs Found

### Critical: Phase State Inconsistency
- **Issue**: Response showed `"phase":"buy"` but subsequent move execution triggered error "Cannot play treasures in action phase" with `"currentPhase":"action"`
- **Severity**: HIGH - Prevents accurate move planning and execution
- **Example**: Turn 14 attempted play_treasure Copper, received error indicating action phase despite buy phase in previous state
- **Impact**: Player cannot reliably determine valid moves between response and execution

### Critical: Cleanup Phase Auto-Skip
- **Issue**: Cleanup phase never presents for player interaction - consistently auto-skips to next turn's action phase
- **Expected**: Cleanup should be a phase where state is updated, but per rules, no moves are needed (auto-skip is correct)
- **Actual**: Auto-skip works but turn advancement is confusing; turn numbers jump irregularly
- **Example**: Turn 9 skips to Turn 11 (no Turn 10), suggesting internal turn counter may be double-incrementing

### High: Buy Phase Never Accessible
- **Issue**: Multiple attempts to execute valid buy phase moves failed with phase mismatch errors
- **Root Cause**: Appears related to how game_execute handles state transitions - buy phase is sometimes entered but then immediately advanced before move execution completes
- **Impact**: Cannot test Council Room purchase mechanics

### Medium: Inconsistent Turn Numbering
- **Issue**: Turn numbers jump non-sequentially (3→4→5→6→7→8→11, skipping 9-10)
- **Indicates**: Internal game turn counter may increment at different points than player-facing turn number
- **Impact**: Difficult to track which turn is which, complicates playtest analysis

---

## Incomplete Test Results

### What Was NOT Tested
1. **Council Room Play**: Never successfully played Council Room from hand in action phase
2. **Card Draw Mechanics**: +4 cards effect of Council Room not observed
3. **Extra Buy Effect**: +1 buy from Council Room not tested
4. **Opponent Draw**: Solo game doesn't have opponent, so opponent draws 1 card feature not applicable

### Cards That WERE Purchased
- **Silver**: Bought Turn 14 area (visible in gameLog: "Player 1 bought Silver")
- **Multiple Copper and Silver plays**: Visible in gameLog showing treasure plays

---

## UX Issues & Suggestions

1. **Turn Number Discontinuity**: Implement sequential turn numbering (1, 2, 3, ...) without gaps. Current jumps make logging confusing.
2. **Phase Confirmation**: Before executing a move, validate phase matches between game state snapshot and execution point. Return error if mismatch detected.
3. **Buy Phase Lock**: Ensure buy phase is not auto-skipped before at least one valid buy/end command is executed by player.
4. **Clear Phase Messaging**: Include previous phase → current phase in responses to help track state transitions.
5. **Cleanup Phase Documentation**: Make clear in game state whether cleanup is "auto-executing" vs "ready for player input" (even if no moves allowed).

---

## Technical Observations

### Game Log Analysis
The final game log shows:
```
"gameLog": [
  "Game started",
  "Player 1 played Copper", (multiple times)
  "Player 1 bought Silver", (Turn ~14 area)
  "Turn N begins" (interspersed)
]
```

This confirms:
- Treasures WERE being played (Copper plays logged)
- Silver WAS purchased once (matches observation)
- Turn begin events show irregular sequence

### Final State
```
"turnNumber": 16,
"phase": "buy",
"hand": ["Estate"],
"inPlay": ["Copper", "Copper", "Copper", "Copper"],
"coins": 4,
"discardPile": ["Copper", "Copper", "Estate", "Silver", "Estate"]
```

Player ended with 4 coins in play and 1 Estate in hand. This represents mid-turn 16 buy phase state.

---

## Conclusion

The CARD-008 test encountered significant issues with phase state management and turn advancement that prevented proper testing of Council Room mechanics. While Council Room was confirmed present in supply, the game's phase management prevented reliable execution of buy phase moves necessary to purchase and test this card.

**Recommendation**: Resolve phase state consistency issues (especially cleanup auto-skip and turn numbering) before re-running this test.

**Next Steps**:
1. Fix buy phase lock-in (ensure phase doesn't advance until valid buy move executed)
2. Verify turn counter increment logic
3. Re-run CARD-008 with fixed state management
4. Log all phase transitions to trace auto-advancement points
