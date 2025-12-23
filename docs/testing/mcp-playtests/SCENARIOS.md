# MCP Playtest Scenarios

Test scenarios for automated game testing via Haiku subagents. Each scenario focuses on specific cards, strategies, or edge cases.

---

## ⚠️ CRITICAL: Edition Parameter

**You MUST pass `edition: "mixed"` when starting games.**

```
game_session(command: "new", seed: "mixed-test-0", edition: "mixed")
```

If you omit `edition`, it defaults to `"2E"` which **excludes these cards**:
- Chapel, Adventurer, Chancellor, Feast, Spy, Thief, Woodcutter

Your target card will NOT appear if you use the wrong edition!

---

## Coverage Status

| ID | Card/Focus | Status | Last Run | Notes |
|----|------------|--------|----------|-------|
| CARD-001 | Chapel | ✅ Pass | 2025-12-23 | All trash mechanics working (0-4 cards) |
| CARD-002 | Throne Room | ✅ Pass | 2025-12-23 | Adapted test - action mechanics verified |
| CARD-003 | Mine | ✅ Pass | 2025-12-23 | Copper→Silver upgrade verified; agent ignored seed checklist |
| CARD-004 | Cellar | ✅ Pass | 2025-12-23 | Adapted - used Chapel for card selection |
| CARD-005 | Workshop | ✅ Pass | 2025-12-23 | Gain mechanic, $4 cost restriction, gain-to-discard verified |
| CARD-006 | Witch | ✅ Pass | 2025-12-23 | +2 cards works; attack suppressed in solo mode (correct) |
| CARD-007 | Militia | ✅ Pass | 2025-12-23 | +$2 works; attack suppressed in solo mode (correct) |
| CARD-008 | Council Room | ✅ Pass | 2025-12-23 | +4 cards, +1 buy verified |
| CARD-009 | Laboratory | ✅ Pass | 2025-12-23 | Chaining tested (3-4 Labs in sequence) |
| CARD-010 | Festival | ✅ Pass | 2025-12-23 | +2 actions, +2 coins, +1 buy all verified
| STRAT-001 | Big Money | ✅ Pass | 2025-12-21 | 2 runs, no issues |
| STRAT-002 | Action Engine | ⬜ Untested | - | - |
| STRAT-003 | Rush Strategy | ⬜ Untested | - | - |
| STRAT-004 | Trasher Strategy | ⬜ Untested | - | - |
| EDGE-001 | Zero Coins | ⬜ Untested | - | - |
| EDGE-002 | Empty Supply | ⬜ Untested | - | - |
| EDGE-003 | Province Exhaustion | ⬜ Untested | - | - |
| EDGE-004 | Large Hand | ⬜ Untested | - | - |
| EDGE-005 | No Valid Actions | ✅ Pass | 2025-12-21 | 1 run, no issues |
| EDGE-006 | Multiple Buys | ⬜ Untested | - | - |
| EDGE-007 | Deck Shuffle | ⬜ Untested | - | - |
| UX-001 | Move Syntax | ⬜ Untested | - | - |
| UX-002 | Phase Transitions | ⚠️ Findings | 2025-12-21 | Minor UX issues noted |
| UX-003 | Error Messages | ⬜ Untested | - | - |

**Legend:** ✅ Pass | ⚠️ Findings | ❌ Fail | 🔄 Retest | ⬜ Untested

---

## Card-Focused Tests

### CARD-001: Chapel Trashing
**Focus**: Test the Chapel card's trash mechanic
**Instructions**:
- Prioritize buying Chapel early
- Use Chapel to trash Copper and Estate cards
- Observe trash pile behavior and deck thinning
**Watch for**: Trash selection UI, multiple card trashing, empty deck edge cases

### CARD-002: Throne Room Doubling
**Focus**: Test Throne Room playing an action twice
**Instructions**:
- Buy Throne Room and various action cards
- Play Throne Room on different actions (Smithy, Village, etc.)
- Try Throne Room on Throne Room if possible
**Watch for**: Action counting, effect doubling, terminal action handling

### CARD-003: Mine Treasure Upgrading
**Focus**: Test Mine's trash-and-gain treasure mechanic
**Instructions**:
- Buy Mine card
- Use Mine to upgrade Copper → Silver → Gold
- Attempt edge cases (Mine with no treasures in hand)
**Watch for**: Treasure selection, gain restrictions, trash-to-gain flow

### CARD-004: Cellar Cycling
**Focus**: Test Cellar's discard-and-draw mechanic
**Instructions**:
- Buy Cellar early
- Use Cellar to discard victory cards and draw fresh
- Try discarding 0 cards, all cards
**Watch for**: Discard selection, draw count matching, shuffle triggers

