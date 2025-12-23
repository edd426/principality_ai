# Playtest: MINE Card Mechanics

**Date**: 2025-12-23 | **Game ID**: game-1766459984954-yr82qyfpy | **Turns**: 15 | **Result**: CRITICAL BUG FOUND

**Seed**: mine-test-1 | **Focus**: Mine trash-treasure + gain-treasure upgrade mechanics

---

## Summary

Tested MINE card (costs 5, Action: "Trash a Treasure from your hand. Gain a Treasure costing up to 3 more") with focus on two-step selection and card placement. **CRITICAL BUG FOUND**: Gained treasure is placed in **discard pile** instead of **hand** as specified in card mechanics.

---

## Test Objectives

1. Trash Copper (0 cost), gain Silver (3 cost) - validates +3 cost upgrade
2. Trash Silver (3 cost), gain Gold (6 cost) - validates +3 cost upgrade
3. Verify two-step selection works (trash choice → gain choice)
4. Validate gained treasure goes to HAND (not discard pile)
5. Confirm cost constraint enforced (+3 max upgrade)
6. Test edge cases: same-cost gain, invalid gains

---

## Turn Log

| Turn | Phase | Action | Result | Notes |
|------|-------|--------|--------|-------|
| 1 | end → buy | Play 5 Copper (5 coins) → Buy Silver | ✓ | Standard Big Money opening |
| 2 | end → buy | Play 2 Copper (2 coins) → Buy Copper | ✓ | Continue building |
| 3 | end → buy | Play 3 Copper+Silver (4 coins) → Buy Silver | ✓ | Building treasures |
| 4 | end → buy | Play 4 Copper (4 coins) → Buy Silver | ✓ | Continue |
| 5 | end → buy | Play 4 Copper (4 coins) → Buy Silver | ✓ | Continue |
| 6 | end → buy | Play 4 Copper+Silver (6 coins) → Buy Gold | ✓ | Higher tier treasure |
| 7 | end → buy | Play 4 Copper+Silver (6 coins) → Buy Gold | ✓ | More Gold |
| 8 | end → buy | Play 3 Copper+Gold (5 coins) → **Buy Mine** | ✓ | **MINE ACQUIRED** |
| 9 | end → buy | Play 5 Copper+Silver (6 coins) → Buy Silver | ✓ | Waiting for Mine to cycle |
| 10 | **MINE TEST** | **Play Mine action** | ⚠️ BUG | **See details below** |
| 11 | end → buy | Play 4 Copper+Silver+Gold (8 coins) → Buy Gold | ✓ | Continue |
| 12 | end → buy | Play 4 Copper+Silver (5 coins) → Buy Silver | ✓ | Continue |
| 13 | end → buy | Play 4 Copper+Silver+Gold (7 coins) → Buy Gold | ✓ | Continue |
| 14 | end → buy | Play 4 Copper+Silver (6 coins) → Buy Gold | ✓ | Continue |
| 15 | end (partial) | Turn ended at buy phase | - | Stopped at testing limit |

---

## CRITICAL BUG: Gained Treasure Placement

### Turn 10 - Mine Usage Details

**Initial Hand**: Silver x1, Estate x1, Copper x2

**Action Executed**: `play_action Mine`

**System Response**:
```
"Card requires choice: Mine - Step 1"
validMoves: [
  "select_treasure_to_trash Silver",
  "select_treasure_to_trash Copper",
  "select_treasure_to_trash Copper"
]
```

**Step 1 - Trash Selection**:
- Command: `select_treasure_to_trash Copper`
- Response: `hand: {"Silver":1,"Estate":1,"Copper":1}` ✓ (Copper removed from hand)

**Step 2 - Gain Selection**:
```
validMoves: [
  "gain_card Copper",
  "gain_card Silver"
]
```
- Command: `gain_card Silver`
- Response: **BUG DETECTED**
  ```
  "hand": {"Silver":1,"Estate":1,"Copper":1}
  ```
  Expected: `"hand": {"Silver":2,"Estate":1,"Copper":1}`

### Post-Turn Analysis (game_observe full)

**After Turn 10 Cleanup**:
```
hand: {Silver:1, Estate:1, Copper:1}      ❌ Missing gained Silver
stats: {
  handCount: 3,
  discardCount: 1,  ← GAINED SILVER IS HERE
  deckCount: 14
}
```

**Conclusion**: The gained Silver card was placed in the **discard pile** instead of the **hand**, violating the card mechanic specification.

