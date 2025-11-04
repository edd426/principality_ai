# Phase 4.1 Features

**Status**: DRAFT
**Created**: 2025-11-03
**Last-Updated**: 2025-11-03
**Owner**: requirements-architect
**Phase**: 4.1

---

## Overview

Phase 4.1 implements three quality-of-life improvements to enhance authentic Dominion gameplay and CLI user experience:

1. **Random Kingdom Card Selection**: Select 10 random action cards per game (matching classic Dominion)
2. **CLI Interactive Prompts**: Fix and extend interactive prompts for all 11 action cards requiring player choices
3. **Card Sorting Display**: Sort cards by cost and name for easier navigation

These features polish the game experience before Phase 5 (Web UI) while maintaining backward compatibility with all existing tests and functionality.

---

## Feature 1: Random Kingdom Card Selection

### Overview

Implement authentic Dominion kingdom card selection by randomly choosing 10 action cards from the pool of 25 kingdom cards at game initialization. This matches the classic Dominion experience where each game features a unique subset of available cards.

### Current Behavior

- All 25 kingdom cards are available in every game session
- Players choose from 32 different supply piles (25 kingdom + 6 basic + Curse)
- No variation between games (same cards always available)
- Analysis paralysis from too many options

### Desired Behavior

- System selects exactly 10 random action cards at game initialization
- Players choose from 17 supply piles (10 kingdom + 6 basic + Curse)
- Different games feature different card combinations
- Seed-based randomization ensures reproducibility for testing
- CLI displays selected kingdom cards at game start
- Backward compatibility: `GameOptions.kingdomCards` parameter allows explicit card specification

### User Stories

**US-RKS-1**: Random Selection for Variety
- **As a** player
- **I want** different kingdom cards in each game
- **So that** I experience strategic variety and increased replayability

**US-RKS-2**: Reproducible Games
- **As a** developer or tester
- **I want** seed-based kingdom selection
- **So that** I can reproduce specific game scenarios for debugging and testing

**US-RKS-3**: Kingdom Display
- **As a** player
- **I want** to see which kingdom cards are selected at game start
- **So that** I can plan my strategy before the game begins

**US-RKS-4**: Explicit Kingdom Specification
- **As a** test author or developer
- **I want** to explicitly specify kingdom cards via GameOptions
- **So that** I can write deterministic tests without relying on randomization

**US-RKS-5**: Authentic Dominion Experience
- **As a** Dominion player
- **I want** exactly 10 kingdom cards per game
- **So that** the game matches authentic Dominion gameplay

### Functional Requirements

**FR-RKS-1**: Exact Card Count
- System SHALL select exactly 10 action cards from the 25 available kingdom cards
- System SHALL NOT modify the count of basic cards (Copper, Silver, Gold, Estate, Duchy, Province, Curse)
- Total supply piles SHALL be 17 (10 kingdom + 6 basic + 1 Curse)

**FR-RKS-2**: Seed-Based Randomization
- System SHALL use the game's seed parameter for kingdom card selection
- Same seed SHALL produce identical kingdom selection across different game sessions
- Different seeds SHALL produce different kingdom selections with high probability

**FR-RKS-3**: All Cards Available Across Games
- All 25 kingdom cards SHALL remain in the card pool
- Any card SHALL have non-zero probability of appearing in a game
- Over multiple games with different seeds, all cards SHALL eventually appear

**FR-RKS-4**: Display Selected Kingdom
- CLI SHALL display the list of selected kingdom cards at game initialization
- Display SHALL occur before Turn 1 begins
- Display format SHALL clearly identify which 10 cards are available

**FR-RKS-5**: Backward Compatibility
- `GameOptions.kingdomCards` parameter SHALL remain optional
- If `kingdomCards` is explicitly provided, system SHALL use specified cards (no random selection)
- If `kingdomCards` is not provided, system SHALL perform random selection
- All existing Phase 1-4 tests SHALL pass without modification (except test setup)

**FR-RKS-6**: Selection Algorithm
- System SHALL use SeededRandom class for randomization
- Selection algorithm SHALL be unbiased (each card has equal probability)
- Algorithm SHALL complete in O(n) time where n = 25

### Acceptance Criteria

**AC-RKS-1**: Card Count Validation
- GIVEN a new game is initialized without explicit kingdomCards
- WHEN the supply is created
- THEN the supply SHALL contain exactly 17 piles
- AND exactly 10 of those piles SHALL be kingdom (action) cards
- AND exactly 6 piles SHALL be basic treasures/victory cards
- AND exactly 1 pile SHALL be Curse

**AC-RKS-2**: Seed Reproducibility
- GIVEN two games initialized with identical seeds
- AND neither game specifies explicit kingdomCards
- WHEN both games are initialized
- THEN both games SHALL have identical kingdom card selections
- AND the order of selected cards SHALL be identical

**AC-RKS-3**: Seed Variation
- GIVEN 10 games initialized with different seeds
- WHEN kingdom cards are selected for each game
- THEN at least 8 games SHALL have at least one different card from the others
- (Statistical test for randomness)

**AC-RKS-4**: Explicit Override
- GIVEN a game initialized with `kingdomCards: ['Village', 'Smithy', 'Market', ...]` (10 cards)
- WHEN the supply is created
- THEN the supply SHALL contain exactly the specified 10 kingdom cards
- AND no random selection SHALL occur
- AND the game seed SHALL NOT affect kingdom selection

**AC-RKS-5**: CLI Display Format
- GIVEN a new CLI game is started
- WHEN the game initializes
- THEN the CLI SHALL display: "Kingdom Cards: [Card1], [Card2], ..., [Card10]"
- AND the display SHALL occur before "Turn 1 | Player 1 | Action Phase"

**AC-RKS-6**: All Cards Available
- GIVEN 100 games with different random seeds
- WHEN kingdom cards are tallied across all games
- THEN all 25 kingdom cards SHALL appear at least once
- (Statistical validation of unbiased selection)

**AC-RKS-7**: Regression Compliance
- GIVEN all Phase 1, 2, 3, and 4 test suites
- WHEN tests are run with Phase 4.1 code
- THEN 100% of tests SHALL pass (possibly with updated test setup to specify kingdomCards)

