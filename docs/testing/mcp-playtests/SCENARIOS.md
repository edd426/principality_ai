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
| CARD-010 | Festival | ✅ Pass | 2025-12-23 | +2 actions, +2 coins, +1 buy all verified |
| CARD-011 | Smithy | ✅ Pass | 2025-12-25 | 9 plays, +3 cards consistent |
| CARD-012 | Village | ✅ Pass | 2025-12-25 | 8+ plays, +1 card +2 actions, chaining works |
| CARD-013 | Moat | ✅ Pass | 2025-12-25 | 4 plays, +2 cards verified |
| CARD-014 | Woodcutter | ✅ Pass | 2025-12-25 | 4 plays, +1 buy +2 coins verified |
| CARD-015 | Market | 🔄 Retest | 2025-12-25 | Agent confused (false positive bug report) |
| STRAT-001 | Big Money | ✅ Pass | 2025-12-25 | Multiple runs, no issues |
| STRAT-002 | Action Engine | ⬜ Untested | - | - |
| STRAT-003 | Rush Strategy | ⬜ Untested | - | - |
| STRAT-004 | Trasher Strategy | ⬜ Untested | - | - |
| EDGE-001 | Zero Coins | ✅ Pass | 2025-12-25 | Only Copper/Curse available at 0 coins |
| EDGE-002 | Empty Supply | ⬜ Untested | - | - |
| EDGE-003 | Province Exhaustion | ✅ Pass | 2025-12-25 | Province buying works, game end detection correct |
| EDGE-004 | Large Hand | ⬜ Untested | - | - |
| EDGE-005 | No Valid Actions | ✅ Pass | 2025-12-21 | 1 run, no issues |
| EDGE-006 | Multiple Buys | ✅ Pass | 2025-12-25 | Festival +1 buy enabled 2 purchases |
| EDGE-007 | Deck Shuffle | ✅ Pass | 2025-12-25 | Shuffle works transparently |
| UX-001 | Move Syntax | ✅ Pass | 2025-12-25 | Clear syntax, good error messages |
| UX-002 | Phase Transitions | ⚠️ Findings | 2025-12-21 | Minor UX issues noted |
| UX-003 | Error Messages | ⬜ Untested | - | - |
| EDGE-008 | Throne Room + Militia | ⬜ Untested | - | 2-player scenario |
| EDGE-009 | Curse Pile Exhaustion | ⬜ Untested | - | 2-player scenario |
| EDGE-010 | Adventurer No Treasures | ⬜ Untested | - | Solo edge case |
| EDGE-011 | Library All Actions | ⬜ Untested | - | Solo edge case |
| MULTI-001 | Attack Resolution | ✅ Pass | 2026-01-02 | 2-player: Militia auto-discard works |
| MULTI-002 | Moat Reaction | ⬜ Untested | - | 2-player: Moat blocks |
| MULTI-003 | Witch Curse Giving | ✅ Pass | 2026-01-02 | 2-player: Curse given, +2 cards works |
| MULTI-004 | Turn Cycling | ✅ Pass | 2026-01-02 | 2-player: P0→P1→P0 verified |

**Legend:** ✅ Pass | ⚠️ Findings | ❌ Fail | 🔄 Retest | ⬜ Untested

**Coverage Summary**: 25/37 scenarios tested (68%), 24 passed, 1 needs retest

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

### EDGE-008: Throne Room + Militia (2-player)
**Focus**: Test double attack via Throne Room
**Setup**: `seed="2p-throne-militia"`, `edition="mixed"`, `numPlayers=2`
**Instructions**:
- Buy Throne Room and Militia
- Play Throne Room on Militia
- Verify opponent discards twice (should end at 3 cards, not 1)
**Watch for**: Double attack resolution, opponent response