### CARD-005: Workshop Gaining
**Focus**: Test Workshop's gain-a-card mechanic
**Instructions**:
- Buy Workshop
- Use Workshop to gain cards costing up to 4
- Try gaining from empty piles
**Watch for**: Cost restriction enforcement, gain-to-discard flow

### CARD-006: Witch Attack + Curses
**Focus**: Test Witch's curse-giving attack
**Instructions**:
- Buy Witch
- Play Witch multiple times
- Observe curse pile depletion
**Watch for**: Curse distribution, curse pile exhaustion, solo mode behavior

### CARD-007: Militia Attack
**Focus**: Test Militia's discard-down attack
**Instructions**:
- Buy Militia
- Play Militia and observe opponent discard
- Check coin bonus (+2)
**Watch for**: Discard-to-3 mechanic, solo mode handling

### CARD-008: Council Room Draw + Opponent
**Focus**: Test Council Room's draw mechanic
**Instructions**:
- Buy Council Room
- Play and observe +4 cards, +1 buy
- Check if opponent draws (if applicable)
**Watch for**: Large draw handling, buy counter, opponent interaction

### CARD-009: Laboratory Chaining
**Focus**: Test Laboratory's non-terminal draw
**Instructions**:
- Buy multiple Laboratories
- Chain Labs together in a single turn
- Observe action preservation
**Watch for**: Action counting, deep draw chains

### CARD-010: Festival Economy
**Focus**: Test Festival's multi-resource bonus
**Instructions**:
- Buy Festival
- Play Festival and track +2 coins, +2 actions, +1 buy
- Combine with other action cards
**Watch for**: Resource accumulation, counter accuracy

---

## Strategy Tests

### STRAT-001: Pure Big Money
**Focus**: Test treasure-only strategy
**Instructions**:
- Buy ONLY treasures (Silver, Gold) and victory cards
- Never buy action cards
- Observe game length and final score
**Watch for**: Buy phase efficiency, victory card timing

### STRAT-002: Action Engine
**Focus**: Test action-heavy deck building
**Instructions**:
- Buy as many action cards as possible
- Prioritize Village (for +actions) and draw cards
- Minimize treasure purchases
**Watch for**: Action chaining, terminal collision handling

### STRAT-003: Rush Strategy
**Focus**: Test fast game ending via pile depletion
**Instructions**:
- Attempt to empty 3 supply piles quickly
- Buy from low-quantity piles
- Track pile counts
**Watch for**: Pile count visibility, game end detection

### STRAT-004: Trasher Strategy
**Focus**: Test aggressive deck thinning
**Instructions**:
- Buy Chapel or other trashing cards
- Trash aggressively (Coppers, Estates)
- Build lean deck
**Watch for**: Empty deck scenarios, shuffle with few cards

---

## Edge Case Tests

### EDGE-001: Zero Coins Buy Phase
**Focus**: Test buying with no money
**Instructions**:
- Enter buy phase with 0 coins
- Verify only Copper/Curse are buyable
- Attempt to buy expensive cards
**Watch for**: Error messages, valid move restrictions

### EDGE-002: Empty Supply Pile
**Focus**: Test buying from depleted piles
**Instructions**:
- Play until a pile empties
- Attempt to buy from empty pile
- Verify game end conditions
**Watch for**: Empty pile handling, 3-pile game end

### EDGE-003: Province Pile Exhaustion
**Focus**: Test game end via Province depletion
**Instructions**:
- Buy Provinces until pile empties
- Verify game ends correctly
- Check final score calculation
**Watch for**: Game end trigger, VP counting

### EDGE-004: Large Hand Size
**Focus**: Test unusually large hands
**Instructions**:
- Use draw cards to get 10+ cards in hand
- Play treasures, make purchases
- Observe UI/state handling
**Watch for**: Hand display, treasure playing efficiency

### EDGE-005: No Valid Actions
**Focus**: Test action phase with no playable actions
**Instructions**:
- Start turn with no action cards
- Verify only "end" is valid
- Move directly to buy phase
**Watch for**: Phase transition, move validation

### EDGE-006: Multiple Buys
**Focus**: Test purchasing multiple cards per turn
**Instructions**:
- Get +buy from Festival or similar
- Buy multiple cards in one turn
- Verify coin tracking across buys
**Watch for**: Buy counter, coin deduction

### EDGE-007: Deck Shuffle Mid-Turn
**Focus**: Test shuffle triggered during play
**Instructions**:
- Play draw cards when deck is nearly empty
- Force a shuffle mid-turn
- Verify discard → deck transition
**Watch for**: Shuffle mechanics, card continuity

---

## Usability Tests

### UX-001: Move Syntax Discovery
**Focus**: Can a naive model figure out move syntax?
**Instructions**:
- Provide NO guidance on move format
- Let agent discover from validMoves
- Note any confusion or errors
**Watch for**: Syntax errors, format confusion

