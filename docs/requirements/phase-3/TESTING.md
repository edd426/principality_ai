# Phase 3 Testing Specifications: Multiplayer Foundation

**Status**: DRAFT
**Created**: 2025-10-28
**Phase**: 3
**Test Count**: 90+ tests (50 unit, 25 integration, 15 E2E)
**Coverage Target**: 95%+
**Owner**: requirements-architect

---

## Table of Contents

- [Testing Overview](#testing-overview)
- [Test Strategy](#test-strategy)
- [Feature 1: Multiplayer Game Engine (20 tests)](#feature-1-multiplayer-game-engine-20-tests)
- [Feature 2: Rules-based AI Opponent (31 tests)](#feature-2-rules-based-ai-opponent-31-tests)
- [Feature 3: Multiplayer Game Flow (33 tests)](#feature-3-multiplayer-game-flow-33-tests)
- [Feature 4: CLI Display (22 tests)](#feature-4-cli-display-22-tests)
- [Feature 5: Multiplayer MCP Tools (22 tests)](#feature-5-multiplayer-mcp-tools-22-tests)
- [Test Execution Plan](#test-execution-plan)
- [Performance & Coverage](#performance--coverage)

---

## Testing Overview

Phase 3 testing validates 2-player game functionality across three levels:

- **Level 1: Unit Tests (50 tests)** - Individual components work correctly
- **Level 2: Integration Tests (25 tests)** - Components work together
- **Level 3: E2E Tests (15 tests)** - Complete user workflows with real engine

**Total**: 90+ tests across all features

**Why Three Levels**:
- Unit tests ensure functions behave correctly in isolation
- Integration tests verify components communicate properly
- E2E tests validate complete game flows with real GameEngine

---

## Test Strategy

### Quality Principles

**Test Completeness**: Each feature tested at all three levels
**Real GameEngine**: All tests use actual GameEngine (no mocks)
**No Randomness**: Tests reproducible with seeds
**Clear Assertions**: Each test has single clear purpose
**Edge Cases**: Boundary conditions tested thoroughly
**Measurable Success**: Pass/fail unambiguous

### Test Execution Order

1. **Unit tests** (fastest, no dependencies)
2. **Integration tests** (medium speed, depend on unit tests)
3. **E2E tests** (slowest, full game sequences)

### Test Fixtures

All multiplayer tests need standard fixtures:

```typescript
// Standard 2-player game state
const seed = 'test-mp-001';
const engine = new GameEngine(seed);
const twoPlayerGame = engine.initializeGame(2);

// Solo game for backward compatibility
const soloGame = engine.initializeGame(1);

// Controlled game states for edge cases
const gameNearEnd = createGameStateWithEmptyPiles(2);
const gameWithAI = createGameWithAIPlayer();
```

### Test Tag System

All tests include structured tags for traceability:

```typescript
describe('Feature X: Component', () => {
  test('specific behavior', () => {
    // @req: FR X.Y - clear requirement
    // @input: What is being tested (e.g., 2 players, specific state)
    // @output: Expected result (e.g., correct turn order)
    // @level: Unit | Integration | E2E
    // @assert: 3-5 clear assertions
    // @edge: Edge cases covered

    expect(...).toBe(...);
    expect(...).toBe(...);
  });
});
```

---

## Feature 1: Multiplayer Game Engine (20 tests)

### UT 1.1: GameState Structure - 2 Players
```typescript
// @req: FR 1.1 - GameState contains 2 PlayerState objects
// @input: initializeGame(2)
// @output: GameState with players array of length 2
// @level: Unit
// @assert: players.length === 2
// @assert: currentPlayer === 0
// @assert: phase === 'action'
// @assert: players[0] and players[1] have distinct state
```

### UT 1.2: GameState Structure - Solo Backward Compatibility
```typescript
// @req: FR 1.5 - Solo games still work
// @input: initializeGame(1)
// @output: GameState with single player (Phase 1 compatible)
// @level: Unit
// @assert: players.length === 1
// @assert: Identical to Phase 1 initialization
```

### UT 1.3: Player 0 Starting Hand
```typescript
// @req: FR 1.2 - Player 0 hand correctly initialized
// @input: initializeGame(2)
// @output: P0 has 5-card starting hand from shuffled deck
// @level: Unit
// @assert: players[0].hand.length === 5
// @assert: players[0].drawPile.length === 5
// @assert: hand contains 5 of [3 Estate, 7 Copper]
// @assert: All hand cards are valid card names
// @edge: Different seed produces different hand order
```

### UT 1.4: Player 1 Starting Hand
```typescript
// @req: FR 1.2 - Player 1 hand independently initialized
// @input: initializeGame(2)
// @output: P1 has independent 5-card starting hand
// @level: Unit
// @assert: players[1].hand.length === 5
// @assert: players[1].drawPile.length === 5
// @assert: P0.hand !== P1.hand (different order, same content)
// @edge: With same seed, hands should shuffle identically (test with multiple seeds)
```

### UT 1.5: Player State Isolation - Hand Changes
```typescript
// @req: FR 1.3 - Changes to P0 hand don't affect P1
// @input: initializeGame(2), executeMove(play_treasure, 'Copper')
// @output: P0 hand modified, P1 hand unchanged
// @level: Unit
// @assert: oldState.players[0].hand !== newState.players[0].hand
// @assert: oldState.players[1].hand === newState.players[1].hand
// @assert: Original state unchanged (immutability)
```

### UT 1.6: Player State Isolation - Coins
```typescript
// @req: FR 1.3 - P0 coins don't affect P1 coins
// @input: initializeGame(2), executeMove(play_treasure, 'Silver')
// @output: P0 coins increased, P1 coins unchanged
// @level: Unit
// @assert: newState.players[0].coins === 2 (Silver = +2)
// @assert: newState.players[1].coins === 0 (unchanged)
```

### UT 1.7: Turn Tracking - Initial State
```typescript
// @req: FR 1.4 - Turn tracking initializes correctly
// @input: initializeGame(2)
// @output: currentPlayer=0, turnNumber=1
// @level: Unit
// @assert: currentPlayer === 0
// @assert: turnNumber === 1
// @assert: phase === 'action'
```

### UT 1.8: Current Player After Move
```typescript
// @req: FR 1.4 - currentPlayer remains 0 until cleanup
// @input: initializeGame(2), execute buy move for P0
// @output: currentPlayer still 0, phase changed to next
// @level: Unit
// @assert: newState.currentPlayer === 0 (still P0)
// @assert: Phase progressed (action→buy or buy→cleanup)
```

### UT 1.9: Player Switch After Cleanup
```typescript
// @req: FR 1.4 - currentPlayer switches after P0 cleanup
// @input: 2-player game in cleanup phase for P0
// @output: currentPlayer switches to 1
// @level: Unit
// @assert: After cleanup move, newState.currentPlayer === 1
// @assert: phase === 'action' (new player's turn)
```

### UT 1.10: Turn Number Increment
```typescript
// @req: FR 1.4 - turnNumber increments after both players complete
// @input: 2-player game, both players complete full turn
// @output: turnNumber increments
// @level: Unit
// @assert: Initial turnNumber === 1
// @assert: After P0 + P1 complete cleanup, turnNumber === 2
// @assert: After P0 + P1 complete cleanup again, turnNumber === 3
```

### UT 1.11: Supply Shared Between Players
```typescript
// @req: FR 1.2 - Supply is shared between players
// @input: initializeGame(2)
// @output: Single supply, modifications visible to both
// @level: Unit
// @assert: gameState.supply is single Map
// @assert: P0 buy changes supply, P1 sees change
```

### UT 1.12: Player Deck Isolation
```typescript
// @req: FR 1.3 - Each player has independent deck
// @input: initializeGame(2)
// @output: players[0].drawPile !== players[1].drawPile
// @level: Unit
// @assert: P0.drawPile.length === 5
// @assert: P1.drawPile.length === 5
// @assert: P0.drawPile items !== P1.drawPile items (or at least not same order)
```

### IT 1.1: Solo Game Flow Still Works
```typescript
// @req: FR 1.5 - Solo games compatible with Phase 1
// @input: Full solo game (10 turns)
// @output: Game completes successfully
// @level: Integration
// @assert: initializeGame(1) works
// @assert: Moves execute normally
// @assert: Game ends correctly
// @assert: No errors from 2-player code
```

### IT 1.2: 2-Player Game Flow
```typescript
// @req: FR 1.1-1.4 - 2-player game initializes and plays
// @input: initializeGame(2), 5 moves for each player
// @output: Correct player states after each move
// @level: Integration
// @assert: P0 makes first 3 moves, state correct
// @assert: P1 makes 3 moves, state independent
// @assert: Turn management works over full sequence
```

### IT 1.3: Multiple 2-Player Games
```typescript
// @req: FR 1.1-1.4 - Can play multiple games sequentially
// @input: Play game 1, reset, play game 2
// @output: Both games complete successfully, independent
// @level: Integration
// @assert: Game 1 and Game 2 are independent
// @assert: No state leakage between games
```

### IT 1.4: Player Deck Reshuffling
```typescript
// @req: FR 1.2 - Deck reshuffles when empty during draw
// @input: 2-player game, force deck empty scenario
// @output: Discard pile shuffled into deck
// @level: Integration
// @assert: Player can draw after deck runs low
// @assert: Both players' deck reshuffle independently
```

### IT 1.5: State Immutability Across 2 Players
```typescript
// @req: FR 1.3 - GameState remains immutable with 2 players
// @input: initializeGame(2), executeMove, compare states
// @output: Original state unchanged, new state returned
// @level: Integration
// @assert: state1 === original (after JSON stringify)
// @assert: state2 !== state1 (new state is different)
// @assert: No mutations detected (deep equality check)
```

**Total Feature 1**: 20 tests (15 unit, 5 integration)

---

## Feature 2: Rules-based AI Opponent (31 tests)

### UT 2.1: AI Decision Engine Exists
```typescript
// @req: FR 2.1 - RulesBasedAI class with decideBestMove method
// @input: RulesBasedAI instantiation
// @output: Instance has decideBestMove method
// @level: Unit
// @assert: RulesBasedAI is instantiable
// @assert: decideBestMove is callable
// @assert: Returns AIDecision with move and reasoning
```

### UT 2.2: AI Makes Valid Move
```typescript
// @req: FR 2.1 - All AI moves are valid
// @input: Random game state, AI decision
// @output: Move passes GameEngine validation
// @level: Unit
// @assert: Move type is valid
// @assert: Card (if specified) is valid
// @assert: GameEngine.executeMove accepts the move
```

### UT 2.3: AI Action - Play Village
```typescript
// @req: FR 2.2 - AI plays Village in action phase
// @input: Hand with Village, action phase, 1 action available
// @output: AI chooses to play Village
// @level: Unit
// @assert: AI decision.move.type === 'play_action'
// @assert: AI decision.move.card === 'Village'
// @assert: Reasoning includes "enables more actions"
// @edge: Prefer Village over Smithy (different effect)
```

### UT 2.4: AI Action - Play Smithy
```typescript
// @req: FR 2.2 - AI plays Smithy in action phase
// @input: Hand with Smithy (no Village), action phase, 1 action
// @output: AI chooses to play Smithy
// @level: Unit
// @assert: AI decision.move.type === 'play_action'
// @assert: AI decision.move.card === 'Smithy'
// @assert: Reasoning includes "draw cards"
```

### UT 2.5: AI Action - No Action Cards
```typescript
// @req: FR 2.2 - AI ends action phase when no action cards
// @input: Hand with only treasures and victories, action phase
// @output: AI chooses end_phase
// @level: Unit
// @assert: AI decision.move.type === 'end_phase'
// @assert: Reasoning: "No action cards to play"
```

### UT 2.6: AI Buy - Gold Available (6+ coins)
```typescript
// @req: FR 2.2 - AI buys Gold with 6+ coins
// @input: 6 coins, Gold available, buy phase
// @output: AI buys Gold
// @level: Unit
// @assert: AI decision.move.type === 'buy'
// @assert: AI decision.move.card === 'Gold'
// @assert: Reasoning: "Big Money: Gold increases coin generation"
```

### UT 2.7: AI Buy - Silver Available (3-5 coins)
```typescript
// @req: FR 2.2 - AI buys Silver with 3+ coins but <6
// @input: 4 coins, Silver available, Gold unavailable
// @output: AI buys Silver
// @level: Unit
// @assert: AI decision.move.type === 'buy'
// @assert: AI decision.move.card === 'Silver'
```

### UT 2.8: AI Buy - Province (8+ coins, endgame)
```typescript
// @req: FR 2.2 - AI buys Province when available and game ending
// @input: 8 coins, Province available, 2 piles empty, buy phase
// @output: AI buys Province
// @level: Unit
// @assert: AI decision.move.type === 'buy'
// @assert: AI decision.move.card === 'Province'
// @assert: Reasoning includes "endgame" or "victory"
```

### UT 2.9: AI Buy - Duchy (5+ coins, late game)
```typescript
// @req: FR 2.2 - AI buys Duchy when endgame and can't afford Province
// @input: 5 coins, Province empty, Duchy available, endgame state
// @output: AI buys Duchy
// @level: Unit
// @assert: AI decision.move.type === 'buy'
// @assert: AI decision.move.card === 'Duchy'
```

### UT 2.10: AI Buy - Estate (2+ coins, very late game)
```typescript
// @req: FR 2.2 - AI buys Estate only in late game
// @input: 2 coins, only Estate and Copper affordable, endgame
// @output: AI buys Estate (or nothing if avoiding)
// @level: Unit
// @assert: If AI buys, move.card === 'Estate'
// @assert: OR AI ends phase instead (both acceptable)
```

### UT 2.11: AI Buy - Avoid Curse
```typescript
// @req: FR 2.2 - AI doesn't buy Curse
// @input: 0 coins, Curse in supply, no other affordable cards
// @output: AI ends phase (doesn't buy Curse)
// @level: Unit
// @assert: AI decision.move.type === 'end_phase'
// @assert: Reasoning explains avoiding Curse
// @edge: Even when only option, avoid Curse
```

### UT 2.12: AI Determinism - Same State Same Move
```typescript
// @req: FR 2.4 - Deterministic decisions
// @input: Same gameState, call decideBestMove 3 times
// @output: Same move returned every time
// @level: Unit
// @assert: decision1.move.card === decision2.move.card
// @assert: decision2.move.card === decision3.move.card
// @assert: All reasoning identical
// @edge: No randomness source in AI
```

### UT 2.13: AI Determinism - Different States Different Moves
```typescript
// @req: FR 2.4 - Different states produce different moves
// @input: State A (3 coins), State B (8 coins)
// @output: Different purchase decisions
// @level: Unit
// @assert: decisionA.move.card !== decisionB.move.card (likely)
// @assert: OR same card but different reasoning
```

### UT 2.14: AI Handles All 8 Cards
```typescript
// @req: FR 2.5 - AI supports all MVP cards
// @input: Hand with each card type
// @output: AI makes reasonable decision
// @level: Unit
// @assert: For each card, AI produces valid decision
// @assert: No crashes or errors
// @cards: Copper, Silver, Gold, Estate, Duchy, Province, Smithy, Village
// @edge: Curse handling
```

### UT 2.15: AI - No Invalid Moves
```typescript
// @req: FR 2.3 - All AI moves pass validation
// @input: 100 random game states, AI decisions
// @output: All moves are valid
// @level: Unit
// @assert: For each move, GameEngine.executeMove succeeds
// @assert: No errors or rejections
// @assert: All card names are valid
```

### UT 2.16: AI - Can't Buy Unavailable Cards
```typescript
// @req: FR 2.3 - AI doesn't buy from empty piles
// @input: Gold supply empty, 6+ coins
// @output: AI buys Silver instead
// @level: Unit
// @assert: AI decision.move.card !== 'Gold'
// @assert: AI decision.move.card === 'Silver'
```

### UT 2.17: AI - Respects Coin Limits
```typescript
// @req: FR 2.3 - AI doesn't buy without sufficient coins
// @input: 2 coins, Silver (3 cost) in supply
// @output: AI buys Copper or ends phase
// @level: Unit
// @assert: If AI buys, cost <= 2 coins
// @assert: Can't buy Silver with only 2 coins
```

### UT 2.18: AI Reasoning is Provided
```typescript
// @req: FR 2.1 - All decisions include reasoning
// @input: Any game state, AI decision
// @output: AIDecision.reasoning is non-empty string
// @level: Unit
// @assert: decision.reasoning.length > 0
// @assert: reasoning is understandable English
// @assert: explains why move was chosen
```

### UT 2.19: AI Action Card Order
```typescript
// @req: FR 2.2 - AI plays action cards in optimal order
// @input: Hand with [Village, Smithy, Copper], 1 action
// @output: AI plays Village first (enables more plays)
// @level: Unit
// @assert: First move plays Village
// @assert: Next move would play Smithy (if action available)
```

### UT 2.20: AI Multiple Action Cards
```typescript
// @req: FR 2.2 - AI sequentially plays multiple action cards
// @input: Hand with [Village, Smithy], 1 action
// @output: AI suggests Village (which gives +2 actions, enabling Smithy)
// @level: Unit
// @assert: AI plays Village first
// @assert: (In next turn) AI plays Smithy
```

### IT 2.1: AI Complete Action Phase
```typescript
// @req: FR 2.2 - AI plays all desired action cards
// @input: AI in action phase, hand with Village + Smithy
// @output: Sequence: play Village → play Smithy → end phase
// @level: Integration
// @assert: Both cards played in correct order
// @assert: Action count respected
```

### IT 2.2: AI Complete Buy Phase
```typescript
// @req: FR 2.2 - AI buys correct card
// @input: AI in buy phase, 8+ coins, Province available
// @output: AI buys Province
// @level: Integration
// @assert: Move executes successfully
// @assert: Supply decreases for Province
// @assert: Player's discard gets Province
```

### IT 2.3: AI Simple Game (5 turns)
```typescript
// @req: FR 2.1-2.5 - AI plays complete game
// @input: AI as both players (or AI vs AI)
// @output: Game completes, AI makes all moves
// @level: Integration
// @assert: All AI moves valid
// @assert: Game progresses normally
// @assert: Game ends correctly
// @assert: Winner determined
```

### IT 2.4: AI Decision Strategy Validation
```typescript
// @req: FR 2.2 - Big Money strategy works
// @input: Track AI purchases over 10 AI turns
// @output: Purchases follow Big Money priority
// @level: Integration
// @assert: Gold purchased before Silver
// @assert: Silver purchased before Duchy
// @assert: Victory cards late game
```

### IT 2.5: AI vs Random Comparison
```typescript
// @req: FR 2.2 - Big Money better than random
// @input: AI vs random player, 10 games
// @output: AI wins most games
// @level: Integration
// @assert: AI win rate > 40% (should be ~50% vs optimal)
// @assert: AI not worse than random
// @edge: Random baseline for comparison
```

### E2E 2.1: Claude Plays Against AI
```typescript
// @req: FR 2.1-2.5 - Claude MCP can play against AI
// @input: Claude initiates game_session, plays moves, AI responds
// @output: Game completes with valid AI opponent
// @level: E2E
// @assert: AI makes valid moves
// @assert: Claude's moves acknowledged
// @assert: Game flow correct
// @cost: $0.05 (multi-tool calls)
```

**Total Feature 2**: 31 tests (20 unit, 5 integration, 1 E2E)

---

## Feature 3: Multiplayer Game Flow (33 tests)

### UT 3.1: Turn Switch - P0 to P1
```typescript
// @req: FR 3.1 - Turn switches from P0 to P1
// @input: P0 cleanup phase, execute end_phase
// @output: currentPlayer changes to 1
// @level: Unit
// @assert: oldState.currentPlayer === 0
// @assert: newState.currentPlayer === 1
```

### UT 3.2: Turn Switch - P1 to P0
```typescript
// @req: FR 3.1 - Turn switches from P1 to P0
// @input: P1 cleanup phase, execute end_phase
// @output: currentPlayer changes to 0
// @level: Unit
// @assert: oldState.currentPlayer === 1
// @assert: newState.currentPlayer === 0
// @assert: turnNumber incremented
```

### UT 3.3: Phase Reset on New Turn
```typescript
// @req: FR 3.2 - Phase resets to action for new player
// @input: P0 completes cleanup, switches to P1
// @output: P1 starts in action phase
// @level: Unit
// @assert: newState.phase === 'action'
// @assert: Player 1 ready for action phase
```

### UT 3.4: Player Stats Reset
```typescript
// @req: FR 3.2 - Actions, buys, coins reset for new turn
// @input: End of previous player's cleanup
// @output: New player has fresh stats
// @level: Unit
// @assert: players[1].actions === 1
// @assert: players[1].buys === 1
// @assert: players[1].coins === 0
```

### UT 3.5: Player Hand Refresh
```typescript
// @req: FR 3.2 - New player draws 5 cards
// @input: Start of P1's turn
// @output: P1.hand has 5 cards
// @level: Unit
// @assert: players[1].hand.length === 5
// @assert: Cards drawn from deck/discard
// @assert: Deck and discard adjusted
```

### UT 3.6: In-Play Cards to Discard
```typescript
// @req: FR 3.2 - inPlay cards moved to discard
// @input: P0 played Village and Smithy, now cleanup
// @output: inPlay cleared, cards in discard
// @level: Unit
// @assert: newState.players[0].inPlay.length === 0
// @assert: Discard pile increased
```

### UT 3.7: Game End - 3 Piles Empty
```typescript
// @req: FR 3.3 - Game ends when 3+ piles empty
// @input: 3 piles at 0 count
// @output: checkGameOver returns true
// @level: Unit
// @assert: isGameOver === true
// @assert: winner determined
// @assert: scores calculated
```

### UT 3.8: Game End - Province Pile Empty
```typescript
// @req: FR 3.3 - Game ends when Province empty
// @input: Province supply = 0
// @output: checkGameOver returns true
// @level: Unit
// @assert: isGameOver === true (major card gone)
// @assert: Game end triggered
```

### UT 3.9: Game Not End - 2 Piles Empty
```typescript
// @req: FR 3.3 - Game continues if only 2 piles empty
// @input: Smithy and Village at 0, other piles have stock
// @output: checkGameOver returns false
// @level: Unit
// @assert: isGameOver === false
// @assert: Game continues
```

### UT 3.10: Victory Point Calculation - P0
```typescript
// @req: FR 3.3 - VP calculated correctly for P0
// @input: P0 deck with 2 Estate (1 VP each), 1 Duchy (3 VP), 1 Province (6 VP)
// @output: Total VP = 1+1+3+6 = 11
// @level: Unit
// @assert: calculateScore(gameState, 0) === 11
// @assert: Correct VP formula
```

### UT 3.11: Victory Point Calculation - P1
```typescript
// @req: FR 3.3 - VP calculated correctly for P1
// @input: P1 deck with 3 Estate, 1 Province
// @output: Total VP = 3 + 6 = 9
// @level: Unit
// @assert: calculateScore(gameState, 1) === 9
// @assert: Independent from P0
```

### UT 3.12: Winner Determination - P0 Wins
```typescript
// @req: FR 3.3 - Winner with higher VP
// @input: P0 = 15 VP, P1 = 10 VP
// @output: winner === 0
// @level: Unit
// @assert: winner === 0
// @assert: Determined by highest VP
```

### UT 3.13: Winner Determination - P1 Wins
```typescript
// @req: FR 3.3 - Winner with higher VP
// @input: P0 = 8 VP, P1 = 20 VP
// @output: winner === 1
// @level: Unit
// @assert: winner === 1
```

### UT 3.14: Tie Breaker
```typescript
// @req: FR 3.3 - Ties broken by turn count
// @input: P0 = 12 VP, P1 = 12 VP, P0 got 12 VP on turn 10, P1 on turn 11
// @output: P0 wins (achieved score first)
// @level: Unit
// @assert: winner === 0 (P0 reached score first)
// @assert: Or: winner === 1 if P1 was ahead earlier
// @edge: Complex tiebreaker logic
```

### UT 3.15: Disconnect - Player Not Responding
```typescript
// @req: FR 3.4 - Disconnect detected
// @input: Player timeout (30s with no input)
// @output: Disconnect event triggered
// @level: Unit
// @assert: Disconnect detected
// @assert: Game state unchanged (not yet recovered)
```

### UT 3.16: Disconnect - Replace with AI
```typescript
// @req: FR 3.4 - Disconnected player replaced with AI
// @input: P0 disconnects, game continues
// @output: AI takes over P0's moves
// @level: Unit
// @assert: P0 replaced by RulesBasedAI
// @assert: Game continues with AI
```

### UT 3.17: Disconnect - Game Continues
```typescript
// @req: FR 3.4 - Game doesn't end on disconnect
// @input: P0 disconnects mid-game
// @output: Game continues, P1 keeps playing
// @level: Unit
// @assert: P1 can continue playing
// @assert: Moves execute normally
// @assert: Game doesn't error
```

### UT 3.18: Disconnect - Both Players
```typescript
// @req: FR 3.4 - Both disconnect → AI vs AI
// @input: P0 and P1 both disconnect
// @output: AI vs AI game continues
// @level: Unit
// @assert: Both replaced by AI
// @assert: Game completes with AI moves
```

### UT 3.19: Disconnect Logging
```typescript
// @req: FR 3.6 - Disconnect logged
// @input: P0 disconnects
// @output: Game log includes disconnect event
// @level: Unit
// @assert: gameLog includes: "Player 0 disconnected"
// @assert: gameLog includes: "Player 0 replaced with Rules-based AI"
```

### UT 3.20: Supply Pile Enforcement
```typescript
// @req: FR 3.5 - Can't buy from empty pile
// @input: Smithy supply = 0, player tries to buy Smithy
// @output: Move rejected, error message
// @level: Unit
// @assert: GameEngine rejects move
// @assert: Error: "Smithy supply exhausted"
```

### UT 3.21: Supply Pile Depletion
```typescript
// @req: FR 3.5 - Supply decreases on purchase
// @input: Buy Copper, starting supply = 60
// @output: Supply = 59
// @level: Unit
// @assert: newSupply.get('Copper') === 59
// @assert: oldSupply.get('Copper') === 60
```

### UT 3.22: Game Log - Move History
```typescript
// @req: FR 3.6 - Game log records all moves
// @input: Series of moves (play, buy, end)
// @output: Game log contains all move descriptions
// @level: Unit
// @assert: gameLog.length >= 10
// @assert: gameLog includes: "Player 0 played Copper"
// @assert: gameLog includes: "Player 0 bought Silver"
```

### IT 3.1: Complete Turn - P0
```typescript
// @req: FR 3.1-3.2 - P0 completes full turn
// @input: P0 starting action phase
// @output: P0 completes action→buy→cleanup
// @level: Integration
// @assert: All 3 phases execute
// @assert: Stats reset properly
// @assert: Turn switches to P1
```

### IT 3.2: Complete Turn - P1
```typescript
// @req: FR 3.1-3.2 - P1 completes full turn
// @input: P1 starting action phase
// @output: P1 completes action→buy→cleanup
// @level: Integration
// @assert: All 3 phases execute
// @assert: Stats reset properly
// @assert: Turn increments, back to P0
```

### IT 3.3: 3-Turn Game
```typescript
// @req: FR 3.1-3.6 - 3 complete turns
// @input: Both players play 3 turns each
// @output: All 6 turns complete, game continues
// @level: Integration
// @assert: Turn sequence correct (P0-P1-P0-P1-P0-P1)
// @assert: turnNumber progresses (1→2→3)
// @assert: All log entries recorded
```

### IT 3.4: Game End Trigger
```typescript
// @req: FR 3.3 - Game ends on supply exhaustion
// @input: Play until 3 piles empty
// @output: Game ends, winner determined, scores shown
// @level: Integration
// @assert: Game stops after end condition
// @assert: Winner calculated
// @assert: Final state returned
```

### IT 3.5: 10-Turn Complete Game
```typescript
// @req: FR 3.1-3.6 - Full game to completion
// @input: Both players play 10 turns (20 player-turns)
// @output: Game completes normally
// @level: Integration
// @assert: All turns valid
// @assert: Game ends on 3-pile condition
// @assert: Winner and scores correct
```

### E2E 3.1: Human vs AI Game
```typescript
// @req: FR 3.1-3.6 - Complete human vs AI game
// @input: Human and AI both play turns
// @output: Game plays end-to-end
// @level: E2E
// @assert: Turns alternate correctly
// @assert: AI makes decisions
// @assert: Game ends properly
// @cost: $0.02 (logging/observation)
```

**Total Feature 3**: 33 tests (22 unit, 8 integration, 3 E2E)

---

## Feature 4: CLI Display (22 tests)

### UT 4.1: Current Player Header
```typescript
// @req: FR 4.1 - Current player indicator displayed
// @input: P0's turn, generate display
// @output: Header shows "PLAYER 0'S TURN"
// @level: Unit
// @assert: Display includes "PLAYER 0"
// @assert: Display includes "TURN #"
```

### UT 4.2: Current Player Header - P1
```typescript
// @req: FR 4.1 - Current player indicator for P1
// @input: P1's turn, generate display
// @output: Header shows "PLAYER 1'S TURN"
// @level: Unit
// @assert: Display includes "PLAYER 1"
```

### UT 4.3: Opponent VP Display
```typescript
// @req: FR 4.2 - Opponent VP shown
// @input: P0's turn, P1 has 8 VP
// @output: Display shows "Opponent: 8 VP"
// @level: Unit
// @assert: Display includes "8 VP"
// @assert: VP correctly calculated
```

### UT 4.4: Opponent Hand Size
```typescript
// @req: FR 4.2 - Opponent hand size shown
// @input: P0's turn, P1 hand has 5 cards
// @output: Display shows "Cards in Hand: 5"
// @level: Unit
// @assert: Display includes "5"
// @assert: Count is accurate
```

### UT 4.5: Opponent In-Play Cards
```typescript
// @req: FR 4.2 - Opponent inPlay cards listed
// @input: P1 played Village and Smithy
// @output: Display shows: "Cards in Play: Village, Smithy"
// @level: Unit
// @assert: Display includes card names
// @assert: All inPlay cards shown
```

### UT 4.6: Supply Pile Display
```typescript
// @req: FR 4.3 - All 8 supply piles shown
// @input: Current supply state
// @output: Display lists Copper, Silver, Gold, Estate, Duchy, Province, Smithy, Village with counts
// @level: Unit
// @assert: All 8 cards present
// @assert: Counts accurate
```

### UT 4.7: Supply Low Warning
```typescript
// @req: FR 4.3 - Low supply warning (<5)
// @input: Smithy = 3 remaining
// @output: Display shows "⚠️ Smithy: 3 ⚠️ Low!"
// @level: Unit
// @assert: Warning symbol present
// @assert: "Low!" text present
```

### UT 4.8: Supply Critically Low Warning
```typescript
// @req: FR 4.3 - Critically low warning (<3)
// @input: Village = 1 remaining
// @output: Display shows "⚠️ Village: 1 ⚠️ Critically Low!"
// @level: Unit
// @assert: "Critically Low!" text present
```

### UT 4.9: Supply Empty Warning
```typescript
// @req: FR 4.3 - Empty pile warning
// @input: Smithy = 0
// @output: Display shows "⚠️ Smithy: EMPTY"
// @level: Unit
// @assert: "EMPTY" displayed
```

### UT 4.10: Turn Boundary - Visual Separator
```typescript
// @req: FR 4.4 - Turn boundaries clear
// @input: Display between turns
// @output: Separator line (══════) visible
// @level: Unit
// @assert: Separator pattern present
// @assert: Separates consecutive turns visually
```

### UT 4.11: Game End Display - Winner
```typescript
// @req: FR 4.5 - Winner displayed with ranking
// @input: P0 wins with 25 VP, P1 has 18 VP
// @output: "🥇 1st Place: Player 0 (25 VP)"
// @level: Unit
// @assert: 🥇 emoji present
// @assert: "1st Place" text present
// @assert: VP shown
```

### UT 4.12: Game End Display - Loser
```typescript
// @req: FR 4.5 - Loser displayed with ranking
// @input: P1 with 18 VP
// @output: "🥈 2nd Place: Player 1 (18 VP)"
// @level: Unit
// @assert: 🥈 emoji present
// @assert: "2nd Place" text present
```

### UT 4.13: Game End - Summary
```typescript
// @req: FR 4.5 - Game summary shown
// @input: Game completed
// @output: "Game completed in X turns"
// @level: Unit
// @assert: Turn count displayed
// @assert: Final scores shown
```

### UT 4.14: Player Hand Display
```typescript
// @req: FR 4.6 - Player hand shown with indices
// @input: P0 hand [Copper, Copper, Silver, Estate, Duchy]
// @output: "[0] Copper  [1] Copper  [2] Silver  [3] Estate  [4] Duchy"
// @level: Unit
// @assert: Indices displayed
// @assert: All cards shown
```

### UT 4.15: Available Moves Display
```typescript
// @req: FR 4.6 - Move options displayed
// @input: Action phase with possible moves
// @output: Numbered list of available moves
// @level: Unit
// @assert: Move numbers sequential
// @assert: Move descriptions clear
```

### UT 4.16: Phase Display
```typescript
// @req: FR 4.6 - Current phase shown
// @input: In action phase
// @output: "ACTION PHASE (1 action available, 1 buy available, $0 coins)"
// @level: Unit
// @assert: Phase name displayed
// @assert: Actions, buys, coins shown
```

### IT 4.1: Complete Game Display
```typescript
// @req: FR 4.1-4.6 - Full game display works
// @input: Play complete 5-turn game
// @output: All display elements update correctly
// @level: Integration
// @assert: Headers show correct player
// @assert: Opponent info updates
// @assert: Supply decreases visible
// @assert: Final scores displayed
```

### IT 4.2: Player Switch Display
```typescript
// @req: FR 4.4 - Display updates on turn switch
// @input: P0 ends cleanup, P1 starts
// @output: Headers and opponent info update
// @level: Integration
// @assert: "PLAYER 1'S TURN" shown
// @assert: Opponent becomes P0
// @assert: Previous opponent's stats updated
```

### IT 4.3: Supply Updates Visible
```typescript
// @req: FR 4.3 - Supply pile counts change
// @input: Multiple purchases
// @output: Display shows decreasing counts
// @level: Integration
// @assert: Copper: 60 → 59 → 58 visible
// @assert: Warnings appear as piles near empty
```

### E2E 4.1: Human Gameplay Display
```typescript
// @req: FR 4.1-4.6 - Human sees clear display
// @input: Human plays 3 turns vs AI
// @output: Display clear, readable, informative
// @level: E2E
// @assert: Player understands whose turn
// @assert: Can see opponent's visible state
// @assert: Supply status obvious
```

**Total Feature 4**: 22 tests (17 unit, 5 integration)

---

## Feature 5: Multiplayer MCP Tools (22 tests)

### UT 5.1: game_session - Create 2P Game
```typescript
// @req: FR 5.1 - game_session creates 2-player game
// @input: game_session({playerCount: 2, playerTypes: ['human','ai']})
// @output: GameState with 2 players, gameId, player metadata
// @level: Unit
// @assert: players.length === 2
// @assert: gameId is unique string
// @assert: player types correct
```

### UT 5.2: game_session - Wrong Player Count
```typescript
// @req: FR 5.1 - Reject non-2 player requests
// @input: game_session({playerCount: 3})
// @output: Error message
// @level: Unit
// @assert: Error thrown
// @assert: Message: "Only 2-player games supported"
```

### UT 5.3: game_session - Player Metadata
```typescript
// @req: FR 5.1 - Player metadata correct
// @input: game_session with [human, ai]
// @output: players[0].type === 'human', players[1].type === 'ai'
// @level: Unit
// @assert: Both player objects correct
// @assert: IDs 0 and 1 assigned
```

### UT 5.4: game_execute - Valid Move
```typescript
// @req: FR 5.2 - Execute valid move
// @input: game_execute({gameId, playerId: 0, move})
// @output: Success, updated gameState
// @level: Unit
// @assert: success === true
// @assert: newState returned
```

### UT 5.5: game_execute - Wrong Player
```typescript
// @req: FR 5.2 - Reject wrong player move
// @input: game_execute with playerId !== currentPlayer
// @output: Error, move not executed
// @level: Unit
// @assert: success === false
// @assert: Error: "It's not your turn"
// @assert: State unchanged
```

### UT 5.6: game_execute - Invalid Move
```typescript
// @req: FR 5.2 - Reject invalid move
// @input: game_execute with card not in hand
// @output: Error, move not executed
// @level: Unit
// @assert: success === false
// @assert: Error message describes problem
// @assert: State unchanged
```

### UT 5.7: game_execute - Move Execution
```typescript
// @req: FR 5.2 - Move executes correctly
// @input: Buy move with sufficient coins
// @output: Card added to discard, supply decreased
// @level: Unit
// @assert: Move succeeds
// @assert: State updated properly
```

### UT 5.8: game_execute - Current Player Update
```typescript
// @req: FR 5.2 - currentPlayer returned
// @input: Execute move during P0's turn
// @output: response.currentPlayer is next player or still P0
// @level: Unit
// @assert: currentPlayer field present
// @assert: Value is 0 or 1
```

### UT 5.9: game_execute - Game Over Detection
```typescript
// @req: FR 5.2 - Game end detected
// @input: Move that triggers 3-pile empty condition
// @output: response.gameOver === true, winner shown
// @level: Unit
// @assert: gameOver field present
// @assert: winner field present when gameOver
```

### UT 5.10: game_execute - Messaging
```typescript
// @req: FR 5.2 - Clear move messages
// @input: Execute various moves
// @output: Message describes move and result
// @level: Unit
// @assert: message non-empty
// @assert: message describes move
// @assert: message includes result
```

### UT 5.11: game_observe - Player Info
```typescript
// @req: FR 5.3 - Observe returns player-specific info
// @input: game_observe({gameId, playerId: 0})
// @output: playerInfo with hand, VP, coins, etc
// @level: Unit
// @assert: playerInfo.myHand present
// @assert: playerInfo.myVP is number
// @assert: playerInfo.myCoins is number
```

### UT 5.12: game_observe - Opponent Info
```typescript
// @req: FR 5.3 - Observe returns opponent info
// @input: game_observe for player 0
// @output: opponentInfo with id, VP, handSize, inPlay, etc
// @level: Unit
// @assert: opponentInfo.id === 1
// @assert: opponentInfo.vp is number
// @assert: opponentInfo.handSize is number
// @assert: opponentInfo.inPlay is array
```

### UT 5.13: game_observe - Supply Info
```typescript
// @req: FR 5.3 - Supply included in observation
// @input: game_observe
// @output: supply field with all piles
// @level: Unit
// @assert: supply map present
// @assert: All 8 cards present
// @assert: Counts accurate
```

### UT 5.14: game_observe - Turn Info
```typescript
// @req: FR 5.3 - Current player and game status
// @input: game_observe
// @output: currentPlayer and gameOver fields
// @level: Unit
// @assert: currentPlayer is 0 or 1
// @assert: gameOver is boolean
```

### UT 5.15: game_observe - Player 0 View
```typescript
// @req: FR 5.3 - P0 sees self as primary
// @input: game_observe({playerId: 0})
// @output: playerInfo = P0's state, opponentInfo = P1
// @level: Unit
// @assert: playerInfo matches P0
// @assert: opponentInfo matches P1
```

### UT 5.16: game_observe - Player 1 View
```typescript
// @req: FR 5.3 - P1 sees self as primary
// @input: game_observe({playerId: 1})
// @output: playerInfo = P1's state, opponentInfo = P0
// @level: Unit
// @assert: playerInfo matches P1
// @assert: opponentInfo matches P0
```

### IT 5.1: Complete Tool Workflow
```typescript
// @req: FR 5.1-5.3 - Full game via tools
// @input: game_session → game_execute → game_observe (3 turns)
// @output: Game progresses via tool calls
// @level: Integration
// @assert: game_session creates game
// @assert: game_execute changes state
// @assert: game_observe shows state
// @assert: All in sync
```

### IT 5.2: AI Auto-Execution
```typescript
// @req: FR 5.4 - AI move auto-executes
// @input: Human executes move, switches to AI
// @output: AI move executed automatically
// @level: Integration
// @assert: After human move, AI move shown in response
// @assert: State reflects AI move
// @assert: Turn switches back to human
```

### IT 5.3: Multiple Tool Calls
```typescript
// @req: FR 5.1-5.4 - Multiple sequential calls
// @input: Series of game_execute calls (3+ moves)
// @output: All moves execute, state consistent
// @level: Integration
// @assert: Each call valid
// @assert: State progresses
// @assert: No conflicts
```

### E2E 5.1: Claude via MCP Tools
```typescript
// @req: FR 5.1-5.4 - Claude plays via tools
// @input: Claude calls game_session, game_execute, game_observe
// @output: Claude plays complete game
// @level: E2E
// @assert: All tools respond correctly
// @assert: Claude makes valid moves
// @assert: Game completes
// @cost: $0.03 (multi-turn game)
```

**Total Feature 5**: 22 tests (16 unit, 5 integration, 1 E2E)

---

## Test Execution Plan

### Phase 1: Unit Tests (Foundation - Day 1-2)

Run all 50+ unit tests first (fastest, no dependencies):

1. Feature 1 units (15 tests) - 5 min
2. Feature 2 units (20 tests) - 8 min
3. Feature 3 units (22 tests) - 8 min
4. Feature 4 units (17 tests) - 5 min
5. Feature 5 units (16 tests) - 5 min

**Total**: ~30 minutes for all unit tests

### Phase 2: Integration Tests (Day 2-3)

Run after unit tests pass:

1. Feature 1 integration (5 tests) - 3 min
2. Feature 2 integration (5 tests) - 5 min
3. Feature 3 integration (8 tests) - 8 min
4. Feature 4 integration (5 tests) - 5 min
5. Feature 5 integration (5 tests) - 5 min

**Total**: ~25 minutes for integration tests

### Phase 3: E2E Tests (Day 3)

Run after integration tests pass:

1. Feature 2 E2E (1 test) - 3 min
2. Feature 3 E2E (3 tests) - 8 min
3. Feature 4 E2E (1 test) - 5 min
4. Feature 5 E2E (1 test) - 3 min

**Total**: ~20 minutes for E2E tests

### Complete Test Run: ~75 minutes total

---

## Performance & Coverage

### Coverage Targets

| Component | Target | Method |
|-----------|--------|--------|
| Multiplayer GameEngine | 95%+ | Unit + integration tests |
| Rules-based AI | 95%+ | Unit tests (20+) + integration |
| Game Flow | 95%+ | Unit + integration tests |
| CLI Display | 95%+ | Unit tests (display formatting) |
| MCP Tools | 95%+ | Unit + integration tests |
| **Overall** | **95%+** | **Combined test suite** |

### Performance Benchmarks

Tests should execute within time targets:

| Test Type | Count | Time Per Test | Total Time |
|-----------|-------|----------------|-----------|
| Unit | 50 | 0.3s | 15s |
| Integration | 25 | 0.6s | 15s |
| E2E | 15 | 1-2s | 30s |

**Target**: Complete test suite runs in < 2 minutes

### Coverage Validation

After all tests pass:

```bash
npm run test -- --coverage

# Expected output:
# Statements   : 95.0% (X/Y)
# Branches     : 93.0% (A/B)
# Functions    : 95.5% (C/D)
# Lines        : 95.2% (E/F)
```

**Gate**: PR blocked if coverage < 95%

---

**Created by**: requirements-architect
**Last Updated**: 2025-10-28
**Approval Status**: PENDING REVIEW