**AC-RKS-8**: Performance
- GIVEN game initialization with random kingdom selection
- WHEN performance is measured
- THEN kingdom selection SHALL complete in less than 10ms

### Edge Cases

**EC-RKS-1**: Invalid Explicit Kingdom Cards
- **Scenario**: User specifies kingdomCards with fewer than 10 cards
- **Expected**: System throws validation error before game starts
- **Rationale**: Prevents invalid game state

**EC-RKS-2**: Duplicate Cards in Explicit Kingdom
- **Scenario**: User specifies kingdomCards with duplicate entries: `['Village', 'Village', 'Smithy', ...]`
- **Expected**: System throws validation error
- **Rationale**: Each kingdom card should appear exactly once in supply

**EC-RKS-3**: Invalid Card Names
- **Scenario**: User specifies kingdomCards with non-existent card: `['InvalidCard', 'Village', ...]`
- **Expected**: System throws validation error with clear error message
- **Rationale**: Prevents runtime errors during game

**EC-RKS-4**: Basic Cards in Kingdom List
- **Scenario**: User specifies kingdomCards including basic cards: `['Copper', 'Village', ...]`
- **Expected**: System throws validation error (basic cards are not kingdom cards)
- **Rationale**: Kingdom cards are action cards only; basic cards always included separately

**EC-RKS-5**: Empty or Undefined Seed
- **Scenario**: Game initialized with seed = "" or seed = undefined
- **Expected**: System generates a default seed (e.g., Date.now().toString()) and uses it for selection
- **Rationale**: Ensure randomization always works

**EC-RKS-6**: Concurrent Game Sessions
- **Scenario**: Multiple games initialized simultaneously with different seeds
- **Expected**: Each game has independent kingdom selection based on its own seed
- **Rationale**: No shared state between game instances

### Dependencies

**Requires**:
- SeededRandom class (exists in `packages/core/src/seeded-random.ts`)
- GameOptions.kingdomCards parameter (exists in `packages/core/src/types.ts`)
- Complete list of 25 kingdom cards (exists in `packages/core/src/cards.ts`)

**Affects**:
- Test setup procedures (tests may need to specify kingdomCards explicitly)
- CLI game initialization flow

**Blocked By**:
- None (all prerequisites are met)

### Affected Components

**Core Engine** (`packages/core/`):
- `src/game.ts` - Modify `initializeGame()` to add kingdom selection logic
- `src/supply.ts` - Modify `createDefaultSupply()` to accept selected kingdom cards
- `src/types.ts` - Add `selectedKingdomCards?: ReadonlyArray<CardName>` to GameState

**CLI** (`packages/cli/`):
- `src/cli.ts` - Display selected kingdom cards at game start
- `src/display.ts` - Add helper function to format kingdom card display

**Tests** (`packages/core/tests/`, `packages/cli/tests/`):
- Update test setup to specify `kingdomCards` explicitly where deterministic behavior is required
- Add new Phase 4.1 test file for kingdom selection logic

### Non-Functional Requirements

**NFR-RKS-1**: Performance
- Kingdom selection SHALL complete in < 10ms (negligible impact on game initialization)

**NFR-RKS-2**: Memory
- Kingdom selection SHALL not increase memory footprint by more than 1KB

**NFR-RKS-3**: Maintainability
- Selection algorithm SHALL be documented with clear comments
- Algorithm SHALL be unit-testable in isolation

---

## Feature 2: CLI Interactive Prompts for Action Cards

### Overview

Implement comprehensive CLI prompts for all 11 action cards that require player choices. This fixes the Cellar auto-execution bug and extends interactive prompts to all cards with mandatory decisions (Chapel, Remodel, Mine, Workshop, Feast, Library, Throne Room, Chancellor, Spy, Bureaucrat).

### Current Behavior (The Cellar Bug)

**User's Example**:
```
Turn 4 | Player 1 | Action Phase
Hand: Market, Copper, Copper, Copper, Cellar

> 1 (Play Cellar)
✓ Player 1 played Market  [WRONG - displays wrong card name]

Hand: Copper, Copper, Copper, Copper  [NO PROMPT SHOWN]
```

**Root Cause**:
- Game engine correctly sets `pendingEffect` for Cellar
- CLI game loop does NOT detect `pendingEffect` state
- CLI does NOT generate or display move options for pending effects
- User never sees discard options
- Auto-execution occurs with default behavior

**Scope of Problem**:
- Cellar: Cannot choose which cards to discard
- Chapel: Cannot choose which cards to trash
- Remodel: No prompts for trash/gain steps
- Mine: No prompts for treasure trash/gain
- Workshop/Feast: No prompts for card gain
- Library: No prompts for set-aside decisions
- Throne Room: Cannot choose which action to double
- Chancellor: No prompt for deck decision
- Spy: No prompts for opponent's top card decisions
- Bureaucrat: Opponent cannot choose victory card to topdeck

### Desired Behavior

**Expected Cellar Interaction**:
```
Turn 4 | Player 1 | Action Phase
Hand: Market, Copper, Copper, Copper, Cellar

> play Cellar
✓ Player 1 played Cellar
Effect: +1 Action. Discard any number of cards, then draw that many.

Choose cards to discard:
  [1] Discard: Market, Copper, Copper, Copper (draw 4)
  [2] Discard: Copper, Copper, Copper (draw 3)
  [3] Discard: Market, Copper, Copper (draw 3)
  [4] Discard: Copper, Copper (draw 2)
  [5] Discard: Market, Copper (draw 2)
  [6] Discard: Copper (draw 1)
  [7] Discard: Market (draw 1)
  [8] Discard nothing (draw 0)

> 2
✓ Discarded: Copper, Copper, Copper
✓ Drew 3 cards

Hand: Market, Silver, Estate, Gold
```

### Card-by-Card Specifications

#### Cellar

**Card Effect**: +1 Action. Discard any number of cards, then draw that many.

**Pending Effect**: `discard_for_cellar`

**Interaction Type**: Single-step, multiple options