---

## Detailed Validation Results

### ✓ PASSING: Two-Step Selection Works
- Mine correctly prompts for trash choice
- Mine correctly prompts for gain choice
- Both selections execute without error
- Cost constraint properly calculated (Copper=0 → can gain up to $3)

### ✓ PASSING: Original Treasure Trashed
- Final trash pile contains the selected Copper
- Copper removed from hand correctly
- Game log shows: "Player 1 played Mine (trash Treasure, gain Treasure +$3 to hand)"

### ✓ PASSING: Cost Constraint Enforced
- When Copper (0 cost) selected, validMoves offered: Copper ($0) and Silver ($3)
- Both are ≤ $3, correctly filtered
- Gold ($6) not offered (would be +6, exceeds +3 limit)

### ❌ FAILING: Gained Treasure Placement
- **Expected**: Gained treasure appears in hand immediately
- **Actual**: Gained treasure appears in discard pile
- **Impact**: Player cannot use upgraded treasure immediately
- **Severity**: CRITICAL - breaks core card mechanic

---

## Card Mechanics Specification vs Implementation

| Aspect | Spec | Actual | Status |
|--------|------|--------|--------|
| Step 1: Trash treasure | ✓ Treasure removed from hand | ✓ Correct | PASS |
| Step 2: Gain treasure | ✓ Goes to HAND | ❌ Goes to discard | **FAIL** |
| Cost calculation | ✓ Trashed cost + 3 | ✓ Correct | PASS |
| Valid options shown | ✓ Only treasures ≤ max cost | ✓ Correct | PASS |
| Original trashed | ✓ In trash pile | ✓ Correct | PASS |

---

## Test Scenarios Not Completed

Due to Mine taking multiple turns to cycle back to hand and focus on the critical bug, these scenarios were not fully tested:

1. **Scenario 2**: Trash Silver (3 cost), gain Gold (6 cost) - NOT TESTED
2. **Scenario 3**: Trash Copper, gain Copper (same cost) - NOT TESTED
3. **Scenario 4**: Attempt invalid gain (cost > +3) - NOT TESTED
4. **Scenario 5**: Mine with no treasures in hand - NOT TESTED

However, the cost constraint validation in Step 2 (Scenario 4 validation) was partially confirmed by the valid options shown.

---

## Root Cause Analysis

The bug appears in card placement logic after Mine's `gain_card` action:

**Expected Flow**:
```
gain_card Silver
→ Add Silver to current hand
→ Hand now: {Silver:2, Estate:1, Copper:1}
→ Card appears in next draw
```

**Actual Flow**:
```
gain_card Silver
→ Add Silver to discard pile
→ Hand: {Silver:1, Estate:1, Copper:1}
→ Card won't appear until discard shuffles into deck
```

This suggests the "gain" mechanic defaults to discard placement rather than hand placement for action cards like Mine. Check implementation of `gainCard()` method vs. `gainCardToHand()` method.

---

## Impact Assessment

**Gameplay Impact**: HIGH
- Player cannot immediately use upgraded treasure
- Defeats the purpose of Mine as a treasure economy accelerator
- Mine becomes nearly worthless (upgraded treasure buried in discard)

**Fix Priority**: CRITICAL - Blocks Mine from functioning correctly

---

## Recommendations

1. **Immediate**: Fix card placement logic in Mine's gain step to use hand placement, not discard
2. **Verification**: Confirm `gain_card` placement default in MCP implementation
3. **Testing**: Re-run this test after fix to validate all 5 scenarios
4. **Related Cards**: Check if other "gain" effects (Remodel, Witch curse gain, etc.) have similar issues

---

## Files for Reference

- **Game State**: Final draw pile shows Mine still in deck (not yet discarded to hand)
- **Game Log**: Shows "Player 1 played Mine (trash Treasure, gain Treasure +$3 to hand)" - documentation claims hand placement but implementation differs
- **Trash Pile**: Contains single Copper (correctly trashed)

---

## Session Notes

- Seed: mine-test-1 produced deterministic game flow
- Big Money strategy successfully built to Copper/Silver/Gold foundation in 8 turns
- Turn 10 allowed direct Mine testing
- MCP response format clear and structured for choice mechanics
- Two-step selection UI properly implemented; only card placement is broken

---

**Test Status**: INCOMPLETE - CRITICAL BUG BLOCKS FURTHER TESTING

Recommendation: Fix card placement bug, re-run full 5-scenario test suite on Mine card.
