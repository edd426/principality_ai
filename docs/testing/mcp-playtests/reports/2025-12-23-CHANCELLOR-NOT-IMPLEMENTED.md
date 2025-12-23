# Playtest Report: Chancellor Card Mechanics Test

**Date**: 2025-12-23 | **Seed**: chancellor-test-1 | **Status**: NOT TESTABLE - CARD NOT IMPLEMENTED | **Result**: SKIPPED

---

## Summary

Chancellor card testing cannot be completed. Chancellor is not currently implemented in the game. The codebase is in Phase 3 (Dominion Base Set completion), which includes only 10 kingdom cards. Chancellor is a Phase 4+ card addition.

---

## Investigation Results

### Game Setup Attempted
- **Seed**: chancellor-test-1
- **Game ID**: game-1766459984925-uosy3hg4h
- **Expected Kingdom Cards**: Including Chancellor
- **Actual Kingdom Cards**: Festival, Library, Militia, Bureaucrat, Village, Throne Room, Smithy, Moat, Laboratory, Workshop

### Card Availability Check

Supply available in Phase 3:

**Treasures**: Copper, Silver, Gold
**Victory Cards**: Estate, Duchy, Province
**Kingdom Cards** (10 total):
1. Festival (5 cost, +5 coins, +1 buy)
2. Library (5 cost, +1 action, draw until hand size 7)
3. Militia (4 cost, attack - discard opponent cards)
4. Bureaucrat (4 cost, attack - silver gain)
5. Village (3 cost, +1 card, +2 actions)
6. Throne Room (4 cost, +1 card, replay action card)
7. Smithy (4 cost, +3 cards)
8. Moat (2 cost, +2 cards, reaction defense)
9. Laboratory (5 cost, +2 cards, +1 action)
10. Workshop (3 cost, gains a card)

**Chancellor Status**: NOT FOUND in supply

---

## What Chancellor Should Test

Chancellor (5 cost action card) mechanics that were planned for testing:

### Primary Mechanic
- **Effect**: +2 coins, then player may put their deck into their discard pile
- **Decision Point**: Optional choice - put deck into discard or keep deck intact
- **Next Action**: If deck is put into discard, next draw triggers immediate shuffle

### Test Scenarios (Not Run)

1. **Scenario 1**: Chancellor with choice to put deck into discard
   - Expected: +2 coins granted immediately
   - Expected: UI offers choice (put deck into discard Y/N)
   - Expected: If yes, entire deck moves to discard pile
   - Expected: Next draw triggers shuffle from discard back to deck

2. **Scenario 2**: Chancellor with choice NOT to put deck into discard
   - Expected: +2 coins granted
   - Expected: Deck remains intact
   - Expected: No disruption to normal draw mechanics

3. **Scenario 3**: Chancellor when deck is empty (edge case)
   - Expected: +2 coins still granted
   - Expected: Choice offered even with empty deck
   - Expected: If accepted, behavior handles empty deck gracefully
   - Expected: No errors or crashes

4. **Scenario 4**: Chancellor enabling expensive card purchase
   - Expected: +2 coins allows buying higher-cost card than normally available
   - Example: With 6 coins → play Chancellor → 8 coins → buy Province
   - Expected: Card purchase succeeds with chancellor-supplied coins

### Key Validations Needed
- [ ] +2 coins granted immediately
- [ ] Choice UI offered after coin grant
- [ ] If "yes": entire deck transferred to discard
- [ ] If "no": deck remains in place
- [ ] Next draw triggers shuffle if deck in discard
- [ ] Both choices resolve without errors
- [ ] Edge case: empty deck handling
- [ ] Edge case: single-card deck handling
- [ ] +2 coins usable for expensive purchases

---

## Current Phase Status

From CLAUDE.md:
- **Phase**: 4 (Complete Dominion Base Set) - 25 cards planned
- **Progress**: 638/655 tests passing
- **Current Implementation**: Phase 3 (10 kingdom cards)
- **Chancellor Location**: Not yet in current codebase

### Implementation Priority

Chancellor would be included in Phase 4 expanded kingdom card set (25 total). Phase 4 requirements are documented in:
- `/docs/requirements/phase-4/` (reference for card specs)
- Implementation pending Phase 3 completion

---

## Recommendation

**Action**: Skip Chancellor testing until card is implemented in Phase 4.

**Alternative**: Suggest testing other Phase 3 cards not yet validated:
- Moat (2 cost, +2 cards, reaction defense)
- Library (5 cost, complex draw mechanics)
- Bureaucrat (4 cost, attack card)
- Throne Room (4 cost, replay mechanics)

**Next Steps**:
1. Implement Chancellor in Phase 4
2. Create test scenarios matching validated game mechanics
3. Re-run playtest with implemented card
4. Validate choice UI and state management for optional card abilities

---

## Technical Notes

- MCP server responds correctly with Phase 3 kingdom card set
- Game state management functioning normally
- No errors encountered during investigation
- Game ended successfully when ended manually
- Seed parameter accepted and processed correctly

---

## Files & References

- CLAUDE.md: Project status and phase tracking
- docs/PHASE_STATUS.md: Current phase details
- docs/requirements/phase-4/: Chancellor specifications (when documented)
- docs/testing/mcp-playtests/SCENARIOS.md: Test scenario templates
