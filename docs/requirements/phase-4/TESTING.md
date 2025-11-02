# Phase 4 Testing Specifications

**Status**: DRAFT
**Created**: 2025-11-02
**Phase**: 4
**Test Count**: 92 tests (48 unit, 29 integration, 15 E2E)
**Owner**: requirements-architect
**Target Coverage**: 95%+

---

## Table of Contents

- [Test Organization](#test-organization)
- [Feature 1: Trashing System Tests](#feature-1-trashing-system-tests)
- [Feature 2: Gaining System Tests](#feature-2-gaining-system-tests)
- [Feature 3: Attack System Tests](#feature-3-attack-system-tests)
- [Feature 4: Reaction System Tests](#feature-4-reaction-system-tests)
- [Feature 5: Duplication & Special Cards Tests](#feature-5-duplication--special-cards-tests)
- [Integration Tests](#integration-tests)
- [End-to-End Tests](#end-to-end-tests)
- [Backward Compatibility Tests](#backward-compatibility-tests)

---

## Test Organization

### Test Structure

```
packages/core/tests/
  ├── trashing.test.ts          (12 unit tests)
  ├── gaining.test.ts           (6 unit tests)
  ├── attacks.test.ts           (15 unit tests)
  ├── reactions.test.ts         (6 unit tests)
  ├── special-cards.test.ts     (9 unit tests)
  ├── integration/
  │   ├── trash-pile.test.ts    (5 tests)
  │   ├── gaining-mechanics.test.ts (4 tests)
  │   ├── attack-flow.test.ts   (10 tests)
  │   ├── throne-room.test.ts   (6 tests)
  │   └── card-combos.test.ts   (4 tests)
  └── e2e/
      ├── trashing-strategy.test.ts (3 tests)
      ├── attack-defense.test.ts    (5 tests)
      ├── throne-room-combos.test.ts (3 tests)
      ├── gardens-strategy.test.ts  (2 tests)
      └── full-base-set.test.ts     (2 tests)
```

### Test Naming Convention

```typescript
// Format: FEATURE-CARDNAME-TESTID: Description
describe('UT-CHAPEL-1: Trash 0-4 cards', () => {
  // @req: Chapel must trash up to 4 cards
  // @edge: Can trash 0 cards (no error)
  // @why: Optional trashing is core to Chapel strategy
});

describe('IT-ATTACK-FLOW-1: Militia with Moat', () => {
  // @req: Moat blocks Militia attack
  // @integration: Attack resolution + reaction system
});

describe('E2E-FULL-GAME-1: Complete game with all 25 cards', () => {
  // @req: All cards work in realistic game
  // @e2e: Full game simulation
});
```

### Coverage Target

- **Overall**: 95%+ coverage
- **Core Mechanics**: 100% (trashing, gaining, attacks, reactions)
- **Card Logic**: 95%+ (all 17 new cards)
- **Edge Cases**: 90%+ (unusual combinations, empty piles)

---

## Feature 1: Trashing System Tests

### UT-CHAPEL-1: Trash 0-4 cards

```typescript
describe('Chapel - Trash up to 4 cards', () => {
  // @req: Chapel must trash up to 4 cards from hand
  // @edge: Can trash 0, 1, 2, 3, or 4 cards

  it('should trash 0 cards (skip)', () => {
    const engine = new GameEngine('seed-chapel-1');
    const state = engine.initializeGame(1);
    // ... setup hand with Chapel
    const result = engine.executeMove(state, { type: 'play_action', card: 'Chapel' });
    const trashResult = engine.executeMove(result.newState, { type: 'trash_cards', cards: [] });

    expect(trashResult.success).toBe(true);
    expect(trashResult.newState.trash).toEqual([]);
    expect(trashResult.newState.players[0].hand.length).toBe(4);  // 5 - 1 Chapel
  });

  it('should trash 1 card', () => {
    // Setup: [Chapel, Copper, Estate, Duchy, Province]
    // Trash: [Copper]
    // Expected: trash = [Copper], hand = [Estate, Duchy, Province]
  });

  it('should trash 4 cards', () => {
    // Setup: [Chapel, Copper, Copper, Estate, Estate, Duchy]
    // Trash: [Copper, Copper, Estate, Estate]
    // Expected: trash = [Copper, Copper, Estate, Estate], hand = [Duchy]
  });

  it('should error when trashing > 4 cards', () => {
    // Setup: [Chapel, C, C, C, C, C] (6 total in hand)
    // Trash attempt: [C, C, C, C, C] (5 cards)
    // Expected: Error: "Chapel can only trash up to 4 cards"
  });

  it('should error when trashing cards not in hand', () => {
    // Setup: [Chapel, Copper, Estate]
    // Trash attempt: [Gold] (not in hand)
    // Expected: Error: "Cards not in hand: Gold"
  });
});
```

### UT-REMODEL-1: Trash and gain upgrade

```typescript
describe('Remodel - Trash 1, gain card +$2', () => {
  // @req: Remodel trashes 1 card, gains card costing up to (trashed cost + $2)

  it('should upgrade Estate to Smithy', () => {
    // Setup: [Remodel, Estate, Copper, Silver]
    // Trash: Estate ($2)
    // Gain: Smithy ($4) (max = $2 + $2 = $4)
    // Expected: trash = [Estate], discard gains Smithy
  });

  it('should upgrade Silver to Gold', () => {
    // Setup: [Remodel, Silver]
    // Trash: Silver ($3)
    // Gain: Gold ($6) (max = $3 + $2 = $6, Gold costs $6)
  });

  it('should error when gaining card too expensive', () => {
    // Setup: [Remodel, Copper]
    // Trash: Copper ($0)
    // Gain attempt: Province ($8) (max = $0 + $2 = $2, Province costs $8)
    // Expected: Error: "Card costs more than allowed"
  });

  it('should error when trashing nothing', () => {
    // Setup: [Remodel] (empty hand after play)
    // Expected: Error: "Must trash a card"
  });

  it('should error when gaining from empty pile', () => {
    // Setup: [Remodel, Estate], Smithy supply = 0
    // Trash: Estate
    // Gain attempt: Smithy (not available)
    // Expected: Error: "Card not available"
  });
});
```

### UT-MINE-1: Trash treasure, gain treasure to hand

```typescript
describe('Mine - Upgrade treasures', () => {
  // @req: Mine trashes Treasure, gains Treasure +$3 to hand

  it('should upgrade Copper to Silver', () => {
    // Setup: [Mine, Copper, Estate]
    // Trash: Copper ($0)
    // Gain: Silver ($3) to hand (not discard)
    // Expected: hand = [Estate, Silver], trash = [Copper]
  });

  it('should upgrade Silver to Gold (to hand)', () => {
    // Setup: [Mine, Silver, Copper]
    // Trash: Silver ($3)
    // Gain: Gold ($6) to hand
    // Expected: hand = [Copper, Gold], can play Gold in buy phase
  });

  it('should error when no treasures in hand', () => {
    // Setup: [Mine, Estate, Duchy]
    // Expected: Error: "Must trash a Treasure"
  });

  it('should error when gaining non-treasure', () => {
    // Setup: [Mine, Copper]
    // Trash: Copper
    // Gain attempt: Estate (not a Treasure)
    // Expected: Error: "Must gain a Treasure"
  });

  it('should handle Mine Gold (no higher treasure)', () => {
    // Setup: [Mine, Gold]
    // Trash: Gold ($6)
    // Gain: Gold ($9 max, but Gold costs $6)
    // Expected: Can gain another Gold
  });
});
```

### UT-MONEYLENDER-1: Trash Copper for +$3

```typescript
describe('Moneylender - Trash Copper for coins', () => {
  // @req: Moneylender trashes Copper for +$3

  it('should trash Copper and gain +$3', () => {
    // Setup: [Moneylender, Copper, Silver]
    // Execute: Play Moneylender, trash Copper
    // Expected: coins += 3, trash = [Copper], hand = [Silver]
  });

  it('should have no effect when no Copper', () => {
    // Setup: [Moneylender, Silver, Gold]
    // Execute: Play Moneylender
    // Expected: No coins gained, no trash, message: "No Copper to trash"
  });

  it('should trash only 1 Copper (if multiple)', () => {
    // Setup: [Moneylender, Copper, Copper, Copper]
    // Execute: Play Moneylender, select first Copper
    // Expected: coins += 3, trash = [Copper], hand = [Copper, Copper]
  });

  it('should work with Throne Room (+$6)', () => {
    // Setup: [Throne Room, Moneylender, Copper, Copper]
    // Execute: Play Throne Room on Moneylender
    // Expected: coins += 6, trash = [Copper, Copper]
  });
});
```

---

## Feature 2: Gaining System Tests

### UT-WORKSHOP-1: Gain card up to $4

```typescript
describe('Workshop - Gain card up to $4', () => {
  // @req: Workshop gains card costing up to $4

  it('should gain Smithy ($4)', () => {
    // Setup: [Workshop, Copper, Estate]
    // Gain: Smithy ($4)
    // Expected: discard gains Smithy, supply.Smithy -= 1
  });

  it('should gain Silver ($3)', () => {
    // Setup: [Workshop]
    // Gain: Silver ($3)
    // Expected: discard gains Silver
  });

  it('should error when gaining card > $4', () => {
    // Setup: [Workshop]
    // Gain attempt: Market ($5)
    // Expected: Error: "Card too expensive"
  });

  it('should error when supply empty', () => {
    // Setup: [Workshop], Smithy supply = 0
    // Gain attempt: Smithy
    // Expected: Error: "Supply exhausted"
  });

  it('should gain Workshop (recursive)', () => {
    // Setup: [Workshop]
    // Gain: Workshop ($3)
    // Expected: discard gains Workshop, can use next turn
  });

  it('should work with Throne Room (gain 2 cards)', () => {
    // Setup: [Throne Room, Workshop]
    // Execute: Play Throne Room on Workshop
    // Gain: Smithy, Silver
    // Expected: discard = [Smithy, Silver]
  });
});
```

### UT-FEAST-1: Trash self, gain card up to $5

```typescript
describe('Feast - Trash self, gain up to $5', () => {
  // @req: Feast trashes itself, gains card up to $5

  it('should trash Feast and gain Duchy', () => {
    // Setup: [Feast, Copper]
    // Execute: Play Feast
    // Gain: Duchy ($5)
    // Expected: trash = [Feast], discard = [Duchy]
  });

  it('should trash Feast and gain Market', () => {
    // Setup: [Feast]
    // Gain: Market ($5)
    // Expected: trash = [Feast], discard = [Market]
  });

  it('should error when gaining card > $5', () => {
    // Setup: [Feast]
    // Gain attempt: Gold ($6)
    // Expected: Error: "Card too expensive"
  });

  it('should not discard Feast after cleanup (already trashed)', () => {
    // Setup: Play Feast, gain Duchy
    // Cleanup phase
    // Expected: Feast in trash (not discard)
  });

  it('should work with Throne Room (gain 2, trash 1)', () => {
    // Setup: [Throne Room, Feast]
    // Execute: Play Throne Room on Feast
    // Gain: Duchy, Market
    // Expected: trash = [Feast], discard = [Duchy, Market]
  });

  it('should gain Province if affordable', () => {
    // Setup: [Feast] (Feast costs $4, but gains up to $5)
    // Gain: Province? (Province costs $8, > $5)
    // Expected: Error (Province too expensive)
    // Alternative gain: Duchy ($5)
  });
});
```

---

## Feature 3: Attack System Tests

### UT-MILITIA-1: Opponents discard to 3 cards

```typescript
describe('Militia - Discard attack', () => {
  // @req: Militia gives +$2, opponents discard to 3 cards

  it('should grant attacker +$2', () => {
    // Setup: 2-player game, P0 plays Militia
    // Expected: P0 coins += 2
  });

  it('should force opponent to discard to 3 cards', () => {
    // Setup: P1 hand = [C, C, S, E, D] (5 cards)
    // P0 plays Militia
    // Expected: P1 prompted to discard 2 cards
    // P1 discards: [C, E]
    // Result: P1 hand = [C, S, D] (3 cards)
  });

  it('should not require discard if opponent has ≤ 3 cards', () => {
    // Setup: P1 hand = [C, S, E] (3 cards)
    // P0 plays Militia
    // Expected: No discard required, P1 hand unchanged
  });

  it('should be blocked by Moat', () => {
    // Setup: P1 hand = [Moat, C, C, S, E] (5 cards)
    // P0 plays Militia
    // P1 reveals Moat
    // Expected: No discard, P1 hand = [Moat, C, C, S, E]
  });

  it('should work in 3-player game (2 opponents)', () => {
    // Setup: 3 players, P0 plays Militia
    // P1 hand = 5 cards, P2 hand = 4 cards
    // Expected: P1 discards to 3, P2 discards to 3
  });

  it('should work with Throne Room (+$4, discard twice)', () => {
    // Setup: [Throne Room, Militia], P1 hand = 7 cards
    // Execute: Throne Room on Militia
    // Expected: P0 coins += 4
    // P1 discards to 3 (first), then discards to 3 again (if hand > 3)
    // If P1 already at 3: no second discard
  });
});
```

### UT-WITCH-1: Opponents gain Curse

```typescript
describe('Witch - Curse attack', () => {
  // @req: Witch gives +2 Cards, opponents gain Curse

  it('should grant attacker +2 Cards', () => {
    // Setup: P0 plays Witch
    // Expected: P0 hand += 2 cards
  });

  it('should give opponent Curse', () => {
    // Setup: P0 plays Witch, Curse supply = 10
    // Expected: P1 discard gains Curse, supply.Curse = 9
  });

  it('should not give Curse if supply empty', () => {
    // Setup: Curse supply = 0
    // P0 plays Witch
    // Expected: P1 doesn't gain Curse (attack fizzles)
  });

  it('should be blocked by Moat', () => {
    // Setup: P1 has Moat
    // P0 plays Witch
    // P1 reveals Moat
    // Expected: P1 doesn't gain Curse
  });

  it('should work in 3-player game', () => {
    // Setup: 3 players, Curse supply = 20
    // P0 plays Witch
    // Expected: P1 gains Curse, P2 gains Curse, supply = 18
  });

  it('should work with Throne Room (+4 Cards, 2 Curses)', () => {
    // Setup: [Throne Room, Witch]
    // Execute: Throne Room on Witch
    // Expected: P0 draws 4 cards, P1 gains 2 Curses
  });
});
```

### UT-BUREAUCRAT-1: Gain Silver to deck, opponents topdeck Victory

```typescript
describe('Bureaucrat - Topdeck attack', () => {
  // @req: Bureaucrat gains Silver to deck, opponents topdeck Victory

  it('should gain Silver to top of deck', () => {
    // Setup: P0 plays Bureaucrat, Silver supply = 40
    // Expected: P0 deck = [Silver, ...rest], supply.Silver = 39
  });

  it('should force opponent to topdeck Victory card', () => {
    // Setup: P1 hand = [C, S, Estate, Duchy]
    // P0 plays Bureaucrat
    // P1 selects Estate to topdeck
    // Expected: P1 deck = [Estate, ...rest], hand = [C, S, Duchy]
  });

  it('should reveal hand if no Victory cards', () => {
    // Setup: P1 hand = [C, S, Smithy] (no Victory)
    // P0 plays Bureaucrat
    // Expected: P1 reveals hand, no topdeck
  });

  it('should be blocked by Moat', () => {
    // Setup: P1 hand = [Moat, Estate]
    // P0 plays Bureaucrat
    // P1 reveals Moat
    // Expected: P1 doesn't topdeck Estate
  });

  it('should work with Throne Room (2 Silvers to deck)', () => {
    // Setup: [Throne Room, Bureaucrat]
    // Execute: Throne Room on Bureaucrat
    // Expected: P0 deck = [Silver, Silver, ...rest]
  });
});
```

### UT-SPY-1: All players reveal top card

```typescript
describe('Spy - Reveal and decide', () => {
  // @req: Spy grants +1 Card, +1 Action, all reveal top card

  it('should grant +1 Card, +1 Action', () => {
    // Setup: P0 plays Spy
    // Expected: P0 hand += 1, actions += 1
  });

  it('should reveal all players top card (including attacker)', () => {
    // Setup: P0 deck top = Copper, P1 deck top = Estate
    // P0 plays Spy
    // Expected: P0 reveals Copper, P1 reveals Estate
  });

  it('should allow attacker to decide (discard or keep)', () => {
    // Setup: P0 reveals Copper (own card)
    // Decide: discard
    // Expected: Copper → P0 discard
    // Setup: P1 reveals Estate
    // Decide: keep
    // Expected: Estate stays on P1 deck
  });

  it('should be blocked by Moat (opponent doesn\'t reveal)', () => {
    // Setup: P1 has Moat
    // P0 plays Spy
    // P1 reveals Moat
    // Expected: P0 reveals own card, P1 doesn't reveal
  });

  it('should work with Throne Room (reveal 2x)', () => {
    // Setup: [Throne Room, Spy]
    // Execute: Throne Room on Spy
    // Expected: +2 Cards, +2 Actions, reveal top card twice
  });
});
```

### UT-THIEF-1: Steal treasures

```typescript
describe('Thief - Treasure steal attack', () => {
  // @req: Thief makes opponents reveal 2 cards, trash Treasure, attacker may gain

  it('should make opponent reveal 2 cards', () => {
    // Setup: P1 deck = [Silver, Copper, Estate, ...]
    // P0 plays Thief
    // Expected: P1 reveals Silver, Copper
  });

  it('should trash selected Treasure', () => {
    // Setup: P1 reveals [Silver, Copper]
    // P0 selects: Silver to trash
    // Expected: trash = [Silver], P1 discard = [Copper]
  });

  it('should allow attacker to gain trashed Treasure', () => {
    // Setup: P1 reveals [Silver, Copper], P0 selects Silver
    // P0 chooses: gain Silver
    // Expected: trash temporarily has Silver, then moves to P0 discard
  });

  it('should discard both if no Treasures revealed', () => {
    // Setup: P1 reveals [Estate, Duchy]
    // Expected: No trash, both → P1 discard
  });

  it('should be blocked by Moat', () => {
    // Setup: P1 has Moat
    // P0 plays Thief
    // P1 reveals Moat
    // Expected: P1 doesn't reveal 2 cards
  });

  it('should work with Throne Room (reveal 4 total)', () => {
    // Setup: [Throne Room, Thief]
    // Execute: Throne Room on Thief
    // Expected: Opponent reveals 4 cards (2 + 2), attacker selects 2 Treasures
  });
});
```

---

## Feature 4: Reaction System Tests

### UT-MOAT-1: Play as action

```typescript
describe('Moat - Action and Reaction', () => {
  // @req: Moat as action: +2 Cards. As reaction: block attacks

  it('should grant +2 Cards when played', () => {
    // Setup: [Moat, C, E]
    // Execute: Play Moat
    // Expected: hand += 2 cards (draw from deck)
  });

  it('should block Militia attack', () => {
    // Setup: P1 hand = [Moat, C, C, S, E] (5 cards)
    // P0 plays Militia
    // P1 reveals Moat
    // Expected: P1 hand = [Moat, C, C, S, E] (no discard)
  });

  it('should block Witch attack', () => {
    // Setup: P1 has Moat
    // P0 plays Witch
    // P1 reveals Moat
    // Expected: P1 doesn't gain Curse
  });

  it('should block Bureaucrat attack', () => {
    // Setup: P1 hand = [Moat, Estate]
    // P0 plays Bureaucrat
    // P1 reveals Moat
    // Expected: P1 doesn't topdeck Estate
  });

  it('should block Spy attack', () => {
    // Setup: P1 has Moat
    // P0 plays Spy
    // P1 reveals Moat
    // Expected: P1 doesn't reveal top card
  });

  it('should block Thief attack', () => {
    // Setup: P1 has Moat
    // P0 plays Thief
    // P1 reveals Moat
    // Expected: P1 doesn't reveal 2 cards
  });

  it('should stay in hand after reveal', () => {
    // Setup: P1 hand = [Moat, C, E]
    // P0 plays Militia
    // P1 reveals Moat
    // Expected: Moat still in hand (not discarded)
  });

  it('should work with Throne Room (+4 Cards)', () => {
    // Setup: [Throne Room, Moat]
    // Execute: Throne Room on Moat
    // Expected: Draw 4 cards total
  });
});
```

---

## Feature 5: Duplication & Special Cards Tests

### UT-THRONE-1: Play action twice

```typescript
describe('Throne Room - Action duplication', () => {
  // @req: Throne Room plays action card twice

  it('should play Smithy twice (+6 Cards)', () => {
    // Setup: [Throne Room, Smithy, C]
    // Execute: Throne Room on Smithy
    // Expected: Draw 6 cards total (3 + 3)
  });

  it('should play Village twice (+2 Cards, +4 Actions)', () => {
    // Setup: [Throne Room, Village]
    // Execute: Throne Room on Village
    // Expected: Draw 2 cards, gain 4 actions
  });

  it('should have no effect if no action cards', () => {
    // Setup: [Throne Room, C, S, E]
    // Execute: Play Throne Room
    // Expected: No selection, Throne Room wasted
  });

  it('should play Chapel twice (trash 8 cards)', () => {
    // Setup: [Throne Room, Chapel, C, C, C, C, E, E, E, E]
    // Execute: Throne Room on Chapel
    // Trash: [C, C, C, C] (first), [E, E, E, E] (second)
    // Expected: trash = 8 cards
  });

  it('should play Feast twice (gain 2, trash 1)', () => {
    // Setup: [Throne Room, Feast]
    // Execute: Throne Room on Feast
    // Expected: Feast trashed once, gain 2 cards up to $5
  });

  it('should play Militia twice (+$4, discard once)', () => {
    // Setup: [Throne Room, Militia], P1 hand = 7 cards
    // Execute: Throne Room on Militia
    // Expected: +$4, P1 discards to 3, then stays at 3
  });

  it('should play Throne Room on Throne Room (4x multiplier)', () => {
    // Setup: [Throne Room, Throne Room, Smithy]
    // Execute: Throne Room #1 on Throne Room #2, which plays Smithy
    // Expected: Smithy played 4 times = +12 Cards
  });

  it('should play Library twice (draw to 7 once)', () => {
    // Setup: [Throne Room, Library], hand = 2 cards
    // Execute: Throne Room on Library
    // First: Draw to 7
    // Second: Already at 7, no draw
    // Expected: Hand = 7 cards total
  });
});
```

### UT-ADVENTURER-1: Reveal until 2 Treasures

```typescript
describe('Adventurer - Treasure reveal', () => {
  // @req: Adventurer reveals until 2 Treasures found

  it('should reveal until 2 Treasures', () => {
    // Setup: Deck = [Copper, Estate, Silver, Gold, Duchy]
    // Execute: Play Adventurer
    // Reveal: Copper (keep), Estate (discard), Silver (keep)
    // Expected: hand gains [Copper, Silver], discard gains [Estate]
  });

  it('should shuffle discard if deck runs out', () => {
    // Setup: Deck = [Copper], Discard = [Silver, Estate]
    // Execute: Play Adventurer
    // Reveal: Copper (keep), shuffle discard, reveal Silver (keep)
    // Expected: hand gains [Copper, Silver]
  });

  it('should gain < 2 Treasures if not enough available', () => {
    // Setup: Deck = [Copper, Estate, Duchy], Discard = []
    // Execute: Play Adventurer
    // Reveal: Copper (keep), Estate (discard), Duchy (discard)
    // Expected: hand gains [Copper], discard gains [Estate, Duchy]
  });

  it('should work with Throne Room (4 Treasures)', () => {
    // Setup: [Throne Room, Adventurer], Deck = [C, C, S, S, G, G, E, E]
    // Execute: Throne Room on Adventurer
    // Expected: hand gains 4 Treasures
  });

  it('should handle all-Treasure deck', () => {
    // Setup: Deck = [Gold, Silver, Copper, Copper]
    // Execute: Play Adventurer
    // Reveal: Gold (keep), Silver (keep), stop
    // Expected: hand gains [Gold, Silver]
  });
});
```

### UT-CHANCELLOR-1: Deck to discard conversion

```typescript
describe('Chancellor - Deck cycling', () => {
  // @req: Chancellor grants +$2, may put deck into discard

  it('should grant +$2', () => {
    // Setup: Play Chancellor
    // Expected: coins += 2
  });

  it('should convert deck to discard if chosen', () => {
    // Setup: Deck = [C, S, G, E, D] (5 cards)
    // Execute: Play Chancellor, choose yes
    // Expected: Deck = [], Discard += 5 cards
  });

  it('should not convert deck if declined', () => {
    // Setup: Deck = [C, S, G, E, D]
    // Execute: Play Chancellor, choose no
    // Expected: Deck unchanged
  });

  it('should work with Throne Room (+$4, choose 2x)', () => {
    // Setup: [Throne Room, Chancellor], Deck = 10 cards
    // Execute: Throne Room on Chancellor
    // Choose: yes (first), deck → discard (5 cards)
    // Choose: yes (second), deck → discard (5 more cards)
    // Expected: +$4, deck empty
  });
});
```

### UT-LIBRARY-1: Draw to 7, skip actions

```typescript
describe('Library - Draw to 7', () => {
  // @req: Library draws until 7 cards, may skip actions

  it('should draw to 7 cards', () => {
    // Setup: Hand = [Library, C] (2 cards), Deck = [S, G, E, D, P, ...]
    // Execute: Play Library
    // Expected: Draw 5 cards, hand = 7 total
  });

  it('should allow skipping action cards', () => {
    // Setup: Hand = [Library, C], Deck = [Village, S, Smithy, G, E, D, P]
    // Execute: Play Library
    // Prompt: Skip Village? yes → set aside
    // Prompt: Skip Smithy? no → to hand
    // Draw until 7 cards
    // Expected: hand = 7 cards (includes Smithy), discard gains Village
  });

  it('should not draw if already at 7+ cards', () => {
    // Setup: Hand = [Library, C, C, S, S, G, G, E] (8 cards)
    // Execute: Play Library
    // Expected: No draw, hand = 8 cards
  });

  it('should work with Throne Room (draw to 7 once)', () => {
    // Setup: [Throne Room, Library], Hand = 2 cards
    // Execute: Throne Room on Library
    // First: Draw to 7
    // Second: Already at 7, no draw
    // Expected: Hand = 7 cards
  });

  it('should handle deck running out', () => {
    // Setup: Hand = [Library, C], Deck = [S, G], Discard = []
    // Execute: Play Library
    // Draw: S, G, shuffle (empty discard), stop
    // Expected: hand = 4 cards (Library + C + S + G)
  });
});
```

### UT-GARDENS-1: Dynamic VP calculation

```typescript
describe('Gardens - Variable victory points', () => {
  // @req: Gardens worth 1 VP per 10 cards in deck

  it('should calculate VP with 30 cards (3 VP per Gardens)', () => {
    // Setup: Total cards = 30, Gardens count = 1
    // Expected: 1 * floor(30/10) = 3 VP
  });

  it('should calculate VP with multiple Gardens', () => {
    // Setup: Total cards = 30, Gardens count = 3
    // Expected: 3 * floor(30/10) = 9 VP
  });

  it('should round down (19 cards = 1 VP)', () => {
    // Setup: Total cards = 19, Gardens count = 1
    // Expected: 1 * floor(19/10) = 1 VP
  });

  it('should give 0 VP if < 10 cards', () => {
    // Setup: Total cards = 9, Gardens count = 1
    // Expected: 1 * floor(9/10) = 0 VP
  });

  it('should count itself (Gardens in deck)', () => {
    // Setup: Total cards = 10 (including 1 Gardens)
    // Expected: 1 * floor(10/10) = 1 VP
  });

  it('should work in full game (Gardens strategy)', () => {
    // Setup: Player buys lots of cheap cards (Copper, Estate)
    // Total cards = 50, Gardens count = 4
    // Expected: 4 * floor(50/10) = 20 VP
  });
});
```

---

## Integration Tests

### IT-TRASH-PILE-1: Trash pile accumulation

```typescript
describe('Integration: Trash pile mechanics', () => {
  it('should accumulate cards over multiple turns', () => {
    // Turn 1: Chapel trashes 4 Estates
    // Turn 2: Moneylender trashes Copper
    // Turn 3: Remodel trashes Silver
    // Expected: trash = [E, E, E, E, C, S] (6 cards)
  });

  it('should be visible to all players', () => {
    // Setup: 2-player game, P0 trashes cards
    // Expected: P1 can query trash pile, sees P0's trashed cards
  });

  it('should not allow gaining from trash (base set)', () => {
    // Setup: trash = [Silver, Gold]
    // Attempt: Gain Silver from trash
    // Expected: Error (only Workshop/Feast gain from supply)
  });

  it('should persist across game end', () => {
    // Setup: Full game, trash pile has 20 cards
    // Game ends
    // Expected: trash pile still queryable in final state
  });

  it('should handle Feast self-trash correctly', () => {
    // Setup: Play Feast, gain Duchy
    // Expected: Feast in trash (not discard, not in play)
    // Cleanup: Feast doesn't return to discard
  });
});
```

### IT-ATTACK-FLOW-1: Attack resolution with multiple opponents

```typescript
describe('Integration: Attack flow', () => {
  it('should resolve Militia in 3-player game', () => {
    // Setup: 3 players, P0 plays Militia
    // P1 hand = 6 cards, P2 hand = 4 cards
    // Expected: P1 discards to 3, P2 discards to 3
  });

  it('should handle mixed Moat reveals', () => {
    // Setup: 3 players, P0 plays Witch
    // P1 has Moat (reveals), P2 no Moat
    // Expected: P1 blocked (no Curse), P2 gains Curse
  });

  it('should process attacks sequentially', () => {
    // Setup: P0 plays Spy, 3 players
    // P0 reveals Copper (decide: discard)
    // P1 reveals Estate (decide: keep)
    // P2 reveals Gold (decide: discard)
    // Expected: Sequential prompts, deterministic order
  });

  it('should handle attack chain (Militia → Witch)', () => {
    // Setup: P0 plays Militia, then Witch (same turn)
    // P1 hand = 5 cards
    // Militia: P1 discards to 3
    // Witch: P1 gains Curse
    // Expected: P1 hand = 3 cards, P1 discard has Curse
  });
});
```

### IT-THRONE-ROOM-1: Complex Throne Room interactions

```typescript
describe('Integration: Throne Room combos', () => {
  it('should handle Throne Room + Chapel (trash 8)', () => {
    // Setup: [Throne Room, Chapel, C, C, C, C, E, E, E, E]
    // Execute: Throne Room on Chapel
    // Expected: trash = 8 cards
  });

  it('should handle Throne Room + Feast (gain 2, trash 1)', () => {
    // Setup: [Throne Room, Feast]
    // Execute: Throne Room on Feast
    // Gain: Duchy, Market
    // Expected: trash = [Feast], discard = [Duchy, Market]
  });

  it('should handle Throne Room + Throne Room + Smithy', () => {
    // Setup: [TR1, TR2, Smithy]
    // TR1 on TR2: TR2 plays Smithy twice
    // TR1 second effect: TR2 plays Smithy twice again
    // Expected: Smithy played 4 times = +12 Cards
  });

  it('should handle Throne Room + Library (draw once)', () => {
    // Setup: [Throne Room, Library], hand = 2 cards
    // Execute: Throne Room on Library
    // Expected: Draw to 7 once, second Library effect does nothing
  });

  it('should handle Throne Room + Workshop (gain 2)', () => {
    // Setup: [Throne Room, Workshop]
    // Gain: Smithy, Silver
    // Expected: discard = [Smithy, Silver]
  });

  it('should handle Throne Room + Militia (+$4, discard once)', () => {
    // Setup: [Throne Room, Militia], P1 hand = 7 cards
    // Expected: +$4, P1 discards to 3 (stays at 3 for second effect)
  });
});
```

---

## End-to-End Tests

### E2E-TRASHING-1: Full game with Chapel strategy

```typescript
describe('E2E: Trashing strategy', () => {
  // @e2e: Complete game using Chapel to thin deck

  it('should win with aggressive trashing', () => {
    // Setup: 2-player game, P0 (human) vs P1 (AI)
    // P0 strategy: Buy Chapel, trash all Estates and Coppers
    // P1 strategy: Big Money (no Chapel)

    // Expected:
    // - P0 deck size: ~15 cards (thinned)
    // - P1 deck size: ~25 cards (normal)
    // - P0 wins (higher card quality)
    // - Game ends in 15-20 turns
  });

  it('should handle over-trashing (trashing too many cards)', () => {
    // Setup: P0 trashes aggressively (including Silvers)
    // Expected: P0 loses (not enough economy)
  });

  it('should demonstrate Remodel upgrade path', () => {
    // Setup: P0 uses Remodel to upgrade Estates → Smithies
    // Expected: P0 gains card draw advantage
  });
});
```

### E2E-ATTACK-DEFENSE-1: Full game with attacks and Moat

```typescript
describe('E2E: Attack/Defense gameplay', () => {
  it('should play Militia vs Moat defense', () => {
    // Setup: P0 buys Militia, P1 buys Moat
    // P0 attacks with Militia repeatedly
    // P1 defends with Moat reveals
    // Expected: P1 successfully defends most attacks
  });

  it('should play Witch spam strategy', () => {
    // Setup: P0 buys multiple Witches
    // P1 buys Chapel to trash Curses
    // Expected: P0 pollutes P1's deck, but P1 recovers with Chapel
  });

  it('should demonstrate Thief steal strategy', () => {
    // Setup: P0 uses Thief to steal P1's Gold
    // Expected: P0 gains Gold, P1's economy weakened
  });

  it('should play full attack game (Militia + Witch + Thief)', () => {
    // Setup: P0 buys all attack cards
    // P1 buys Moat for defense
    // Expected: Complex attack/defense interactions
  });

  it('should demonstrate Bureaucrat late-game disruption', () => {
    // Setup: Late game, P1 has Provinces in hand
    // P0 plays Bureaucrat
    // P1 forced to topdeck Province (delays VP)
    // Expected: P0 wins by delaying P1's victory
  });
});
```

### E2E-THRONE-ROOM-1: Full game with Throne Room combos

```typescript
describe('E2E: Throne Room strategy', () => {
  it('should play Throne Room + Smithy engine', () => {
    // Setup: P0 buys Throne Room and Smithies
    // P0 consistently plays Throne Room + Smithy (+6 Cards)
    // Expected: P0 draws entire deck most turns
  });

  it('should play Throne Room + Village chain', () => {
    // Setup: P0 buys Throne Room, Villages
    // P0 chains: Throne Room + Village → +2 Cards, +4 Actions
    // Expected: P0 plays many action cards per turn
  });

  it('should play Throne Room + Chapel (deck thinning)', () => {
    // Setup: P0 uses Throne Room + Chapel to trash 8 cards
    // Expected: P0 rapidly thins deck to <15 cards
  });
});
```

### E2E-GARDENS-1: Full game with Gardens strategy

```typescript
describe('E2E: Gardens strategy', () => {
  it('should win with Gardens + Workshop', () => {
    // Setup: P0 buys Gardens, uses Workshop to gain cheap cards
    // P0 deck: 50+ cards (lots of Copper, Estate, cheap actions)
    // P0 has 5 Gardens = 5 * floor(50/10) = 25 VP
    // Expected: P0 wins with high VP from Gardens
  });

  it('should demonstrate Gardens vs Big Money', () => {
    // Setup: P0 (Gardens strategy), P1 (Big Money)
    // P0 aims for 40-50 cards
    // P1 aims for Provinces
    // Expected: Close game, Gardens competitive
  });
});
```

### E2E-FULL-BASE-SET-1: Complete game with all 25 cards

```typescript
describe('E2E: Full base set gameplay', () => {
  it('should play complete game with all 25 cards available', () => {
    // Setup: 2-player game, all 25 kingdom cards in supply
    // P0 (human) vs P1 (AI)
    // Random selection of 10 kingdom cards for game
    // Expected: Game completes without errors, all mechanics work
  });

  it('should validate AI handles all 25 cards', () => {
    // Setup: AI vs AI, all 25 cards available
    // Expected: AI makes valid moves with all cards
    // No errors, game completes
  });
});
```

---

## Backward Compatibility Tests

### BC-PHASE-1-3: Ensure no regressions

```typescript
describe('Backward Compatibility: Phase 1-3', () => {
  it('should pass all Phase 1 tests', () => {
    // Run Phase 1 test suite
    // Expected: 100% pass rate
  });

  it('should pass all Phase 2 tests', () => {
    // Run Phase 2 test suite (MCP integration)
    // Expected: 100% pass rate
  });

  it('should pass all Phase 3 tests', () => {
    // Run Phase 3 test suite (multiplayer)
    // Expected: 100% pass rate
  });

  it('should support solo games with 8 cards', () => {
    // Setup: 1-player game, only original 8 kingdom cards
    // Expected: Works exactly as Phase 1
  });

  it('should support multiplayer with 8 cards', () => {
    // Setup: 2-player game, only original 8 kingdom cards
    // Expected: Works exactly as Phase 3
  });

  it('should maintain MCP tool compatibility', () => {
    // Setup: MCP server with Phase 4 game
    // Execute: game_execute, game_observe, game_session
    // Expected: All tools work with new move types
  });
});
```

---

## Test Execution Plan

### Test Order (TDD Red Phase)

1. **Unit Tests** (48 tests) - Write first, all fail
   - Trashing: 12 tests
   - Gaining: 6 tests
   - Attacks: 15 tests
   - Reactions: 6 tests
   - Special: 9 tests

2. **Integration Tests** (29 tests) - Write second, all fail
   - Trash pile: 5 tests
   - Gaining mechanics: 4 tests
   - Attack flow: 10 tests
   - Throne Room: 6 tests
   - Card combos: 4 tests

3. **E2E Tests** (15 tests) - Write third, all fail
   - Trashing strategy: 3 tests
   - Attack/defense: 5 tests
   - Throne Room: 3 tests
   - Gardens: 2 tests
   - Full base set: 2 tests

### Green Phase (Implementation)

After all 92 tests written and failing:
- dev-agent implements features
- Tests turn green one by one
- Target: 100% pass rate

### Coverage Validation

```bash
npm run test -- --coverage
```

Expected output:
```
--------------------------|---------|----------|---------|---------|
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
All files                 |   95.2  |   93.8   |   96.1  |   95.5  |
 cards.ts                 |   100   |   100    |   100   |   100   |
 game.ts                  |   94.8  |   92.5   |   95.2  |   94.9  |
 ai.ts                    |   93.1  |   91.2   |   94.8  |   93.4  |
 presentation.ts          |   96.5  |   95.1   |   97.2  |   96.8  |
--------------------------|---------|----------|---------|---------|
```

---

## Summary

Phase 4 testing specifications:
- **92 total tests** (48 unit, 29 integration, 15 E2E)
- **95%+ coverage target**
- **Zero regressions** (all Phase 1-3 tests pass)
- **TDD workflow** (tests first, implementation second)

**Test Distribution**:
- Trashing: 12 unit + 5 integration + 3 E2E = 20 tests
- Gaining: 6 unit + 4 integration + 2 E2E = 12 tests
- Attacks: 15 unit + 10 integration + 5 E2E = 30 tests
- Reactions: 6 unit + 4 integration + 2 E2E = 12 tests
- Special: 9 unit + 6 integration + 3 E2E = 18 tests

**Next Steps**:
1. test-architect implements all 92 tests
2. Validate RED phase (all tests fail)
3. dev-agent implements features
4. Validate GREEN phase (all tests pass)

---

**Document Status**: DRAFT - Pending Review
**Created**: 2025-11-02
**Author**: requirements-architect
**Ready for**: Test implementation (test-architect)
