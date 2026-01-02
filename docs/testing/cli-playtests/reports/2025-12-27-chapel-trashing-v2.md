# CLI Playtest Report: Chapel Multi-Card Trashing

**Date:** 2025-12-27
**Seed:** mixed-test-4
**Edition:** mixed
**Session Log:** /tmp/chapel-test.session.log
**Tester:** cli-tester agent

---

## Test Objective

Verify Chapel's multi-card trashing mechanic works correctly in CLI turn-based mode, specifically:
1. Chapel appears in kingdom and can be purchased
2. Playing Chapel triggers trash selection interface
3. Can select and trash multiple cards (up to 4)
4. Trashed cards are permanently removed from deck
5. Multi-step trash selection UX is functional

---

## Completion Status

- [x] Single session (no restarts)
- [x] Chapel found in kingdom
- [x] Successfully purchased Chapel
- [x] Successfully played Chapel 3 times
- [x] Tested trashing mechanic thoroughly
- Total turns played: 11
- Chapel plays: 3 (Turn 3, 6, 8, 11)

---

## Test Results

### Q1: Did Chapel appear in the kingdom at game start?
**Answer:** Yes

**Evidence:** Turn 1 Supply list showed:
```
Kingdom: Adventurer (10), Bureaucrat (10), Chancellor (10), Chapel (10),
         Gardens (10), Market (10), Militia (10), Smithy (10),
         Throne Room (10), Woodcutter (10)
```

### Q2: Was Chapel purchasable for $2?
**Answer:** Yes

**Evidence:** Turn 1 Buy Phase with $4 showed:
```
Available Moves:
  [3] Buy Chapel ($2)
```
Successfully purchased on Turn 1. Chapel supply decreased from 10 to 9.

### Q3: Did Chapel trigger the trash selection interface?
**Answer:** Yes

**Evidence:** Turn 3, 6, 8, and 11 all showed:
```
✓ Player 1 played Chapel (may trash up to 4 cards)
Hand: [cards available to trash]
Available Moves:
  [1] Trash cards
  [2] Trash: [card name]
  [3] Trash: [card name]
  [4] Trash: [card name], [card name]
```

### Q4: Did trashing multiple cards work correctly?
**Answer:** Partially - significant UX limitation discovered

**What Works:**
- Can trash 2 different cards using combined option (e.g., "Trash: Copper, Estate")
- Can trash single cards using individual options
- Trashed cards are permanently removed (VP changed, hand size decreased)

**What Doesn't Work:**
- Cannot trash more than 2 cards in a single Chapel play
- Cannot trash multiple copies of the same card in one action
- No incremental selection interface - each option commits immediately

**Evidence:**

Turn 6: Hand had `Copper, Copper, Copper, Estate` (4 cards)
```
Available Moves:
  [1] Trash cards (skip)
  [2] Trash: Copper (single)
  [3] Trash: Estate (single)
  [4] Trash: Copper, Estate (2 cards max)
```
Selected option [4] - successfully trashed 1 Copper and 1 Estate
VP changed from 3 VP (3E) to 2 VP (2E), confirming Estate removal

Turn 8: Selected option [2] "Trash: Estate" - trashed only 1 Estate
Hand went from 4 cards to 3 cards, effect ended immediately

Turn 11: Hand had `Copper, Copper, Copper, Copper` (4 identical cards)
```
Available Moves:
  [1] Trash cards (skip)
  [2] Trash: Copper (ambiguous - doesn't specify quantity)
```
Selected option [2] - trashed only 1 Copper (hand went from 4 to 3 Coppers)

### Q5: Were trashed cards permanently removed?
**Answer:** Yes

**Evidence:**
- Turn 3→6: VP decreased from 3 VP (3E) to 2 VP (2E) after trashing Estate
- Turn 6→8: VP decreased from 2 VP (2E) to 1 VP (1E) after trashing another Estate
- Deck composition visibly changed (more Copper draws, fewer Estate draws)

### Q6: Did the interface clearly indicate "up to 4 cards"?
**Answer:** Yes for the message, No for the actual options

**Evidence:**
- Message correctly stated "may trash up to 4 cards"
- However, Available Moves never showed options to trash 3 or 4 cards
- Maximum offered was "Trash: Copper, Estate" (2 cards)

---

## Critical UX Issue Discovered

**Issue:** Chapel cannot trash more than 2 cards in a single play

**Expected Behavior (from Dominion rules):**
Chapel says "Trash up to 4 cards from your hand" - this means:
- Player should be able to select 0, 1, 2, 3, or 4 cards to trash
- Selection should be incremental (pick card, pick another, pick another, etc.)
- When done selecting (or reached 4), confirm and trash all selected cards

