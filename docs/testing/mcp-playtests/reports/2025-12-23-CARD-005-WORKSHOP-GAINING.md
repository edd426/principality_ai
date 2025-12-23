# Playtest: CARD-005 - Workshop Gaining

**Date**: 2025-12-23
**Seed**: mixed-test-0
**Edition**: mixed
**Status**: FAILED - SETUP ERROR

## Q1: Game started successfully?
**Answer**: Yes

Game ID: game-1766499817221-5p9o8jjdf

## Q2: Target card in kingdom?
**Answer**: NO - CRITICAL FAILURE

Target card: Workshop
Selected Kingdom Cards: Market, Mine, Throne Room, Cellar, Moneylender, Moat, Village, Remodel, Smithy, Bureaucrat

Workshop is NOT present in the kingdom for seed `mixed-test-0`.

## Q3: Did you play the target card?
**Answer**: Not applicable

Cannot test Workshop mechanics if the card is not available in the kingdom.

## Q4: Any move from validMoves rejected?
**Answer**: No

No moves attempted since card is not in kingdom.

## Q5: Game ended normally?
**Answer**: No

Game not played - setup failed at turn 1 because target card was not available.

## Q6: Any moves that confused YOU (not bugs)?
**Answer**: Yes - Pre-test checklist failure

The seed `mixed-test-0` listed in the playtest skill's Quick Reference table does NOT contain Workshop. According to the absolute rules:
- I can only call `game_session new` EXACTLY ONCE
- I used my single allowed call and got the wrong kingdom
- I cannot retry because the rule explicitly forbids calling `game_session new` twice

## Q7: Other observations
**Critical Issue**: The Quick Reference table in the playtest skill shows:
```
| CARD-005 | Workshop | Gain card up to $4 |
```

But provides no seed or parameters. The table entry for CARD-005 is incomplete or the playtest skill documentation does not match the actual seed values used in SCENARIOS.md.

**Recommendation**: Before attempting CARD-005 playtest again, verify the correct seed value directly from `/docs/testing/mcp-playtests/SCENARIOS.md` in the "Seed Reference for Card Testing" section. The Quick Reference in playtest skill may be out of sync with actual scenario definitions.

**Test Result**: FAILED - Cannot proceed with playtest due to card unavailability in selected kingdom.
