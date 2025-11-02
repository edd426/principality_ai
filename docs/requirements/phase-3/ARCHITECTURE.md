# Phase 3 Architecture: Multiplayer Foundation

**Status**: COMPLETE
**Created**: 2025-10-28
**Completed**: 2025-11-01
**Phase**: 3
**Owner**: requirements-architect

---

## Table of Contents

- [System Architecture Overview](#system-architecture-overview)
- [Core Data Structures](#core-data-structures)
- [Game State Evolution](#game-state-evolution)
- [Rules Engine](#rules-engine)
- [Implementation Approach](#implementation-approach)
- [API Interfaces](#api-interfaces)
- [Performance Considerations](#performance-considerations)
- [Testing Architecture](#testing-architecture)
- [Deployment & Rollout](#deployment--rollout)

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ CLI / MCP Server (Input/Output)                                 │
│ - game_session() - Create 2-player game                         │
│ - game_execute() - Execute moves (human or AI)                  │
│ - game_observe() - Observe game state                           │
│ - Display handlers - Render to terminal                         │
└────────────────┬────────────────────────────────────────────────┘
                 │
    ┌────────────┴─────────────────┐
    │                              │
┌───▼──────────────────┐   ┌──────▼──────────────────┐
│ GameEngine           │   │ RulesBasedAI            │
│ - executeMove()      │   │ - decideBestMove()      │
│ - validateMove()     │   │ - evaluateMove()        │
│ - checkGameOver()    │   │ - Big Money strategy    │
│ - getValidMoves()    │   │ - Deterministic logic   │
└───┬──────────────────┘   └──────┬──────────────────┘
    │                             │
    │      ┌──────────────────────┘
    │      │
    └──────┼──────────────────────────────────────┐
           │                                      │
┌──────────▼───────────────────────────────────────▼──┐
│ GameState (Immutable)                               │
│ - players[0..1]: PlayerState                        │
│ - supply: Map<CardName, number>                     │
│ - currentPlayer: 0 | 1                              │
│ - phase: 'action' | 'buy' | 'cleanup'               │
│ - turnNumber: number                                │
│ - gameLog: string[]                                 │
└─────────────────────────────────────────────────────┘
```

### Architecture Principles

**1. Immutability**
- GameState never mutated (always returns new state)
- PlayerState immutable (frozen arrays/objects)
- Enables time-travel, undo, deterministic replay

**2. Single Responsibility**
- GameEngine: Game rules and state transitions
- RulesBasedAI: Move decisions only (no state changes)
- CLI: Display only (no game logic)
- MCP Tools: I/O layer (no game logic)

**3. Backward Compatibility**
- Solo games (numPlayers=1) work unchanged
- Existing tests continue passing
- GameEngine constructor accepts options parameter

**4. Determinism**
- Same seed = same shuffle
- Same AI state = same decision
- Full game replay possible with seed

---

## Core Data Structures

### Multiplayer GameState

```typescript
interface GameState {
  readonly players: ReadonlyArray<PlayerState>;  // Length = 2
  readonly supply: ReadonlyMap<CardName, number>;
  readonly currentPlayer: number;                 // 0 or 1
  readonly phase: Phase;                          // 'action' | 'buy' | 'cleanup'
  readonly turnNumber: number;                    // 1, 2, 3, ...
  readonly seed: string;
  readonly gameLog: ReadonlyArray<string>;
}

interface PlayerState {
  readonly drawPile: ReadonlyArray<CardName>;     // 0-60+ cards
  readonly hand: ReadonlyArray<CardName>;         // 0-20 cards (usually 5)
  readonly discardPile: ReadonlyArray<CardName>;  // 0-60+ cards
  readonly inPlay: ReadonlyArray<CardName>;       // 0-10 cards
  readonly actions: number;                       // 0+
  readonly buys: number;                          // 0+
  readonly coins: number;                         // 0+
}
```

### Data Structure Changes

**Solo Game** (Phase 1):
```
GameState:
  players: [PlayerState]  // Array length 1
  currentPlayer: always 0 // No switching
```

**Multiplayer Game** (Phase 3):
```
GameState:
  players: [PlayerState, PlayerState]  // Array length 2
  currentPlayer: 0 | 1                 // Switches after cleanup
```

**Key Difference**: Array of 2 instead of 1, turn switching logic added

### Player Identification

```typescript
// Player types (tracking who's controlling)
type PlayerType = 'human' | 'claude' | 'ai';

interface GameMetadata {
  gameId: string;                        // Unique identifier
  players: [PlayerInfo, PlayerInfo];     // Exactly 2 players
  seed: string;                          // Reproducibility
  created: number;                       // Timestamp
}

interface PlayerInfo {
  id: number;                            // 0 or 1
  type: PlayerType;                      // Who's controlling
  name: string;                          // "Player 0", "AI", etc
  disconnected?: boolean;                // Disconnect flag
}
```

### Supply Structure

```typescript
// Supply remains unchanged (shared between players)
type Supply = ReadonlyMap<CardName, number>;

const defaultSupply: Supply = {
  'Copper': 60,
  'Silver': 40,
  'Gold': 30,
  'Estate': 12,
  'Duchy': 12,
  'Province': 12,
  'Smithy': 10,
  'Village': 10
};
```

### Move Structure

```typescript
interface Move {
  type: 'play_action'
       | 'play_treasure'
       | 'play_all_treasures'
       | 'buy'
       | 'end_phase'
       | 'discard_for_cellar';
  card?: CardName;        // For single-card moves
  cards?: ReadonlyArray<CardName>;  // For multi-card moves
}

// Multiplayer doesn't change Move structure
// But execution validates it's the right player's turn
```

---

## Game State Evolution

### Initialization Sequence

```
GameEngine.initializeGame(2)
  ↓
  ├─ Create Player 0
  │  ├─ Create starting deck (7 Copper + 3 Estate)
  │  ├─ Shuffle with seeded RNG
  │  ├─ Draw 5-card starting hand
  │  └─ drawPile = remaining 5 cards
  │
  ├─ Create Player 1 (independent)
  │  ├─ Create starting deck (same 10 cards)
  │  ├─ Shuffle with seeded RNG (different order than P0)
  │  ├─ Draw 5-card starting hand
  │  └─ drawPile = remaining 5 cards
  │
  ├─ Initialize shared supply
  │  └─ All piles at default counts
  │
  └─ Return GameState
     ├─ players = [P0, P1]
     ├─ currentPlayer = 0
     ├─ phase = 'action'
     ├─ turnNumber = 1
     └─ gameLog = ["Game started"]
```

### Turn Progression

```
Turn 1:
  Player 0:
    Phase: action → buy → cleanup
    Action: actions/buys/coins reset, hand drawn
    Cleanup: inPlay → discard, new hand drawn
    End: currentPlayer = 1, phase = action

  Player 1:
    Phase: action → buy → cleanup
    Action: actions/buys/coins reset, hand drawn
    Cleanup: inPlay → discard, new hand drawn
    End: currentPlayer = 0, turnNumber = 2, phase = action

Turn 2:
  Player 0: [repeat]
  ...
```

### Phase Transitions

```
Action Phase:
  ├─ play_action: Play action card, apply effect, continue
  └─ end_phase: Move to buy phase

Buy Phase:
  ├─ play_treasure: Play treasure card, add coins
  ├─ buy: Buy card with available coins
  └─ end_phase: Move to cleanup phase

Cleanup Phase:
  ├─ inPlay cards → discard pile
  ├─ hand cards → discard pile
  ├─ Shuffle discard if deck empty
  ├─ Draw 5 new cards
  ├─ Reset actions/buys/coins
  ├─ Switch player (currentPlayer = 1 - currentPlayer)
  ├─ phase = 'action'
  └─ If just switched from P1 to P0: turnNumber++
```

### Game End Detection

```
checkGameOver(gameState):
  emptyPiles = count(pile.count === 0)

  if emptyPiles >= 3:
    gameOver = true
  elsif Province count === 0:
    gameOver = true
  else:
    gameOver = false

  if gameOver:
    scores = [calculateScore(P0), calculateScore(P1)]
    winner = scores.indexOf(max(scores))
    return { isGameOver: true, winner, scores }
  else:
    return { isGameOver: false }
```

---

## Rules Engine

### Turn Management Algorithm

```typescript
class GameEngine {
  executeMove(state: GameState, move: Move): GameResult {
    // 1. Validate move for current player
    const player = state.players[state.currentPlayer];
    if (!this.isValidMove(state, move)) {
      return { success: false, error: "Invalid move" };
    }

    // 2. Apply move to get new state
    let newState = this.applyMove(state, move);

    // 3. Check for phase transitions
    if (this.shouldEndPhase(newState)) {
      newState = this.advancePhase(newState);
    }

    // 4. Check for player switch
    if (newState.phase === 'action' && newState.currentPlayer !== state.currentPlayer) {
      newState = this.resetPlayerTurn(newState);
    }

    // 5. Check for game end
    if (this.checkGameOver(newState).isGameOver) {
      newState = this.endGame(newState);
    }

    return { success: true, newState };
  }
}
```

### Turn Reset Logic

```typescript
resetPlayerTurn(state: GameState): GameState {
  const player = state.players[state.currentPlayer];

  // 1. Clear inPlay cards
  const discardFromPlay = player.inPlay;

  // 2. Move hand and inPlay to discard
  const newDiscard = [
    ...player.discardPile,
    ...player.hand,
    ...discardFromPlay
  ];

  // 3. Reshuffle if deck empty
  let deck = [...player.drawPile];
  if (deck.length < 5 && newDiscard.length > 0) {
    const [newDeck, remainingDiscard] =
      this.reshuffleDiscard(deck, newDiscard, 5);
    deck = newDeck;
    newDiscard = remainingDiscard;
  }

  // 4. Draw 5 cards
  const [newHand, finalDeck] = this.drawCards(deck, 5);

  // 5. Create new player state
  const resetPlayer: PlayerState = {
    drawPile: finalDeck,
    hand: newHand,
    discardPile: newDiscard,
    inPlay: [],
    actions: 1,
    buys: 1,
    coins: 0
  };

  // 6. Update game state
  const newPlayers = [...state.players];
  newPlayers[state.currentPlayer] = resetPlayer;

  return {
    ...state,
    players: newPlayers
  };
}
```

### AI Decision Framework

```typescript
class RulesBasedAI {
  decideBestMove(state: GameState, playerIndex: number): AIDecision {
    const validMoves = this.getValidMoves(state, playerIndex);

    if (validMoves.length === 0) {
      throw new Error("No valid moves available");
    }

    // Score each valid move
    const moveScores = validMoves.map(move => ({
      move,
      score: this.evaluateMove(move, state, playerIndex)
    }));

    // Select highest-scoring move
    const bestMove = moveScores.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    return {
      move: bestMove.move,
      reasoning: this.explainMove(bestMove.move, state, playerIndex)
    };
  }

  evaluateMove(move: Move, state: GameState, playerIndex: number): number {
    const player = state.players[playerIndex];

    switch (move.type) {
      case 'play_action':
        // Score based on card effect
        return this.scoreActionCard(move.card);

      case 'play_treasure':
        // Treasures are valuable for coins
        return this.scoreTreasure(move.card);

      case 'buy':
        // Score based on Big Money priority
        return this.scorePurchase(move.card, state, player);

      case 'end_phase':
        // End phase when no better moves
        return 0;

      default:
        return 0;
    }
  }

  scorePurchase(card: CardName, state: GameState, player: PlayerState): number {
    // Big Money strategy priorities
    const scores = {
      'Gold': 100,      // Highest priority
      'Silver': 90,
      'Duchy': 50,      // VP cards lower priority
      'Province': 150,  // Highest if available
      'Estate': 30,
      'Copper': 20,
      'Village': 40,    // Action cards
      'Smithy': 45,
      'Curse': -100     // Avoid at all costs
    };

    return scores[card] || 0;
  }
}
```

### Big Money Strategy Rules

```
ACTION PHASE:
  1. If [Village] in hand → PLAY Village (enables more actions)
  2. Else if [Smithy] in hand → PLAY Smithy (draw cards)
  3. Else → END phase

BUY PHASE:
  1. If coins >= 8 AND [Province] available AND game_ending → BUY Province
  2. Else if coins >= 6 AND [Gold] available → BUY Gold
  3. Else if coins >= 5 AND [Duchy] available AND game_ending → BUY Duchy
  4. Else if coins >= 3 AND [Silver] available → BUY Silver
  5. Else if coins >= 2 AND [Estate] available AND late_game → BUY Estate
  6. Else → END phase

CLEANUP PHASE:
  → Always END phase (automatic)
```

---

## Implementation Approach

### GameEngine Changes Required

**Constructor**:
```typescript
class GameEngine {
  constructor(
    seed: string,
    options: GameOptions = {}
  ) {
    this.seed = seed;
    this.random = new SeededRandom(seed);
    this.options = options;
    // No changes to constructor
  }
}
```

**initializeGame Enhancement**:
```typescript
initializeGame(numPlayers: number = 1): GameState {
  // Accept numPlayers parameter
  // For numPlayers = 1: existing solo behavior
  // For numPlayers = 2: create 2 PlayerState objects
  // For numPlayers > 2: future expansion (may require further work)

  const players: PlayerState[] = [];
  for (let i = 0; i < numPlayers; i++) {
    const startingDeck = createStartingDeck();
    const shuffledDeck = this.random.shuffle(startingDeck);

    players.push({
      drawPile: shuffledDeck.slice(5),
      hand: shuffledDeck.slice(0, 5),
      discardPile: [],
      inPlay: [],
      actions: 1,
      buys: 1,
      coins: 0
    });
  }

  return {
    players,
    supply: createDefaultSupply(this.options),
    currentPlayer: 0,
    phase: 'action',
    turnNumber: 1,
    seed: this.seed,
    gameLog: ['Game started with ' + numPlayers + ' players']
  };
}
```

**executeMove Changes**:
```typescript
executeMove(state: GameState, move: Move): GameResult {
  try {
    let newState = this.processMove(state, move);

    // NEW: Check for phase transitions in multiplayer
    if (this.isPhaseComplete(newState)) {
      newState = this.transitionPhase(newState);
    }

    // NEW: Check for player switch
    if (newState.phase === 'action' && newState.currentPlayer !== state.currentPlayer) {
      // Player switch happened, reset their turn
      newState = this.resetPlayerTurn(newState);
    }

    // NEW: Check for game end
    const victory = this.checkGameOver(newState);
    if (victory.isGameOver) {
      newState = { ...newState, gameLog: [
        ...newState.gameLog,
        `Game ended: Player ${victory.winner} wins`
      ]};
    }

    return { success: true, newState };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
```

### RulesBasedAI Implementation

**File**: `packages/core/src/ai.ts` (new file)

```typescript
export class RulesBasedAI {
  constructor(private seed: string) {}

  decideBestMove(state: GameState, playerIndex: number): AIDecision {
    // Validate input
    if (playerIndex !== state.currentPlayer) {
      throw new Error(`It's not player ${playerIndex}'s turn`);
    }

    const validMoves = this.getValidMoves(state, playerIndex);

    if (validMoves.length === 0) {
      throw new Error("No valid moves available");
    }

    // Evaluate each move
    const scores = validMoves.map(move => ({
      move,
      score: this.evaluateMove(move, state, playerIndex)
    }));

    // Select best
    const best = scores.reduce((a, b) =>
      a.score > b.score ? a : b
    );

    return {
      move: best.move,
      reasoning: this.explainMove(best.move, state, playerIndex)
    };
  }

  private getValidMoves(state: GameState, playerIndex: number): Move[] {
    // Reuse GameEngine validation
    const engine = new GameEngine(state.seed);
    const validMoves: Move[] = [];

    // For each possible move, test if it's valid
    // ... (implement move enumeration)

    return validMoves;
  }

  // ... rest of implementation
}

export interface AIDecision {
  move: Move;
  reasoning: string;
}
```

### Backward Compatibility Strategy

**Solo games unaffected**:
1. `GameEngine.initializeGame()` defaults to `numPlayers=1`
2. Solo game logic path unchanged
3. All Phase 1-2 tests continue passing

**Feature flag if needed**:
```typescript
interface GameOptions {
  multiplayerEnabled?: boolean;  // Default: true
  victoryPileSize?: number;      // Existing option
}
```

---

## API Interfaces

### GameEngine Public API (Extended)

```typescript
class GameEngine {
  // Existing methods (unchanged)
  constructor(seed: string, options?: GameOptions);
  initializeGame(numPlayers?: number): GameState;
  executeMove(state: GameState, move: Move): GameResult;
  checkGameOver(state: GameState): Victory;
  getValidMoves(state: GameState, playerIndex?: number): Move[];

  // New for multiplayer (optional public API)
  switchPlayer(state: GameState): GameState;
  resetPlayerTurn(state: GameState): GameState;
  calculateScore(state: GameState, playerIndex: number): number;
}
```

### RulesBasedAI Public API

```typescript
class RulesBasedAI {
  constructor(seed: string);

  decideBestMove(
    state: GameState,
    playerIndex: number
  ): AIDecision;

  evaluateMove(
    move: Move,
    state: GameState,
    playerIndex: number
  ): number;

  getValidMoves(
    state: GameState,
    playerIndex: number
  ): Move[];
}

interface AIDecision {
  move: Move;
  reasoning: string;
}
```

### MCP Tool Interfaces (Extended)

```typescript
// game_session: Create 2-player game
interface GameSessionInput {
  playerCount: 2;  // Strict 2-player
  playerTypes: ['human', 'ai'] | ['claude', 'ai'] | ['ai', 'ai'];
  seed?: string;
  options?: GameOptions;
}

interface GameSessionOutput {
  gameId: string;
  players: [PlayerInfo, PlayerInfo];
  gameState: GameState;
  message: string;
}

// game_execute: Execute move for current player
interface GameExecuteInput {
  gameId: string;
  playerId: number;  // 0 or 1 (must match currentPlayer)
  move: Move;
}

interface GameExecuteOutput {
  success: boolean;
  gameState: GameState;
  currentPlayer: number;
  message: string;
  gameOver?: boolean;
  winner?: number;
  scores?: [number, number];
}

// game_observe: Observe game state
interface GameObserveInput {
  gameId: string;
  playerId: number;  // Observer's ID
}

interface GameObserveOutput {
  gameId: string;
  playerId: number;
  gameState: GameState;
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
  supply: ReadonlyMap<CardName, number>;
  currentPlayer: number;
  gameOver: boolean;
}
```

---

## Performance Considerations

### Target Performance Metrics

| Operation | Target | Method |
|-----------|--------|--------|
| Move execution | <100ms | Time single move + state update |
| Turn reset | <50ms | Time player turn reset sequence |
| AI decision | <100ms | Time AI.decideBestMove() |
| State serialization | <50ms | Time JSON.stringify(gameState) |
| Full game (10 turns) | <5s | Time complete 20-move game |

### Memory Usage

```
GameState (2 players):
  ├─ players[0]: ~1KB (hand + deck refs)
  ├─ players[1]: ~1KB
  ├─ supply: ~400 bytes
  ├─ gameLog: ~1-5KB (grows with turns)
  └─ Total: ~5-10KB per game

With 100 concurrent games: ~1MB memory
No issues expected with standard Node.js heap (512MB+)
```

### Optimization Strategies

**1. Avoid Unnecessary Object Creation**
- Reuse card arrays where possible
- Use structural sharing for state updates

**2. Batch Operations**
- Multi-card chains (Phase 1.5) already batch
- Keep batch logic for multiplayer

**3. Lazy Evaluation**
- Don't calculate final scores until game end
- Only recalculate affected player state

**4. Caching**
- Cache valid moves list between calls
- Invalidate on state change

---

## Testing Architecture

### Real GameEngine Strategy

All Phase 3 tests use actual GameEngine, not mocks:

```typescript
describe('Multiplayer Game Flow', () => {
  it('should switch turns correctly', () => {
    // REAL GameEngine (not mock)
    const engine = new GameEngine('test-seed-001');
    const state1 = engine.initializeGame(2);

    // Execute real move
    const result = engine.executeMove(state1, {
      type: 'end_phase'
    });

    // Should progress through phases
    expect(result.success).toBe(true);
    expect(result.newState.phase).toBe('buy');
  });
});
```

**Why Real Engine**:
- Tests validate actual game behavior
- Catches state mutation bugs
- Validates immutability
- Tests run deterministically (seeded)
- No mock maintenance burden

### Test Fixtures

Standard fixtures for all tests:

```typescript
// Setup
const seed = 'test-multiplayer-001';
const engine = new GameEngine(seed);
const gameState = engine.initializeGame(2);
const ai = new RulesBasedAI(seed);

// Standard assertions
expect(gameState.players.length).toBe(2);
expect(gameState.currentPlayer).toBe(0);
expect(gameState.phase).toBe('action');

// State helpers
function getPlayer(state: GameState, id: number): PlayerState {
  return state.players[id];
}

function getScore(state: GameState, id: number): number {
  return calculateScore(state, id);
}

function countEmptyPiles(state: GameState): number {
  return Array.from(state.supply.values())
    .filter(count => count === 0).length;
}
```

### Integration Test Patterns

Full game sequences test feature interactions:

```typescript
describe('Complete Game Flow', () => {
  it('should play 3 complete turns', () => {
    const engine = new GameEngine('seed');
    let state = engine.initializeGame(2);

    // Player 0 Turn 1
    state = executePhase(engine, state, [
      { type: 'end_phase' }  // Action
    ]);
    state = executePhase(engine, state, [
      { type: 'buy', card: 'Copper' },
      { type: 'end_phase' }  // Buy
    ]);
    state = executePhase(engine, state, [
      { type: 'end_phase' }  // Cleanup
    ]);

    // Verify state after P0's turn
    expect(state.currentPlayer).toBe(1);
    expect(state.phase).toBe('action');

    // ... repeat for P1
  });
});
```

### E2E Test Pattern

Real Claude gameplay (limited):

```typescript
describe('Claude Gameplay', () => {
  test('Claude can play 2-player game', async () => {
    // Create game via MCP
    const createResult = await mcp.game_session({
      playerCount: 2,
      playerTypes: ['claude', 'ai']
    });

    const gameId = createResult.gameId;
    let state = createResult.gameState;

    // Play 3 turns
    for (let i = 0; i < 3; i++) {
      // Claude moves
      const claudeResult = await mcp.game_execute({
        gameId,
        playerId: 0,
        move: getClaudeMove(state)
      });
      state = claudeResult.gameState;

      // AI auto-executes if it's their turn
      if (state.currentPlayer === 1) {
        // AI move already executed by game_execute
      }
    }

    // Verify game state valid
    expect(state.turnNumber).toBe(4);
  });
});
```

---

## Deployment & Rollout

### Incremental Implementation

**Phase 1: Engine Foundation** (Week 1, Days 1-2)
- GameEngine.initializeGame(2) working
- Player state isolation verified
- Turn management logic added
- Tests: 15 unit + 2 integration

**Phase 2: AI Opponent** (Week 1, Days 3-5)
- RulesBasedAI class implemented
- Big Money strategy complete
- Deterministic decisions verified
- Tests: 20 unit + 5 integration

**Phase 3: Game Flow** (Week 2, Days 1-2)
- Turn switching automated
- Game end detection working
- Disconnect handling implemented
- Tests: 22 unit + 8 integration

**Phase 4: CLI & MCP** (Week 2, Days 3-5)
- CLI display updated for 2 players
- MCP tools extended
- Final integration
- Tests: 17+16 unit + 10 integration

### Rollout Strategy

**1. Internal Testing** (Dev-only)
- All 90+ tests passing locally
- Manual gameplay testing (human vs AI)
- Performance benchmarks validated

**2. Staging** (Integration environment)
- Deploy to staging branch
- Run full test suite in CI
- Manual QA by requirements-architect

**3. Production** (Main branch)
- Merge to main with PR
- Tag Phase 3 release
- Update CLAUDE.md with Phase 3 completion

### Rollback Plan

If issues discovered:

1. **Critical Bug**: Revert commit, investigate in feature branch
2. **Performance Issue**: Profile, optimize, re-test
3. **Backward Compatibility**: Verify solo games still work (should be unchanged)

All Phase 1-2 tests must continue passing.

---

## Future Extensibility

### 3+ Player Support

Current design supports future expansion to 3+ players:

```typescript
// Would need changes:
interface GameState {
  readonly players: ReadonlyArray<PlayerState>;  // Any length
  readonly currentPlayer: number;                 // Any valid index
  // Rest unchanged
}

// Turn switching would cycle: 0→1→2→0→1→2→...
// Game end detection would scale naturally
// Supply remains shared across all players
```

### Advanced AI Strategies

RulesBasedAI structure enables more sophisticated strategies:

```typescript
// Future: Factory pattern for AI strategies
type AIStrategy = 'bigMoney' | 'aggressive' | 'defensive' | 'balanced';

class AIFactory {
  static create(strategy: AIStrategy): RulesBasedAI {
    // Return different AI implementations
  }
}
```

### Web UI Integration (Phase 4)

MCP tool layer enables smooth transition:

```
Phase 3: CLI + MCP (current)
  ├─ CLI: Terminal display
  └─ MCP: Tool-based interface

Phase 4: Web UI
  ├─ Web Frontend: Browser display
  ├─ WebSocket: Real-time communication
  └─ Same MCP: Tool layer unchanged
```

---

**Created by**: requirements-architect
**Last Updated**: 2025-10-28
**Approval Status**: PENDING REVIEW
