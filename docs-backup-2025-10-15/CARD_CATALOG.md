# Principality AI - Card Catalog

**Version**: 1.0.0 (Phase 1 - MVP Set)
**Last Updated**: October 4, 2025

Complete specifications for all cards in Principality AI. This catalog serves as the single source of truth for card behavior, effects, and interactions.

---

## Table of Contents

- [Card Categories](#card-categories)
- [Basic Treasures](#basic-treasures)
- [Victory Cards](#victory-cards)
- [Kingdom Cards](#kingdom-cards)
  - [Draw Cards](#draw-cards)
  - [Economy Cards](#economy-cards)
  - [Utility Cards](#utility-cards)
- [Effect Resolution](#effect-resolution)
- [Edge Cases & Interactions](#edge-cases--interactions)
- [Supply Quantities](#supply-quantities)

---

## Card Categories

### Treasure Cards
Cards that provide coins when played during buy phase. Cannot be played during action phase.

### Victory Cards
Cards that provide victory points at game end. No in-game effects.

### Action Cards
Cards that provide various effects when played during action phase. Consume one action to play.

---

## Basic Treasures

### Copper

![Basic Treasure]

| Property | Value |
|----------|-------|
| **Type** | Treasure |
| **Cost** | $0 |
| **Effect** | +$1 |
| **Supply** | 60 cards |

#### Description
The basic treasure. Every player starts with 7 Copper cards.

#### Effect Details
- When played: Add 1 coin to available coins
- Can only be played during buy phase
- No limit to number of Copper that can be played per turn

#### Starting Deck
Each player begins with 7 Copper cards.

---

### Silver

![Basic Treasure]

| Property | Value |
|----------|-------|
| **Type** | Treasure |
| **Cost** | $3 |
| **Effect** | +$2 |
| **Supply** | 40 cards |

#### Description
Mid-tier treasure providing 2 coins.

#### Effect Details
- When played: Add 2 coins to available coins
- Can only be played during buy phase
- More efficient than Copper (2 coins per card vs 1)

#### Strategy Notes
- Early game purchase target
- Replaces Copper in engine decks
- Cost-efficient at $3 for +$2

---

### Gold

![Basic Treasure]

| Property | Value |
|----------|-------|
| **Type** | Treasure |
| **Cost** | $6 |
| **Effect** | +$3 |
| **Supply** | 30 cards |

#### Description
Premium treasure providing 3 coins.

#### Effect Details
- When played: Add 3 coins to available coins
- Can only be played during buy phase
- Most efficient treasure (3 coins per card)

#### Strategy Notes
- Late game purchase
- Enables Province purchases
- Generally worth buying when affordable

---

## Victory Cards

### Estate

![Victory Card]

| Property | Value |
|----------|-------|
| **Type** | Victory |
| **Cost** | $2 |
| **Victory Points** | 1 |
| **Supply** | 12 cards |

#### Description
Basic victory card worth 1 point at game end.

#### Effect Details
- No in-game effect
- Worth 1 victory point when scoring
- Dead card during gameplay (cannot be played)

#### Starting Deck
Each player begins with 3 Estate cards.

#### Strategy Notes
- Generally undesirable to buy (clogs deck)
- Sometimes purchased to end game or prevent opponent from winning

---

### Duchy

![Victory Card]

| Property | Value |
|----------|-------|
| **Type** | Victory |
| **Cost** | $5 |
| **Victory Points** | 3 |
| **Supply** | 12 cards |

#### Description
Mid-tier victory card worth 3 points at game end.

#### Effect Details
- No in-game effect
- Worth 3 victory points when scoring
- Dead card during gameplay

#### Strategy Notes
- 3 VP for $5 is less efficient than Province (6 VP for $8)
- Usually purchased in late game when Province is too expensive
- Can be part of winning strategy in shorter games

---

### Province

![Victory Card]

| Property | Value |
|----------|-------|
| **Type** | Victory |
| **Cost** | $8 |
| **Victory Points** | 6 |
| **Supply** | 12 cards |

#### Description
Premium victory card worth 6 points at game end.

#### Effect Details
- No in-game effect
- Worth 6 victory points when scoring
- Dead card during gameplay

#### Game End Trigger
**Important**: Game ends immediately when Province pile is empty.

#### Strategy Notes
- Primary victory point source in most games
- Most efficient VP/$
- Emptying Province pile ends game

---

## Kingdom Cards

### Draw Cards

#### Village

![Action Card - Draw]

| Property | Value |
|----------|-------|
| **Type** | Action |
| **Cost** | $3 |
| **Effect** | +1 Card, +2 Actions |
| **Supply** | 10 cards |

##### Description
Card-neutral action enabler. Allows playing multiple action cards per turn.

##### Effect Resolution
1. Draw 1 card from deck
2. Add 2 actions to available actions
3. Net effect: Deck-neutral, +1 action

##### Effect Details
- **Card Draw**: Draw occurs first, before actions added
- **Deck Exhaustion**: If deck empty, shuffle discard pile first
- **Zero Cards Available**: If deck and discard both empty, no card drawn (no error)

##### Use Cases
- Chain multiple action cards together
- Enable combo plays with Smithy/Laboratory
- Maintain action count while cycling deck

##### Interactions
- **With Smithy**: Village → Smithy allows playing Smithy without consuming net actions
- **With Festival**: Can chain multiple Villages and Festivals
- **Multiple Villages**: Can play all Villages in hand for massive action count

##### Strategy Notes
- Key enabler for action-heavy strategies
- Cost-efficient at $3
- Almost always beneficial to play
- Rare to have negative impact (card-neutral)

---

#### Smithy

![Action Card - Draw]

| Property | Value |
|----------|-------|
| **Type** | Action |
| **Cost** | $4 |
| **Effect** | +3 Cards |
| **Supply** | 10 cards |

##### Description
Simple card draw. Significantly increases hand size.

##### Effect Resolution
1. Draw 3 cards from deck

##### Effect Details
- **Deck Exhaustion**: If fewer than 3 cards in deck, shuffle discard pile
- **Insufficient Cards**: If deck + discard < 3, draw as many as available (no error)
- **Action Cost**: Consumes one action, provides no actions back

##### Use Cases
- Dig for specific cards
- Increase hand size for better turns
- Find treasures in buy phase (if played during action phase)

##### Interactions
- **With Village**: Play Village first to maintain actions
- **Multiple Smithies**: Each draws 3, but consumes actions quickly
- **Terminal Draw**: Without action enablers, only play one Smithy per turn

##### Strategy Notes
- Strong early game purchase
- +3 cards is significant draw power
- "Terminal" (doesn't give actions) - requires Village/Laboratory to chain
- Good in Big Money strategies

---

#### Laboratory

![Action Card - Draw]

| Property | Value |
|----------|-------|
| **Type** | Action |
| **Cost** | $5 |
| **Effect** | +2 Cards, +1 Action |
| **Supply** | 10 cards |

##### Description
Card-positive action enabler. Increases hand size while maintaining actions.

##### Effect Resolution
1. Draw 2 cards from deck
2. Add 1 action to available actions
3. Net effect: +1 card, action-neutral

##### Effect Details
- **Card Draw**: Draw occurs first, before action added
- **Deck Exhaustion**: If fewer than 2 cards, shuffle discard pile
- **Action-Neutral**: Can play all Laboratories in hand without running out of actions

##### Use Cases
- Build large hands
- Maintain action count while drawing
- Cycle deck efficiently

##### Interactions
- **Multiple Laboratories**: Can chain unlimited Labs (action-neutral)
- **With Draw Cards**: Excellent with Smithy/Council Room
- **Deck Cycling**: Plays through deck faster than Village

##### Strategy Notes
- Versatile and powerful
- More expensive than Village ($5 vs $3)
- Card-positive makes it excellent for engine building
- Can play entire hand of Labs without issue

---

### Economy Cards

#### Market

![Action Card - Economy]

| Property | Value |
|----------|-------|
| **Type** | Action |
| **Cost** | $5 |
| **Effect** | +1 Card, +1 Action, +$1, +1 Buy |
| **Supply** | 10 cards |

##### Description
Swiss army knife card. Provides small bonus to every resource.

##### Effect Resolution
1. Draw 1 card from deck
2. Add 1 action to available actions
3. Add 1 coin to available coins
4. Add 1 buy to available buys
5. Net effect: Action-neutral, card-neutral, +$1, +1 buy

##### Effect Details
- **Multi-Effect**: All effects apply simultaneously
- **Resolution Order**: Effects processed in order: cards, actions, coins, buys
- **Deck Exhaustion**: Standard draw rules apply

##### Use Cases
- Provide extra buy for dual purchases
- Generate coins in action phase
- Maintain actions while cycling
- Versatile filler card

##### Interactions
- **Multiple Markets**: Can play entire hand without consuming actions
- **With Woodcutter**: Both provide +buy, enabling multi-buy turns
- **Coin Generation**: Provides coins during action phase (unlike treasures)

##### Strategy Notes
- Jack-of-all-trades, master of none
- +Buy is most unique aspect
- Enables Province + Duchy turns
- Action-neutral makes it safe to play

---

#### Woodcutter

![Action Card - Economy]

| Property | Value |
|----------|-------|
| **Type** | Action |
| **Cost** | $3 |
| **Effect** | +$2, +1 Buy |
| **Supply** | 10 cards |

##### Description
Provides coins and extra buy. Enables multi-purchase turns.

##### Effect Resolution
1. Add 2 coins to available coins
2. Add 1 buy to available buys

##### Effect Details
- **No Cards Drawn**: Woodcutter provides no card advantage
- **Coin Timing**: Coins added during action phase
- **Terminal**: Provides no actions

##### Use Cases
- Enable dual purchases
- Increase buying power
- Replace treasure cards in action-heavy decks

##### Interactions
- **With Village**: Play Village first to maintain actions
- **Multiple Woodcutters**: Each provides +$2 and +1 buy
- **With Market**: Combine for total +3 coins and +2 buys

##### Strategy Notes
- Cheap ($3) source of +buy
- +$2 is decent coin generation
- Terminal (no actions) limits utility
- Better in action-rich decks

---

#### Festival

![Action Card - Economy]

| Property | Value |
|----------|-------|
| **Type** | Action |
| **Cost** | $5 |
| **Effect** | +2 Actions, +$2, +1 Buy |
| **Supply** | 10 cards |

##### Description
Action enabler with economic benefits. Provides coins and buy.

##### Effect Resolution
1. Add 2 actions to available actions
2. Add 2 coins to available coins
3. Add 1 buy to available buys
4. Net effect: +1 action, +$2, +1 buy

##### Effect Details
- **No Card Draw**: Festival provides no card advantage
- **Action-Positive**: Net +1 action after playing Festival

##### Use Cases
- Generate coins in action phase
- Enable action chains
- Provide extra buy
- Alternative to Village in action decks

##### Interactions
- **Multiple Festivals**: Can chain multiple Festivals
- **With Village**: Both provide action surplus
- **With Draw Cards**: Excellent combo (actions + coins)

##### Strategy Notes
- Expensive ($5) but powerful
- Action-positive without card draw
- Coin generation in action phase is valuable
- +Buy enables big purchasing turns

---

### Utility Cards

#### Council Room

![Action Card - Utility]

| Property | Value |
|----------|-------|
| **Type** | Action |
| **Cost** | $5 |
| **Effect** | +4 Cards, +1 Buy |
| **Supply** | 10 cards |

##### Description
Massive card draw with extra buy. Strongest draw card in MVP set.

##### Effect Resolution
1. Draw 4 cards from deck
2. Add 1 buy to available buys

##### Effect Details
- **Large Draw**: +4 cards is most in MVP set
- **Deck Exhaustion**: If fewer than 4 cards, shuffle discard pile
- **Terminal**: No actions provided
- **Buy Bonus**: Enables multi-purchase

##### Use Cases
- Dig deep for specific cards
- Find multiple treasure cards
- Enable Province + Duchy purchases
- Build massive hands

##### Interactions
- **With Village**: Village first to maintain actions
- **Multiple Council Rooms**: Requires action enablers
- **With Laboratory**: Lab → Council Room draws 6 total cards

##### Strategy Notes
- Most powerful single-card draw
- Terminal nature requires careful play
- +Buy is valuable side benefit
- Can dramatically accelerate games

---

#### Cellar

![Action Card - Utility]

| Property | Value |
|----------|-------|
| **Type** | Action |
| **Cost** | $2 |
| **Effect** | +1 Action, Discard any number of cards, then draw that many |
| **Supply** | 10 cards |

##### Description
Deck filtering card. Discard unwanted cards and draw replacements.

##### Effect Resolution

**Phase 1: Play Cellar**
1. Add 1 action to available actions
2. Trigger discard prompt

**Phase 2: Discard for Cellar** (requires separate move)
1. Player specifies cards to discard (via `discard_for_cellar` move)
2. Discard specified cards
3. Draw number of cards equal to number discarded

##### Effect Details
- **Two-Step Process**: Requires separate `discard_for_cellar` move after playing
- **Optional Discard**: Can discard 0 cards (draw 0)
- **Discard Validation**: All specified cards must be in hand
- **Draw Count**: Always equals discard count (cannot draw more or less)
- **Deck Exhaustion**: Standard draw rules apply

##### Move Format
```typescript
// Step 1: Play Cellar
{ type: 'play_action', card: 'Cellar' }

// Step 2: Discard and draw
{ type: 'discard_for_cellar', cards: ['Estate', 'Estate', 'Copper'] }
// Discards 3 cards, draws 3 cards
```

##### Use Cases
- Discard victory cards in early/mid game
- Cycle deck to find specific cards
- Improve hand quality
- Maintain actions while filtering

##### Interactions
- **With Victory Cards**: Discard Estates/Duchies for useful cards
- **Multiple Cellar**: Can play all Cellars (action-neutral)
- **Deck Exhaustion**: Can discard more than deck contains (draws available)

##### Edge Cases

**Discard 0 Cards**:
```typescript
{ type: 'discard_for_cellar', cards: [] }  // Valid, draw 0
```

**Discard More Than Deck**:
- If discard 3 but only 2 cards in deck+discard, draw 2 (no error)

**Invalid Cards**:
- Specifying cards not in hand returns error
- Must spell card names exactly as in hand

##### Strategy Notes
- Cheapest kingdom card ($2)
- Action-neutral makes it safe to play
- Deck quality > deck quantity
- Excellent in engines with dead cards
- Can be used as "virtual draw" (discard 0, draw 0, maintain actions)

---

## Effect Resolution

### Resolution Order

When a card is played:

1. **Card Movement**: Card moves from hand to play area
2. **Resource Decrementation**: Actions/buys decremented by 1 (if applicable)
3. **Effect Application**: Card effects applied in this order:
   - Cards drawn
   - Actions added
   - Buys added
   - Coins added
   - Special effects (Cellar discard prompt)

### Example Resolution

**Playing Market with 2 cards in deck**:
```
Initial State:
- Hand: [Market, Copper, Estate]
- Deck: [Silver, Gold]
- Actions: 1
- Coins: 0

Play Market:
1. Market → Play area
2. Actions: 1 → 0 (cost to play)
3. Draw 1 card: Silver → Hand
4. Actions: 0 → 1 (Market effect)
5. Coins: 0 → 1 (Market effect)
6. Buys: 1 → 2 (Market effect)

Final State:
- Hand: [Copper, Estate, Silver]
- Deck: [Gold]
- Play Area: [Market]
- Actions: 1
- Coins: 1
- Buys: 2
```

---

## Edge Cases & Interactions

### Deck Exhaustion

**When drawing cards with empty deck**:

1. If deck empty, shuffle discard pile into deck
2. If both empty, draw as many cards as available (may be 0)
3. Never errors on insufficient cards

**Example**:
```
Deck: []
Discard: [Copper, Silver]
Hand: [Smithy]

Play Smithy:
1. Deck empty, shuffle discard → Deck: [Copper, Silver]
2. Draw 3 cards: Draw 2 (Copper, Silver), deck exhausted
3. Final hand includes 2 cards, not 3 (no error)
```

### Multiple Card Draws

**Playing multiple draw cards**:

Each draw card triggers independently. Deck shuffles between draws if needed.

**Example**:
```
Hand: [Laboratory, Smithy]
Deck: [Village]
Discard: [Copper, Silver, Gold, Estate, Market]

Play Laboratory:
- Draw 2: Village (from deck), then shuffle discard, draw Copper
- Deck now: [Silver, Gold, Estate, Market]

Play Smithy:
- Draw 3: Silver, Gold, Estate
- Deck now: [Market]
```

### Zero Actions/Buys

**Starting cleanup with resources**:

Unused actions/buys do not carry over.

**Example**:
```
- Have 3 actions, 2 buys at end of buy phase
- End phase → Cleanup
- New turn starts with 1 action, 1 buy (not 4/3)
```

### Victory Card Timing

**Victory cards provide no in-game benefit**:

- Cannot be played (not action/treasure)
- Clog hand during game
- Only score at game end

### Game End Priority

**Multiple end conditions**:

If Province empty AND 3 piles empty simultaneously:
- Both conditions check after each move
- Province check takes precedence (but results identical)

---

## Supply Quantities

### Starting Supply (1-4 players)

| Card | Quantity | Notes |
|------|----------|-------|
| **Copper** | 60 | Unlimited practical |
| **Silver** | 40 | Usually sufficient |
| **Gold** | 30 | Can be exhausted |
| **Estate** | 12 | Victory pile |
| **Duchy** | 12 | Victory pile |
| **Province** | 12 | Game end trigger |
| **Village** | 10 | Kingdom |
| **Smithy** | 10 | Kingdom |
| **Laboratory** | 10 | Kingdom |
| **Market** | 10 | Kingdom |
| **Woodcutter** | 10 | Kingdom |
| **Festival** | 10 | Kingdom |
| **Council Room** | 10 | Kingdom |
| **Cellar** | 10 | Kingdom |

**Total Cards in Supply**: 258 cards

### Supply Exhaustion

**Game continues until**:
- Province pile empty, OR
- Any 3 piles empty

**Strategic Implications**:
- Buying out Copper is impractical (60 cards)
- Kingdom piles can exhaust (10 cards)
- Victory piles exactly 12 (4 players = 3 per player)

---

## Card Categories Summary

### By Cost

| Cost | Cards |
|------|-------|
| **$0** | Copper |
| **$2** | Estate, Cellar |
| **$3** | Silver, Village, Woodcutter |
| **$4** | Smithy |
| **$5** | Duchy, Laboratory, Market, Festival, Council Room |
| **$6** | Gold |
| **$8** | Province |

### By Type

| Type | Count | Cards |
|------|-------|-------|
| **Treasure** | 3 | Copper, Silver, Gold |
| **Victory** | 3 | Estate, Duchy, Province |
| **Action** | 8 | Village, Smithy, Laboratory, Market, Woodcutter, Festival, Council Room, Cellar |

### By Effect Type

| Effect | Cards |
|--------|-------|
| **+Cards** | Village, Smithy, Laboratory, Market, Council Room, Cellar* |
| **+Actions** | Village, Laboratory, Market, Festival, Cellar |
| **+Coins** | Copper, Silver, Gold, Market, Woodcutter, Festival |
| **+Buys** | Market, Woodcutter, Festival, Council Room |
| **Special** | Cellar (discard/draw) |

*Cellar draws cards equal to discards

---

## Phase 2 Preview

**Upcoming Cards** (not in MVP):

- Attack cards (Militia, Witch)
- Trashing cards (Chapel, Remodel)
- Gaining cards (Workshop)
- Reaction cards (Moat)
- Curse cards

These will introduce new mechanics and interactions.

---

## Glossary

- **Terminal**: Action card that provides no +Actions (consumes action to play)
- **Cantrip**: Action card that is action-neutral (+1 Card, +1 Action minimum)
- **Dead Card**: Card with no in-game effect (victory cards)
- **Engine**: Deck built around chaining action cards
- **Big Money**: Strategy focusing on treasures and victory cards

---

**Document Version**: 1.0.0
**Last Updated**: October 4, 2025
**Game Version**: Phase 1 MVP

For API details, see [API_REFERENCE.md](./API_REFERENCE.md)
For game rules, see [principality-ai-design.md](./principality-ai-design.md)