### EDGE-009: Curse Pile Exhaustion (2-player)
**Focus**: Test Witch when Curse pile is nearly empty
**Setup**: `seed="2p-witch-curse"`, `edition="mixed"`, `numPlayers=2`
**Instructions**:
- Play Witch repeatedly to deplete Curse pile
- Verify final Witch play when 0-1 Curses remain
- Check that no crash occurs
**Watch for**: Empty pile handling, Curse distribution

### EDGE-010: Adventurer No Treasures
**Focus**: Test Adventurer when deck has no treasures
**Setup**: `seed="mixed-test-0"`, `edition="mixed"`, `numPlayers=1`
**Instructions**:
- Use Chapel to trash all Coppers
- Play Adventurer with no treasures in deck
- Verify graceful handling (draws 0 treasures, no crash)
**Watch for**: Edge case handling, error messages

### EDGE-011: Library All Actions
**Focus**: Test Library when deck contains only action cards
**Setup**: Custom scenario with action-heavy deck
**Instructions**:
- Build deck with many action cards
- Play Library aiming to draw to 7
- Verify set-aside mechanics work correctly
**Watch for**: Library's skip-action behavior

---

## 2-Player Scenarios

These scenarios require `numPlayers=2`. The opponent auto-plays Big Money strategy.

### MULTI-001: Attack Resolution (Militia)
**Focus**: Test Militia attack affects opponent
**Setup**: `seed="2p-militia-test"`, `edition="mixed"`, `numPlayers=2`, `kingdomCards=["Militia"]`
**Instructions**:
- Buy and play Militia
- Verify opponent hand reduced to 3 cards
- Check +$2 is gained
**Watch for**: Attack resolution, hand size change

### MULTI-002: Moat Reaction
**Focus**: Test Moat blocks attacks
**Setup**: `seed="2p-moat-test"`, `edition="mixed"`, `numPlayers=2`, `kingdomCards=["Militia", "Moat"]`
**Instructions**:
- Ensure opponent has Moat in hand
- Play attack card (Militia or Witch)
- Verify attack is blocked when Moat revealed
**Watch for**: Moat auto-reveal, attack cancellation

### MULTI-003: Witch Curse Giving
**Focus**: Test Witch gives Curse to opponent
**Setup**: `seed="2p-witch-test"`, `edition="mixed"`, `numPlayers=2`, `kingdomCards=["Witch"]`
**Instructions**:
- Buy and play Witch
- Verify opponent gains Curse
- Check Curse pile decrements
- Verify +2 cards for player
**Watch for**: Curse distribution, draw effect

### MULTI-004: Turn Cycling
**Focus**: Test P0 → P1 → P0 turn rotation
**Setup**: `seed="2p-cycle-test"`, `edition="mixed"`, `numPlayers=2`
**Instructions**:
- Complete full turn (action → buy → cleanup)
- Verify opponent takes automated turn
- Confirm turn returns to Player 0
- Check turn number increments correctly
**Watch for**: Turn rotation, opponentTurnSummary field

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
| Mine | `mixed-test-1` | `mixed` |
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

---

## Playtesting Gaps

### Cards Not Yet Tested (10 of 25)

The following kingdom cards have no dedicated playtest scenarios:

| Card | Seed | Complexity | Priority |
|------|------|------------|----------|
| Adventurer | `mixed-test-0` | Medium | Low (1E-only, rarely used) |
| Bureaucrat | `mixed-test-4` | Medium | Medium |
| Chancellor | `mixed-test-0` | Low | Low (1E-only) |
| Feast | `mixed-test-0` | Medium | Low (1E-only, self-trashing) |
| Gardens | `mixed-test-4` | Low | Medium (VP counting) |
| Library | _(run discovery)_ | High | Medium |
| Moneylender | `mixed-test-15` | Medium | High (trash + gain) |
| Remodel | `mixed-test-0` | High | High (trash + gain) |
| Spy | `mixed-test-0` | High | Low (1E-only, complex) |
| Thief | `mixed-test-15` | High | Low (1E-only, attack) |

### Scenarios Not Yet Tested - Solo (7 of 29)

