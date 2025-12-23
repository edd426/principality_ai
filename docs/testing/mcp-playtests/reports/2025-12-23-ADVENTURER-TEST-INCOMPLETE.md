# Playtest: Adventurer Reveal-Until Mechanics

**Date**: 2025-12-23 | **Game ID**: game-1766459984513-b3gnl8eqo | **Status**: BLOCKED | **Result**: Cannot Complete

## Summary

Test cannot proceed as requested. The seed `adventurer-test-1` was generated with kingdom cards that do NOT include Adventurer card. The MCP server's `game_session new` command does not support specifying custom kingdom cards via API parameters.

## Issue Details

### Root Cause
- Requested test: Validate Adventurer card reveal-until mechanics
- Seed provided: `adventurer-test-1`
- Actual kingdom cards in generated game: `Cellar`, `Witch`, `Festival`, `Market`, `Bureaucrat`, `Village`, `Gardens`, `Chapel`, `Smithy`, `Workshop`
- **Missing**: Adventurer card is NOT in the selected kingdom

### API Limitation
The `mcp__principality__game_session` function signature only accepts:
```typescript
{
  command: "new" | "end" | "list",
  seed?: string,
  model?: "haiku" | "sonnet",
  gameId?: string
}
```

No parameter exists to specify custom kingdom cards (e.g., `kingdomCards` parameter).

### Game State Confirmation
Initial observation showed supply included:
- Treasures: Copper, Silver, Gold
- Victory: Estate, Duchy, Province
- Curse: Curse
- Kingdom cards (10): Cellar, Witch, Festival, Market, Bureaucrat, Village, Gardens, Chapel, Smithy, Workshop

Adventurer was **NOT** present in any of the 3 categories.

## Actions Taken

1. Started game with seed `adventurer-test-1` → Confirmed Adventurer not in kingdom
2. Ended game immediately to avoid turn counter issue
3. Documented findings

## Recommendations for Future Testing

### Option 1: Create seed with Adventurer
Need to ensure the seed used for this test actually generates a kingdom that includes Adventurer. This would require:
- Modifying the seed string that determines RNG for kingdom card selection, OR
- Adding API support to specify kingdom cards explicitly

### Option 2: Add kingdom card API parameter
Update `mcp__principality__game_session` to accept optional parameter:
```typescript
kingdomCards?: string[];  // e.g., ["Adventurer", "Village", "Market", ...]
```

This would allow testers to specify exactly which cards to test.

### Option 3: Verify seed generation logic
Check if seed `adventurer-test-1` is a known seed that should generate Adventurer in the kingdom. If so, investigate why RNG produced different results.

## Test Scenarios (Not Executed)

These scenarios were planned but cannot be tested until Adventurer is available:

### Scenario 1: Normal Play
- Play Adventurer with typical deck composition
- Verify it reveals cards from deck until exactly 2 treasures found
- Validate treasures go to hand, non-treasures to discard

### Scenario 2: Many Non-Treasures (Estates)
- Build deck with mostly Estates and few treasures
- Play Adventurer with deck containing 5+ non-treasures but only 2-3 treasures
- Verify reveal stops after finding 2nd treasure

### Scenario 3: Fewer Than 2 Treasures Available
- Scenario where deck+discard combined has only 1 treasure
- Play Adventurer and verify graceful handling
- Confirm single treasure goes to hand, reveal stops

### Scenario 4: Reveal-to-Discard Validation
- Play Adventurer multiple times
- Track each revealed non-treasure card
- Verify all non-treasures correctly placed in discard pile
- Check no cards are lost or duplicated

## Cards That Should Be Tested

**Adventurer** (cost 6):
- Action card
- Effect: "Reveal cards from your deck until you reveal 2 Treasure cards. Put those Treasures in your hand and discard the other revealed cards."

### Key Mechanics
1. **Reveal source**: From deck only (not discard initially)
2. **Reveal condition**: "Until 2 treasures found"
3. **Treasure destination**: Hand
4. **Non-treasure destination**: Discard pile
5. **Edge case**: Fewer than 2 treasures available in deck (requires shuffle of discard into deck)

## Files Generated
- This report: `/docs/testing/mcp-playtests/reports/2025-12-23-ADVENTURER-TEST-INCOMPLETE.md`

## Next Steps

1. Clarify seed generation: Does `adventurer-test-1` include Adventurer or not?
2. Create new seed with Adventurer in kingdom (if not already there)
3. Add kingdom card selection API parameter to MCP server
4. Re-run test with proper seed and available card

## Logs

### Game Initialization
```json
{
  "gameId": "game-1766459984513-b3gnl8eqo",
  "seed": "adventurer-test-1",
  "selectedKingdomCards": [
    "Cellar", "Witch", "Festival", "Market", "Bureaucrat",
    "Village", "Gardens", "Chapel", "Smithy", "Workshop"
  ],
  "adventurerPresent": false,
  "timestamp": "2025-12-23T00:00:00Z"
}
```

---

**Test Status**: BLOCKED - Cannot proceed without Adventurer card in kingdom

**Resolution**: Requires either API enhancement or seed verification/correction