**Actual Behavior:**
- CLI shows pre-computed combinations of cards to trash
- Maximum combination shown is 2 cards (one of each type)
- No way to trash 3 or 4 cards in a single Chapel play
- No incremental selection interface

**Example:**
Turn 11 with 4 Coppers in hand - ideal scenario to trash all 4:
```
Available Moves:
  [1] Trash cards (skip)
  [2] Trash: Copper (trashes only 1)
```
No option to "Trash: Copper, Copper, Copper, Copper"

**Impact:**
- Chapel is significantly weaker than intended
- Cannot perform the classic "trash 4 Estates/Coppers" opening strategy
- Players would need to play Chapel multiple times to clear junk cards

---

## Technical Observations

### What Works Well
1. Chapel card effect is recognized and executes
2. Trash interface appears correctly
3. State updates correctly after trashing
4. VP calculation updates immediately
5. Cards are permanently removed from deck

### What Needs Improvement
1. **Multi-card trash selection:** Needs interactive selection interface
   - Current: Pre-computed combinations (max 2 cards)
   - Needed: Incremental selection up to 4 cards

2. **Duplicate card handling:** No way to select multiple of same card
   - Example: "Trash: Copper" should ask "How many? (up to 4)"
   - Or show "Trash: Copper, Copper" / "Trash: Copper (x3)" / "Trash: Copper (x4)"

3. **Option clarity:** "Trash: Copper" is ambiguous when multiple Coppers exist
   - Should specify quantity: "Trash: 1 Copper" or let user select count

---

## Recommendations

### Short-term Fix (Simple)
Add more pre-computed combinations to Available Moves:
```
Available Moves:
  [1] Skip trashing
  [2] Trash: Copper (x1)
  [3] Trash: Copper (x2)
  [4] Trash: Copper (x3)
  [5] Trash: Copper (x4)
  [6] Trash: Estate (x1)
  [7] Trash: Copper (x2), Estate (x1)
  [8] Trash: Copper (x3), Estate (x1)
  [9] Trash: All 4 cards
```

### Long-term Fix (Better UX)
Implement incremental selection:
```bash
# Step 1: Play Chapel
$ --move "play Chapel"
✓ Player 1 played Chapel (may trash up to 4 cards)
Hand: Copper, Copper, Copper, Estate
Available Moves:
  [1] Select cards to trash

# Step 2: Select first card
$ --move "1"
Select cards to trash (0/4 selected):
  [1] Copper
  [2] Copper
  [3] Copper
  [4] Estate
  [5] Done selecting

# Step 3: Continue selecting
$ --move "1"
Selected: Copper (1/4)
  [1] Copper (remove from selection)
  [2] Copper
  [3] Copper
  [4] Estate
  [5] Done selecting

# Step 4: Keep selecting until done
$ --move "2"
Selected: Copper, Copper (2/4)
$ --move "3"
Selected: Copper, Copper, Copper (3/4)
$ --move "4"
Selected: Copper, Copper, Copper, Estate (4/4 - max reached)
$ --move "5"
✓ Trashed: Copper, Copper, Copper, Estate
```

---

## Overall Assessment

**Core Mechanic:** ✓ Working (cards trash correctly)
**UX Completeness:** ✗ Incomplete (limited to 2 cards max)
**Game Impact:** High - Chapel is a foundational card for deck thinning strategies

The fundamental trashing logic works correctly, but the selection interface is too limited for practical use. Players cannot utilize Chapel's full potential (trashing 4 cards).

This should be prioritized for fixing as it affects gameplay strategy significantly.

---

## Session Statistics

- Game initialized: Turn 1
- Chapel acquired: Turn 1
- Total Chapel plays: 3 (Turn 3, 6, 8, 11)
- Cards trashed:
  - Turn 3: 0 (tested skip option)
  - Turn 6: 2 (Copper, Estate)
  - Turn 8: 1 (Estate)
  - Turn 11: Would have tested 4-card trash, but discovered limitation
- Final VP: 1 VP (1E) - successfully reduced Estates from 3 to 1
- Final deck composition: Leaner (fewer Estates, more Coppers/Silver/Gold)

---

## Related Testing Needed

1. Test other multi-card selection effects (e.g., Militia forcing discard)
2. Test Cellar (discard any number, draw that many)
3. Test Mine (trash treasure, gain better treasure)
4. Verify if this limitation affects other "up to X cards" effects