| ID | Focus | Complexity | Priority |
|----|-------|------------|----------|
| CARD-015 | Market | Low | High (needs retest - agent confused) |
| STRAT-002 | Action Engine | High | Low (complex strategy) |
| STRAT-003 | Rush Strategy | High | Medium (pile depletion) |
| STRAT-004 | Trasher Strategy | Medium | Medium |
| EDGE-002 | Empty Supply | Medium | High (game end condition) |
| EDGE-004 | Large Hand | Medium | Low |
| UX-003 | Error Messages | Low | Low |

### New Solo Edge Cases

| ID | Focus | Complexity | Priority |
|----|-------|------------|----------|
| EDGE-010 | Adventurer No Treasures | Medium | Medium |
| EDGE-011 | Library All Actions | Medium | Medium |

### New 2-Player Scenarios (requires numPlayers=2)

| ID | Focus | Complexity | Priority |
|----|-------|------------|----------|
| MULTI-001 | Attack Resolution (Militia) | Medium | High |
| MULTI-002 | Moat Reaction | Medium | High |
| MULTI-003 | Witch Curse Giving | Medium | High |
| MULTI-004 | Turn Cycling | Low | High |
| EDGE-008 | Throne Room + Militia | Medium | Medium |
| EDGE-009 | Curse Pile Exhaustion | Medium | Medium |

### Recommended Next Steps

1. **High Priority**: MULTI-001-004 (2-player core mechanics), EDGE-002 (Empty Supply), CARD-015 (Market retest)
2. **Medium Priority**: EDGE-008, EDGE-009, EDGE-010, EDGE-011, STRAT-003, STRAT-004
3. **Low Priority**: 1E-only cards (Adventurer, Chancellor, Feast, Spy, Thief)

---

## Haiku Agent Recommendations

### Tests Haiku Handles Well

Haiku agents excel at **mechanical, deterministic tests** with clear instructions:

| Category | Good For Haiku | Why |
|----------|---------------|-----|
| Simple card effects | Smithy, Village, Moat, Laboratory | Single effect, easy to verify |
| Treasure/economy | Silver, Gold buying | Predictable coin math |
| Basic edge cases | EDGE-001, EDGE-005, EDGE-007 | Clear pass/fail criteria |
| Move syntax | UX-001 | Following documented patterns |
| +Buy mechanics | Woodcutter, Festival, Market | Simple counter tracking |

**Haiku Success Rate**: 9/10 tests passed (90%) when given explicit seeds and editions.

### Tests Requiring Smarter Models

These tests involve complex decision-making or multi-step reasoning:

| Category | Avoid for Haiku | Why |
|----------|----------------|-----|
| Strategy tests | STRAT-002, STRAT-003 | Require long-term planning |
| Complex cards | Throne Room, Remodel, Library | Multi-step decisions |
| Attack cards | Spy, Thief | Complex opponent interactions |
| Self-trashing | Feast | Timing decisions |
| Pending effects | Mine, Workshop | Multi-phase resolution |

### Haiku Best Practices

1. **Always provide explicit seeds and editions** - Don't rely on haiku to look them up
2. **Give mechanical instructions** - "Play card X, verify Y happens"
3. **Set turn limits** - "Play for 15 turns or until game ends"
4. **Keep focus narrow** - One card or mechanic per test
5. **Use `play_treasure all`** - Reduces decision complexity

### Example: Good Haiku Prompt

```
Test CARD-011: Smithy

SETUP:
- Seed: mixed-test-0
- Edition: mixed

STRATEGY:
1. Buy Silver until you have 4+ coins
2. Buy Smithy (cost 4)
3. When Smithy in hand: play it, verify +3 cards
4. Continue buying treasures/provinces

Play for 15 turns. Report if Smithy ever gives ≠3 cards.
```

### Example: Bad Haiku Prompt

```
Test the Throne Room card and see if it works correctly with
different action cards. Try various combinations and report
any issues you find.
```

(Too open-ended, no specific verification criteria)
