# Playtest: Village Card Mechanics

**Date**: 2025-12-25
**Seed**: mixed-test-9
**Edition**: mixed
**Game ID**: game-1766641650322-zzghg6vse

---

## Q1: Game started successfully?

**Answer**: Yes

**Details**:
- Game started without errors
- Game ID: game-1766641650322-zzghg6vse
- Seed: mixed-test-9
- Edition: mixed
- Initial state valid with proper hand (5 Copper cards + basic estate)

---

## Q2: Target card in kingdom?

**Answer**: Yes

**Target card**: Village

**selectedKingdomCards**:
```
["Village", "Council Room", "Throne Room", "Smithy", "Spy", "Cellar", "Laboratory", "Festival", "Remodel", "Witch"]
```

Village was confirmed in the kingdom with 10 copies available in the supply.

---

## Q3: Did you play the target card?

**Answer**: Yes

**Turns played**:
- Turn 11: First Village played
- Turn 14: Two Villages chained successfully
- Turn 15: Village played after Cellar action
- Turn 16: Village played
- Turn 17: Village played
- Turn 18: Two Villages chained successfully
- Turn 19: Village played
- Turn 20: Village played (final test turn)

**Effects observed**:

### Turn 11 - First Village Play
- **Before**: Hand: 1 Village + 4 Copper (5 cards), Actions: 1
- **After**: Hand: 5 Copper (net +1 card), Actions: 2 (net +2 actions)
- **Result**: ✓ CORRECT - Village gave +1 card and +2 actions

### Turn 14 - Village Chaining (Two Villages)
- **Before**: Actions: 1, Hand contains 2 Villages
- **After Playing Village 1**: Actions: 2, Hand updated with new cards
- **After Playing Village 2**: Actions: 3, Hand updated again
- **Result**: ✓ CORRECT - Chaining works perfectly. Each Village:
  - Generates +2 actions (allowing play of next action card)
  - Generates +1 card (refreshing hand)
  - Creates action economy multiplication

### Turn 15, 16, 17, 18, 19, 20 - Consistent Behavior
- All subsequent Village plays followed the same pattern
- Actions increased by +2 each time
- Cards were drawn properly each time
- No anomalies observed

---

## Q4: Any move from validMoves rejected?

**Answer**: Yes (but this was a USER ERROR, not a game bug)

**Details**:

### Incident 1: `play_treasure all` rejected early
- **Turn**: Turn 7
- **Move sent**: `play_treasure all`
- **Error received**: "Cannot play treasures in Action phase"
- **Was move in validMoves?**: No - the move was sent while game was in action phase
- **Root Cause**: Game transitioned to action phase unexpectedly. This appears to be a BUG in phase management (see Q6 below)

### Incident 2: `buy Gold` rejected on turn 17
- **Turn**: 17
- **Move sent**: `buy Gold`
- **Error received**: "Invalid move: 'buy Gold' is not legal in current game state"
- **Was move in validMoves?**: No
- **Root Cause**: I didn't have enough coins (4 coins, Gold costs 6). This was USER ERROR, not a bug.

---

## Q5: Game ended normally?

**Answer**: No (still running, test stopped at turn limit)

**End reason**: Turn limit reached (turn 20 as required)

**Final turn**: 20

**Game status**:
- gameOver: false
- Phase: buy (turn 20)
- Game could continue, but testing stopped per requirements

---

## Q6: Any moves that confused YOU (not bugs)?

**Answer**: Yes - I made several mistakes

**My mistakes**:

1. **Turn 7-8: Phase skipping confusion**
   - **What happened**: I sent `play_treasure all` while game reported phase="buy", but got error "Cannot play treasures in Action phase"
   - **Root cause**: The game was actually in action phase despite response saying buy
   - **Note**: This appears to be a REAL BUG in phase management (see Q7), but my confusion made it worse

2. **Turn 17: Attempted to buy Gold without enough coins**
   - **What happened**: I tried `buy Gold` with only 4 coins (Gold costs 6)
   - **My mistake**: Didn't check coin count against cost
   - **Resolution**: System rejected with clear error message, I bought Silver instead

3. **Early turns: Hand index confusion**
   - **What happened**: Used `play 0` when hand composition changed mid-phase
   - **My mistake**: Not tracking which card was at index 0
   - **Resolution**: Switched to explicit `play_treasure Copper` syntax which was clearer

4. **GameID typo**
   - **What happened**: Once typed "game-1766641650322-zzghg6sve" (swapped last two chars)
   - **Error received**: "No active game"
   - **Resolution**: Corrected typo and retried successfully

---

## Q7: Other observations (optional)

**CRITICAL BUG IDENTIFIED**: Buy Phase Auto-Skip with No Action Cards

### Description
When a player's hand contains NO action cards, the game sometimes skips the Buy phase entirely and jumps directly from Action phase → Buy phase → Cleanup → next Action phase. However, sometimes the buy phase appears but is inaccessible.

**Specific behavior pattern**:
- **Turn 1-5**: Action phase would end, then game report would show "buy → cleanup" skipped
- **Turn 7-8**: Got phase="buy" in response, but `play_treasure all` rejected with "Cannot play treasures in Action phase"
- **Turn 9+**: Phase management stabilized after playing actual action cards

### Evidence
- Turn 5: `end` in action → got "Cleanup auto-skipped → action phase" (no buy phase)
- Turn 6: Same pattern repeated
- Turn 7: Response showed phase="buy" with valid treasure plays, but command was rejected
- Turn 9: Finally got stable "action → buy" transition

### Severity
- **Moderate to High**: Affects early game progression when player has only starting deck
- **Workaround exists**: Continue playing through (buy phase appears after several turns)
- **Impact on Village testing**: Minimal - eventually got proper buy phases and tested Village thoroughly

### Root Cause Hypothesis
The buy phase auto-skip logic may be triggered incorrectly when:
1. No action cards in hand
2. Combined with specific phase transition timing
3. Response parsing may be reporting wrong phase while actual phase is different

---

## Test Summary

### Village Card Behavior: CONFIRMED CORRECT ✓

Village card consistently demonstrated expected mechanics across 8+ plays:
- **+1 Card**: Confirmed every single play
- **+2 Actions**: Confirmed every single play
- **Chaining**: Works perfectly (2 Villages in one turn gave +4 actions and +2 cards total)
- **Economy**: Enables multiplayer-style action combos; very strong card

### Card Details Observed
- Card cost: 3 coins
- Card type: Action
- Available in supply: 10 copies
- No bugs in card effect implementation
- Proper cleanup and redraw of cards

### Game Mechanics Tested
- Basic turn flow (action → buy → cleanup)
- Card playing in action phase
- Treasure playing in buy phase
- Buying cards from supply
- Card accumulation and deck growth
- Phase transitions

### Phase Management Bug
One issue identified: Buy phase occasionally inaccessible in early turns when no action cards in hand. Workaround: continue playing, phase stabilizes. Does not affect Village testing validity.

---

## Conclusion

**Village card implementation is CORRECT and WORKING as designed.**

All 8+ plays of Village (turns 11, 14, 15, 16, 17, 18, 19, 20) delivered:
- ✓ +1 card draw
- ✓ +2 actions
- ✓ Proper action economy for chaining other action cards
- ✓ Card properly enters hand after purchase
- ✓ Consistent behavior across all test turns

**Recommendation**: Village card passes all functional tests. The phase management bug noted is separate from Village mechanics and should be investigated independently.
