# Phase 4 Feature Specifications: Complete Dominion Base Set

**Status**: DRAFT
**Created**: 2025-11-02
**Phase**: 4
**Card Count**: 17 new cards (25 total)
**Owner**: requirements-architect

---

## Table of Contents

- [Feature 1: Trashing System](#feature-1-trashing-system)
- [Feature 2: Gaining System](#feature-2-gaining-system)
- [Feature 3: Attack System](#feature-3-attack-system)
- [Feature 4: Reaction System](#feature-4-reaction-system)
- [Feature 5: Duplication & Special Cards](#feature-5-duplication--special-cards)
- [Card Interaction Matrix](#card-interaction-matrix)
- [UI/UX Requirements](#uiux-requirements)

---

## Feature 1: Trashing System

### Overview

**Mechanic**: Trash pile for permanent card removal from player decks
- Cards in trash are removed from the game (not in deck, discard, or supply)
- Trash pile is visible to all players (public information)
- Trashed cards cannot be gained back (in base set)
- Enables deck thinning strategies (remove Estates, Coppers)

### Card 1.1: Chapel ($2)

**Type**: Action
**Cost**: $2
**Effect**: Trash up to 4 cards from your hand
**Supply**: 10 cards

**Detailed Behavior**:
```
Action Phase:
  Player has: [Chapel, Copper, Copper, Estate, Duchy] in hand
  Player plays Chapel
  → System prompts: "Select up to 4 cards to trash (or 0 to skip)"
  Player selects: [Copper, Copper, Estate] (3 cards)
  → Cards move from hand to trash pile
  → Hand now: [Duchy]
  → Trash pile gains: [Copper, Copper, Estate]
  → Chapel played (stays in play until cleanup)
```

**Move Types Required**:
```typescript
// Play Chapel
{ type: 'play_action', card: 'Chapel' }

// Select cards to trash (0-4 cards)
{ type: 'trash_cards', cards: ['Copper', 'Copper', 'Estate'] }

// Or skip trashing
{ type: 'trash_cards', cards: [] }
```

**Edge Cases**:
- EC 1.1.1: Player has < 4 cards in hand → can trash all remaining
- EC 1.1.2: Player selects 0 cards → valid, no cards trashed
- EC 1.1.3: Player selects > 4 cards → error: "Chapel can only trash up to 4 cards"
- EC 1.1.4: Player selects cards not in hand → error: "Selected cards not in hand"

**Interactions**:
- With Throne Room: Can trash up to 8 cards total (4 + 4)
- With Council Room: Draw 4 cards, then trash 4 of them
- With Smithy: Draw 3 cards, then trash up to 4

**UI Requirements**:
- Display: "Chapel | $2 | action | Trash up to 4 cards"
- Prompt: "Select cards to trash (0-4):" with card indices
- Confirmation: "Trashed: Copper, Copper, Estate"

**Test Count**: 5 tests
- UT-CHAPEL-1: Trash 0-4 cards (all valid amounts)
- UT-CHAPEL-2: Error on > 4 cards selected
- UT-CHAPEL-3: Throne Room + Chapel (trash 8 total)
- IT-CHAPEL-1: Chapel reduces deck size over time
- IT-CHAPEL-2: Trashed cards visible in trash pile

---

### Card 1.2: Remodel ($4)

**Type**: Action
**Cost**: $4
**Effect**: Trash a card from your hand. Gain a card costing up to $2 more.
**Supply**: 10 cards

**Detailed Behavior**:
```
Action Phase:
  Player has: [Remodel, Copper, Silver, Estate] in hand
  Player plays Remodel
  → Prompt: "Select 1 card to trash"
  Player selects: Estate
  → Estate moves to trash pile
  → Prompt: "Gain a card costing up to $4" (Estate cost $2 + $2 = $4)
  Available cards: Copper ($0), Silver ($3), Smithy ($4), Workshop ($3), Remodel ($4)
  Player selects: Smithy
  → Smithy moves from supply to discard pile
  → Hand now: [Copper, Silver, Smithy]
```

**Move Types Required**:
```typescript
// Play Remodel
{ type: 'play_action', card: 'Remodel' }

// Trash a card
{ type: 'trash_cards', cards: ['Estate'] }

// Gain a card (costing up to trashed card + $2)
{ type: 'gain_card', card: 'Smithy' }
```

**Edge Cases**:
- EC 1.2.1: Remodel an Estate ($2) → gain up to $4 (Smithy, Remodel, etc.)
- EC 1.2.2: Remodel a Province ($8) → gain up to $10 (nothing in base set)
- EC 1.2.3: Remodel with empty hand → error: "Must trash a card"
- EC 1.2.4: Gain card not in supply → error: "Card not available"
- EC 1.2.5: Gain card costing too much → error: "Card costs more than allowed"

**Interactions**:
- Remodel Estate → gain Smithy (upgrade cheap card)
- Remodel Silver → gain Gold (treasure upgrade)
- Remodel Duchy → gain Province (victory upgrade)
- With Throne Room: Trash 2 cards, gain 2 cards

**UI Requirements**:
- Display: "Remodel | $4 | action | Trash 1 card, gain card costing up to $2 more"
- Prompt 1: "Select card to trash"
- Prompt 2: "Gain card costing up to $X" (calculated from trashed card)

**Test Count**: 5 tests
- UT-REMODEL-1: Remodel Estate → gain Smithy
- UT-REMODEL-2: Remodel Gold → gain Province
- UT-REMODEL-3: Error on exceeding cost limit
- IT-REMODEL-1: Deck composition changes (trash Estate, gain Gold)
- IT-REMODEL-2: Throne Room + Remodel (2 upgrades)

---

### Card 1.3: Mine ($5)

**Type**: Action
**Cost**: $5
**Effect**: Trash a Treasure from your hand. Gain a Treasure costing up to $3 more.
**Supply**: 10 cards

**Detailed Behavior**:
```
Action Phase:
  Player has: [Mine, Copper, Silver, Estate] in hand
  Player plays Mine
  → Prompt: "Trash 1 Treasure"
  Available treasures in hand: Copper, Silver
  Player selects: Silver ($3)
  → Silver moves to trash pile
  → Prompt: "Gain a Treasure costing up to $6" ($3 + $3)
  Available treasures: Copper ($0), Silver ($3), Gold ($6)
  Player selects: Gold
  → Gold moves from supply to hand (special: goes to hand, not discard)
  → Hand now: [Copper, Estate, Gold]
```

**Move Types Required**:
```typescript
// Play Mine
{ type: 'play_action', card: 'Mine' }

// Trash a treasure
{ type: 'trash_cards', cards: ['Silver'] }

// Gain a treasure (to hand, not discard)
{ type: 'gain_card', card: 'Gold', destination: 'hand' }
```

**Edge Cases**:
- EC 1.3.1: No treasures in hand → error: "Must trash a Treasure"
- EC 1.3.2: Mine Copper → gain up to $3 (Silver)
- EC 1.3.3: Mine Silver → gain up to $6 (Gold)
- EC 1.3.4: Mine Gold → gain up to $9 (no treasure costs that much in base set)
- EC 1.3.5: Try to gain non-treasure → error: "Must gain a Treasure"

**Interactions**:
- Mine Copper → Silver (early game upgrade)
- Mine Silver → Gold (mid-game acceleration)
- Mine Gold → Gold (no higher treasure, but still playable)
- With Throne Room: Trash 2 treasures, gain 2 treasures to hand

**Special Rule**: Gained treasure goes to hand, not discard (can play immediately in buy phase)

**UI Requirements**:
- Display: "Mine | $5 | action | Trash Treasure, gain Treasure +$3 to hand"
- Prompt 1: "Select Treasure to trash"
- Prompt 2: "Gain Treasure costing up to $X to your hand"

**Test Count**: 5 tests
- UT-MINE-1: Mine Copper → Silver
- UT-MINE-2: Mine Silver → Gold (to hand)
- UT-MINE-3: Error when no treasures in hand
- IT-MINE-1: Gained treasure playable same turn
- IT-MINE-2: Throne Room + Mine (2 treasure upgrades)

---

### Card 1.4: Moneylender ($4)

**Type**: Action
**Cost**: $4
**Effect**: Trash a Copper from your hand. If you did, +$3.
**Supply**: 10 cards

**Detailed Behavior**:
```
Action Phase:
  Player has: [Moneylender, Copper, Silver, Estate] in hand
  Player plays Moneylender
  → Check: Does hand contain Copper?
  → Yes: Prompt: "Trash Copper for +$3? (y/n)"
  Player confirms: yes
  → Copper moves to trash pile
  → Player gains +$3 coins
  → Coins: 0 → 3

Alternative:
  Player has: [Moneylender, Silver, Gold, Estate] (no Copper)
  Player plays Moneylender
  → Check: No Copper in hand
  → No effect (no coins gained, no trash)
  → Message: "No Copper to trash"
```

**Move Types Required**:
```typescript
// Play Moneylender
{ type: 'play_action', card: 'Moneylender' }

// If Copper in hand, trash it (automatic or prompted)
{ type: 'trash_cards', cards: ['Copper'] }
// (Or auto-execute if Copper present)
```

**Edge Cases**:
- EC 1.4.1: No Copper in hand → no effect (no coins, no trash)
- EC 1.4.2: Multiple Coppers → only trash 1 (player chooses or first one)
- EC 1.4.3: Throne Room + Moneylender → trash 2 Coppers, +$6 total

**Interactions**:
- With Throne Room: +$6 if 2 Coppers available
- Early game: Great for thinning Copper
- Late game: Less useful (fewer Coppers left)

**UI Requirements**:
- Display: "Moneylender | $4 | action | Trash Copper for +$3"
- Prompt: "Trash Copper? (y/n)" or auto-trash if only one
- Message: "+$3" or "No Copper to trash"

**Test Count**: 4 tests
- UT-MONEYLENDER-1: Trash Copper, gain +$3
- UT-MONEYLENDER-2: No Copper, no effect
- UT-MONEYLENDER-3: Throne Room + Moneylender (+$6)
- IT-MONEYLENDER-1: Deck thinning over multiple turns

---

### Trashing System Summary

**Acceptance Criteria**:
- AC 1.1: Trash pile exists in GameState
- AC 1.2: Trashed cards removed from player deck/discard/hand
- AC 1.3: Trash pile visible to all players
- AC 1.4: All 4 trashing cards work correctly
- AC 1.5: Throne Room compatibility with all trashing cards

**Test Count**: 20 tests (12 unit, 5 integration, 3 E2E)

---

## Feature 2: Gaining System

### Overview

**Mechanic**: Gain cards without buying (bypasses buy limit, no coin cost)
- Gained cards typically go to discard pile (unless specified)
- Gaining doesn't consume buys (can gain + buy in same turn)
- Supply must have cards available (cannot gain from empty pile)
- Enables workshop strategies, alternative acquisition

### Card 2.1: Workshop ($3)

**Type**: Action
**Cost**: $3
**Effect**: Gain a card costing up to $4
**Supply**: 10 cards

**Detailed Behavior**:
```
Action Phase:
  Player has: [Workshop, Copper, Estate] in hand
  Player plays Workshop
  → Prompt: "Gain a card costing up to $4"
  Available cards: Copper ($0), Silver ($3), Estate ($2), Smithy ($4), Workshop ($3), Remodel ($4)
  Player selects: Smithy
  → Smithy moves from supply to discard pile
  → Supply: Smithy 10 → 9
  → Discard pile gains: Smithy
```

**Move Types Required**:
```typescript
// Play Workshop
{ type: 'play_action', card: 'Workshop' }

// Gain a card (to discard)
{ type: 'gain_card', card: 'Smithy', destination: 'discard' }
```

**Edge Cases**:
- EC 2.1.1: Gain card costing > $4 → error: "Card too expensive"
- EC 2.1.2: Gain card not in supply → error: "Card not available"
- EC 2.1.3: Gain from empty pile → error: "Supply exhausted"
- EC 2.1.4: Can gain victory cards (Estate, Duchy)
- EC 2.1.5: Can gain Workshop (gaining cards that gain cards)

**Interactions**:
- Workshop → Smithy (gain card draw)
- Workshop → Silver (gain economy)
- Workshop → Workshop (gain more gaining)
- With Throne Room: Gain 2 cards costing up to $4

**UI Requirements**:
- Display: "Workshop | $3 | action | Gain card costing up to $4"
- Prompt: "Gain card costing up to $4"
- Confirmation: "Gained Smithy"

**Test Count**: 6 tests
- UT-WORKSHOP-1: Gain card costing $0-$4
- UT-WORKSHOP-2: Error on card > $4
- UT-WORKSHOP-3: Error on empty supply
- IT-WORKSHOP-1: Throne Room + Workshop (gain 2 cards)
- IT-WORKSHOP-2: Workshop chain (gain Workshop, use next turn)
- E2E-WORKSHOP-1: Full game with Workshop strategy

---

### Card 2.2: Feast ($4)

**Type**: Action
**Cost**: $4
**Effect**: Trash this Feast. Gain a card costing up to $5.
**Supply**: 10 cards

**Detailed Behavior**:
```
Action Phase:
  Player has: [Feast, Copper, Estate] in hand
  Player plays Feast
  → Feast is trashed (automatic, from play area)
  → Prompt: "Gain a card costing up to $5"
  Available: Copper ($0), Silver ($3), Duchy ($5), Market ($5), Laboratory ($5)
  Player selects: Duchy
  → Duchy moves from supply to discard pile
  → Feast in trash pile (not discard)
  → Next cleanup: Feast doesn't return to discard (already trashed)
```

**Move Types Required**:
```typescript
// Play Feast
{ type: 'play_action', card: 'Feast' }
// (Auto-trash Feast after play)

// Gain a card
{ type: 'gain_card', card: 'Duchy', destination: 'discard' }
```

**Edge Cases**:
- EC 2.2.1: Feast trashes itself automatically (not in cleanup)
- EC 2.2.2: Throne Room + Feast → trash 1 Feast, gain 2 cards (special ruling)
- EC 2.2.3: Gain Province ($8) → error: "Card too expensive"
- EC 2.2.4: Feast in trash, not discard after play

**Interactions**:
- Feast → Duchy (early VP)
- Feast → Market (gain economy + draw)
- With Throne Room: Gain 2 cards up to $5 (Feast only trashed once)

**Special Rule**: Feast trashes itself when played (before gaining card)

**UI Requirements**:
- Display: "Feast | $4 | action | Trash this, gain card up to $5"
- Automatic: "Feast trashed"
- Prompt: "Gain card costing up to $5"

**Test Count**: 6 tests
- UT-FEAST-1: Feast trashes itself
- UT-FEAST-2: Gain card up to $5
- UT-FEAST-3: Throne Room + Feast (gain 2, trash 1)
- IT-FEAST-1: Feast not in discard after play
- IT-FEAST-2: Feast strategy (gain Duchies early)
- E2E-FEAST-1: Full game using Feast for acceleration

---

### Gaining System Summary

**Acceptance Criteria**:
- AC 2.1: Gaining doesn't consume buys
- AC 2.2: Gained cards go to discard (unless specified)
- AC 2.3: Supply properly decremented
- AC 2.4: Both gaining cards work correctly
- AC 2.5: Throne Room compatibility

**Test Count**: 12 tests (6 unit, 4 integration, 2 E2E)

---

## Feature 3: Attack System

### Overview

**Mechanic**: Attack cards affect all other players
- Attack applies to ALL opponents simultaneously
- Resolution order: clockwise from attacker (deterministic)
- Opponent can reveal Moat to block (see Feature 4)
- Attacks are mandatory (cannot choose not to attack)

### Card 3.1: Militia ($4)

**Type**: Action - Attack
**Cost**: $4
**Effect**: +$2. Each other player discards down to 3 cards in hand.
**Supply**: 10 cards

**Detailed Behavior**:
```
Action Phase (2-player game):
  Player 0 has: [Militia, Copper, Estate] in hand
  Player 0 plays Militia
  → Player 0 gains +$2 coins
  → Attack phase:
    → Check Player 1's hand size
    → Player 1 has 5 cards: [Copper, Silver, Estate, Duchy, Province]
    → Prompt Player 1: "Discard 2 cards (keep 3)"
    → Player 1 selects: [Copper, Estate]
    → Player 1's hand now: [Silver, Duchy, Province] (3 cards)
  → Militia stays in play until cleanup
```

**Move Types Required**:
```typescript
// Play Militia
{ type: 'play_action', card: 'Militia' }

// Opponent discards (opponent's turn briefly)
{ type: 'discard_to_hand_size', cards: ['Copper', 'Estate'], target_size: 3 }
```

**Edge Cases**:
- EC 3.1.1: Opponent has ≤ 3 cards → no discard required
- EC 3.1.2: Opponent has > 3 cards → discard exactly (hand_size - 3)
- EC 3.1.3: Opponent reveals Moat → attack blocked, no discard
- EC 3.1.4: 3+ player game → all opponents discard
- EC 3.1.5: AI opponent → auto-select lowest-value cards to discard

**Interactions**:
- Militia + Militia → opponents discard twice (if hand allows)
- Throne Room + Militia → +$4, opponents discard to 3 twice (effective: 3 cards max)
- Opponent Moat → blocks attack

**UI Requirements**:
- Display: "Militia | $4 | action-attack | +$2. Opponents discard to 3 cards"
- Attack message: "Player 0 played Militia! Discard down to 3 cards."
- Prompt: "Select cards to discard (keep 3)"

**Test Count**: 6 tests
- UT-MILITIA-1: Player gains +$2
- UT-MILITIA-2: Opponent discards to 3 cards
- UT-MILITIA-3: Opponent with ≤ 3 cards (no discard)
- IT-MILITIA-1: Moat blocks Militia
- IT-MILITIA-2: Throne Room + Militia
- E2E-MILITIA-1: Full game with Militia attacks

---

### Card 3.2: Witch ($5)

**Type**: Action - Attack
**Cost**: $5
**Effect**: +2 Cards. Each other player gains a Curse.
**Supply**: 10 cards

**Detailed Behavior**:
```
Action Phase (2-player game):
  Player 0 has: [Witch, Copper, Estate] in hand
  Player 0 plays Witch
  → Player 0 draws 2 cards
  → Attack phase:
    → Check Curse supply: 10 available
    → Player 1 gains Curse to discard pile
    → Curse supply: 10 → 9
    → Player 1's discard pile gains: [Curse]
  → Witch stays in play until cleanup
```

**Move Types Required**:
```typescript
// Play Witch
{ type: 'play_action', card: 'Witch' }
// (Auto-draw 2 cards, auto-apply Curse to opponents)
```

**Edge Cases**:
- EC 3.2.1: Curse supply empty → no Curse gained (attack fizzles)
- EC 3.2.2: Opponent reveals Moat → attack blocked, no Curse
- EC 3.2.3: 3+ players, 1 Curse left → first opponent gets it, others don't
- EC 3.2.4: Curse goes to discard pile (pollutes deck)

**Interactions**:
- Chapel can trash Curses (counterplay)
- Moat blocks Witch (defensive)
- Throne Room + Witch → +4 cards, opponents gain 2 Curses

**Curse Supply**:
- 2-player game: 10 Curses
- 3-player game: 20 Curses
- 4-player game: 30 Curses

**UI Requirements**:
- Display: "Witch | $5 | action-attack | +2 Cards. Opponents gain Curse"
- Attack message: "Player 0 played Witch! You gained a Curse."
- Confirmation: "Curse added to your discard pile"

**Test Count**: 6 tests
- UT-WITCH-1: Player draws 2 cards
- UT-WITCH-2: Opponent gains Curse
- UT-WITCH-3: Empty Curse supply (no gain)
- IT-WITCH-1: Moat blocks Witch
- IT-WITCH-2: Throne Room + Witch (2 Curses)
- E2E-WITCH-1: Full game with Witch strategy

---

### Card 3.3: Bureaucrat ($4)

**Type**: Action - Attack
**Cost**: $4
**Effect**: Gain a Silver onto your deck. Each other player reveals a Victory card from their hand and puts it onto their deck (or reveals their hand if no Victory cards).
**Supply**: 10 cards

**Detailed Behavior**:
```
Action Phase (2-player game):
  Player 0 has: [Bureaucrat, Copper] in hand
  Player 0 plays Bureaucrat
  → Player 0 gains Silver to top of deck (not discard)
  → Player 0's deck: [Silver, ...rest]
  → Attack phase:
    → Player 1 has: [Copper, Silver, Estate, Duchy]
    → Prompt Player 1: "Reveal Victory card to put on deck"
    → Player 1 selects: Estate
    → Player 1's deck: [Estate, ...rest]
    → (Duchy stays in hand)
```

**Move Types Required**:
```typescript
// Play Bureaucrat
{ type: 'play_action', card: 'Bureaucrat' }
// (Auto-gain Silver to deck)

// Opponent reveals and places Victory
{ type: 'reveal_and_topdeck', card: 'Estate' }
```

**Edge Cases**:
- EC 3.3.1: No Silver in supply → no gain (attack still happens)
- EC 3.3.2: Opponent has no Victory cards → reveals entire hand, no topdeck
- EC 3.3.3: Opponent has multiple Victory cards → player chooses which
- EC 3.3.4: Moat blocks attack (no topdeck)

**Interactions**:
- Bureaucrat + Bureaucrat → multiple Silvers on deck
- Throne Room + Bureaucrat → 2 Silvers on deck, opponent topdecks 2 Victory
- Late game: Forces opponents to topdeck Provinces (delays VP)

**UI Requirements**:
- Display: "Bureaucrat | $4 | action-attack | Gain Silver to deck. Opponents topdeck Victory"
- Prompt: "Reveal Victory card to place on deck"
- Message: "No Victory cards to reveal" (if applicable)

**Test Count**: 5 tests
- UT-BUREAUCRAT-1: Gain Silver to deck
- UT-BUREAUCRAT-2: Opponent topdecks Victory
- UT-BUREAUCRAT-3: Opponent has no Victory (reveal hand)
- IT-BUREAUCRAT-1: Moat blocks Bureaucrat
- IT-BUREAUCRAT-2: Throne Room + Bureaucrat

---

### Card 3.4: Spy ($4)

**Type**: Action - Attack
**Cost**: $4
**Effect**: +1 Card, +1 Action. Each player (including you) reveals the top card of their deck and discards it or puts it back, your choice.
**Supply**: 10 cards

**Detailed Behavior**:
```
Action Phase (2-player game):
  Player 0 plays Spy
  → Player 0: +1 Card, +1 Action
  → Spy phase (all players):
    → Player 0 reveals top card: Copper
    → Prompt Player 0: "Discard or keep Copper on deck?"
    → Player 0 chooses: discard
    → Copper → discard pile

    → Player 1 reveals top card: Estate
    → Prompt Player 0 (attacker): "Discard or keep Player 1's Estate?"
    → Player 0 chooses: discard (force opponent to lose Estate draw)
    → Player 1's Estate → Player 1's discard pile
```

**Move Types Required**:
```typescript
// Play Spy
{ type: 'play_action', card: 'Spy' }

// Decide on revealed card
{ type: 'spy_decision', player: 0, card: 'Copper', decision: 'discard' | 'keep' }
{ type: 'spy_decision', player: 1, card: 'Estate', decision: 'discard' | 'keep' }
```

**Edge Cases**:
- EC 3.4.1: Deck empty → shuffle discard, reveal top card
- EC 3.4.2: Deck and discard empty → no reveal
- EC 3.4.3: Moat blocks attack (opponent doesn't reveal)
- EC 3.4.4: Attacker controls all decisions (even for self)

**Interactions**:
- Spy + Spy → reveal top card twice (good deck control)
- Throne Room + Spy → +2 Cards, +2 Actions, 2 reveals
- Strategic: Discard opponent's good cards (Gold, Province)

**UI Requirements**:
- Display: "Spy | $4 | action-attack | +1 Card, +1 Action. All reveal top card"
- Prompt: "Player 1 revealed Estate. Discard or keep?"
- Message: "You chose to discard Player 1's Estate"

**Test Count**: 5 tests
- UT-SPY-1: Player gains +1 Card, +1 Action
- UT-SPY-2: All players reveal top card
- UT-SPY-3: Attacker controls decisions
- IT-SPY-1: Moat blocks Spy (opponent doesn't reveal)
- IT-SPY-2: Throne Room + Spy

---

### Card 3.5: Thief ($4)

**Type**: Action - Attack
**Cost**: $4
**Effect**: Each other player reveals the top 2 cards of their deck. If they revealed any Treasure cards, they trash one of them that you choose. You may gain any or all of these trashed cards. They discard the other revealed cards.
**Supply**: 10 cards

**Detailed Behavior**:
```
Action Phase (2-player game):
  Player 0 plays Thief
  → Attack phase:
    → Player 1 reveals top 2 cards: [Silver, Copper]
    → Prompt Player 0: "Choose Treasure to trash: Silver or Copper"
    → Player 0 selects: Silver
    → Silver → trash pile
    → Prompt Player 0: "Gain trashed Silver? (y/n)"
    → Player 0 confirms: yes
    → Silver moves from trash to Player 0's discard pile
    → Player 1's Copper → discard pile
```

**Move Types Required**:
```typescript
// Play Thief
{ type: 'play_action', card: 'Thief' }

// Choose Treasure to trash
{ type: 'select_treasure_to_trash', player: 1, card: 'Silver' }

// Optionally gain trashed Treasure
{ type: 'gain_trashed_card', card: 'Silver' }
```

**Edge Cases**:
- EC 3.5.1: Opponent reveals no Treasures → discard both, no trash
- EC 3.5.2: Opponent reveals 1 Treasure → trash it (no choice)
- EC 3.5.3: Opponent reveals 2 Treasures → attacker chooses which to trash
- EC 3.5.4: Attacker can decline to gain trashed Treasure
- EC 3.5.5: Moat blocks Thief (no reveal)

**Interactions**:
- Thief + Thief → multiple treasure steals
- Throne Room + Thief → reveal 4 cards total (2 + 2)
- Strategic: Trash opponent's Gold, gain it yourself

**UI Requirements**:
- Display: "Thief | $4 | action-attack | Opponents reveal 2, trash Treasure, you may gain"
- Prompt 1: "Choose Treasure to trash: Silver or Copper"
- Prompt 2: "Gain trashed Silver? (y/n)"

**Test Count**: 6 tests
- UT-THIEF-1: Opponent reveals 2 cards
- UT-THIEF-2: Attacker chooses Treasure to trash
- UT-THIEF-3: Attacker gains trashed Treasure
- UT-THIEF-4: Opponent reveals no Treasures
- IT-THIEF-1: Moat blocks Thief
- IT-THIEF-2: Throne Room + Thief

---

### Attack System Summary

**Acceptance Criteria**:
- AC 3.1: All attack cards affect opponents
- AC 3.2: Attacks work in multiplayer (2+ players)
- AC 3.3: Attack resolution is deterministic (clockwise order)
- AC 3.4: Moat can block all attacks (see Feature 4)
- AC 3.5: All 5 attack cards work correctly

**Test Count**: 30 tests (15 unit, 10 integration, 5 E2E)

---

## Feature 4: Reaction System

### Overview

**Mechanic**: Reaction cards can be revealed in response to attacks
- Moat is the only reaction in base set
- Revealing Moat blocks attack (no effect on revealing player)
- Moat can be revealed even if not current player's turn
- Moat stays in hand after reveal (not played or discarded)

### Card 4.1: Moat ($2)

**Type**: Action - Reaction
**Cost**: $2
**Effect**: +2 Cards. When another player plays an Attack card, you may reveal this from your hand. If you do, you are unaffected by that Attack.
**Supply**: 10 cards

**Detailed Behavior (as Action)**:
```
Action Phase:
  Player has: [Moat, Copper, Estate] in hand
  Player plays Moat
  → Player draws 2 cards
  → Moat stays in play until cleanup
```

**Detailed Behavior (as Reaction)**:
```
Action Phase (during opponent's turn):
  Player 0 plays Militia (attack)
  → Attack resolution:
    → Player 1 has Moat in hand
    → Prompt Player 1: "Reveal Moat to block attack? (y/n)"
    → Player 1 confirms: yes
    → Moat revealed (shown to all players)
    → Attack blocked for Player 1
    → Moat stays in Player 1's hand (not discarded)
  → Player 0's Militia attack continues to other players (if 3+)
```

**Move Types Required**:
```typescript
// Play Moat as action
{ type: 'play_action', card: 'Moat' }

// Reveal Moat to block attack
{ type: 'reveal_reaction', card: 'Moat' }
```

**Edge Cases**:
- EC 4.1.1: Moat in hand, attack played → prompt to reveal
- EC 4.1.2: No Moat in hand → cannot block
- EC 4.1.3: Multiple attacks → Moat blocks each (can reveal multiple times)
- EC 4.1.4: Throne Room + Moat → +4 Cards (doesn't affect blocking)
- EC 4.1.5: Moat revealed, then played as action → both effects valid

**Interactions**:
- Blocks: Militia, Witch, Bureaucrat, Spy, Thief (all attacks)
- With Throne Room: +4 Cards
- Strategic: Keep Moat in hand for defense

**UI Requirements**:
- Display: "Moat | $2 | action-reaction | +2 Cards. Reveal to block attacks"
- Prompt (reaction): "Reveal Moat to block Militia? (y/n)"
- Message: "Player 1 revealed Moat. Attack blocked."

**Test Count**: 12 tests
- UT-MOAT-1: Play as action (+2 Cards)
- UT-MOAT-2: Reveal to block Militia
- UT-MOAT-3: Reveal to block Witch
- UT-MOAT-4: Reveal to block Bureaucrat
- UT-MOAT-5: Reveal to block Spy
- UT-MOAT-6: Reveal to block Thief
- IT-MOAT-1: Moat stays in hand after reveal
- IT-MOAT-2: Multiple attacks blocked by same Moat
- IT-MOAT-3: Throne Room + Moat (+4 Cards)
- IT-MOAT-4: Moat in multiplayer (blocks for revealer only)
- E2E-MOAT-1: Full game with Moat defense strategy
- E2E-MOAT-2: Attack-heavy game with Moat counterplay

---

### Reaction System Summary

**Acceptance Criteria**:
- AC 4.1: Moat can be played as action (+2 Cards)
- AC 4.2: Moat can be revealed to block attacks
- AC 4.3: Moat stays in hand after reveal
- AC 4.4: Moat blocks all 5 attack cards
- AC 4.5: Moat only protects revealer (not all players)

**Test Count**: 12 tests (6 unit, 4 integration, 2 E2E)

---

## Feature 5: Duplication & Special Cards

### Overview

**Mechanic**: Special cards with unique behaviors
- Throne Room: Play an action card twice
- Adventurer: Reveal until 2 Treasures found
- Chancellor: Optional deck-to-discard conversion
- Library: Draw until 7 cards, skip actions
- Gardens: Victory card with variable VP (1 VP per 10 cards in deck)

### Card 5.1: Throne Room ($4)

**Type**: Action
**Cost**: $4
**Effect**: You may play an Action card from your hand twice.
**Supply**: 10 cards

**Detailed Behavior**:
```
Action Phase:
  Player has: [Throne Room, Village, Smithy, Copper] in hand
  Player plays Throne Room
  → Prompt: "Select Action card to play twice (or skip)"
  Player selects: Smithy
  → Smithy played (first time): +3 Cards
  → Smithy played (second time): +3 Cards
  → Total effect: +6 Cards
  → Throne Room and Smithy stay in play until cleanup
```

**Move Types Required**:
```typescript
// Play Throne Room
{ type: 'play_action', card: 'Throne Room' }

// Select Action to play twice
{ type: 'select_action_for_throne', card: 'Smithy' }
// (Game engine auto-executes Smithy twice)
```

**Edge Cases**:
- EC 5.1.1: No Action cards in hand → Throne Room has no effect
- EC 5.1.2: Throne Room + Chapel → trash up to 8 cards (4 + 4)
- EC 5.1.3: Throne Room + Feast → gain 2 cards, trash Feast once
- EC 5.1.4: Throne Room + Throne Room → play 1 action card 4 times
- EC 5.1.5: Throne Room + Militia → +$4, opponents discard to 3 twice (effectively once)

**Interactions with All Cards**:
- Village: +2 Cards, +4 Actions
- Smithy: +6 Cards
- Laboratory: +4 Cards, +2 Actions
- Market: +2 Cards, +2 Actions, +2 Buys, +2 Coins
- Woodcutter: +2 Buys, +4 Coins
- Festival: +4 Actions, +2 Buys, +4 Coins
- Council Room: +8 Cards, +2 Buys
- Cellar: +2 Actions, discard/draw twice
- Chapel: Trash up to 8 cards
- Remodel: Trash 2, gain 2
- Mine: Trash 2 Treasures, gain 2 to hand
- Moneylender: +$6 if 2 Coppers
- Workshop: Gain 2 cards up to $4
- Feast: Gain 2 cards up to $5, trash Feast once
- Militia: +$4, opponents discard to 3
- Witch: +4 Cards, opponents gain 2 Curses
- Bureaucrat: Gain 2 Silvers to deck, opponents topdeck 2 Victory
- Spy: +2 Cards, +2 Actions, reveal 2x
- Thief: Reveal 4 cards, trash 2 Treasures
- Moat: +4 Cards
- Adventurer: Reveal until 4 Treasures
- Chancellor: +$4, choose deck-to-discard twice
- Library: Draw to 7, then draw to 7 again (effectively 7 max)

**UI Requirements**:
- Display: "Throne Room | $4 | action | Play Action card twice"
- Prompt: "Select Action card to play twice"
- Message: "Playing Smithy twice: +3 Cards, +3 Cards"

**Test Count**: 8 tests
- UT-THRONE-1: Throne Room + Smithy (+6 Cards)
- UT-THRONE-2: Throne Room + Village (+2 Cards, +4 Actions)
- UT-THRONE-3: No Action cards (no effect)
- UT-THRONE-4: Throne Room + Chapel (trash 8)
- IT-THRONE-1: Throne Room + Feast (gain 2, trash 1)
- IT-THRONE-2: Throne Room + Militia (+$4, discard once)
- IT-THRONE-3: Throne Room + Throne Room (4x multiplier)
- E2E-THRONE-1: Full game with Throne Room combos

---

### Card 5.2: Adventurer ($6)

**Type**: Action
**Cost**: $6
**Effect**: Reveal cards from your deck until you reveal 2 Treasure cards. Put those Treasures into your hand and discard the other revealed cards.
**Supply**: 10 cards

**Detailed Behavior**:
```
Action Phase:
  Player has: [Adventurer, Estate, Duchy] in hand
  Player's deck: [Copper, Estate, Silver, Gold, Province]
  Player plays Adventurer
  → Reveal process:
    → Reveal #1: Copper (Treasure) → set aside
    → Reveal #2: Estate (not Treasure) → discard
    → Reveal #3: Silver (Treasure) → set aside
    → 2 Treasures found, stop revealing
  → Copper and Silver → hand
  → Estate → discard pile
  → Hand now: [Estate, Duchy, Copper, Silver]
```

**Move Types Required**:
```typescript
// Play Adventurer
{ type: 'play_action', card: 'Adventurer' }
// (Auto-reveal until 2 Treasures found)
```

**Edge Cases**:
- EC 5.2.1: Deck runs out → shuffle discard, continue revealing
- EC 5.2.2: Deck + discard < 2 Treasures → reveal all, gain what's found
- EC 5.2.3: Deck is all Treasures → reveal 2, stop immediately
- EC 5.2.4: Throne Room + Adventurer → reveal until 4 Treasures

**Interactions**:
- Late game: Guarantee 2 Treasures (often Gold)
- With Throne Room: Gain 4 Treasures to hand
- Strategic: Works best with high Treasure density

**UI Requirements**:
- Display: "Adventurer | $6 | action | Reveal until 2 Treasures, put in hand"
- Message: "Revealed: Copper (kept), Estate (discarded), Silver (kept)"
- Confirmation: "Added Copper and Silver to hand"

**Test Count**: 5 tests
- UT-ADVENTURER-1: Reveal until 2 Treasures
- UT-ADVENTURER-2: Deck runs out, shuffle discard
- UT-ADVENTURER-3: < 2 Treasures available (gain all)
- IT-ADVENTURER-1: Throne Room + Adventurer (4 Treasures)
- E2E-ADVENTURER-1: Full game with Adventurer strategy

---

### Card 5.3: Chancellor ($3)

**Type**: Action
**Cost**: $3
**Effect**: +$2. You may immediately put your deck into your discard pile.
**Supply**: 10 cards

**Detailed Behavior**:
```
Action Phase:
  Player has: [Chancellor, Copper] in hand
  Player's deck: [Silver, Gold, Estate, Duchy, Province] (5 cards)
  Player plays Chancellor
  → Player gains +$2
  → Prompt: "Put deck into discard pile? (y/n)"
  → Player confirms: yes
  → All 5 cards from deck → discard pile
  → Deck now empty (will shuffle discard on next draw)
```

**Move Types Required**:
```typescript
// Play Chancellor
{ type: 'play_action', card: 'Chancellor' }

// Choose to convert deck to discard
{ type: 'chancellor_decision', convert: true | false }
```

**Edge Cases**:
- EC 5.3.1: Deck already empty → no effect on deck
- EC 5.3.2: Player declines → deck unchanged
- EC 5.3.3: Throne Room + Chancellor → +$4, choose deck-to-discard twice

**Interactions**:
- Strategic: Trigger reshuffle (get discard pile back into play)
- With Throne Room: +$4
- Late game: Cycle deck faster

**UI Requirements**:
- Display: "Chancellor | $3 | action | +$2. May put deck into discard"
- Prompt: "Put deck into discard pile? (y/n)"
- Confirmation: "Deck moved to discard (5 cards)"

**Test Count**: 4 tests
- UT-CHANCELLOR-1: Gain +$2
- UT-CHANCELLOR-2: Convert deck to discard
- UT-CHANCELLOR-3: Decline conversion
- IT-CHANCELLOR-1: Throne Room + Chancellor (+$4)

---

### Card 5.4: Library ($5)

**Type**: Action
**Cost**: $5
**Effect**: Draw until you have 7 cards in hand. You may set aside any Action cards drawn this way, as you draw them; discard the set aside cards after you finish drawing.
**Supply**: 10 cards

**Detailed Behavior**:
```
Action Phase:
  Player has: [Library, Copper] in hand (2 cards)
  Player's deck: [Village, Silver, Smithy, Gold, Estate, Duchy]
  Player plays Library
  → Target: 7 cards in hand (need 5 more)
  → Draw #1: Village
    → Prompt: "Set aside Village? (y/n)"
    → Player confirms: yes → Village set aside
    → Hand still 2 cards
  → Draw #2: Silver → hand (no prompt, not Action)
  → Draw #3: Smithy
    → Prompt: "Set aside Smithy? (y/n)"
    → Player declines: no → Smithy to hand
  → Draw #4: Gold → hand
  → Draw #5: Estate → hand
  → Hand now 7 cards, stop drawing
  → Set-aside Village → discard pile
  → Final hand: [Copper, Silver, Smithy, Gold, Estate, Duchy, Province]
```

**Move Types Required**:
```typescript
// Play Library
{ type: 'play_action', card: 'Library' }

// Decide on each Action card drawn
{ type: 'library_set_aside', card: 'Village', set_aside: true | false }
```

**Edge Cases**:
- EC 5.4.1: Already have 7+ cards → no draw
- EC 5.4.2: Deck runs out before 7 cards → draw all available
- EC 5.4.3: All cards drawn are Actions → can set all aside
- EC 5.4.4: Throne Room + Library → draw to 7, then draw to 7 again (no additional draw)

**Interactions**:
- Strategic: Guaranteed 7-card hand
- Skip Actions: Avoid diluting Treasure-heavy hand
- With Throne Room: Draw to 7 (first effect), already at 7 (second effect = no draw)

**UI Requirements**:
- Display: "Library | $5 | action | Draw to 7 cards, may skip Actions"
- Prompt (per Action drawn): "Set aside Village? (y/n)"
- Message: "Drew to 7 cards. Set aside: Village, Smithy (now discarded)"

**Test Count**: 5 tests
- UT-LIBRARY-1: Draw to 7 cards
- UT-LIBRARY-2: Set aside Action cards
- UT-LIBRARY-3: Already at 7+ cards (no draw)
- IT-LIBRARY-1: Deck runs out (draw all available)
- IT-LIBRARY-2: Throne Room + Library (draw to 7 once)

---

### Card 5.5: Gardens ($4)

**Type**: Victory
**Cost**: $4
**Effect**: Worth 1 VP for every 10 cards in your deck (rounded down).
**Supply**: 10 cards (same as other Victory cards)

**Detailed Behavior**:
```
End of Game:
  Player's deck (all zones combined):
    Hand: 5 cards
    Deck: 10 cards
    Discard: 15 cards
    In Play: 0 cards
    Total: 30 cards

  Player has 3 Gardens

  VP Calculation:
    Gardens #1: 30 cards / 10 = 3 VP
    Gardens #2: 30 cards / 10 = 3 VP
    Gardens #3: 30 cards / 10 = 3 VP
    Total from Gardens: 9 VP

    Other Victory cards: 2 Estate (2 VP), 1 Duchy (3 VP), 1 Province (6 VP)
    Total VP: 9 + 2 + 3 + 6 = 20 VP
```

**VP Calculation Formula**:
```typescript
const totalCards = hand.length + deck.length + discard.length + inPlay.length;
const gardensCount = countCard('Gardens', playerDeck);
const gardensVP = gardensCount * Math.floor(totalCards / 10);
```

**Edge Cases**:
- EC 5.5.1: < 10 cards in deck → 0 VP per Gardens
- EC 5.5.2: 19 cards in deck → 1 VP per Gardens
- EC 5.5.3: 100 cards in deck → 10 VP per Gardens
- EC 5.5.4: Gardens counts itself (Gardens is in deck)

**Interactions**:
- Strategic: Buy lots of cheap cards (Copper, Estate) to inflate deck size
- Workshop: Gain cheap cards to increase Gardens VP
- Feast: Gain Duchies and increase deck size
- Counter-strategy: Chapel thins deck (reduces Gardens VP)

**UI Requirements**:
- Display: "Gardens | $4 | victory | Worth 1 VP / 10 cards in deck"
- End game: "Gardens: 30 cards in deck = 3 VP each (x3 Gardens = 9 VP)"

**Test Count**: 5 tests
- UT-GARDENS-1: Calculate VP with various deck sizes (0, 9, 10, 19, 20, 100)
- UT-GARDENS-2: Multiple Gardens (VP multiplies)
- UT-GARDENS-3: Gardens counts itself
- IT-GARDENS-1: Gardens strategy (buy cheap cards)
- E2E-GARDENS-1: Full game with Gardens win condition

---

### Duplication & Special Cards Summary

**Acceptance Criteria**:
- AC 5.1: Throne Room plays actions twice
- AC 5.2: Adventurer reveals until 2 Treasures
- AC 5.3: Chancellor converts deck to discard
- AC 5.4: Library draws to 7, skips Actions
- AC 5.5: Gardens calculates VP correctly

**Test Count**: 18 tests (9 unit, 6 integration, 3 E2E)

---

## Card Interaction Matrix

### High-Value Combinations

| Card 1 | Card 2 | Effect | Strategic Value |
|--------|--------|--------|-----------------|
| Throne Room | Village | +2 Cards, +4 Actions | Action chain enabler |
| Throne Room | Smithy | +6 Cards | Massive draw |
| Throne Room | Chapel | Trash up to 8 cards | Aggressive deck thinning |
| Throne Room | Witch | +4 Cards, opponents gain 2 Curses | Strong attack |
| Workshop | Smithy | Gain Smithy for free | Economy acceleration |
| Chapel | Estate/Copper | Trash weak cards | Deck optimization |
| Mine | Copper/Silver | Upgrade treasures | Economic growth |
| Gardens | Workshop | Gain cheap cards, increase VP | Gardens strategy |
| Moat | Any Attack | Block attack | Defense |
| Militia | Witch | Multiple hand disruption | Offensive pressure |
| Library | Village/Smithy | Draw to 7, skip Actions for Treasure | Economy focus |
| Feast | Duchy | Gain Duchy early | Early VP |

### Counter-Strategies

| Strategy | Counter | Explanation |
|----------|---------|-------------|
| Witch spam | Moat | Block Curses |
| Witch spam | Chapel | Trash Curses |
| Militia attacks | Big hand (Library) | Mitigate discard effect |
| Gardens | Chapel | Thin opponent's deck |
| Big Money | Thief | Steal opponent's Gold |
| Action chains | Militia | Force discard of key cards |

---

## UI/UX Requirements

### Card Display Format

**Existing Format** (from Phase 1-3):
```
Village | $3 | action | +1 Card, +2 Actions
```

**New Formats** (Phase 4):
```
Chapel | $2 | action | Trash up to 4 cards
Militia | $4 | action-attack | +$2. Opponents discard to 3 cards
Moat | $2 | action-reaction | +2 Cards. Reveal to block attacks
Gardens | $4 | victory | Worth 1 VP / 10 cards
```

### Interactive Prompts

**Trashing Prompts**:
- "Select up to 4 cards to trash (or 0 to skip): [indices]"
- "Select 1 card to trash: [indices]"

**Gaining Prompts**:
- "Gain card costing up to $4: [available cards]"
- "Gain card costing up to $5: [available cards]"

**Attack Prompts**:
- "Player 0 played Militia! Discard down to 3 cards."
- "Select 2 cards to discard: [indices]"

**Reaction Prompts**:
- "Player 0 played Witch! Reveal Moat to block? (y/n)"

**Special Prompts**:
- "Select Action card to play twice: [action cards in hand]"
- "Put deck into discard pile? (y/n)"
- "Set aside Village? (y/n)"

### Game State Display Updates

**Trash Pile**:
```
TRASH PILE (5 cards):
  Copper, Copper, Estate, Curse, Estate
```

**Curse Supply**:
```
SUPPLY PILES
───────────────────────────────────────
Curses: 7 ⚠️ Low!
```

**Attack Indicator**:
```
Player 0 played Militia!
→ Attacking all opponents...
→ Player 1: Discarded 2 cards
→ Player 2: Revealed Moat (blocked)
```

**Gardens VP Display**:
```
FINAL SCORES
───────────────────────────────────────
Player 0:
  Estate (x2): 2 VP
  Duchy (x1): 3 VP
  Province (x1): 6 VP
  Gardens (x3): 9 VP (30 cards in deck)
  Total: 20 VP
```

---

## Summary

Phase 4 adds 17 new cards across 5 major mechanics:
- **Trashing**: 4 cards (Chapel, Remodel, Mine, Moneylender)
- **Gaining**: 2 cards (Workshop, Feast)
- **Attacks**: 5 cards (Militia, Witch, Bureaucrat, Spy, Thief)
- **Reactions**: 1 card (Moat)
- **Special**: 5 cards (Throne Room, Adventurer, Chancellor, Library, Gardens)

**Total Test Count**: 92 tests
- Unit: 48 tests
- Integration: 29 tests
- E2E: 15 tests

**Backward Compatibility**: All Phase 1-3 functionality preserved (8 existing cards + new 17 = 25 total)

**Next Document**: [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical design for new mechanics

---

**Document Status**: DRAFT - Pending Review
**Created**: 2025-11-02
**Author**: requirements-architect
**Ready for**: Test specification (TESTING.md) and implementation planning