**Prompt Design**:
```
Effect: +1 Action. Discard any number of cards, then draw that many.

Choose cards to discard:
  [1] Discard: Copper, Copper, Copper, Copper (draw 4)
  [2] Discard: Copper, Copper, Copper (draw 3)
  [3] Discard: Copper, Copper (draw 2)
  [4] Discard: Copper (draw 1)
  [5] Discard nothing (draw 0)
```

**Move Options Generation**:
- Generate all combinations of cards in hand up to 4 cards (or hand size, whichever is smaller)
- Include "discard nothing" option
- Sort options by number of cards descending (most discard first)

**Example Full Interaction**:
```
Turn 3 | Player 1 | Action Phase
Hand: Cellar, Copper, Copper, Estate, Silver

> play Cellar
✓ Player 1 played Cellar
Effect: +1 Action. Discard any number of cards, then draw that many.

Choose cards to discard:
  [1] Discard: Copper, Copper, Estate, Silver (draw 4)
  [2] Discard: Copper, Copper, Estate (draw 3)
  [3] Discard: Copper, Copper, Silver (draw 3)
  [4] Discard: Copper, Estate, Silver (draw 3)
  [5] Discard: Copper, Copper (draw 2)
  [6] Discard: Copper, Estate (draw 2)
  [7] Discard: Copper, Silver (draw 2)
  [8] Discard: Estate, Silver (draw 2)
  [9] Discard: Copper (draw 1)
  [10] Discard: Estate (draw 1)
  [11] Discard: Silver (draw 1)
  [12] Discard nothing (draw 0)

> 2
✓ Discarded: Copper, Copper, Estate
✓ Drew 3 cards

Hand: Gold, Village, Smithy
```

---

#### Chapel

**Card Effect**: Trash up to 4 cards from your hand.

**Pending Effect**: `trash_cards` (with `maxTrash: 4`)

**Interaction Type**: Single-step, multiple options

**Prompt Design**:
```
Effect: Trash up to 4 cards from your hand.

Choose cards to trash:
  [1] Trash: Copper, Copper, Estate, Curse (4 cards)
  [2] Trash: Copper, Copper, Estate (3 cards)
  [3] Trash: Copper, Estate (2 cards)
  [4] Trash: Estate (1 card)
  [5] Trash nothing
```

**Move Options Generation**:
- Similar to Cellar but with trash instead of discard
- Up to 4 cards (or hand size)
- Include "trash nothing" option

**Example Full Interaction**:
```
Turn 2 | Player 1 | Action Phase
Hand: Chapel, Copper, Copper, Estate

> play Chapel
✓ Player 1 played Chapel
Effect: Trash up to 4 cards from your hand.

Choose cards to trash:
  [1] Trash: Copper, Copper, Estate (3 cards)
  [2] Trash: Copper, Copper (2 cards)
  [3] Trash: Copper, Estate (2 cards)
  [4] Trash: Copper (1 card)
  [5] Trash: Estate (1 card)
  [6] Trash nothing

> 1
✓ Trashed: Copper, Copper, Estate
Trash Pile: [Copper, Copper, Estate]

Hand: (empty)
```

---

#### Remodel (2-Step Card)

**Card Effect**: Trash a card from your hand. Gain a card costing up to $2 more.

**Pending Effects**:
1. `trash_for_remodel` (Step 1)
2. `gain_card` with `maxGainCost` (Step 2)

**Interaction Type**: Two-step

**Step 1 Prompt Design**:
```
Effect: Trash a card from your hand. Gain a card costing up to $2 more.

Step 1: Choose card to trash:
  [1] Trash: Estate ($2) → Can gain up to $4
  [2] Trash: Copper ($0) → Can gain up to $2
  [3] Trash: Silver ($3) → Can gain up to $5
```

**Step 2 Prompt Design**:
```
Step 2: Choose card to gain (up to $5):
  [1] Gain: Province ($8) [TOO EXPENSIVE]
  [2] Gain: Duchy ($5)
  [3] Gain: Market ($5)
  [4] Gain: Laboratory ($5)
  [5] Gain: Smithy ($4)
  [6] Gain: Silver ($3)
```

**Move Options Generation**:
- Step 1: List all cards in hand with their costs and potential gain range
- Step 2: List all cards in supply with cost ≤ maxGainCost, sorted by cost descending

**Example Full Interaction**:
```
Turn 5 | Player 1 | Action Phase
Hand: Remodel, Estate, Copper, Silver, Gold

> play Remodel
✓ Player 1 played Remodel
Effect: Trash a card from your hand. Gain a card costing up to $2 more.

Step 1: Choose card to trash:
  [1] Trash: Estate ($2) → Can gain up to $4
  [2] Trash: Copper ($0) → Can gain up to $2
  [3] Trash: Silver ($3) → Can gain up to $5
  [4] Trash: Gold ($6) → Can gain up to $8

> 1
✓ Trashed: Estate
Trash Pile: [Estate]

Step 2: Choose card to gain (up to $4):
  [1] Gain: Smithy ($4)
  [2] Gain: Remodel ($4)
  [3] Gain: Village ($3)
  [4] Gain: Silver ($3)
  [5] Gain: Cellar ($2)
  [6] Gain: Chapel ($2)
  [7] Gain: Estate ($2)

> 1
✓ Gained: Smithy (to discard pile)

Hand: Copper, Silver, Gold
```

---

#### Mine (2-Step Card)

**Card Effect**: Trash a Treasure from your hand. Gain a Treasure costing up to $3 more, to your hand.

**Pending Effects**:
1. `select_treasure_to_trash` (Step 1)
2. `gain_card` with `maxGainCost` and `destination: 'hand'` (Step 2)

**Interaction Type**: Two-step, treasure-specific

**Step 1 Prompt Design**:
```
Effect: Trash a Treasure from your hand. Gain a Treasure costing up to $3 more, to your hand.

Step 1: Choose Treasure to trash:
  [1] Trash: Copper ($0) → Can gain Treasure up to $3
  [2] Trash: Silver ($3) → Can gain Treasure up to $6
```

**Step 2 Prompt Design**:
```
Step 2: Choose Treasure to gain (up to $6, to hand):
  [1] Gain: Gold ($6) to hand
  [2] Gain: Silver ($3) to hand
  [3] Gain: Copper ($0) to hand
```

