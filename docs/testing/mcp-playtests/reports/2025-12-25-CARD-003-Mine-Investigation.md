# Playtest: CARD-003 (Mine Treasure Upgrading)

**Date**: 2025-12-25
**Seed**: mixed-test-0 (attempted)
**Edition**: mixed
**Test Status**: FAILED - SEED MISMATCH

---

## Q1: Game started successfully?
**Answer**: Yes
**Game ID**: game-1766635762152-z7acam8kc

---

## Q2: Target card in kingdom?
**Answer**: NO - CRITICAL ISSUE

**Target card**: Mine
**Expected behavior**: Mine should be available in kingdom for testing trash-and-gain mechanic

**Actual selectedKingdomCards**:
```
["Workshop","Feast","Chancellor","Remodel","Adventurer","Festival","Cellar","Witch","Spy","Smithy"]
```

**Analysis**:
- Mine is NOT present in the kingdom
- The seed `mixed-test-0` documented in SCENARIOS.md for CARD-003 does NOT contain Mine
- This prevents any testing of Mine's core mechanics
- The seed is either incorrectly documented or the wrong seed was specified

---

## Q3: Did you play the target card?
**Answer**: Not-applicable
**Reason**: Mine was not available in kingdom

---

## Q4: Any move from validMoves rejected?
**Answer**: No
**Note**: Could not progress to test moves because target card missing

---

## Q5: Game ended normally?
**Answer**: No
**End reason**: Test terminated due to seed mismatch
**Final turn**: 1 (game ended immediately)

---

## Q6: Any moves that confused YOU (not bugs)?
**Answer**: No move execution attempted

---

## Q7: Other observations

### CRITICAL FINDING: SEED MISMATCH

The documented seed for CARD-003 in SCENARIOS.md is incorrect or needs updating:
- **Seed used**: `mixed-test-0`
- **Expected**: Mine in selectedKingdomCards
- **Actual**: Mine NOT in selectedKingdomCards

**Kingdom cards in mix-test-0**:
1. Workshop - "Gain a card costing up to 4"
2. Feast - "Gain a card costing up to 5"
3. Chancellor - "Each other player reveals a card"
4. Remodel - "Trash a card, gain a card costing up to 1 more"
5. Adventurer - "Reveal cards until you reveal 2 treasures"
6. Festival - "+2 coins, +1 action, +1 buy"
7. Cellar - "+1 action, discard any number"
8. Witch - "Each player gains a Curse"
9. Spy - "Each player reveals and discards"
10. Smithy - "+3 cards"

**Mine is absent** from this kingdom.

### RECOMMENDATION

Before retesting CARD-003, need to:
1. Identify or create a seed that includes Mine in selectedKingdomCards
2. Update SCENARIOS.md with correct seed reference
3. Verify seed produces Mine consistently via deterministic shuffle

### TEST BLOCKED

Cannot proceed with CARD-003 playtest until:
- Correct seed with Mine is identified
- SCENARIOS.md is updated
- New game is started with corrected seed

---

## Summary

**Test Result**: BLOCKED
**Root Cause**: Documentation mismatch - documented seed does not contain target card
**Impact**: Zero test coverage achieved for Mine mechanics
**Next Steps**: Fix seed documentation and rerun from STEP 1
