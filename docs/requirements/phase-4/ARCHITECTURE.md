# Phase 4 Architecture: Technical Design

**Status**: DRAFT
**Created**: 2025-11-02
**Phase**: 4
**Owner**: requirements-architect

---

## Table of Contents

- [GameState Changes](#gamestate-changes)
- [Move Type Extensions](#move-type-extensions)
- [Card Type System](#card-type-system)
- [Trash Pile System](#trash-pile-system)
- [Gaining System](#gaining-system)
- [Attack Resolution Flow](#attack-resolution-flow)
- [Reaction System](#reaction-system)
- [Throne Room Mechanics](#throne-room-mechanics)
- [Special Card Behaviors](#special-card-behaviors)
- [Performance Considerations](#performance-considerations)
- [Backward Compatibility](#backward-compatibility)

---

## GameState Changes

### Current GameState (Phase 3)

```typescript
export interface GameState {
  readonly players: ReadonlyArray<PlayerState>;
  readonly supply: ReadonlyMap<CardName, number>;
  readonly currentPlayer: number;
  readonly phase: Phase;
  readonly turnNumber: number;
  readonly seed: string;
  readonly gameLog: ReadonlyArray<string>;
}
```

### Updated GameState (Phase 4)

```typescript
export interface GameState {
  readonly players: ReadonlyArray<PlayerState>;
  readonly supply: ReadonlyMap<CardName, number>;
  readonly trash: ReadonlyArray<CardName>;  // NEW: Trash pile
  readonly currentPlayer: number;
  readonly phase: Phase;
  readonly turnNumber: number;
  readonly seed: string;
  readonly gameLog: ReadonlyArray<string>;
}
```

### Supply Changes

**Current Supply** (Phase 3):
```typescript
{
  'Copper': 60,
  'Silver': 40,
  'Gold': 30,
  'Estate': 12,
  'Duchy': 12,
  'Province': 12,
  'Village': 10,
  'Smithy': 10,
  'Laboratory': 10,
  'Market': 10,
  'Woodcutter': 10,
  'Festival': 10,
  'Council Room': 10,
  'Cellar': 10
}
```

**Updated Supply** (Phase 4):
```typescript
{
  // Basic Cards (unchanged)
  'Copper': 60,
  'Silver': 40,
  'Gold': 30,
  'Estate': 12,
  'Duchy': 12,
  'Province': 12,
  'Curse': 10,  // NEW: 10 for 2-player, 20 for 3-player, 30 for 4-player

  // Existing Kingdom Cards (unchanged)
  'Village': 10,
  'Smithy': 10,
  'Laboratory': 10,
  'Market': 10,
  'Woodcutter': 10,
  'Festival': 10,
  'Council Room': 10,
  'Cellar': 10,

  // NEW Kingdom Cards
  'Chapel': 10,
  'Remodel': 10,
  'Mine': 10,
  'Moneylender': 10,
  'Workshop': 10,
  'Feast': 10,
  'Militia': 10,
  'Witch': 10,
  'Bureaucrat': 10,
  'Spy': 10,
  'Thief': 10,
  'Moat': 10,
  'Throne Room': 10,
  'Adventurer': 10,
  'Chancellor': 10,
  'Library': 10,
  'Gardens': 10  // Victory card (same pile size as Estate/Duchy/Province)
}
```

**Curse Supply Calculation**:
```typescript
function getCurseSupply(playerCount: number): number {
  if (playerCount === 2) return 10;
  if (playerCount === 3) return 20;
  if (playerCount === 4) return 30;
  return 10; // Default to 2-player
}
```

---

## Move Type Extensions

### Current Move Types (Phase 3)

```typescript
export interface Move {
  type: 'play_action' | 'play_treasure' | 'play_all_treasures' | 'buy' | 'end_phase' | 'discard_for_cellar';
  card?: CardName;
  cards?: ReadonlyArray<CardName>;
}
```

### Updated Move Types (Phase 4)

```typescript
export interface Move {
  type:
    // Existing (Phase 1-3)
    | 'play_action'
    | 'play_treasure'
    | 'play_all_treasures'
    | 'buy'
    | 'end_phase'
    | 'discard_for_cellar'

    // NEW (Phase 4)
    | 'trash_cards'                    // Chapel, Remodel, Mine, Moneylender, Feast
    | 'gain_card'                      // Workshop, Feast, Remodel, Mine
    | 'reveal_reaction'                // Moat blocking attacks
    | 'select_action_for_throne'       // Throne Room selecting action
    | 'discard_to_hand_size'           // Militia attack response
    | 'reveal_and_topdeck'             // Bureaucrat attack response
    | 'spy_decision'                   // Spy revealed card decision
    | 'select_treasure_to_trash'       // Thief selecting treasure
    | 'gain_trashed_card'              // Thief gaining trashed treasure
    | 'chancellor_decision'            // Chancellor deck-to-discard choice
    | 'library_set_aside';             // Library setting aside actions

  card?: CardName;
  cards?: ReadonlyArray<CardName>;
  destination?: 'hand' | 'discard' | 'deck';  // NEW: For Mine (hand), Bureaucrat (deck)
  decision?: 'discard' | 'keep' | 'yes' | 'no';  // NEW: For Spy, Chancellor, Library
  targetPlayer?: number;  // NEW: For attack resolution
}
```

### Move Validation

Each move type requires specific validation:

```typescript
function validateMove(move: Move, gameState: GameState): boolean {
  const player = gameState.players[gameState.currentPlayer];

  switch (move.type) {
    case 'trash_cards':
      // Cards must be in hand
      // Card count must be within limit (Chapel: 0-4, Remodel: 1, etc.)
      return move.cards?.every(c => player.hand.includes(c)) ?? false;

    case 'gain_card':
      // Card must be in supply
      // Card must meet cost requirement
      // Destination must be valid
      return (gameState.supply.get(move.card!) ?? 0) > 0;

    case 'reveal_reaction':
      // Must be reaction card (Moat)
      // Must be in hand
      // Must be during attack
      return move.card === 'Moat' && player.hand.includes('Moat');

    case 'select_action_for_throne':
      // Must be action card
      // Must be in hand
      return move.card && isActionCard(move.card) && player.hand.includes(move.card);

    case 'discard_to_hand_size':
      // Cards must be in hand
      // Discard count must reduce hand to target size
      const targetSize = 3; // Militia
      const discardCount = player.hand.length - targetSize;
      return (move.cards?.length ?? 0) === discardCount;

    // ... other validations
  }
}
```

---

## Card Type System

### Existing Card Types (Phase 3)

```typescript
export type CardType = 'action' | 'treasure' | 'victory' | 'curse';
```

### Updated Card Types (Phase 4)

```typescript
export type CardType =
  | 'action'           // Village, Smithy, etc.
  | 'treasure'         // Copper, Silver, Gold
  | 'victory'          // Estate, Duchy, Province, Gardens
  | 'curse'            // Curse
  | 'action-attack'    // Militia, Witch, Bureaucrat, Spy, Thief
  | 'action-reaction'; // Moat
```

**Note**: `action-attack` and `action-reaction` are still action cards (inherit action behavior), but have additional properties.

### Card Definition Updates

```typescript
export interface Card {
  name: CardName;
  type: CardType;
  cost: number;
  effect: CardEffect;
  description: string;
  victoryPoints?: number;
  isAttack?: boolean;      // NEW: True for Militia, Witch, etc.
  isReaction?: boolean;    // NEW: True for Moat
}

export const NEW_CARDS: Record<CardName, Card> = {
  'Chapel': {
    name: 'Chapel',
    type: 'action',
    cost: 2,
    effect: { special: 'trash_up_to_4' },
    description: 'Trash up to 4 cards from your hand'
  },
  'Militia': {
    name: 'Militia',
    type: 'action',
    cost: 4,
    effect: { coins: 2 },
    description: '+$2. Each other player discards down to 3 cards',
    isAttack: true
  },
  'Moat': {
    name: 'Moat',
    type: 'action',
    cost: 2,
    effect: { cards: 2 },
    description: '+2 Cards. Reveal to block attacks',
    isReaction: true
  },
  'Gardens': {
    name: 'Gardens',
    type: 'victory',
    cost: 4,
    effect: {},
    description: 'Worth 1 VP per 10 cards in your deck',
    victoryPoints: 0  // Calculated dynamically
  },
  // ... other 14 cards
};
```

---

## Trash Pile System

### Data Structure

```typescript
// In GameState
readonly trash: ReadonlyArray<CardName>;

// Initially empty
const initialState: GameState = {
  // ...
  trash: [],
  // ...
};
```

### Trashing Operation

```typescript
function trashCards(
  gameState: GameState,
  playerIndex: number,
  cardsToTrash: ReadonlyArray<CardName>
): GameState {
  const player = gameState.players[playerIndex];

  // Validate cards are in hand
  const invalidCards = cardsToTrash.filter(c => !player.hand.includes(c));
  if (invalidCards.length > 0) {
    throw new Error(`Cards not in hand: ${invalidCards.join(', ')}`);
  }

  // Remove cards from hand
  const newHand = player.hand.filter(c => !cardsToTrash.includes(c));

  // Add cards to trash pile
  const newTrash = [...gameState.trash, ...cardsToTrash];

  // Update player
  const newPlayer = { ...player, hand: newHand };
  const newPlayers = gameState.players.map((p, i) => i === playerIndex ? newPlayer : p);

  return {
    ...gameState,
    players: newPlayers,
    trash: newTrash,
    gameLog: [
      ...gameState.gameLog,
      `Player ${playerIndex} trashed: ${cardsToTrash.join(', ')}`
    ]
  };
}
```

### Trash Pile Query

```typescript
function getTrashPile(gameState: GameState): ReadonlyArray<CardName> {
  return gameState.trash;
}

function isCardInTrash(gameState: GameState, cardName: CardName): boolean {
  return gameState.trash.includes(cardName);
}

function countCardInTrash(gameState: GameState, cardName: CardName): number {
  return gameState.trash.filter(c => c === cardName).length;
}
```

### Trash Pile Visibility

- **Public Information**: All players can see trash pile contents
- **Query Anytime**: No restrictions on viewing
- **Immutable**: Cards cannot be removed from trash (in base set)

---

## Gaining System

### Gain Card Operation

```typescript
function gainCard(
  gameState: GameState,
  playerIndex: number,
  cardName: CardName,
  destination: 'hand' | 'discard' | 'deck' = 'discard'
): GameState {
  // Validate card in supply
  const supplyCount = gameState.supply.get(cardName) ?? 0;
  if (supplyCount <= 0) {
    throw new Error(`${cardName} not available in supply`);
  }

  // Decrement supply
  const newSupply = new Map(gameState.supply);
  newSupply.set(cardName, supplyCount - 1);

  // Add card to player's destination
  const player = gameState.players[playerIndex];
  let newPlayer: PlayerState;

  switch (destination) {
    case 'hand':
      newPlayer = { ...player, hand: [...player.hand, cardName] };
      break;
    case 'discard':
      newPlayer = { ...player, discardPile: [...player.discardPile, cardName] };
      break;
    case 'deck':
      newPlayer = { ...player, drawPile: [cardName, ...player.drawPile] };  // Top of deck
      break;
  }

  const newPlayers = gameState.players.map((p, i) => i === playerIndex ? newPlayer : p);

  return {
    ...gameState,
    players: newPlayers,
    supply: newSupply,
    gameLog: [
      ...gameState.gameLog,
      `Player ${playerIndex} gained ${cardName} to ${destination}`
    ]
  };
}
```

### Cost Validation

```typescript
function canGainCard(
  cardName: CardName,
  maxCost: number,
  gameState: GameState
): boolean {
  const card = getCard(cardName);
  const inSupply = (gameState.supply.get(cardName) ?? 0) > 0;
  return card.cost <= maxCost && inSupply;
}

function getGainableCards(
  maxCost: number,
  gameState: GameState
): ReadonlyArray<CardName> {
  return Array.from(gameState.supply.keys()).filter(cardName =>
    canGainCard(cardName, maxCost, gameState)
  );
}
```

---

## Attack Resolution Flow

### Attack Sequence Diagram

```
Player 0 plays Attack card (e.g., Militia)
  ↓
Execute attack effect on Player 0 (if any, e.g., Militia +$2)
  ↓
For each opponent (Player 1, Player 2, ...):
  ↓
  Check if opponent has Moat in hand
    ↓ Yes
    Prompt: "Reveal Moat to block?"
      ↓ Yes
      Skip attack for this player
      ↓ No
      Continue to attack resolution
    ↓ No Moat
    Continue to attack resolution
  ↓
  Execute attack effect on opponent
    - Militia: Discard to 3 cards
    - Witch: Gain Curse
    - Bureaucrat: Topdeck Victory card
    - Spy: Reveal top card, attacker decides
    - Thief: Reveal 2 cards, attacker selects Treasure to trash
  ↓
Next opponent
  ↓
Attack complete
```

### Attack Resolution Implementation

```typescript
function resolveAttack(
  gameState: GameState,
  attackerIndex: number,
  attackCard: CardName
): GameState {
  let state = gameState;

  // Get all opponents
  const opponentIndices = gameState.players
    .map((_, i) => i)
    .filter(i => i !== attackerIndex);

  // Resolve attack for each opponent
  for (const opponentIndex of opponentIndices) {
    const opponent = state.players[opponentIndex];

    // Check for Moat reaction
    const hasMoat = opponent.hand.includes('Moat');
    if (hasMoat) {
      // Prompt opponent to reveal Moat (or auto-reveal for AI)
      const revealMoat = promptRevealMoat(opponentIndex);  // User input or AI decision
      if (revealMoat) {
        state = {
          ...state,
          gameLog: [
            ...state.gameLog,
            `Player ${opponentIndex} revealed Moat. Attack blocked.`
          ]
        };
        continue;  // Skip attack for this opponent
      }
    }

    // Execute attack effect
    state = executeAttackEffect(state, attackCard, attackerIndex, opponentIndex);
  }

  return state;
}

function executeAttackEffect(
  gameState: GameState,
  attackCard: CardName,
  attackerIndex: number,
  victimIndex: number
): GameState {
  switch (attackCard) {
    case 'Militia':
      return militiaAttack(gameState, victimIndex);
    case 'Witch':
      return witchAttack(gameState, victimIndex);
    case 'Bureaucrat':
      return bureaucratAttack(gameState, victimIndex);
    case 'Spy':
      return spyAttack(gameState, attackerIndex, victimIndex);
    case 'Thief':
      return thiefAttack(gameState, attackerIndex, victimIndex);
    default:
      return gameState;
  }
}
```

### Attack-Specific Implementations

**Militia**:
```typescript
function militiaAttack(gameState: GameState, victimIndex: number): GameState {
  const victim = gameState.players[victimIndex];
  if (victim.hand.length <= 3) {
    return gameState;  // No discard needed
  }

  // Prompt victim to discard (hand.length - 3) cards
  const cardsToDiscard = promptDiscardToThree(victimIndex, victim.hand);

  // Execute discard
  return discardCards(gameState, victimIndex, cardsToDiscard);
}
```

**Witch**:
```typescript
function witchAttack(gameState: GameState, victimIndex: number): GameState {
  const curseCount = gameState.supply.get('Curse') ?? 0;
  if (curseCount <= 0) {
    return gameState;  // No Curses left
  }

  // Gain Curse to victim's discard
  return gainCard(gameState, victimIndex, 'Curse', 'discard');
}
```

**Spy**:
```typescript
function spyAttack(
  gameState: GameState,
  attackerIndex: number,
  victimIndex: number
): GameState {
  const victim = gameState.players[victimIndex];

  // Reveal top card of victim's deck
  const topCard = victim.drawPile[0];
  if (!topCard) {
    // Shuffle discard if deck empty
    const state = shuffleDiscardIntoDeck(gameState, victimIndex);
    const newTopCard = state.players[victimIndex].drawPile[0];
    if (!newTopCard) return state;  // No cards available
  }

  // Attacker decides: discard or keep
  const decision = promptSpyDecision(attackerIndex, topCard);

  if (decision === 'discard') {
    return discardTopCard(gameState, victimIndex);
  } else {
    return gameState;  // Keep on deck
  }
}
```

---

## Reaction System

### Moat Reveal Mechanism

```typescript
function checkAndPromptReaction(
  gameState: GameState,
  playerIndex: number,
  attackCard: CardName
): { revealed: boolean; newState: GameState } {
  const player = gameState.players[playerIndex];

  // Check if player has Moat
  if (!player.hand.includes('Moat')) {
    return { revealed: false, newState: gameState };
  }

  // Prompt player to reveal (or auto-reveal for AI)
  const revealDecision = promptRevealReaction(playerIndex, 'Moat', attackCard);

  if (revealDecision) {
    const newState = {
      ...gameState,
      gameLog: [
        ...gameState.gameLog,
        `Player ${playerIndex} revealed Moat to block ${attackCard}`
      ]
    };
    return { revealed: true, newState };
  }

  return { revealed: false, newState: gameState };
}
```

### Moat Stays in Hand

**Important**: Revealing Moat does NOT remove it from hand

```typescript
// Moat reveal does not modify hand
function revealMoat(gameState: GameState, playerIndex: number): GameState {
  // Only add to game log, hand unchanged
  return {
    ...gameState,
    gameLog: [
      ...gameState.gameLog,
      `Player ${playerIndex} revealed Moat`
    ]
  };
}
```

---

## Throne Room Mechanics

### Action Duplication System

```typescript
function playThroneRoom(
  gameState: GameState,
  playerIndex: number,
  selectedAction: CardName
): GameState {
  const player = gameState.players[playerIndex];

  // Validate selected action is in hand
  if (!player.hand.includes(selectedAction)) {
    throw new Error(`${selectedAction} not in hand`);
  }

  // Play the action twice
  let state = gameState;

  // First play
  state = playActionCard(state, playerIndex, selectedAction);

  // Second play (if action still in hand or in play)
  // Note: Some actions (like Feast) trash themselves, so check availability
  if (canPlayActionAgain(state, playerIndex, selectedAction)) {
    state = playActionCard(state, playerIndex, selectedAction);
  }

  return state;
}
```

### Special Throne Room Cases

**Feast + Throne Room**:
```typescript
// Feast trashes itself on first play
// But Throne Room effect continues: gain 2 cards total
function playThroneRoomFeast(gameState: GameState, playerIndex: number): GameState {
  let state = gameState;

  // First effect: Feast trashes itself, gain card up to $5
  state = trashCards(state, playerIndex, ['Feast']);
  state = gainCard(state, playerIndex, promptGainCard(5), 'discard');

  // Second effect: Feast already trashed, but effect happens again
  state = gainCard(state, playerIndex, promptGainCard(5), 'discard');

  return state;
}
```

**Militia + Throne Room**:
```typescript
// Militia: +$2, opponents discard to 3
// Throne Room: +$4, opponents discard to 3 TWICE (but can't discard below 3)
function playThroneRoomMilitia(gameState: GameState, playerIndex: number): GameState {
  let state = gameState;

  // First play: +$2, discard to 3
  state = addCoins(state, playerIndex, 2);
  state = resolveAttack(state, playerIndex, 'Militia');

  // Second play: +$2, discard to 3 (if hand > 3 again)
  state = addCoins(state, playerIndex, 2);
  state = resolveAttack(state, playerIndex, 'Militia');

  return state;
}
```

---

## Special Card Behaviors

### Adventurer: Reveal Until 2 Treasures

```typescript
function playAdventurer(gameState: GameState, playerIndex: number): GameState {
  const player = gameState.players[playerIndex];
  let state = gameState;
  let treasuresFound: CardName[] = [];
  let cardsRevealed: CardName[] = [];

  while (treasuresFound.length < 2) {
    // Check deck, shuffle if needed
    if (player.drawPile.length === 0) {
      state = shuffleDiscardIntoDeck(state, playerIndex);
    }

    // Check again after shuffle
    if (state.players[playerIndex].drawPile.length === 0) {
      break;  // No more cards available
    }

    // Reveal top card
    const topCard = state.players[playerIndex].drawPile[0];
    cardsRevealed.push(topCard);

    if (isTreasureCard(topCard)) {
      treasuresFound.push(topCard);
    }

    // Remove from deck
    state = removeTopCard(state, playerIndex);
  }

  // Add treasures to hand
  state = addCardsToHand(state, playerIndex, treasuresFound);

  // Discard non-treasures
  const nonTreasures = cardsRevealed.filter(c => !treasuresFound.includes(c));
  state = addCardsToDiscard(state, playerIndex, nonTreasures);

  return state;
}
```

### Library: Draw to 7, Skip Actions

```typescript
function playLibrary(gameState: GameState, playerIndex: number): GameState {
  const player = gameState.players[playerIndex];
  let state = gameState;
  let setAsideCards: CardName[] = [];

  while (state.players[playerIndex].hand.length < 7) {
    // Check deck, shuffle if needed
    if (state.players[playerIndex].drawPile.length === 0) {
      state = shuffleDiscardIntoDeck(state, playerIndex);
    }

    // Check again after shuffle
    if (state.players[playerIndex].drawPile.length === 0) {
      break;  // No more cards
    }

    // Draw card
    const drawnCard = state.players[playerIndex].drawPile[0];
    state = removeTopCard(state, playerIndex);

    // If action card, prompt to set aside
    if (isActionCard(drawnCard)) {
      const setAside = promptSetAside(playerIndex, drawnCard);
      if (setAside) {
        setAsideCards.push(drawnCard);
        continue;  // Don't add to hand
      }
    }

    // Add to hand
    state = addCardToHand(state, playerIndex, drawnCard);
  }

  // Discard set-aside cards
  state = addCardsToDiscard(state, playerIndex, setAsideCards);

  return state;
}
```

### Gardens: Dynamic VP Calculation

```typescript
function calculateGardensVP(playerState: PlayerState): number {
  // Count total cards in all zones
  const totalCards =
    playerState.hand.length +
    playerState.drawPile.length +
    playerState.discardPile.length +
    playerState.inPlay.length;

  // Count Gardens in player's deck
  const gardensCount = countCardInDeck(playerState, 'Gardens');

  // 1 VP per 10 cards, per Gardens
  return gardensCount * Math.floor(totalCards / 10);
}

function calculateScore(gameState: GameState, playerIndex: number): number {
  const player = gameState.players[playerIndex];
  let score = 0;

  // Standard victory cards
  score += countCardInDeck(player, 'Estate') * 1;
  score += countCardInDeck(player, 'Duchy') * 3;
  score += countCardInDeck(player, 'Province') * 6;

  // Gardens (dynamic)
  score += calculateGardensVP(player);

  // Curses (negative)
  score -= countCardInDeck(player, 'Curse') * 1;

  return score;
}
```

---

## Performance Considerations

### Move Execution Targets

**Current Performance** (Phase 3):
- Move execution: ~12ms average
- Supply lookup: ~2ms
- Card validation: ~1ms

**Phase 4 Targets**:
- Move execution: < 15ms (3ms buffer for new mechanics)
- Attack resolution: < 50ms (multiplayer with 4 players)
- Trash pile operations: < 5ms
- Gaining operations: < 10ms

### Attack Loop Optimization

```typescript
// Sequential processing (simple, deterministic)
function resolveAttackSequential(gameState: GameState, attackerIndex: number): GameState {
  let state = gameState;
  for (const opponentIndex of getOpponents(attackerIndex)) {
    state = executeAttackEffect(state, opponentIndex);
  }
  return state;
}

// Parallel processing (faster, but complex)
// NOT RECOMMENDED for Phase 4 (determinism > performance)
```

**Decision**: Use sequential attack processing for Phase 4 (simpler, deterministic)

### Supply Lookup Optimization

```typescript
// Current: Map lookup (O(1))
const supplyCount = gameState.supply.get(cardName);

// Optimized: Pre-filter available cards
const availableCards = Array.from(gameState.supply.entries())
  .filter(([_, count]) => count > 0)
  .map(([name, _]) => name);
```

### Throne Room Optimization

```typescript
// Avoid re-calculating action effects
// Cache effect results if deterministic

const actionEffectCache = new Map<string, GameState>();

function playActionWithCache(
  gameState: GameState,
  playerIndex: number,
  actionCard: CardName
): GameState {
  const cacheKey = `${JSON.stringify(gameState)}-${actionCard}`;

  if (actionEffectCache.has(cacheKey)) {
    return actionEffectCache.get(cacheKey)!;
  }

  const result = playActionCard(gameState, playerIndex, actionCard);
  actionEffectCache.set(cacheKey, result);
  return result;
}
```

**Note**: Cache invalidation required on state changes (may not be worth complexity)

---

## Backward Compatibility

### Phase 1-3 Compatibility

**Guaranteed**:
- All existing tests pass (0 regressions)
- Solo games work with 8 or 25 cards
- Multiplayer works with 8 or 25 cards
- MCP tools unchanged (new move types handled automatically)

### Migration Strategy

**GameState Migration**:
```typescript
// Phase 3 state
const phase3State: GameState = {
  players: [...],
  supply: new Map([...]),
  currentPlayer: 0,
  phase: 'action',
  turnNumber: 1,
  seed: 'seed-123',
  gameLog: []
};

// Phase 4 state (add trash pile)
const phase4State: GameState = {
  ...phase3State,
  trash: []  // Add empty trash pile
};
```

**Supply Migration**:
```typescript
// Add new cards to supply
const phase4Supply = new Map(phase3State.supply);
phase4Supply.set('Curse', 10);
phase4Supply.set('Chapel', 10);
// ... add all 17 new cards
```

### Testing Backward Compatibility

```typescript
// Regression test: Phase 1-3 functionality
describe('Phase 4 Backward Compatibility', () => {
  it('should support solo games with 8 cards', () => {
    const engine = new GameEngine('seed');
    const state = engine.initializeGame(1);
    // Only include original 8 kingdom cards
    expect(state.supply.has('Village')).toBe(true);
    expect(state.supply.has('Chapel')).toBe(false);  // Not in Phase 1-3 games
  });

  it('should pass all Phase 1-3 tests', () => {
    // Run all existing tests
    // Expect 100% pass rate
  });
});
```

---

## Summary

Phase 4 introduces 5 major architectural changes:
1. **Trash Pile**: New `trash` array in GameState
2. **Move Types**: 11 new move types for new mechanics
3. **Card Types**: `action-attack` and `action-reaction` subtypes
4. **Attack Resolution**: Sequential attack loop with Moat blocking
5. **Special Behaviors**: Throne Room duplication, Gardens dynamic VP, Adventurer/Library conditional draw

**Performance Targets**:
- Move execution: < 15ms
- Attack resolution: < 50ms (4 players)
- Trash operations: < 5ms
- Gaining operations: < 10ms

**Backward Compatibility**: 100% (all Phase 1-3 tests pass)

**Next Document**: [TESTING.md](./TESTING.md) - Comprehensive test specifications

---

**Document Status**: DRAFT - Pending Review
**Created**: 2025-11-02
**Author**: requirements-architect
**Ready for**: Test specification and implementation planning