**Move Options Generation**:
- Step 1: List only treasures in hand
- Step 2: List only treasures in supply with cost ≤ maxGainCost
- Note: Gained card goes to hand, not discard pile

**Example Full Interaction**:
```
Turn 4 | Player 1 | Action Phase
Hand: Mine, Copper, Copper, Silver

> play Mine
✓ Player 1 played Mine
Effect: Trash a Treasure from your hand. Gain a Treasure costing up to $3 more, to your hand.

Step 1: Choose Treasure to trash:
  [1] Trash: Silver ($3) → Can gain Treasure up to $6
  [2] Trash: Copper ($0) → Can gain Treasure up to $3

> 1
✓ Trashed: Silver
Trash Pile: [Silver]

Step 2: Choose Treasure to gain (up to $6, to hand):
  [1] Gain: Gold ($6) to hand
  [2] Gain: Silver ($3) to hand

> 1
✓ Gained: Gold to hand

Hand: Mine, Copper, Copper, Gold
```

---

#### Workshop

**Card Effect**: Gain a card costing up to $4.

**Pending Effect**: `gain_card` with `maxGainCost: 4`

**Interaction Type**: Single-step, gain selection

**Prompt Design**:
```
Effect: Gain a card costing up to $4.

Choose card to gain:
  [1] Gain: Smithy ($4)
  [2] Gain: Remodel ($4)
  [3] Gain: Village ($3)
  [4] Gain: Silver ($3)
  [5] Gain: Cellar ($2)
  [6] Gain: Chapel ($2)
  [7] Gain: Estate ($2)
  [8] Gain: Copper ($0)
```

**Move Options Generation**:
- List all cards in supply with cost ≤ $4
- Sort by cost descending, then alphabetically

**Example Full Interaction**:
```
Turn 3 | Player 1 | Action Phase
Hand: Workshop, Copper, Copper, Estate

> play Workshop
✓ Player 1 played Workshop
Effect: Gain a card costing up to $4.

Choose card to gain:
  [1] Gain: Smithy ($4)
  [2] Gain: Militia ($4)
  [3] Gain: Village ($3)
  [4] Gain: Silver ($3)
  [5] Gain: Chapel ($2)

> 1
✓ Gained: Smithy (to discard pile)

Hand: Copper, Copper, Estate
```

---

#### Feast

**Card Effect**: Trash Feast. Gain a card costing up to $5.

**Pending Effect**: `gain_card` with `maxGainCost: 5` (and automatic Feast trashing)

**Interaction Type**: Single-step, gain selection (similar to Workshop but higher cost)

**Prompt Design**:
```
Effect: Trash Feast. Gain a card costing up to $5.

Choose card to gain:
  [1] Gain: Duchy ($5)
  [2] Gain: Market ($5)
  [3] Gain: Laboratory ($5)
  [4] Gain: Mine ($5)
  [5] Gain: Smithy ($4)
  [6] Gain: Village ($3)
```

**Move Options Generation**:
- List all cards in supply with cost ≤ $5
- Sort by cost descending, then alphabetically
- Note: Feast is automatically trashed (no user choice needed)

**Example Full Interaction**:
```
Turn 4 | Player 1 | Action Phase
Hand: Feast, Copper, Copper, Estate

> play Feast
✓ Player 1 played Feast
✓ Trashed: Feast
Effect: Gain a card costing up to $5.

Choose card to gain:
  [1] Gain: Duchy ($5)
  [2] Gain: Market ($5)
  [3] Gain: Laboratory ($5)

> 2
✓ Gained: Market (to discard pile)

Hand: Copper, Copper, Estate
```

---

#### Library

**Card Effect**: Draw until you have 7 cards in hand, skipping any Action cards you choose to; set those aside, discarding them afterwards.

**Pending Effect**: `library_set_aside` (repeats for each action card drawn)

**Interaction Type**: Multi-step (one decision per action card encountered)

**Prompt Design** (per action card):
```
Library: Drew [CardName] (Action card)

Choose:
  [1] Set aside [CardName] (skip it, discard at end)
  [2] Keep [CardName] in hand
```

**Move Options Generation**:
- For each action card drawn during Library resolution
- Binary choice: set aside or keep
- Repeat until hand has 7 cards or draw pile exhausted

**Example Full Interaction**:
```
Turn 5 | Player 1 | Action Phase
Hand: Library, Copper, Copper (3 cards)
Draw Pile: Village, Silver, Smithy, Estate, Gold, ...

> play Library
✓ Player 1 played Library
Effect: Draw until you have 7 cards in hand, skipping any Action cards you choose to.

✓ Drew: Silver (4 cards in hand)
✓ Drew: Estate (5 cards in hand)

Library: Drew Village (Action card)

Choose:
  [1] Set aside Village (skip it, discard at end)
  [2] Keep Village in hand

> 1
✓ Set aside: Village

✓ Drew: Gold (6 cards in hand)

Library: Drew Smithy (Action card)

Choose:
  [1] Set aside Smithy (skip it, discard at end)
  [2] Keep Smithy in hand

> 2
✓ Kept: Smithy

Hand: Library, Copper, Copper, Silver, Estate, Gold, Smithy (7 cards)
✓ Discarded set-aside cards: Village
```

---

#### Throne Room

**Card Effect**: You may play an Action card from your hand twice.

**Pending Effect**: `select_action_for_throne`

**Interaction Type**: Single-step, action card selection

**Prompt Design**:
```
Effect: You may play an Action card from your hand twice.

Choose Action card to play twice:
  [1] Play: Village (twice)
  [2] Play: Smithy (twice)
  [3] Play: Market (twice)
  [4] Skip (don't use Throne Room)
```

**Move Options Generation**:
- List all action cards in hand (excluding Throne Room itself)
- Include "skip" option
- After selection, chosen card is played twice

