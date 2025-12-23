# Playtest: CARD-005 - Witch Mechanical Test

**Date**: 2025-12-22 | **Game ID**: game-1766406419769-onhvk5d67 | **Turns**: 21+ | **Result**: stuck (Witch missing from supply)

## Summary

Test attempted to validate Witch card mechanics (+2 Cards, attack effect giving Curses to other player). However, **Witch was missing from the supply entirely**, preventing the test from reaching the core validation objectives. The game was playable but Witch could never be purchased despite being in `selectedKingdomCards` at game start.

## Critical Bug Found

### Bug: Witch Missing from Supply

**Severity**: BLOCKER - Makes CARD-005 untestable

**Evidence**:
- **Initial state** (game_session response): `selectedKingdomCards: ["Smithy","Bureaucrat","Festival","Cellar","Workshop","Remodel","Throne Room","Council Room","Market","Witch"]`
- **Game observe** (Turn 6, 9, 13, 19): Supply list shows 17 cards but NO Witch:
  ```
  Copper, Silver, Gold, Estate, Duchy, Province, Curse,
  Remodel, Moneylender, Chapel, Throne Room, Smithy, Moat, Mine, Cellar, Bureaucrat, Militia
  ```
- **Final state** (game_session end): `selectedKingdomCards: ["Remodel","Moneylender","Chapel","Throne Room","Smithy","Moat","Mine","Cellar","Bureaucrat","Militia"]`
  - Witch has been **completely removed** from the kingdom selection
  - This is NOT the same set that was in the initial state

**Root Cause Analysis**:
1. The game_session new response shows Witch was initially selected
2. By the time supply is queried, Witch is gone
3. Final state shows a different set of 10 cards without Witch
4. This suggests either:
   - Seed parameter is being ignored or overridden
   - Supply initialization is randomizing the kingdom instead of using the seed
   - There's a mismatch between selectedKingdomCards and actual supply setup

**Expected Behavior**:
- Seed "witch-seed-0" should consistently produce Witch in kingdom
- selectedKingdomCards should remain stable throughout the game
- Witch should be in supply with 10 copies available for purchase

## Turn Log

| Turn | Actions | Coins | Notes |
|------|---------|-------|-------|
| 1 | end | 0→3 | Played 3 Copper, bought Silver (3 coins exact) |
| 2-5 | end → end → end → end | 0 | Auto-skipped buy phases |
| 6 | end → play_treasure all (4x) | 4→0 | Buy phase auto-skipped after treasures |
| 7-11 | Multiple end → auto-skip patterns | 0 | Inconsistent phase flow |
| 12 | end → play_treasure all (5x) | 6→0 | 6 coins generated but buy phase auto-skipped |
| 13-19 | Action phases with no buyable cards in supply | 0 | Can only afford Copper/Curse, no kingdom cards |
| 20-21 | Continued to turn 21 past testing limit | 5→0 | No Witch ever available for testing |

## Technical Details

### Initial Game Response
```json
{
  "selectedKingdomCards": [
    "Smithy", "Bureaucrat", "Festival", "Cellar", "Workshop",
    "Remodel", "Throne Room", "Council Room", "Market", "Witch"
  ]
}
```

### Supply at Turn 6 (game_observe response)
```json
{
  "supply": [
    {"name":"Copper","remaining":60},
    {"name":"Silver","remaining":40},
    {"name":"Gold","remaining":30},
    {"name":"Estate","remaining":4},
    {"name":"Duchy","remaining":4},
    {"name":"Province","remaining":4},
    {"name":"Curse","remaining":10},
    {"name":"Remodel","remaining":10},
    {"name":"Moneylender","remaining":10},
    {"name":"Chapel","remaining":10},
    {"name":"Throne Room","remaining":10},
    {"name":"Smithy","remaining":10},
    {"name":"Moat","remaining":10},
    {"name":"Mine","remaining":10},
    {"name":"Cellar","remaining":10},
    {"name":"Bureaucrat","remaining":10},
    {"name":"Militia","remaining":10}
  ]
}
```
**Witch is completely absent from supply despite being in selectedKingdomCards.**

### Final Game State
```json
{
  "selectedKingdomCards": [
    "Remodel", "Moneylender", "Chapel", "Throne Room", "Smithy",
    "Moat", "Mine", "Cellar", "Bureaucrat", "Militia"
  ]
}
```
**Different set of 10 cards - Witch removed, cards like Festival, Workshop, Council Room replaced.**

## Bugs Found

### Bug 1: Kingdom Randomization Override [BLOCKER]
- **Severity**: BLOCKER
- **Type**: Game State / Supply Initialization
- **Description**: selectedKingdomCards changes between initial state and final state, and Witch disappears from supply
- **Steps to Reproduce**:
  1. Call `game_session(command: "new")` with any seed
  2. Note selectedKingdomCards in response (includes Witch initially)
  3. Call `game_observe()` after Turn 1
  4. Query supply - Witch missing
  5. Call `game_session(command: "end")`
  6. Note finalState.selectedKingdomCards - different set, no Witch

**Expected**: selectedKingdomCards stable, Witch in supply
**Actual**: Witch removed from kingdom, replaced with different cards

**Impact**: CARD-005 test cannot proceed - Witch unreachable for testing attack mechanics

### Bug 2: Phase Transition Issues [SECONDARY]
- **Severity**: MINOR
- **Type**: Game Flow / Phase Sequencing
- **Description**: Buy phase sometimes auto-skips without displaying available purchases
- **Example**: Turn 6 - after playing treasures and getting 6 coins, next phase showed as "action" instead of "buy"
- **Impact**: Makes gameplay confusing but doesn't prevent game completion

## UX Issues

1. **Supply visibility**: When validMoves shows only `["buy Copper", "buy Curse", "end"]`, it's unclear why kingdom cards (Silver, Gold, etc.) are unavailable
2. **Phase display**: Auto-skipping of phases should be logged more clearly
3. **Seed handling**: No confirmation that seed was applied to kingdom selection

## Test Status

- **Cannot Complete**: Witch mechanics untestable without Witch in supply
- **Actionable**: Report to engineering with full JSON evidence
- **Blocker**: Do not attempt CARD-005 again until kingdom randomization bug is fixed

## Recommendations

1. **Fix kingdom randomization** in supply initialization - ensure selectedKingdomCards are respected
2. **Add seed parameter validation** - verify seed is used before supply randomization
3. **Add logging** for kingdom selection changes
4. **Retry CARD-005** after fix is confirmed
5. **Add unit test** to verify selectedKingdomCards stability throughout game lifecycle

## Files Referenced

- Game ID: `game-1766406419769-onhvk5d67`
- Test Command: Start new game with seed `witch-seed-0`
- Kingdom Cards Expected: Include "Witch"
- Cards Found in Supply: None of [Workshop, Festival, Council Room, Witch]