### UX-002: Phase Transition Clarity
**Focus**: Are phase changes clear?
**Instructions**:
- Pay attention to phase change messages
- Note if transitions are confusing
- Track action → buy → cleanup flow
**Watch for**: Phase indicators, implicit vs explicit transitions

### UX-003: Error Message Quality
**Focus**: Are error messages helpful?
**Instructions**:
- Deliberately make invalid moves
- Observe error responses
- Note if errors help correct behavior
**Watch for**: Error clarity, recovery guidance

---

## Scenario Selection Guide

| Goal | Recommended Scenarios |
|------|----------------------|
| Test new card | CARD-* matching that card |
| Find crashes | EDGE-001 through EDGE-007 |
| Test tool usability | UX-001 through UX-003 |
| Stress test | STRAT-002 (engine), EDGE-004 (large hand) |
| Quick validation | STRAT-001 (simple), EDGE-005 (minimal) |

---

## Seed Reference for Card Testing

When testing specific cards, use these seeds with `edition="mixed"` to guarantee the card appears in the kingdom.

### Edition Parameter

The MCP `game_session` tool now supports an `edition` parameter:

```
game_session(command="new", seed="mixed-test-0", edition="mixed")
```

**Values:**
- `"1E"` - First Edition cards only
- `"2E"` - Second Edition cards only (default)
- `"mixed"` - All 25 kingdom cards available

### 1E-Only Cards

These 6 cards are First Edition only and **require `edition="mixed"`** to appear:

| Card | Seed | Full Kingdom |
|------|------|--------------|
| **Adventurer** | `mixed-test-0` | Workshop, Feast, Chancellor, Remodel, Adventurer, Festival, Cellar, Witch, Spy, Smithy |
| **Spy** | `mixed-test-0` | Workshop, Feast, Chancellor, Remodel, Adventurer, Festival, Cellar, Witch, Spy, Smithy |
| **Feast** | `mixed-test-0` | Workshop, Feast, Chancellor, Remodel, Adventurer, Festival, Cellar, Witch, Spy, Smithy |
| **Chancellor** | `mixed-test-0` | Workshop, Feast, Chancellor, Remodel, Adventurer, Festival, Cellar, Witch, Spy, Smithy |
| **Woodcutter** | `mixed-test-4` | Smithy, Market, Militia, Woodcutter, Adventurer, Throne Room, Bureaucrat, Chapel, Gardens, Chancellor |
| **Thief** | `mixed-test-15` | Adventurer, Workshop, Smithy, Thief, Moat, Moneylender, Village, Witch, Woodcutter, Chapel |

### Seed Discovery

To find a seed containing a specific card:

```javascript
import { GameEngine } from '@principality/core';

for (let i = 0; i < 100; i++) {
  const seed = `test-${i}`;
  const engine = new GameEngine(seed);
  const state = engine.initializeGame(1, { edition: 'mixed' });

  if (state.selectedKingdomCards.includes('TargetCard')) {
    console.log(`Found: seed="${seed}"`);
    break;
  }
}
```

### Quick Reference: Test Any Card

| Target Card | Seed | Edition |
|-------------|------|---------|
| Adventurer | `mixed-test-0` | `mixed` |
| Bureaucrat | `mixed-test-4` | `mixed` or `2E` |
| Cellar | `mixed-test-0` | `mixed` or `2E` |
| Chancellor | `mixed-test-0` | `mixed` |
| Chapel | `mixed-test-4` | `mixed` or `2E` |
| Council Room | `mixed-test-1` | `mixed` |
| Feast | `mixed-test-0` | `mixed` |
| Festival | `mixed-test-0` | `mixed` or `2E` |
| Gardens | `mixed-test-4` | `mixed` or `2E` |
| Laboratory | `mixed-test-1` | `mixed` |
| Library | _(run discovery)_ | `mixed` or `2E` |
| Market | `mixed-test-4` | `mixed` or `2E` |
| Militia | `mixed-test-4` | `mixed` or `2E` |
| Mine | `mixed-test-0` | `mixed` |
| Moat | `mixed-test-15` | `mixed` or `2E` |
| Moneylender | `mixed-test-15` | `mixed` or `2E` |
| Remodel | `mixed-test-0` | `mixed` or `2E` |
| Smithy | `mixed-test-0` | `mixed` or `2E` |
| Spy | `mixed-test-0` | `mixed` |
| Thief | `mixed-test-15` | `mixed` |
| Throne Room | `mixed-test-4` | `mixed` or `2E` |
| Village | `mixed-test-15` | `mixed` or `2E` |
| Witch | `mixed-test-0` | `mixed` or `2E` |
| Woodcutter | `mixed-test-4` | `mixed` |
| Workshop | `mixed-test-0` | `mixed` or `2E` |