**Example Full Interaction**:
```
Turn 6 | Player 1 | Action Phase (2 actions available)
Hand: Throne Room, Village, Smithy, Copper, Estate

> play Throne Room
✓ Player 1 played Throne Room
Effect: You may play an Action card from your hand twice.

Choose Action card to play twice:
  [1] Play: Village (twice) → +2 Cards, +4 Actions
  [2] Play: Smithy (twice) → +6 Cards
  [3] Skip (don't use Throne Room)

> 2
✓ Playing Smithy (1st time)
✓ Drew 3 cards
✓ Playing Smithy (2nd time)
✓ Drew 3 cards

Hand: Village, Copper, Estate, Silver, Gold, Duchy, Market, Cellar, Workshop (9 cards)
Actions: 1
```

---

#### Chancellor

**Card Effect**: +$2. You may immediately put your deck into your discard pile.

**Pending Effect**: `chancellor_decision`

**Interaction Type**: Single-step, binary choice

**Prompt Design**:
```
Effect: +$2. You may immediately put your deck into your discard pile.

Choose:
  [1] Yes (put deck into discard pile)
  [2] No (keep deck as-is)
```

**Move Options Generation**:
- Binary choice
- Clear explanation of what each option does

**Example Full Interaction**:
```
Turn 3 | Player 1 | Action Phase
Hand: Chancellor, Copper, Copper, Estate
Draw Pile: 5 cards
Discard Pile: 2 cards

> play Chancellor
✓ Player 1 played Chancellor
Effect: +$2
Coins: 2

Chancellor: You may immediately put your deck into your discard pile.

Choose:
  [1] Yes (move 5 cards from deck to discard pile)
  [2] No (keep deck as-is)

> 1
✓ Moved deck to discard pile (5 cards)

Draw Pile: (empty)
Discard Pile: 7 cards
```

---

#### Spy

**Card Effect**: +1 Card, +1 Action. Each player (including you) reveals the top card of their deck and either discards it or puts it back, your choice.

**Pending Effect**: `spy_decision` (repeats for each player)

**Interaction Type**: Multi-step (one decision per player)

**Prompt Design** (per player):
```
Spy: Player [N] revealed [CardName]

Choose:
  [1] Discard [CardName]
  [2] Keep [CardName] on top of deck
```

**Move Options Generation**:
- For each player in turn order (starting with current player)
- Binary choice: discard or keep
- Display which player and which card

**Example Full Interaction** (2-player game):
```
Turn 4 | Player 1 | Action Phase
Hand: Spy, Copper, Copper, Estate

> play Spy
✓ Player 1 played Spy
Effect: +1 Card, +1 Action
✓ Drew: Silver
Actions: 1

Spy: Player 1 (you) revealed Copper

Choose:
  [1] Discard Copper
  [2] Keep Copper on top of deck

> 1
✓ Player 1 discarded Copper

Spy: Player 2 revealed Estate

Choose:
  [1] Discard Estate (Player 2's top card)
  [2] Keep Estate on top of deck (Player 2's top card)

> 1
✓ Player 2 discarded Estate

Hand: Silver, Copper, Copper, Estate
```

---

#### Bureaucrat

**Card Effect**: Gain a Silver onto your deck. Each other player reveals a Victory card from their hand and puts it onto their deck (or reveals a hand with no Victory cards).

**Pending Effect**: `reveal_and_topdeck` (for each opponent)

**Interaction Type**: Multi-step (opponent choices)

