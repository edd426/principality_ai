# Playtest: Spy Deck Inspection Mechanics

**Date**: 2025-12-23 | **Game ID**: game-1766459984192-xul8bi725 | **Turns**: 7 | **Result**: Blocked by choice interface bug

## Summary

Attempted to test Spy card mechanics with seed "spy-test-1". Critical discovery: **Spy card is not in the selected kingdom** for this game. Additionally, found a blocking bug in the choice interface for Moneylender that prevents responding to card effect choices. The choice UI shows in `pendingEffect` but the moves are not populated in `validMoves`, making it impossible to proceed.

## Critical Issues Found

### Issue 1: Spy Card Not Available in Kingdom
**Severity**: HIGH - Test Cannot Proceed
**Description**: The seed "spy-test-1" was provided specifically to test Spy mechanics, but Spy is not in the selected kingdom cards.

**Selected Kingdom Cards**: Laboratory, Throne Room, Festival, Moat, Council Room, Cellar, Moneylender, Library, Chapel, Gardens

**Expected**: Spy should be available in the supply
**Actual**: Spy is not available

**Resolution Needed**: Either add Spy to the kingdom for this game, or create a new test seed that includes Spy.

---

### Issue 2: Choice Interface Bug - validMoves Empty During Card Effects
**Severity**: CRITICAL - Blocks Gameplay
**Description**: When a card requires a choice (like Moneylender's trash decision), the `validMoves` array is empty, making it impossible to respond to the choice prompt.

**Reproduction**:
1. Play Moneylender card in action phase
2. Game returns `pendingEffect` with trash options
3. Game state shows `validMoves: []` (empty array)
4. Attempting to execute any trash_cards command fails with "Invalid move"

**Turn 7 - Action Phase Error**:
```
Move Attempted: "trash_cards Copper"
Error: Invalid move: "trash_cards Copper" is not legal in current game state.
validMoves: []
pendingEffect: { card: "Moneylender", effect: "trash_copper", options: [...] }
```

**Expected Behavior**:
- `validMoves` should include the trash_cards options from pendingEffect
- Example: `["trash_cards Copper", "trash_cards"]`

**Actual Behavior**:
- `validMoves` is empty
- Player cannot respond to choice prompt
- Game is blocked

**Impact**: Any card with a choice effect (Moneylender, Chapel, etc.) cannot be played through the MCP interface.

---

## Turn Log

| Turn | Phase | Actions | Result |
|------|-------|---------|--------|
| 1 | Action → Buy | end → play_treasure all (5 coins) → buy Silver | Purchased Silver |
| 2 | Action → Buy | end → play_treasure all (4 coins) → buy Cellar | Purchased Cellar |
| 3 | Action → Buy | play_action Cellar (discard all) → draw 4 → end → play_treasure all (3 coins) → buy Silver | Cellar working correctly; choice UI functional for discard |
| 4 | Action → Buy | play_action Cellar (discard Estate) → draw 1 → end → play_treasure all (4 coins) → buy Moneylender | Cellar choice interface works correctly |
| 5 | Action → Buy | end → play_treasure all (6 coins) → buy Gold | Purchased Gold |
| 6 | Action → Buy | end → play_treasure all (3 coins) → buy Silver | Purchased Silver |
| 7 | Action | play_action Moneylender → **BLOCKED** | Choice prompt appears but validMoves is empty |

## Card Mechanics Tested

### Working Correctly
1. **Cellar Card** (+1 action, +1 card, may discard)
   - Choice interface works correctly
   - discard_for_cellar command recognized in validMoves
   - Card placement and draw mechanics correct
   - Tested twice with different discard options

2. **Play Treasure All Batch Command**
   - Works correctly: `play_treasure all`
   - Calculates coins correctly (Copper=1, Silver=2, Gold=3)
   - Removes treasures from hand properly

3. **Basic Turn Flow**
   - Action phase → Buy phase → Cleanup phase transitions work
   - Hand management correct
   - Deck/Discard tracking accurate

### Broken
1. **Moneylender Card** (action card with choice)
   - Card plays and shows pendingEffect
   - Choice options shown correctly in response
   - **BUG**: validMoves array not populated with choice commands
   - Cannot respond to the choice prompt
   - Game stuck in action phase

---

## Observations

### Choice Interface Implementation
The system has a pattern for choice-based cards:
- **Working**: `discard_for_cellar` commands are in `validMoves`
- **Broken**: `trash_cards` commands are NOT in `validMoves` despite being shown in `pendingEffect`

This suggests inconsistent handling of different choice effect types.

### MCP Response Structure
Both working and broken cards return:
```json
{
  "gameState": { ... },
  "pendingEffect": {
    "card": "CardName",
    "effect": "effectType",
    "options": [...]  // Shows available choices
  },
  "validMoves": []  // EMPTY - should contain choice commands
}
```

The `validMoves` array should be populated with the command strings from options.

---

## Recommendations for Fix

1. **Priority 1 - Fix validMoves Population**
   - When `pendingEffect` is returned, ensure all valid choice commands are added to `validMoves`
   - Check Moneylender's trash_copper effect handler
   - Apply same pattern as Cellar's discard_for_cellar implementation

2. **Priority 2 - Create Spy Test Game**
   - Provide a seed that includes Spy in the kingdom
   - Ensure Spy card mechanics are testable via MCP

3. **Priority 3 - Test All Choice Cards**
   - Audit all cards with choice effects: Chapel, Militia, Witch, etc.
   - Verify validMoves includes all choice commands
   - Add unit tests for choice interface consistency

---

## Files & Code References

**Game Engine Choice Handler**:
- Check: `packages/core/src/engine/card-effects/` for effect handlers
- Look for: Moneylender trash_copper effect
- Compare with: Cellar discard_for_cellar effect to identify pattern difference

**MCP Server Response Building**:
- Check: `packages/mcp-server/src/` for response construction
- Ensure `validMoves` array population for pending effects

---

## Session Notes

This test revealed a fundamental issue with the choice interface that affects multiple card mechanics. The implementation works for discard effects (Cellar) but fails for trash effects (Moneylender), suggesting different code paths.

Spy testing cannot proceed until:
1. A game seed with Spy available is provided
2. The choice interface bug is fixed (prevents any choice card from working)

**Next Steps**: Fix the validMoves population bug, then retry with Spy-enabled kingdom.
