# Principality AI - API Reference

**Version**: 1.0.0 (Phase 1)
**Package**: `@principality/core`
**Last Updated**: October 4, 2025

This document provides complete API documentation for the Principality AI game engine. All public interfaces, methods, and types are documented here.

---

## Table of Contents

- [GameEngine Class](#gameengine-class)
  - [Constructor](#constructor)
  - [initializeGame()](#initializegame)
  - [executeMove()](#executemove)
  - [getValidMoves()](#getvalidmoves)
  - [checkGameOver()](#checkgameover)
- [Type Definitions](#type-definitions)
  - [GameState](#gamestate)
  - [PlayerState](#playerstate)
  - [Move](#move)
  - [GameResult](#gameresult)
  - [Victory](#victory)
  - [Card](#card)
- [Move Types Reference](#move-types-reference)
- [Error Reference](#error-reference)
- [Usage Examples](#usage-examples)

---

## GameEngine Class

The main entry point for the game engine. Manages game state, validates moves, and enforces game rules.

```typescript
import { GameEngine } from '@principality/core';
```

### Constructor

Creates a new GameEngine instance with deterministic randomness.

```typescript
constructor(seed: string)
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `seed` | `string` | Yes | Seed for deterministic random number generation. Any string is valid. |

#### Behavior

- Initializes internal seeded random number generator
- Identical seeds produce identical game sequences
- Empty string is valid (produces deterministic sequence)
- No validation of seed format

#### Example

```typescript
const engine = new GameEngine('my-game-12345');
```

#### Notes

- **Determinism**: Same seed = same shuffles, same starting hands
- **Thread Safety**: Not thread-safe (single-threaded JavaScript environment)
- **Immutability**: Engine instance can be reused for multiple games

---

### initializeGame()

Creates a new game state with specified number of players.

```typescript
initializeGame(numPlayers: number = 1): GameState
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `numPlayers` | `number` | No | `1` | Number of players (1-4 recommended) |

#### Returns

`GameState` - Initial game state with:
- Each player has 7 Copper + 3 Estate, shuffled
- Each player draws 5 cards as starting hand
- Supply piles initialized (60 Copper, 40 Silver, 30 Gold, 12 Victory cards each, 10 of each Kingdom card)
- First player (index 0) starts in action phase
- Turn number set to 1

#### Behavior

- No validation on `numPlayers` (accepts any number)
- Each player gets identical starting deck (7 Copper, 3 Estate)
- Starting decks shuffled independently using seeded random
- Supply quantities fixed per Phase 1 design

#### Example

```typescript
const engine = new GameEngine('seed-123');
const gameState = engine.initializeGame(2); // 2-player game

console.log(gameState.players[0].hand);  // 5 cards (random mix of Copper/Estate)
console.log(gameState.phase);            // 'action'
console.log(gameState.turnNumber);       // 1
```

#### Notes

- **Recommended Player Count**: 1-4 players (not enforced)
- **Supply Scaling**: Supply quantities do NOT scale with player count (Phase 1 limitation)
- **Seeded Shuffling**: Starting hands are deterministic based on engine seed

---

### executeMove()

Executes a move and returns the resulting game state or error.

```typescript
executeMove(state: GameState, move: Move): GameResult
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `state` | `GameState` | Yes | Current game state (not modified) |
| `move` | `Move` | Yes | Move to execute |

#### Returns

`GameResult` - Result object with:

**On Success**:
```typescript
{
  success: true,
  newState: GameState  // Updated game state
}
```

**On Failure**:
```typescript
{
  success: false,
  error: string  // Human-readable error message
}
```

#### Behavior

- **Immutable**: Never modifies input `state`
- **No Exceptions**: Always returns `GameResult`, never throws
- **Validation**: Validates move legality before execution
- **State Changes**: Returns new state with all changes applied atomically

#### Validation Rules

Move is rejected (returns `{success: false, error}`) if:
- Move type invalid for current phase
- Required resources unavailable (actions/buys/coins)
- Card not in player's hand (for play moves)
- Card not in supply or unaffordable (for buy moves)
- Missing required move parameters

#### Example

```typescript
const result = engine.executeMove(gameState, {
  type: 'play_action',
  card: 'Village'
});

if (result.success) {
  gameState = result.newState;
  console.log('Village played successfully');
} else {
  console.error('Move failed:', result.error);
}
```

#### Performance

- **Target**: < 10ms per move
- **Complexity**: O(n) where n = number of cards in player state
- **Memory**: Creates new state objects (garbage collection)

#### Notes

- **Error Handling**: Errors are returned, not thrown (no try/catch needed)
- **State Consistency**: Failed moves return original state unchanged
- **Logging**: Successful moves append to `gameLog` in returned state

---

### getValidMoves()

Returns all legal moves for the current game state.

```typescript
getValidMoves(state: GameState): Move[]
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `state` | `GameState` | Yes | Current game state |

#### Returns

`Move[]` - Array of legal moves. Always includes at least `{type: 'end_phase'}`.

#### Behavior by Phase

**Action Phase**:
- One move per action card in hand (if actions > 0)
- `end_phase` move (always available)

**Buy Phase**:
- One move per treasure card in hand
- One `buy` move per affordable card in supply (if buys > 0)
- `end_phase` move (always available)

**Cleanup Phase**:
- Only `end_phase` move (triggers cleanup and next turn)

#### Example

```typescript
const validMoves = engine.getValidMoves(gameState);

// Action phase with Village and Smithy in hand, 1 action:
// [
//   { type: 'play_action', card: 'Village' },
//   { type: 'play_action', card: 'Smithy' },
//   { type: 'end_phase' }
// ]
```

#### Performance

- **Complexity**: O(h + s) where h = hand size, s = supply size
- **Lazy Evaluation**: Computes moves on-demand (not cached)

#### Notes

- **Affordability**: Buy moves only for cards player can afford
- **Supply Check**: Buy moves only for cards with count > 0
- **Duplicates**: Multiple copies of same card in hand = multiple identical moves
- **Special Cases**: Does not include `discard_for_cellar` (user must know when Cellar prompts)

---

### checkGameOver()

Checks if game has ended and determines winner.

```typescript
checkGameOver(state: GameState): Victory
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `state` | `GameState` | Yes | Current game state |

#### Returns

`Victory` - Object indicating game status and winner (if game over).

#### End Conditions

Game ends when:
1. **Province pile empty** (checked first)
2. **Any 3 supply piles empty** (checked second)

#### Tie-Breaking

If multiple players have max score:
- **Winner**: Player with lowest index (first player wins ties)

#### Example

```typescript
const victory = engine.checkGameOver(gameState);

if (victory.isGameOver) {
  console.log(`Player ${victory.winner} wins!`);
  console.log('Scores:', victory.scores);
} else {
  console.log('Game continues');
}
```

#### Scoring

Scores calculated from ALL cards (deck + hand + discard + play area):
- **Estate**: 1 VP
- **Duchy**: 3 VP
- **Province**: 6 VP
- All other cards: 0 VP

#### Notes

- **When to Call**: Should be called after each turn to check for game end
- **Performance**: O(p * c) where p = players, c = cards per player
- **Multiple Conditions**: If both conditions met simultaneously, Province rule takes precedence (but produces same result)

---

## Type Definitions

### GameState

Represents the complete state of a game at a point in time.

```typescript
interface GameState {
  readonly players: ReadonlyArray<PlayerState>;
  readonly supply: ReadonlyMap<CardName, number>;
  readonly currentPlayer: number;
  readonly phase: Phase;
  readonly turnNumber: number;
  readonly seed: string;
  readonly gameLog: ReadonlyArray<string>;
}
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `players` | `ReadonlyArray<PlayerState>` | Array of player states (index = player number) |
| `supply` | `ReadonlyMap<CardName, number>` | Available cards in supply with quantities |
| `currentPlayer` | `number` | Index of current player (0-based) |
| `phase` | `Phase` | Current phase: `'action'`, `'buy'`, or `'cleanup'` |
| `turnNumber` | `number` | Current turn number (starts at 1, increments when player 0 starts turn) |
| `seed` | `string` | Seed used for this game (for reproducibility) |
| `gameLog` | `ReadonlyArray<string>` | Array of game events (debugging/replay) |

#### Immutability

All fields are readonly. To modify state, use `executeMove()` which returns new state.

---

### PlayerState

Represents a single player's state.

```typescript
interface PlayerState {
  readonly deck: ReadonlyArray<CardName>;
  readonly hand: ReadonlyArray<CardName>;
  readonly discard: ReadonlyArray<CardName>;
  readonly playArea: ReadonlyArray<CardName>;
  readonly actions: number;
  readonly buys: number;
  readonly coins: number;
}
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `deck` | `ReadonlyArray<CardName>` | Cards remaining in deck (top = index 0) |
| `hand` | `ReadonlyArray<CardName>` | Cards in hand |
| `discard` | `ReadonlyArray<CardName>` | Discard pile (bottom = index 0) |
| `playArea` | `ReadonlyArray<CardName>` | Cards played this turn |
| `actions` | `number` | Actions remaining this turn |
| `buys` | `number` | Buys remaining this turn |
| `coins` | `number` | Coins available this turn |

#### Card Flow

- **Draw**: Deck → Hand (shuffle discard into deck if empty)
- **Play**: Hand → Play Area
- **Buy**: Supply → Discard
- **Cleanup**: Hand + Play Area → Discard, draw 5 to hand

---

### Move

Represents a player action.

```typescript
interface Move {
  type: 'play_action' | 'play_treasure' | 'buy' | 'end_phase' | 'discard_for_cellar';
  card?: CardName;
  cards?: ReadonlyArray<CardName>;
}
```

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `string` | Yes | Type of move |
| `card` | `CardName` | Conditional | Single card (for play/buy moves) |
| `cards` | `ReadonlyArray<CardName>` | Conditional | Multiple cards (for Cellar discard) |

See [Move Types Reference](#move-types-reference) for detailed move specifications.

---

### GameResult

Result of executing a move.

```typescript
interface GameResult {
  success: boolean;
  newState?: GameState;
  error?: string;
}
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | `true` if move executed successfully |
| `newState` | `GameState?` | Updated game state (present if `success = true`) |
| `error` | `string?` | Error message (present if `success = false`) |

#### Guarantees

- If `success = true`, `newState` is present and `error` is undefined
- If `success = false`, `error` is present and `newState` is undefined

---

### Victory

Game over status and winner information.

```typescript
interface Victory {
  isGameOver: boolean;
  winner?: number;
  scores?: ReadonlyArray<number>;
}
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `isGameOver` | `boolean` | `true` if game has ended |
| `winner` | `number?` | Player index of winner (present if `isGameOver = true`) |
| `scores` | `ReadonlyArray<number>?` | All player scores (present if `isGameOver = true`) |

---

### Card

Card definition.

```typescript
interface Card {
  name: CardName;
  type: CardType;
  cost: number;
  effect: CardEffect;
  description: string;
  victoryPoints?: number;
}
```

See [CARD_CATALOG.md](./CARD_CATALOG.md) for all card definitions.

---

## Move Types Reference

### play_action

Play an action card from hand.

```typescript
{
  type: 'play_action',
  card: CardName  // Required: which card to play
}
```

**Requirements**:
- Phase must be `'action'`
- `player.actions > 0`
- `card` must be in hand
- `card` must be an action card

**Effects**:
- Card moved from hand to play area
- Actions decremented by 1
- Card effects applied (draw cards, gain actions/buys/coins)
- Special effects handled (e.g., Cellar prompts for discard)

**Example**:
```typescript
{ type: 'play_action', card: 'Village' }
```

---

### play_treasure

Play a treasure card from hand.

```typescript
{
  type: 'play_treasure',
  card: CardName  // Required: which treasure to play
}
```

**Requirements**:
- Phase must be `'buy'`
- `card` must be in hand
- `card` must be a treasure card

**Effects**:
- Card moved from hand to play area
- Coins increased by treasure value

**Example**:
```typescript
{ type: 'play_treasure', card: 'Silver' }  // +2 coins
```

---

### buy

Purchase a card from supply.

```typescript
{
  type: 'buy',
  card: CardName  // Required: which card to buy
}
```

**Requirements**:
- Phase must be `'buy'`
- `player.buys > 0`
- `player.coins >= card.cost`
- `supply[card] > 0`

**Effects**:
- Coins decremented by card cost
- Buys decremented by 1
- Card moved from supply to discard pile
- Supply count decremented

**Example**:
```typescript
{ type: 'buy', card: 'Province' }  // Costs 8 coins
```

---

### end_phase

End current phase and transition to next.

```typescript
{
  type: 'end_phase'
}
```

**Requirements**: None (always valid)

**Effects by Phase**:

**Action Phase**:
- Transition to buy phase
- No other changes

**Buy Phase**:
- Transition to cleanup phase
- No other changes

**Cleanup Phase**:
- All cards in hand and play area moved to discard
- Draw 5 cards (shuffle discard if deck empty)
- Reset actions = 1, buys = 1, coins = 0
- Advance to next player (or increment turn if back to player 0)
- Transition to action phase

**Example**:
```typescript
{ type: 'end_phase' }
```

---

### discard_for_cellar

Discard cards for Cellar's effect.

```typescript
{
  type: 'discard_for_cellar',
  cards: ReadonlyArray<CardName>  // Required: cards to discard (can be empty)
}
```

**Requirements**:
- Only prompted after playing Cellar card
- All cards in `cards` array must be in hand
- Duplicates allowed (discard multiple Coppers, etc.)

**Effects**:
- Each card in `cards` moved from hand to discard
- Draw number of cards equal to `cards.length`

**Example**:
```typescript
{ type: 'discard_for_cellar', cards: ['Estate', 'Estate'] }  // Discard 2, draw 2
{ type: 'discard_for_cellar', cards: [] }  // Discard 0, draw 0 (valid)
```

---

## Error Reference

All errors returned via `GameResult.error` (never thrown as exceptions).

### Common Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `"Cannot play actions outside action phase"` | Tried to play action in buy/cleanup | Wait for action phase |
| `"Must specify card to play"` | Move missing `card` field | Add `card: 'CardName'` |
| `"No actions remaining"` | `player.actions = 0` | End phase or play Village first |
| `"Cannot play treasures outside buy phase"` | Tried to play treasure in action/cleanup | Wait for buy phase |
| `"No buys remaining"` | `player.buys = 0` | Can't buy more this turn |
| `"Insufficient coins to buy [card]"` | `player.coins < card.cost` | Play more treasures or buy cheaper card |
| `"Card not in hand: [card]"` | Specified card not in hand | Check hand contents first |
| `"Card not in supply: [card]"` | Supply pile empty | Choose different card |
| `"Unknown move type: [type]"` | Invalid move type | Use valid move type |
| `"Must specify cards to discard"` | Cellar move missing `cards` | Add `cards: []` |
| `"Cannot discard card not in hand: [card]"` | Cellar discard includes card not in hand | Only discard cards from hand |

### Error Handling Pattern

```typescript
const result = engine.executeMove(gameState, move);

if (!result.success) {
  console.error('Move failed:', result.error);
  // Handle error (retry, show message, etc.)
  return;
}

// Success - use new state
gameState = result.newState;
```

---

## Usage Examples

### Complete Game Turn

```typescript
import { GameEngine } from '@principality/core';

const engine = new GameEngine('game-seed-123');
let gameState = engine.initializeGame(1);

// Check hand
console.log('Hand:', gameState.players[0].hand);
// Output: ['Copper', 'Copper', 'Estate', 'Copper', 'Copper']

// Play all actions (if any)
let result = engine.executeMove(gameState, { type: 'end_phase' });
if (result.success) {
  gameState = result.newState;
  console.log('Phase:', gameState.phase);  // 'buy'
}

// Play all treasures
const treasures = gameState.players[0].hand.filter(card =>
  ['Copper', 'Silver', 'Gold'].includes(card)
);

for (const treasure of treasures) {
  result = engine.executeMove(gameState, {
    type: 'play_treasure',
    card: treasure
  });
  if (result.success) {
    gameState = result.newState;
  }
}

console.log('Coins:', gameState.players[0].coins);  // 4 (from 4 Coppers)

// Buy a card
if (gameState.players[0].coins >= 3) {
  result = engine.executeMove(gameState, {
    type: 'buy',
    card: 'Silver'
  });
  if (result.success) {
    gameState = result.newState;
    console.log('Bought Silver!');
  }
}

// End turn
result = engine.executeMove(gameState, { type: 'end_phase' });
if (result.success) {
  gameState = result.newState;
  console.log('New hand:', gameState.players[0].hand);  // New 5 cards
  console.log('Turn:', gameState.turnNumber);  // 2
}
```

### Using getValidMoves()

```typescript
// Get all legal moves
const validMoves = engine.getValidMoves(gameState);

// AI strategy: play first action if available
const actionMove = validMoves.find(m => m.type === 'play_action');
if (actionMove) {
  const result = engine.executeMove(gameState, actionMove);
  if (result.success) {
    gameState = result.newState;
  }
}

// Or: randomly choose a valid move
const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
```

### Checking Game Over

```typescript
// After each turn
const victory = engine.checkGameOver(gameState);

if (victory.isGameOver) {
  console.log('Game Over!');
  console.log(`Winner: Player ${victory.winner}`);
  console.log('Final Scores:', victory.scores);

  // Example output:
  // Game Over!
  // Winner: Player 0
  // Final Scores: [28, 15]
}
```

### Multiplayer Game

```typescript
const engine = new GameEngine('multiplayer-seed');
let gameState = engine.initializeGame(2);

while (!engine.checkGameOver(gameState).isGameOver) {
  console.log(`Player ${gameState.currentPlayer}'s turn`);
  console.log(`Phase: ${gameState.phase}`);

  // Get valid moves for current player
  const moves = engine.getValidMoves(gameState);

  // In real game: let player choose move
  // For demo: just end phase
  const result = engine.executeMove(gameState, { type: 'end_phase' });

  if (result.success) {
    gameState = result.newState;
  }
}
```

### Error Handling

```typescript
// Attempt to buy Province with insufficient coins
const result = engine.executeMove(gameState, {
  type: 'buy',
  card: 'Province'
});

if (!result.success) {
  console.error('Purchase failed:', result.error);
  // "Insufficient coins to buy Province"

  // Try cheaper alternative
  const silverResult = engine.executeMove(gameState, {
    type: 'buy',
    card: 'Silver'
  });

  if (silverResult.success) {
    gameState = silverResult.newState;
    console.log('Bought Silver instead');
  }
}
```

---

## Performance Characteristics

| Operation | Complexity | Target Time | Notes |
|-----------|-----------|-------------|-------|
| `constructor()` | O(1) | < 1ms | Seed hashing |
| `initializeGame()` | O(p * c) | < 50ms | p=players, c=cards, includes shuffles |
| `executeMove()` | O(h + d) | < 10ms | h=hand size, d=deck size, worst case with shuffle |
| `getValidMoves()` | O(h + s) | < 5ms | h=hand size, s=supply size |
| `checkGameOver()` | O(p * c) | < 20ms | p=players, c=total cards owned |

**Memory**: Each GameState is ~1KB per player. Immutable pattern creates new objects but is GC-friendly.

---

## Design Principles

1. **Immutability**: All state is readonly. Methods return new state, never modify input.

2. **No Exceptions**: Public API never throws. Errors returned as `{ success: false, error }`.

3. **Determinism**: Same seed → same game sequence. Critical for testing and replay.

4. **Type Safety**: Full TypeScript typing. Compile-time checks prevent many errors.

5. **Validation First**: All moves validated before execution. Invalid moves leave state unchanged.

6. **Performance**: Optimized for < 10ms per move. Critical for responsive UI and fast AI turns.

---

## Version History

**1.0.0** (Phase 1 - October 2025)
- Initial API release
- Core game engine with 8 kingdom cards
- Immutable state pattern
- Comprehensive validation

**Upcoming** (Phase 2 - MCP Integration)
- Additional helper methods for natural language parsing
- Game state serialization utilities
- Move history and replay support

---

## See Also

- [Game Design Document](./principality-ai-design.md) - Rules and gameplay
- [Card Catalog](./CARD_CATALOG.md) - Complete card specifications
- [Technical Specifications](./principality-ai-technical-specs.md) - Architecture
- [Developer Guide](./CLAUDE.md) - Quick reference and gotchas
