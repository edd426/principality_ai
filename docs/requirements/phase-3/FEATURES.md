# Phase 3 Feature Specifications: Multiplayer Foundation

**Status**: COMPLETE
**Created**: 2025-10-28
**Completed**: 2025-11-01
**Phase**: 3
**Test Count**: 90+ tests (50 unit, 25 integration, 15 E2E)
**Owner**: requirements-architect

---

## Table of Contents

- [Feature 1: Multiplayer Game Engine](#feature-1-multiplayer-game-engine)
- [Feature 2: Rules-based AI Opponent](#feature-2-rules-based-ai-opponent)
- [Feature 3: Multiplayer Game Flow](#feature-3-multiplayer-game-flow)
- [Feature 4: CLI Display for Multiplayer](#feature-4-cli-display-for-multiplayer)
- [Feature 5: Multiplayer MCP Tools](#feature-5-multiplayer-mcp-tools)
- [Feature Interactions](#feature-interactions)

---

## Feature 1: Multiplayer Game Engine

### Description

Extends the existing GameEngine and GameState to support 2-player games with independent player state, turn management, and proper game initialization.

### Rationale

The current GameEngine assumes a single player (always index 0). Multiplayer games require:
- Separate player hands, decks, and scores
- Turn management (tracking whose turn it is)
- Proper initialization for multiple players
- Game state that supports arbitrary player count (future-proofing)

### Functional Requirements

#### FR 1.1: GameState Data Structure for 2 Players

**Requirement**: GameState.players array contains exactly 2 PlayerState objects for multiplayer games

**Specification**:
```typescript
// Multiplayer GameState structure
interface GameState {
  readonly players: ReadonlyArray<PlayerState>;  // Must be length 2
  readonly currentPlayer: number;                 // 0 or 1 (who's turn)
  readonly phase: Phase;                          // 'action' | 'buy' | 'cleanup'
  readonly turnNumber: number;                    // Game turn counter
  readonly seed: string;                          // Game seed for reproducibility
  readonly gameLog: ReadonlyArray<string>;        // Full game history
}

interface PlayerState {
  readonly drawPile: ReadonlyArray<CardName>;     // 10-70 cards
  readonly hand: ReadonlyArray<CardName>;         // 5 cards initially
  readonly discardPile: ReadonlyArray<CardName>;  // Accumulated discards
  readonly inPlay: ReadonlyArray<CardName>;       // Cards played this turn
  readonly actions: number;                       // 1-N actions available
  readonly buys: number;                          // 1-N buys available
  readonly coins: number;                         // 0-N coins available
}
```

**Test Level**:
- Unit: Verify GameState structure for 2 players
- Integration: Verify player state isolation (P1 changes don't affect P2)

---

#### FR 1.2: Multiplayer Game Initialization

**Requirement**: `GameEngine.initializeGame(numPlayers)` creates proper state for 2 players

**Specification**:
```typescript
// Initialize 2-player game
const engine = new GameEngine('seed-123');
const gameState = engine.initializeGame(2);

// Resulting state:
gameState.players.length === 2  // Exactly 2 players
gameState.currentPlayer === 0   // Player 0 starts
gameState.phase === 'action'    // Action phase first
gameState.turnNumber === 1      // Turn 1

// Each player gets independent starting deck
gameState.players[0].hand.length === 5      // P1 has 5-card hand
gameState.players[0].drawPile.length === 5  // P1 has 5-card deck
gameState.players[0].discardPile.length === 0
gameState.players[0].inPlay.length === 0
gameState.players[0].actions === 1
gameState.players[0].buys === 1
gameState.players[0].coins === 0

gameState.players[1].hand.length === 5      // P2 has 5-card hand
gameState.players[1].drawPile.length === 5  // P2 has 5-card deck
// ... same structure for P2
```

**Behavior**:
- Each player gets shuffled starting deck (7 Copper + 3 Estate)
- Each player draws 5-card starting hand
- Supply initialized once (shared between players)
- Player 0 starts in action phase
- No turn counter increment until first end_phase

**Edge Cases**:
- EC 1.2.1: `initializeGame(1)` still works (solo mode backward compatibility)
- EC 1.2.2: `initializeGame(3+)` accepted but multiplayer requires special handling
- EC 1.2.3: Same seed produces deterministic identical hands for both players

**Test Count**: 5 unit tests

---

#### FR 1.3: Player State Isolation

**Requirement**: Each player's state changes independently; modifications to one player don't affect the other

**Specification**:
- P1's hand modifications don't affect P2's hand
- P1's deck modifications don't affect P2's deck
- P1's coins don't affect P2's actions/buys
- Supply is shared (modifications visible to both)
- GameState is immutable (no mutations)

**Validation**:
```typescript
const state1 = engine.initializeGame(2);

// Execute move for Player 0
const moveResult = engine.executeMove(state1, { type: 'play_treasure', card: 'Copper' });
const state2 = moveResult.newState;

// Player 0 state changed
state2.players[0].hand !== state1.players[0].hand  // P0 hand different
state2.players[0].coins !== state1.players[0].coins  // P0 coins different

// Player 1 state unchanged
state2.players[1].hand === state1.players[1].hand  // P1 hand identical
state2.players[1].coins === state1.players[1].coins  // P1 coins identical

// Original state unchanged (immutability)
state1.players[0].hand === state1.players[0].hand  // Original state intact
```

**Test Count**: 4 unit tests

---

#### FR 1.4: Turn Tracking

**Requirement**: GameState.currentPlayer and GameState.turnNumber accurately reflect game progress

**Specification**:
- `currentPlayer`: 0 or 1 (whose turn it is)
- `turnNumber`: Increments once per full round (both players complete cleanup)
- Turn sequence: P0 action → P0 buy → P0 cleanup → P1 action → P1 buy → P1 cleanup → next turn

**Behavior**:
```
Initial state:
  currentPlayer: 0
  turnNumber: 1
  phase: 'action'

After P0 cleanup:
  currentPlayer: 1
  turnNumber: 1     // Still turn 1 (only P0 completed)
  phase: 'action'

After P1 cleanup:
  currentPlayer: 0
  turnNumber: 2     // Incremented (full round complete)
  phase: 'action'
```

**Test Count**: 3 unit tests

---

#### FR 1.5: Backward Compatibility with Solo Games

**Requirement**: Existing solo games continue to work with numPlayers=1

**Specification**:
- `GameEngine.initializeGame()` defaults to `numPlayers=1`
- `GameEngine.initializeGame(1)` produces identical state to Phase 1
- All Phase 1-2 game logic unchanged
- Solo game tests continue passing

**Validation**:
```typescript
const engine = new GameEngine('seed');
const soloState = engine.initializeGame(1);

soloState.players.length === 1
soloState.currentPlayer === 0
// Rest of state identical to Phase 1
```

**Test Count**: 2 unit tests

---

### Acceptance Criteria

| Criterion | How to Verify |
|-----------|---------------|
| AC 1.1: 2-player games initialize correctly | `initializeGame(2)` produces valid 2-player state |
| AC 1.2: Each player has independent state | Changes to P1 don't affect P2 |
| AC 1.3: Turn tracking works | Turn number increments correctly |
| AC 1.4: State immutability preserved | No mutations occur during game |
| AC 1.5: Solo games still work | `initializeGame(1)` works as Phase 1 |

### Test Count Summary

- **Unit Tests**: 15
- **Integration Tests**: 5
- **Total**: 20 tests

### Example Scenario: Initialization

```
User initiates: 2-player game, human vs AI, seed "mp-001"
System executes: engine.initializeGame(2)
Result:
  ✓ Player 0: 5 Copper, 1 Estate in hand (drawn from starting deck)
  ✓ Player 1: 5 Copper, 1 Estate in hand (independent shuffle)
  ✓ Supply initialized: 60 Copper, 40 Silver, 30 Gold, 12 Estate, 12 Duchy, 12 Province, 10 Smithy, 10 Village
  ✓ Player 0's turn, action phase
  ✓ Game log: "Game started with 2 players"
```

---

## Feature 2: Rules-based AI Opponent

### Description

Implements deterministic move selection for AI players using Big Money strategy. The AI evaluates valid moves and chooses the best move according to Big Money principles.

### Rationale

Multiplayer games need an opponent. Big Money is the simplest yet effective strategy:
- Deterministic (same game state = same move, reproducible)
- Understandable (clear decision logic for debugging)
- Competitive (wins ~40-50% of games vs random)
- Implementable (no machine learning required)

### Functional Requirements

#### FR 2.1: AI Decision Engine Interface

**Requirement**: Create AI decision engine that evaluates game state and produces valid moves

**Specification**:
```typescript
interface AIDecision {
  move: Move;           // The move to execute
  reasoning: string;    // Why this move was chosen
}

class RulesBasedAI {
  // Evaluate current game state and return best move
  decideBestMove(gameState: GameState, playerIndex: number): AIDecision

  // Get all valid moves for current state
  getValidMoves(gameState: GameState, playerIndex: number): ReadonlyArray<Move>

  // Evaluate move quality (higher = better)
  evaluateMove(move: Move, gameState: GameState, playerIndex: number): number
}
```

**Behavior**:
- Accepts GameState and player index
- Returns single best Move according to Big Money strategy
- Includes reasoning string for logging/debugging
- Throws error if no valid moves available

**Test Count**: 5 unit tests

---

#### FR 2.2: Big Money Strategy Implementation

**Requirement**: AI follows Big Money strategy when selecting moves

**Full Strategy Specification**: See `/docs/requirements/BIG_MONEY_STRATEGY.md` for complete decision tree, turn milestones, and success metrics.

**Summary**:

**Action Phase** (deciding which action cards to play):
- **Priority 1**: Village (enables more action plays: +2 actions, +1 card)
- **Priority 2**: Smithy (card draw: +3 cards)
- **Priority 3**: Other action cards (play first available)
- **Priority 4**: End phase (no action cards available)

**Buy Phase** (deciding what to buy) - **Evaluated in strict priority order**:

**Priority 1: Province** (Mid/Late Game Victory Path)
- **Condition**: coins >= 8 AND Province available AND mid-game-or-later
- **Mid-Game Threshold** (any one triggers):
  - Turn number >= 10 (time-based)
  - OR Provinces remaining <= 6 (scarcity-based)
  - OR Any supply pile empty (endgame approaching)
- **Critical**: **Province ALWAYS beats Gold** once mid-game threshold met

**Priority 2: Gold** (Economy Maximization)
- **Condition**: coins >= 6 AND Gold available
- **Note**: Only evaluated if Priority 1 condition fails

**Priority 3: Duchy** (Endgame VP Fallback)
- **Condition**: coins >= 5 AND Duchy available AND endgame-imminent
- **Endgame Threshold** (any one triggers):
  - Provinces remaining <= 3 (Province pile nearly exhausted)
  - OR Supply piles empty >= 3 (alternative end condition imminent)

**Priority 4: Silver** (Economy Building)
- **Condition**: coins >= 3 AND Silver available

**Priority 5: End Phase** (No Profitable Purchase)
- **Condition**: No higher priority condition met

**Cleanup Phase**:
- End phase automatically (no choice)

**Behavior**:
```typescript
// Scenario 1: Action phase with Village and Smithy
gameState.players[1].hand = ['Village', 'Smithy', 'Copper'];
ai.decideBestMove(gameState, 1)
// Returns: play Village (Priority 1: enables more action plays)

// Scenario 2: Buy phase, turn 10+, 8 coins, BOTH Gold and Province available
gameState.turn = 10;
gameState.players[1].coins = 8;
gameState.supply.get('Province') > 0;  // Available
gameState.supply.get('Gold') > 0;      // Also available!
ai.decideBestMove(gameState, 1)
// Returns: buy Province (Priority 1 beats Priority 2, mid-game threshold met)
// ⚠️ CRITICAL: Province chosen over Gold despite Gold being "cheaper"

// Scenario 3: Buy phase, turn 10+, 7 coins, Province unaffordable
gameState.turn = 10;
gameState.players[1].coins = 7;  // Not enough for Province
gameState.supply.get('Province') > 0;
gameState.supply.get('Gold') > 0;
ai.decideBestMove(gameState, 1)
// Returns: buy Gold (Priority 1 fails: 7 < 8, Priority 2 succeeds)

// Scenario 4: Buy phase, early game (turn < 10), 8 coins, Province available
gameState.turn = 8;  // Before mid-game threshold
gameState.players[1].coins = 8;
gameState.supply.get('Province') > 0;
gameState.supply.get('Gold') > 0;
ai.decideBestMove(gameState, 1)
// Returns: buy Gold (Priority 1 fails: turn < 10, Priority 2 succeeds)

// Scenario 5: Buy phase, endgame, 5 coins, Duchy available
gameState.turn = 20;
gameState.players[1].coins = 5;
gameState.supply.get('Province') = 2;  // Nearly exhausted
gameState.supply.get('Duchy') > 0;
ai.decideBestMove(gameState, 1)
// Returns: buy Duchy (Priority 3: endgame fallback, Province scarce)

// Scenario 6: Buy phase, 3 coins, Silver available
gameState.players[1].coins = 3;
gameState.supply.get('Silver') > 0;
ai.decideBestMove(gameState, 1)
// Returns: buy Silver (Priority 4: economy building)
```

**Test Count**: 12 unit tests (3 action plays, 5 buy decisions, 2 cleanup, 2 edge cases)

---

#### FR 2.3: Move Validity Checking

**Requirement**: AI only suggests valid moves according to game rules

**Specification**:
- All suggested moves must pass `GameEngine.executeMove()` validation
- Cannot play cards not in hand
- Cannot play treasures in action phase
- Cannot buy cards with insufficient coins
- Cannot exceed supply limits

**Validation**:
```typescript
// AI move must be valid
const aiDecision = ai.decideBestMove(gameState, playerIndex);
const result = gameEngine.executeMove(gameState, aiDecision.move);

result.success === true  // Move always succeeds
result.newState !== undefined  // New state produced
```

**Test Count**: 4 unit tests

---

#### FR 2.4: Deterministic Decisions

**Requirement**: Same game state + same AI = same move (reproducible gameplay)

**Specification**:
- No randomness in move selection
- No time-based decisions
- No external state dependencies
- Pure function: gameState → move

**Validation**:
```typescript
const decision1 = ai.decideBestMove(gameState, 1);
const decision2 = ai.decideBestMove(gameState, 1);

decision1.move.type === decision2.move.type
decision1.move.card === decision2.move.card
// Same move, every time
```

**Test Count**: 3 unit tests

---

#### FR 2.5: All MVP Cards Supported

**Requirement**: AI can make decisions about all 8 MVP cards

**Specification**:
- Treasures: Copper (0 cost, +1 coin), Silver (3 cost, +2 coins), Gold (6 cost, +3 coins)
- Victory: Estate (2 cost, +1 VP), Duchy (5 cost, +3 VP), Province (8 cost, +6 VP)
- Curses: Curse (0 cost, -1 VP) [avoid]
- Actions: Smithy (4 cost, +3 cards), Village (3 cost, +1 card, +2 actions)

**Behavior**: AI evaluates all cards and makes decisions following Big Money priority tree (see `/docs/requirements/BIG_MONEY_STRATEGY.md`)

**Test Count**: 2 unit tests

---

### Acceptance Criteria

| Criterion | How to Verify |
|-----------|---------------|
| AC 2.1: AI makes valid moves | All AI moves pass game validation |
| AC 2.2: AI follows Big Money | Gold before Silver before Duchy before Estate |
| AC 2.3: AI plays action cards | Action cards played in action phase |
| AC 2.4: Decisions are deterministic | Same state = same move |
| AC 2.5: All 8 cards handled | AI makes decisions for all card types |

### Test Count Summary

- **Unit Tests**: 26 (strategy + validity + determinism)
- **Integration Tests**: 5 (full game sequences with AI)
- **Total**: 31 tests

### Example Scenarios: AI Decision Making

**Scenario A: Action Phase with Multiple Cards**
```
Player 1 (AI) hand: [Village, Smithy, Copper, Estate, Duchy]
Available actions: 1
Phase: Action

AI Decision:
  Village is action card with +2 actions
  Playing Village enables more action plays
  → PLAY VILLAGE
  Reasoning: "Playing Village enables 2 more actions"
```

**Scenario B: Buy Phase - Gold Available**
```
Player 1 (AI) hand: [Copper, Copper, Copper, Gold]
After playing treasures:
  Total coins: 6
  Buys available: 1
Phase: Buy
Supply: Gold (20 remaining), Silver (15), Copper (55)

AI Decision:
  6 coins = can afford Gold
  Gold not in hand yet
  → BUY GOLD
  Reasoning: "Big Money: Gold increases future coin generation"
```

**Scenario C: Buy Phase - Late Game, Province Available**
```
Player 1 (AI) hand: [Silver, Gold]
After playing treasures:
  Total coins: 8
Piles emptied: 2 (Smithy, Copper nearly gone)
Phase: Buy

AI Decision:
  8 coins = can afford Province
  Game ending (2 piles nearly empty)
  Province = 6 VP (winning)
  → BUY PROVINCE
  Reasoning: "Late game: Province wins when supply runs out"
```

---

## Feature 3: Multiplayer Game Flow

### Description

Manages the complete 2-player game lifecycle: turn sequencing, phase transitions, game end detection, and disconnect handling.

### Rationale

Multiplayer games require:
- Sequential turn management (P0→P1→P0 cycling)
- Proper phase transitions (action→buy→cleanup→next player)
- Game end detection with 2 players (supply exhaustion, disconnect)
- Disconnect recovery (replace with AI)

### Functional Requirements

#### FR 3.1: Turn Sequence Management

**Requirement**: Turns progress correctly through both players in order

**Specification**:
```
Turn 1:
  Player 0: Action → Buy → Cleanup
  → Player switches
  Player 1: Action → Buy → Cleanup
  → turnNumber increments
Turn 2:
  Player 0: Action → Buy → Cleanup
  → Player switches
  Player 1: Action → Buy → Cleanup
  → turnNumber increments
```

**Behavior**:
- After cleanup phase completes, switch to other player
- New player enters action phase with fresh stats
- After both players complete, increment turnNumber
- No player skips or gets double turns

**Test Count**: 5 unit tests

---

#### FR 3.2: Player Turn Reset

**Requirement**: Each new turn resets player actions, buys, and coins; draws 5 new cards

**Specification**:
```typescript
// At start of player's turn in action phase:
const player = gameState.players[currentPlayer];

player.actions === 1  // Reset to 1
player.buys === 1     // Reset to 1
player.coins === 0    // Reset to 0
player.inPlay.length === 0  // Clear played cards
player.hand.length === 5  // Should have 5 cards (drawn fresh)

// Cards drawn from deck/discard (shuffle discard if deck empty)
// inPlay cards moved to discard pile
```

**Behavior**:
- Cleanup phase: inPlay cards → discard pile
- Start of new turn: draw 5 cards (reshuffle discard if needed)
- Reset actions, buys, coins
- Draw happens before action phase displays moves

**Test Count**: 4 unit tests

---

#### FR 3.3: Game End Detection - 2 Players

**Requirement**: Game ends correctly when supply exhausted with 2 players

**Specification**:
```typescript
// Game ends when any of these happen:
1. Three or more supply piles are empty
   Example: Smithy, Village, and Copper all empty

2. Province pile is empty
   (Single condition, equivalent to high-value card gone)

// Victory determination:
const p0VP = calculateScore(gameState, 0);
const p1VP = calculateScore(gameState, 1);

winner = p0VP > p1VP ? 0 : 1;
scores = [p0VP, p1VP];

// Results:
{
  isGameOver: true,
  winner: 0 or 1,
  scores: [p0Score, p1Score]
}
```

**Behavior**:
- Check after each move (especially buy)
- Game end triggered on next player's turn or immediately
- Score calculated for both players
- Winner determined by highest VP
- Ties broken by turn count (earlier win = higher quality play)

**Test Count**: 6 unit tests

---

#### FR 3.4: Disconnect Detection and Handling

**Requirement**: When a player disconnects, game continues with rules-based AI replacement

**Specification**:
```typescript
// Disconnect detected: player didn't provide move within timeout
// (Timeout: 30 seconds for human input, 5 seconds for AI)

// Recovery process:
1. Log disconnect: "Player 0 disconnected"
2. Replace with AI: "Player 0 replaced with Rules-based AI"
3. Continue game: Next move decided by RulesBasedAI
4. Mark game: "Player 0 (Human) vs Player 1 (AI)"

// Game end:
- Original human player marked as 2nd place
- AI opponent marked as 1st place
- Game completes with AI vs AI
```

**Behavior**:
- Timeout detection: no move provided within threshold
- Automatic replacement: RulesBasedAI takes over
- Game continues: no state reset, seamless transition
- Final results: original players attributed correctly (winner = original player who stayed)

**Edge Cases**:
- EC 3.4.1: Both players disconnect → both replaced (AI vs AI), game continues
- EC 3.4.2: Disconnect mid-action phase → AI completes current phase
- EC 3.4.3: Disconnect during move selection → AI picks move

**Test Count**: 5 unit tests

---

#### FR 3.5: Supply Pile Tracking

**Requirement**: Track which piles are empty and enforce emptiness

**Specification**:
```typescript
// Supply initialized with:
const supply: Map<CardName, number> = {
  'Copper': 60,
  'Silver': 40,
  'Gold': 30,
  'Estate': 12,
  'Duchy': 12,
  'Province': 12,
  'Smithy': 10,
  'Village': 10
}

// When pile becomes empty (count === 0):
supply.get('Smithy') === 0  // Pile is empty

// Cannot buy from empty pile:
if (supply.get(cardName) <= 0) {
  throw new Error(`${cardName} supply exhausted`);
}

// Game end check: count piles with 0 count
const emptyPiles = Array.from(supply.values()).filter(count => count === 0).length;
if (emptyPiles >= 3) {
  gameIsOver = true;
}
```

**Test Count**: 3 unit tests

---

#### FR 3.6: Game State Logging

**Requirement**: Full game history logged for debugging and replay

**Specification**:
```typescript
// gameLog contains all major events:
gameLog: [
  "Game started with 2 players",
  "Player 0 played Copper (+$1)",
  "Player 0 played Silver (+$2)",
  "Player 0 bought Gold (cost 6)",
  "Player 0 ended buy phase",
  "Player 0 moved to cleanup",
  "Player 0 drew 5 cards",
  "Player 1's turn started",
  "Player 1 played Village (+1 card, +2 actions)",
  "Player 1 played Smithy (+3 cards)",
  ...
  "Game ended: Player 0 wins with 25 VP vs 18 VP"
]

// Each log entry:
- Timestamp implicit (order)
- Player identifier
- Action description
- Outcome (coins, cards, etc)
```

**Test Count**: 2 unit tests

---

### Acceptance Criteria

| Criterion | How to Verify |
|-----------|---------------|
| AC 3.1: Turn order correct | P0→P1→P0 sequence verified |
| AC 3.2: Turn reset works | Actions/buys/coins reset, 5 cards drawn |
| AC 3.3: Game end detected | Game ends on 3 piles empty or Province empty |
| AC 3.4: Winner calculated | Highest VP wins (ties broken by turn count) |
| AC 3.5: Disconnect handled | AI replacement, game continues |
| AC 3.6: Game logged | All actions recorded in gameLog |

### Test Count Summary

- **Unit Tests**: 25 (turns, reset, end detection, disconnect, logging)
- **Integration Tests**: 8 (full game flow sequences)
- **Total**: 33 tests

### Example Scenario: Complete 2-Turn Game Flow

```
Turn 1:
  Player 0:
    ✓ Action phase: hand = [Copper, Copper, Silver, Estate, Duchy]
    ✓ Play no action cards → end action phase
    ✓ Buy phase: Copper + Copper + Silver = 4 coins
    ✓ Buy Silver (3 coins) → 1 coin remaining
    ✓ End buy phase
    ✓ Cleanup: Silver → discard, inPlay → discard
    ✓ Draw 5 new cards

  Player 1:
    ✓ Action phase: hand = [Copper, Copper, Gold, Estate, Duchy]
    ✓ Play no action cards → end action phase
    ✓ Buy phase: Copper + Copper + Gold = 5 coins
    ✓ Buy Silver (3 coins) → 2 coins left, not enough for next card
    ✓ End buy phase
    ✓ Cleanup: Silver → discard, inPlay → discard
    ✓ Draw 5 new cards
    ✓ turnNumber increments to 2

Game end check: Smithy (10), Village (10), all other piles have stock
→ Continue to Turn 2
```

---

## Feature 4: CLI Display for Multiplayer

### Description

Terminal-based display showing 2-player game context, including current player, opponent information, supply status, and turn boundaries.

### Rationale

2-player games need clear visual indication of:
- Whose turn it is (human often plays at terminal)
- Opponent's visible state (VP, hand size, played cards)
- Supply status (cards running low, game approaching end)
- Turn boundaries (when play switches to other player)

### Functional Requirements

#### FR 4.1: Current Player Indicator

**Requirement**: Clear display of whose turn it is

**Specification**:
```
═══════════════════════════════════════════════════════════
PLAYER 0'S TURN (Human vs AI)  |  Turn #3
═══════════════════════════════════════════════════════════

```

**Behavior**:
- Prominent header before each turn
- Shows "PLAYER 0" or "PLAYER 1"
- Indicates player type (Human, AI, or both)
- Shows current turn number
- Separator line above and below

**Test Count**: 2 unit tests

---

#### FR 4.2: Opponent Visibility Information

**Requirement**: Display opponent's visible game state

**Specification**:
```
═══════════════════════════════════════════════════════════
OPPONENT STATUS
───────────────────────────────────────────────────────────
Victory Points: 12 VP
Cards in Hand: 5 (not shown)
Cards in Play: Smithy, Village, Copper
Discard Pile: 8 cards
───────────────────────────────────────────────────────────

```

**Behavior**:
- Show opponent's VP score (updated every turn)
- Show opponent's hand size (number, not content)
- Show opponent's inPlay cards (visible per Dominion rules)
- Show opponent's discard pile size
- Per standard Dominion: unrevealed hand not shown, but count shown

**Example**:
```
OPPONENT STATUS
───────────────────────────────────────────────────────────
Victory Points: 8 VP
Cards in Hand: 4 (not shown)
Cards in Play: Gold, Copper
Discard Pile: 6 cards
───────────────────────────────────────────────────────────
```

**Test Count**: 3 unit tests

---

#### FR 4.3: Supply Pile Status

**Requirement**: Display supply pile stock remaining for all cards

**Specification**:
```
SUPPLY PILES
───────────────────────────────────────────────────────────
Treasures:
  Copper: 48 | Silver: 28 | Gold: 15

Victory Cards:
  Estate: 10 | Duchy: 8 | Province: 5 ⚠️ Low!

Kingdom:
  Smithy: 6 ⚠️ Critically Low! | Village: 4 ⚠️ Critically Low!
───────────────────────────────────────────────────────────
```

**Behavior**:
- Display all 8 cards in supply
- Show remaining count for each
- Warn "Low!" if < 5 remaining
- Warn "Critically Low!" if < 3 remaining
- Warn "EMPTY" if count === 0 (game end condition)
- Use emojis/symbols for warnings (⚠️)

**Test Count**: 3 unit tests

---

#### FR 4.4: Turn Boundaries

**Requirement**: Clear visual separation between turns

**Specification**:
```
═══════════════════════════════════════════════════════════
PLAYER 0's TURN (Turn #3)
═══════════════════════════════════════════════════════════
[... game play ...]

═══════════════════════════════════════════════════════════
PLAYER 1's TURN (Turn #3)
═══════════════════════════════════════════════════════════
[... game play ...]

═══════════════════════════════════════════════════════════
PLAYER 0's TURN (Turn #4)  ← turnNumber incremented
═══════════════════════════════════════════════════════════
```

**Behavior**:
- Bold separator line (═══ pattern)
- Player number displayed
- Current turn number
- Clear visual break between turns

**Test Count**: 2 unit tests

---

#### FR 4.5: Game End Results

**Requirement**: Display final scores with rankings

**Specification**:
```
═══════════════════════════════════════════════════════════
GAME OVER
═══════════════════════════════════════════════════════════

FINAL RANKINGS
───────────────────────────────────────────────────────────
🥇 1st Place: Player 0 (Human)
   Victory Points: 32 VP
   Deck: 8 Copper, 3 Silver, 2 Gold, 4 Estate, 3 Duchy, 2 Province

🥈 2nd Place: Player 1 (Rules-based AI)
   Victory Points: 18 VP
   Deck: 5 Copper, 2 Silver, 3 Estate, 1 Duchy

═══════════════════════════════════════════════════════════
Game completed in 12 turns. Play again? (y/n)
═══════════════════════════════════════════════════════════
```

**Behavior**:
- Show "GAME OVER" header
- List both players ranked by VP
- Show winner (🥇 1st) and loser (🥈 2nd)
- Include VP scores
- Show deck composition (if available)
- Show total turns played
- Prompt for replay

**Test Count**: 4 unit tests

---

#### FR 4.6: Player Hand Display (During Turn)

**Requirement**: Show current player's hand and available moves

**Specification**:
```
YOUR HAND
───────────────────────────────────────────────────────────
[0] Copper     [1] Copper      [2] Silver
[3] Estate     [4] Duchy
───────────────────────────────────────────────────────────

ACTION PHASE (1 action available, 1 buy available, $0 coins)
Available moves:
  [5] Play Copper
  [6] Play Copper
  [7] Play Silver
  [8] End Phase
```

**Behavior**:
- Show player's current hand with indices
- Show available moves with consequences (coins, cards, etc)
- Display phase, actions, buys, coins at top
- Update after each move

**Test Count**: 3 unit tests

---

### Acceptance Criteria

| Criterion | How to Verify |
|-----------|---------------|
| AC 4.1: Current player shown | Header displays whose turn |
| AC 4.2: Opponent info visible | VP, hand size, inPlay shown |
| AC 4.3: Supply status displayed | All piles shown with warnings |
| AC 4.4: Turn boundaries clear | Visual separator between turns |
| AC 4.5: Game end shown | Final rankings and scores |
| AC 4.6: Player hand shown | Current player sees options |

### Test Count Summary

- **Unit Tests**: 17 (display formatting and content)
- **Integration Tests**: 5 (full game display flow)
- **Total**: 22 tests

---

## Feature 5: Multiplayer MCP Tools

### Description

Extends MCP tools (game_execute, game_observe, game_session) to support 2-player games with proper player identification and move execution.

### Rationale

MCP tools are the interface for Claude to play games. They need to support:
- 2-player game creation (human vs AI, Claude vs AI)
- Move execution for specific players
- State observation with player-specific visibility

### Functional Requirements

#### FR 5.1: game_session for 2-Player Games

**Requirement**: Create new 2-player games with proper player identification

**Specification**:
```typescript
interface GameSessionInput {
  playerCount: 2;  // Strict 2-player
  playerTypes: ['human', 'ai'] | ['claude', 'ai'];
  seed?: string;
  options?: GameOptions;
}

interface GameSessionOutput {
  gameId: string;
  players: [
    { id: 0, type: 'human' | 'claude', name: 'Player 0' },
    { id: 1, type: 'ai', name: 'Rules-based AI' }
  ];
  gameState: GameState;
  message: string;
}

// Example call:
const result = mcp.game_session({
  playerCount: 2,
  playerTypes: ['human', 'ai'],
  seed: 'multiplayer-001'
});

// Result:
{
  gameId: 'mp-001-2025-10-28',
  players: [
    { id: 0, type: 'human', name: 'Player 0' },
    { id: 1, type: 'ai', name: 'Rules-based AI' }
  ],
  gameState: { players: [...], currentPlayer: 0, ... },
  message: 'Game initialized: Human (Player 0) vs Rules-based AI (Player 1)'
}
```

**Behavior**:
- Accept playerCount=2 only (error on other values)
- Accept playerTypes: [human,ai], [claude,ai], [ai,ai]
- Generate unique gameId
- Initialize GameState with 2 players
- Return proper player metadata

**Test Count**: 4 unit tests

---

#### FR 5.2: game_execute for Player-Specific Moves

**Requirement**: Execute moves for current player with validation

**Specification**:
```typescript
interface GameExecuteInput {
  gameId: string;
  playerId: number;  // 0 or 1 - must match currentPlayer
  move: Move;
}

interface GameExecuteOutput {
  success: boolean;
  gameState: GameState;
  currentPlayer: number;  // Who's turn next
  message: string;
  gameOver?: boolean;
  winner?: number;
}

// Example call:
const result = mcp.game_execute({
  gameId: 'mp-001-2025-10-28',
  playerId: 0,  // Must be current player
  move: { type: 'buy', card: 'Silver' }
});

// Result:
{
  success: true,
  gameState: { ... },  // Updated state
  currentPlayer: 0,  // Still P0 (still in buy phase)
  message: 'Player 0 bought Silver',
  gameOver: false
}
```

**Behavior**:
- Validate playerId matches currentPlayer
- Execute move using GameEngine
- Return updated state
- Track turn/phase transitions
- Error if wrong player tries to move
- Automatically execute AI moves when currentPlayer=1 (rules-based AI)

**Validation Rules**:
- playerId must equal gameState.currentPlayer
- move must be valid for current phase
- move must be valid for current player

**Test Count**: 5 unit tests

---

#### FR 5.3: game_observe for Player-Specific Visibility

**Requirement**: Return game state with proper information visibility for requesting player

**Specification**:
```typescript
interface GameObserveInput {
  gameId: string;
  playerId: number;  // 0 or 1 - requesting player's perspective
}

interface GameObserveOutput {
  gameId: string;
  playerId: number;
  gameState: GameState;  // Full state (but could filter based on rules)
  playerInfo: {
    myHand: ReadonlyArray<CardName>;
    myVP: number;
    myCoins: number;
    myActions: number;
    myBuys: number;
  };
  opponentInfo: {
    id: number;
    vp: number;
    handSize: number;
    inPlay: ReadonlyArray<CardName>;
    discardCount: number;
  };
  supply: Map<CardName, number>;
  currentPlayer: number;
  gameOver: boolean;
}

// Example call (Player 0 observes):
const result = mcp.game_observe({
  gameId: 'mp-001-2025-10-28',
  playerId: 0
});

// Result includes:
{
  gameId: 'mp-001-2025-10-28',
  playerId: 0,
  playerInfo: {
    myHand: ['Copper', 'Copper', 'Silver', 'Estate', 'Duchy'],
    myVP: 5,
    myCoins: 0,
    myActions: 1,
    myBuys: 1
  },
  opponentInfo: {
    id: 1,
    vp: 3,
    handSize: 5,
    inPlay: ['Copper', 'Copper'],  // Visible per rules
    discardCount: 8
  },
  supply: { 'Copper': 55, 'Silver': 38, ... },
  currentPlayer: 1,  // It's opponent's turn
  gameOver: false
}
```

**Behavior**:
- Provide full state data (no filtering needed for MVP)
- Organize data for easy Claude consumption
- Show opponent's visible cards only (inPlay, not unrevealed hand)
- Include player stats (VP, hand size, deck info)
- Indicate whose turn it is

**Test Count**: 4 unit tests

---

#### FR 5.4: AI Move Execution in MCP Tools

**Requirement**: When currentPlayer=1 (AI), automatically execute AI's move

**Specification**:
```typescript
// After game_execute() with playerId=0 (human),
// if move ends a phase and switches to Player 1 (AI):
//
// Tool automatically:
// 1. Gets AI decision using RulesBasedAI
// 2. Executes AI move
// 3. Returns updated state with AI move already executed

// Example: Human ends phase, AI takes over
const humanResult = mcp.game_execute({
  gameId: 'mp-001',
  playerId: 0,
  move: { type: 'end_phase' }
});

// Tool execution:
// 1. Switches to Player 1 (AI)
// 2. Gets AI decision for current gameState
// 3. Executes AI move
// 4. Returns state AFTER AI move

humanResult = {
  success: true,
  gameState: { currentPlayer: 1 },  // It's P1's turn
  message: 'Player 0 ended phase. Player 1 (AI) bought Silver.',
  gameOver: false
}
```

**Behavior**:
- After human move, if phase switches to AI player:
  - Call RulesBasedAI.decideBestMove()
  - Execute AI move
  - Return updated state
  - Repeat until human's turn comes back
- Exception: if game ends, return final state

**Test Count**: 3 unit tests

---

### Acceptance Criteria

| Criterion | How to Verify |
|-----------|---------------|
| AC 5.1: 2-player games created | game_session returns valid 2P state |
| AC 5.2: Moves executed correctly | game_execute switches players, updates state |
| AC 5.3: State observed properly | game_observe shows correct visibility |
| AC 5.4: AI auto-executes | AI moves when currentPlayer=1 |
| AC 5.5: Errors on wrong player | game_execute rejects wrong player moves |

### Test Count Summary

- **Unit Tests**: 16 (tool input/output, player validation)
- **Integration Tests**: 6 (tool interactions with GameEngine)
- **Total**: 22 tests

---

## Feature Interactions

### Game Flow Summary

```
1. game_session(playerTypes=['human','ai'])
   ↓ Creates 2-player GameState

2. Human: game_execute(playerId=0, move)
   ↓ Executes human move

3. If phase change to Player 1:
   → game_execute auto-runs AI.decideBestMove()
   → game_execute auto-executes AI move
   ↓ Returns to step 2 (human's turn)

4. game_observe(playerId=0)
   ↓ Human sees game state
   ↓ Opponent info visible (VP, hand size, inPlay)

5. Repeat until game_end
   ↓ 3+ piles empty OR player disconnects

6. Return final state with winner and scores
```

### Multi-Feature Test Scenarios

**Scenario 1: Complete 3-turn Game (Human vs AI)**
```
Test validates:
  ✓ 2-player initialization (Feature 1)
  ✓ Human moves (Feature 1, 5)
  ✓ AI decision-making (Feature 2)
  ✓ AI move execution (Feature 2, 5)
  ✓ Turn switching (Feature 3)
  ✓ Game continues properly (Feature 3)
  ✓ Display updates (Feature 4)
  ✓ Game end detection (Feature 3)
```

**Scenario 2: Opponent Observability**
```
Test validates:
  ✓ Player 0 plays card (Feature 1)
  ✓ Player 1 observes inPlay (Feature 4, 5)
  ✓ Player 1 sees opponent VP (Feature 4, 5)
  ✓ Player 1 decides move based on opponent state (Feature 2)
```

**Scenario 3: Disconnect During Game**
```
Test validates:
  ✓ Disconnect detected (Feature 3)
  ✓ Human player replaced by AI (Feature 3)
  ✓ AI continues game (Feature 2, 3)
  ✓ Game completes (Feature 3)
  ✓ Original player marked correctly (Feature 3)
```

---

**Created by**: requirements-architect
**Last Updated**: 2025-10-28
**Approval Status**: PENDING REVIEW