**Prompt Design** (opponent's turn):
```
Bureaucrat Attack: Choose Victory card to put on top of your deck:
  [1] Topdeck: Estate
  [2] Topdeck: Duchy
  [3] Reveal hand (no Victory cards)
```

**Move Options Generation**:
- For each opponent, list victory cards in their hand
- Include "reveal hand" option if no victory cards
- Binary/multiple choice depending on hand contents

**Example Full Interaction** (2-player game):
```
Turn 5 | Player 1 | Action Phase
Hand: Bureaucrat, Copper, Copper, Estate

> play Bureaucrat
✓ Player 1 played Bureaucrat
✓ Gained: Silver (to top of deck)

Bureaucrat Attack on Player 2

Player 2's turn:
Bureaucrat Attack: Choose Victory card to put on top of your deck:
  [1] Topdeck: Estate
  [2] Topdeck: Duchy

> 1
✓ Player 2 topdecked: Estate

Hand: Copper, Copper, Estate
```

---

### User Stories

**US-CLI-1**: Visible Options for Cellar
- **As a** player
- **I want** to see all discard options when I play Cellar
- **So that** I can make informed decisions about which cards to discard

**US-CLI-2**: Consistent Interaction Patterns
- **As a** player
- **I want** consistent numbered option formats across all interactive cards
- **So that** I can quickly understand and use any card

**US-CLI-3**: Clear Effect Reminders
- **As a** player
- **I want** to see the card's effect description with each prompt
- **So that** I remember what the card does without checking help

**US-CLI-4**: Multi-Step Guidance
- **As a** player playing Remodel or Mine
- **I want** clear "Step 1" and "Step 2" labels
- **So that** I understand I'm in a two-step process

**US-CLI-5**: Error Recovery
- **As a** player
- **I want** helpful error messages when I enter an invalid selection
- **So that** I can correct my mistake without confusion

**US-CLI-6**: Option Descriptions
- **As a** new player
- **I want** each option to explain what will happen
- **So that** I can learn the game while playing

### Functional Requirements

**FR-CLI-1**: Pending Effect Detection
- CLI game loop SHALL check for `state.pendingEffect` after each move execution
- If pendingEffect exists, CLI SHALL NOT prompt for standard moves
- CLI SHALL enter interactive prompt mode instead

**FR-CLI-2**: Option Generation
- System SHALL generate all valid move options for the current pendingEffect type
- Options SHALL be numbered starting from 1
- Options SHALL be deterministic (same state → same option order)

**FR-CLI-3**: Display Formatting
- Each prompt SHALL display the card's effect description
- Each option SHALL be numbered: `[1]`, `[2]`, etc.
- Each option SHALL include a clear description of what happens
- Multi-step cards SHALL label steps: "Step 1:", "Step 2:"

**FR-CLI-4**: User Input Parsing
- System SHALL accept numeric input (1, 2, 3, ...)
- System SHALL reject non-numeric input with error message
- System SHALL reject out-of-range numbers with error message
- System SHALL re-prompt after invalid input (no state change)

**FR-CLI-5**: Move Execution
- System SHALL execute the selected move
- System SHALL display confirmation of what happened
- System SHALL handle multi-step cards by re-entering prompt mode for next step
- System SHALL clear pendingEffect only when all steps complete

**FR-CLI-6**: Comprehensive Card Coverage
- System SHALL support all 11 cards with interactive choices:
  - Cellar, Chapel, Remodel, Mine, Workshop, Feast
  - Library, Throne Room, Chancellor, Spy, Bureaucrat
- Each card SHALL have unique prompt formatting appropriate to its effect

**FR-CLI-7**: Backward Compatibility
- CLI changes SHALL NOT affect AI player move execution
- MCP server interface SHALL remain unchanged
- Programmatic move submission SHALL continue to work

### Acceptance Criteria

**AC-CLI-1**: Cellar Fix Validation
- GIVEN a player plays Cellar with 4 cards in hand
- WHEN pendingEffect is set
- THEN CLI SHALL display all discard combinations (up to 4 cards)
- AND user SHALL be able to select via number
- AND selected cards SHALL be discarded
- AND player SHALL draw same number of cards

**AC-CLI-2**: All 11 Cards Prompt
- GIVEN each of the 11 interactive cards is played in a test game
- WHEN pendingEffect is set for each card
- THEN CLI SHALL display appropriate options for each card
- AND all 11 cards SHALL show interactive prompts

**AC-CLI-3**: Numbered Selection
- GIVEN any interactive prompt is displayed
- WHEN user enters a valid number
- THEN corresponding move SHALL execute
- AND confirmation message SHALL display

**AC-CLI-4**: Invalid Selection Handling
- GIVEN an interactive prompt with 5 options
- WHEN user enters "99" or "abc" or "-1"
- THEN system SHALL display error message
- AND system SHALL re-prompt without state change

**AC-CLI-5**: Multi-Step Cards (Remodel)
- GIVEN player plays Remodel
- WHEN Step 1 completes (trash selection)
- THEN Step 2 prompt SHALL automatically display (gain selection)
- AND both steps SHALL execute successfully

**AC-CLI-6**: Multi-Step Cards (Mine)
- GIVEN player plays Mine with treasures in hand
- WHEN Step 1 completes (treasure trash)
- THEN Step 2 SHALL show only treasures as gain options
- AND gained treasure SHALL go to hand (not discard pile)

**AC-CLI-7**: Iterative Prompts (Library)
- GIVEN player plays Library with action cards in draw pile
- WHEN each action card is drawn
- THEN system SHALL prompt for set-aside decision
- AND system SHALL continue until hand has 7 cards or draw pile exhausted

**AC-CLI-8**: Iterative Prompts (Spy)
- GIVEN player plays Spy in 2-player game
- WHEN top cards are revealed
- THEN system SHALL prompt for decision on Player 1's card
- THEN system SHALL prompt for decision on Player 2's card
- AND both decisions SHALL execute correctly

**AC-CLI-9**: Effect Description Display
- GIVEN any interactive card is played
- WHEN prompt is displayed
- THEN card's effect description SHALL be shown
- AND description SHALL match card's official text

**AC-CLI-10**: Regression Compliance
- GIVEN all Phase 1-4 tests
- WHEN tests are run with Phase 4.1 CLI changes
- THEN all tests SHALL pass
- AND AI players SHALL continue to function correctly

**AC-CLI-11**: Performance
- GIVEN an interactive prompt is displayed
- WHEN performance is measured
- THEN option generation SHALL complete in < 50ms
- AND display rendering SHALL complete in < 50ms

### Edge Cases

**EC-CLI-1**: Empty Hand with Interactive Card
- **Scenario**: Player plays Chapel with empty hand
- **Expected**: Display "No cards to trash" and skip interaction
- **Rationale**: No valid options means no choice needed

**EC-CLI-2**: No Valid Options (Workshop with empty supply)
- **Scenario**: Player plays Workshop but no cards ≤ $4 available in supply
- **Expected**: Display "No cards available to gain" and skip interaction
- **Rationale**: Impossible to fulfill card effect

**EC-CLI-3**: Throne Room with No Other Actions
- **Scenario**: Player plays Throne Room with no other action cards in hand
- **Expected**: Display "No action cards to play" and skip effect
- **Rationale**: Throne Room requires another action to function

**EC-CLI-4**: Library with Full Hand
- **Scenario**: Player plays Library with already 7 cards in hand
- **Expected**: No cards drawn, no prompt shown
- **Rationale**: Effect condition already satisfied

**EC-CLI-5**: Library with Empty Draw Pile
- **Scenario**: Player plays Library with draw pile exhausted
- **Expected**: System draws available cards (shuffles discard if needed), stops at 7 or when no more cards
- **Rationale**: Standard draw rules apply

**EC-CLI-6**: Spy with Empty Opponent Decks
- **Scenario**: Player plays Spy but opponents have empty draw piles
- **Expected**: Shuffle discard pile if available, otherwise skip that player's reveal
- **Rationale**: Standard draw rules apply to reveals

**EC-CLI-7**: Bureaucrat Against Hand with No Victory Cards
- **Scenario**: Opponent has no victory cards when Bureaucrat is played
- **Expected**: Prompt shows "Reveal hand (no Victory cards)" option only
- **Rationale**: Attack has no effect if no victory cards available

**EC-CLI-8**: Remodel Trash Province
- **Scenario**: Player trashes Province ($8) with Remodel
- **Expected**: Step 2 shows cards up to $10 (but none exist in base set)
- **Rationale**: Effect allows gaining cards up to $10 even if none exist

**EC-CLI-9**: Mine with No Treasures
- **Scenario**: Player plays Mine with no treasures in hand
- **Expected**: Display "No treasures to trash" and skip effect
- **Rationale**: Mine requires treasures to function

**EC-CLI-10**: Concurrent Pending Effects
- **Scenario**: Throne Room plays another Throne Room (nested)
- **Expected**: System handles nested pendingEffect states correctly
- **Rationale**: Edge case for complex card interactions

**EC-CLI-11**: User Cancellation Mid-Step
- **Scenario**: User wants to exit during Remodel Step 1
- **Expected**: Currently not supported; user must complete the effect
- **Rationale**: Game rules require effect resolution once card is played

### Dependencies

**Requires**:
- pendingEffect system (exists in GameState)
- validMoves generation for pending effects (may need enhancement)
- Card effect descriptions (exist in cards.ts)

**Affects**:
- CLI game loop logic
- CLI display formatting
- CLI input parsing

**Blocked By**:
- None (all prerequisites exist)

### Affected Components

**CLI** (`packages/cli/`):
- `src/cli.ts` - Game loop: detect pendingEffect, enter interactive mode
- `src/display.ts` - Add displayInteractivePrompt() and related helpers
- `src/parser.ts` - Add parseNumericSelection()
- `src/helpers.ts` (NEW) - Option generation helpers (getCombinations, formatMoveOption, etc.)

**Core Engine** (`packages/core/` - minor changes if needed):
- `src/game.ts` - Verify validMoves includes all necessary options for pending effects

**Tests**:
- `packages/cli/tests/` - New test file for interactive prompts
- `packages/core/tests/` - Add tests for validMoves with pending effects

### Non-Functional Requirements

**NFR-CLI-1**: Performance
- Option generation SHALL complete in < 50ms for worst case (Cellar with 5 cards = 31 combinations)
- Display rendering SHALL complete in < 50ms

**NFR-CLI-2**: Usability
- Options SHALL be visually scannable (clear numbering, grouping)
- Error messages SHALL explain what went wrong and how to fix it
- Prompts SHALL fit in standard terminal width (80 chars recommended)

**NFR-CLI-3**: Maintainability
- Each card's prompt logic SHALL be isolated in a dedicated function
- Shared helpers SHALL be reusable across multiple card types
- Code SHALL include clear comments explaining interaction patterns

---

## Feature 3: Card Sorting Display

### Overview

Implement consistent card sorting throughout the CLI by cost (ascending) and then alphabetically. This makes it easier for players to find cards in supply listings, buy options, and all other card displays.

### Current Behavior

- Cards are displayed in arbitrary order (often insertion order or iteration order)
- Supply command shows cards without logical grouping
- Buy phase options are unsorted
- Difficult to scan for specific cards or compare costs

### Desired Behavior

- All card lists sorted by cost (ascending: $0, $2, $3, $4, $5, ...)
- Within same cost, cards sorted alphabetically (ASCII-betical)
- Consistent sorting across all displays: supply, buy options, hand, etc.
- Optional: Group display by cost tier for easier scanning

### User Stories

**US-SORT-1**: Quick Card Lookup
- **As a** player
- **I want** cards sorted by cost
- **So that** I can quickly find cards in my budget range

**US-SORT-2**: Consistent Display
- **As a** player
- **I want** alphabetical sorting within cost tiers
- **So that** I can find specific cards predictably

**US-SORT-3**: Strategic Planning
- **As a** player planning my next buy
- **I want** to see all cards grouped by cost
- **So that** I can easily compare options at each price point

**US-SORT-4**: Reduced Cognitive Load
- **As a** player
- **I want** consistent card ordering everywhere
- **So that** I don't have to search for cards in different orders in different contexts

### Functional Requirements

**FR-SORT-1**: Primary Sort by Cost
- System SHALL sort cards by cost in ascending order ($0, $2, $3, $4, $5, $6, $8)
- Copper ($0) SHALL appear before Silver ($3)
- Silver ($3) SHALL appear before Gold ($6)

**FR-SORT-2**: Secondary Sort Alphabetically
- Within cards of same cost, system SHALL sort alphabetically
- ASCII-betical sorting is acceptable (A-Z, case-sensitive if needed)
- Example: At $4: Bureaucrat, Feast, Gardens, Militia, Remodel, Smithy, Throne Room

**FR-SORT-3**: Universal Application
- Sorting SHALL apply to:
  - Supply command output
  - Buy phase available cards
  - Hand display (optional, may remain unsorted for tactical reasons)
  - Discard pile display
  - Trash pile display
  - Any other card list in CLI

**FR-SORT-4**: Basic Cards Included
- Basic treasures (Copper, Silver, Gold) SHALL be included in sort
- Victory cards (Estate, Duchy, Province) SHALL be included in sort
- Curse SHALL be included in sort (cost $0)

**FR-SORT-5**: No Logic Changes
- Sorting is display-only
- No changes to game engine logic or state management
- No changes to move execution or validation

### Acceptance Criteria

**AC-SORT-1**: Supply Command Sorted
- GIVEN player runs "supply" command
- WHEN output is displayed
- THEN cards SHALL be listed by cost ascending
- AND cards within same cost SHALL be alphabetical

**AC-SORT-2**: Example Supply Output
```
Supply:
  $0: Copper (46), Curse (10)
  $2: Cellar (10), Chapel (10), Estate (8)
  $3: Silver (40), Village (10), Woodcutter (10)
  $4: Bureaucrat (10), Feast (10), Militia (10), Remodel (10), Smithy (10)
  $5: Duchy (8), Laboratory (10), Market (10), Mine (10)
  $6: Gold (30)
  $8: Province (8)
```

**AC-SORT-3**: Buy Phase Options Sorted
- GIVEN player is in buy phase with 5 coins
- WHEN available buy options are displayed
- THEN options SHALL be sorted by cost, then alphabetically
- AND cards > $5 SHALL NOT appear (out of budget)

**AC-SORT-4**: Example Buy Output
```
Turn 3 | Player 1 | Buy Phase | $5 available

Available to buy:
  [1] Province ($8) [TOO EXPENSIVE]
  [2] Duchy ($5)
  [3] Laboratory ($5)
  [4] Market ($5)
  [5] Mine ($5)
  [6] Smithy ($4)
  [7] Village ($3)
  [8] Silver ($3)
  [9] Estate ($2)
  [10] Copper ($0)
```

**AC-SORT-5**: All Displays Consistent
- GIVEN any CLI command that displays cards
- WHEN cards are shown
- THEN sorting SHALL be consistent with cost-then-name order

**AC-SORT-6**: Performance
- GIVEN supply command is run
- WHEN performance is measured
- THEN sorting SHALL complete in < 5ms

**AC-SORT-7**: Regression
- GIVEN all Phase 1-4 tests
- WHEN tests are run with sorting changes
- THEN 100% of tests SHALL pass (display changes don't affect logic)

### Edge Cases

**EC-SORT-1**: Cards with Same Name Different Types
- **Scenario**: Hypothetically, if two cards had same name but different costs (doesn't exist in Dominion)
- **Expected**: Sort by cost first, so they'd be separated
- **Rationale**: Cost is primary sort key

**EC-SORT-2**: Empty Supply Piles
- **Scenario**: Some supply piles are empty (0 cards)
- **Expected**: Still display in sorted order, show "(0)" for count
- **Rationale**: Player should see what's unavailable

**EC-SORT-3**: Cards Not in Supply
- **Scenario**: Display cards that aren't in current game's supply
- **Expected**: Sort those cards too if displayed (e.g., in help system)
- **Rationale**: Consistency everywhere

**EC-SORT-4**: Single Card
- **Scenario**: List has only one card
- **Expected**: Display that card (trivial sort)
- **Rationale**: Edge case, no issues expected

**EC-SORT-5**: Duplicate Card Names in List
- **Scenario**: List has duplicate entries (shouldn't happen, but defensive)
- **Expected**: Sort treats duplicates normally (stable sort)
- **Rationale**: Defensive programming

### Dependencies

**Requires**:
- getCard() function for cost lookup (exists)
- Access to card definitions (exists in cards.ts)

**Affects**:
- CLI display functions

**Blocked By**:
- None

### Affected Components

**CLI** (`packages/cli/`):
- `src/display.ts` - Add sortCardsByCostAndName() helper, apply to all display functions
  - displaySupply()
  - displayBuyOptions()
  - displayHand() (optional)
  - displayDiscardPile() (if exists)
  - displayTrashPile() (if exists)

**Core Engine** (`packages/core/`):
- No changes required (display-only feature)

**Tests**:
- `packages/cli/tests/` - Add tests for sorting function
- Minimal test updates (display changes)

### Non-Functional Requirements

**NFR-SORT-1**: Performance
- Sorting function SHALL complete in < 5ms for typical card lists (10-30 cards)
- O(n log n) complexity acceptable

**NFR-SORT-2**: Maintainability
- Sorting helper SHALL be reusable function
- Function SHALL have clear documentation and examples

**NFR-SORT-3**: Localization-Ready
- Use localeCompare() for alphabetical sorting (future-proofs for international users)

---

## Traceability Matrix

Map each requirement to specific test IDs (to be defined in TESTING.md):

| Requirement ID | Feature | Test IDs |
|----------------|---------|----------|
| FR-RKS-1 | Random Kingdom: Exact count | UT-RKS-1, IT-RKS-1, E2E-RKS-1 |
| FR-RKS-2 | Random Kingdom: Seed-based | UT-RKS-2, UT-RKS-3, E2E-RKS-1 |
| FR-RKS-3 | Random Kingdom: All cards available | UT-RKS-6 |
| FR-RKS-4 | Random Kingdom: Display | IT-RKS-2, E2E-RKS-1 |
| FR-RKS-5 | Random Kingdom: Backward compat | UT-RKS-4, AC-RKS-7 |
| FR-RKS-6 | Random Kingdom: Algorithm | UT-RKS-1, UT-RKS-8 |
| FR-CLI-1 | CLI Prompts: Detection | UT-CLI-CELLAR-1, IT-CLI-1 |
| FR-CLI-2 | CLI Prompts: Option generation | UT-CLI-CELLAR-1, UT-CLI-CHAPEL-1, ... |
| FR-CLI-3 | CLI Prompts: Display formatting | IT-CLI-1, IT-CLI-2, E2E-CLI-1 |
| FR-CLI-4 | CLI Prompts: Input parsing | UT-CLI-INPUT-1, IT-CLI-ERROR-1 |
| FR-CLI-5 | CLI Prompts: Move execution | IT-CLI-1, IT-CLI-2, IT-CLI-3 |
| FR-CLI-6 | CLI Prompts: All 11 cards | E2E-CLI-1 (tests all cards) |
| FR-CLI-7 | CLI Prompts: Backward compat | Regression tests |
| FR-SORT-1 | Card Sorting: By cost | UT-SORT-1 |
| FR-SORT-2 | Card Sorting: Alphabetically | UT-SORT-2 |
| FR-SORT-3 | Card Sorting: Universal | IT-SORT-1, IT-SORT-2 |
| FR-SORT-4 | Card Sorting: Basic cards | UT-SORT-1 |
| FR-SORT-5 | Card Sorting: Display-only | Regression tests |

---

## Success Criteria Summary

Phase 4.1 is considered **COMPLETE** when:

1. ✅ **Feature 1 (Random Kingdom)**:
   - All 6 functional requirements implemented and tested
   - All 8 acceptance criteria pass
   - Seed-based randomization works reliably
   - CLI displays kingdom at game start
   - All existing tests pass with minimal updates

2. ✅ **Feature 2 (CLI Prompts)**:
   - All 7 functional requirements implemented and tested
   - All 11 acceptance criteria pass
   - All 11 interactive cards show prompts correctly
   - Multi-step cards (Remodel, Mine, Library, Spy) work end-to-end
   - Error handling is robust and helpful

3. ✅ **Feature 3 (Card Sorting)**:
   - All 5 functional requirements implemented and tested
   - All 7 acceptance criteria pass
   - Consistent sorting across all CLI displays
   - Performance targets met (< 5ms)

4. ✅ **Quality Metrics**:
   - Test coverage remains ≥ 95%
   - 100% regression (all Phase 1-4 tests pass)
   - No performance degradation
   - Documentation updated (README.md, CLAUDE.md)

---

**Document Status**: DRAFT - Ready for review and test specification

**Next Steps**:
1. Review and approve feature specifications
2. Create TESTING.md with comprehensive test specifications
3. Create TECHNICAL.md with implementation guidance
4. Begin test-architect work (write tests)
5. Begin dev-agent work (implement features)

**Estimated Effort**: 19-25 hours total (see OVERVIEW.md for breakdown)
