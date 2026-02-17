# Development Guide

**Status**: ACTIVE

---

## Overview

This guide covers development workflows, testing strategies, and common commands for working on Principality AI.

---

## Development Commands

### Build Commands

```bash
# Build all packages
npm run build

# Build specific package
cd packages/core && npm run build
cd packages/cli && npm run build
```

### Testing Commands

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/game.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests for specific package
cd packages/core && npm test
cd packages/cli && npm test
```

### Linting Commands

```bash
# Check code style
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### CLI Game Commands

```bash
# Start CLI game
npm run play

# Start with specific seed
npm run play -- --seed=12345

# Start with multiple players
npm run play -- --players=2

# Stable numbers mode (for AI testing)
npm run play -- --stable-numbers

# Manual cleanup mode (disable auto-skip)
npm run play -- --manual-cleanup

# Combine flags
npm run play -- --seed=test --stable-numbers
```

---

## Manual Testing (Phase 1)

### Quick Engine Validation

Copy and paste this for quick validation of the game engine:

```bash
node -e "
const {GameEngine} = require('./packages/core/dist/game.js');
console.log('✓ Successfully loaded GameEngine');
const engine = new GameEngine('12345');
const gameState = engine.initializeGame(1);
console.log('✓ Game initialized successfully');
console.log('Player hand:', gameState.players[0].hand.join(', '));
console.log('Available actions:', gameState.players[0].actions);
console.log('Game phase:', gameState.phase);
console.log('Supply cards available:', gameState.supply.size);
"
```

### Test Complete Game Turn

```bash
node -e "
const {GameEngine} = require('./packages/core/dist/game.js');
const engine = new GameEngine('12345');
let gameState = engine.initializeGame(1);
console.log('Initial hand:', gameState.players[0].hand.join(', '));
console.log('Initial coins:', gameState.players[0].coins);

// End action phase (auto-plays treasures)
let result = engine.executeMove(gameState, {type: 'end_phase'});
if (result.success) {
  gameState = result.gameState;
  console.log('After treasures played - Coins:', gameState.players[0].coins);
  console.log('Phase:', gameState.phase);
}
"
```

### Test Full Turn Sequence

```bash
node -e "
const {GameEngine} = require('./packages/core/dist/game.js');
const engine = new GameEngine('12345');
let gameState = engine.initializeGame(1);

console.log('=== FULL GAME TURN DEMONSTRATION ===');
console.log('Initial phase:', gameState.phase);
console.log('Initial hand:', gameState.players[0].hand.join(', '));
console.log('Initial actions/buys/coins:', gameState.players[0].actions + '/' + gameState.players[0].buys + '/' + gameState.players[0].coins);
console.log('');

// End action phase (no actions to play)
let result = engine.executeMove(gameState, { type: 'end_phase' });
if (result.success) {
  gameState = result.gameState;
  console.log('✓ Moved to buy phase');
  console.log('Phase:', gameState.phase);
  console.log('Coins after auto-playing treasures:', gameState.players[0].coins);
  console.log('');
  
  // Try to buy Estate (costs 2 coins)
  if (gameState.players[0].coins >= 2) {
    result = engine.executeMove(gameState, { type: 'buy', card: 'Estate' });
    if (result.success) {
      gameState = result.gameState;
      console.log('✓ Bought Estate');
      console.log('Remaining coins:', gameState.players[0].coins);
      console.log('Remaining buys:', gameState.players[0].buys);
    }
  }
  
  // End buy phase
  result = engine.executeMove(gameState, { type: 'end_phase' });
  if (result.success) {
    gameState = result.gameState;
    console.log('✓ Ended turn, moved to cleanup');
    console.log('Final phase:', gameState.phase);
    console.log('Current player:', gameState.currentPlayer);
    console.log('Turn number:', gameState.turnNumber);
  }
}

console.log('\\n=== GAME ENGINE IS WORKING! ===');
"
```

---

## Testing Strategy

### Core Game Engine
- **Coverage Target**: 95%+
- **Focus**: All game state transitions, move validation, error handling
- **Test File**: `packages/core/tests/game.test.ts`

### Card Effects
- **Coverage Target**: 100%
- **Focus**: Each card's unique effects, edge cases
- **Test File**: `packages/core/tests/cards.test.ts`

### CLI Interface
- **Coverage Target**: 90%+
- **Focus**: User input parsing, display formatting, command handling
- **Test Files**: `packages/cli/tests/*.test.ts`

### Performance Tests
- **Coverage Target**: All critical paths
- **Focus**: Move execution, shuffle, initialization
- **Test File**: `packages/core/tests/performance.test.ts`

### Integration Tests
- **Coverage Target**: End-to-end scenarios
- **Focus**: Multi-turn games, multiplayer, edge cases
- **Test File**: `packages/cli/tests/integration.test.ts`

---

## Test Coverage

### Generate Coverage Report

```bash
npm run test:coverage
```

This generates:
- Terminal summary
- HTML report in `coverage/` directory
- LCOV file for CI/CD integration

### View Coverage Report

```bash
# macOS
open coverage/lcov-report/index.html

# Linux
xdg-open coverage/lcov-report/index.html

# Windows
start coverage/lcov-report/index.html
```

---

## Common Workflows

### Adding a New Feature

1. **Write tests first** (TDD approach)
   ```bash
   # Create test file
   touch packages/core/tests/new-feature.test.ts
   
   # Run tests (they'll fail)
   npm test
   ```

2. **Implement feature**
   ```bash
   # Edit source code
   code packages/core/src/game.ts
   
   # Run tests until they pass
   npm test -- --watch
   ```

3. **Check coverage**
   ```bash
   npm run test:coverage
   ```

4. **Lint and build**
   ```bash
   npm run lint
   npm run build
   ```

### Debugging Tests

```bash
# Run single test file with verbose output
npm test -- tests/game.test.ts --verbose

# Run specific test by name
npm test -- -t "should initialize game"

# Enable Node debugger
node --inspect-brk node_modules/.bin/jest tests/game.test.ts
```

### Performance Testing

```bash
# Run performance tests only
npm test -- tests/performance.test.ts

# Run with timing output
npm test -- tests/performance.test.ts --verbose
```

---

## Project Structure

### Monorepo Organization

```
principality-ai/
├── packages/
│   ├── api-server/        # HTTP/WebSocket API server
│   │   ├── src/
│   │   │   ├── server.ts  # Hono app setup
│   │   │   ├── routes/    # REST endpoints
│   │   │   ├── services/  # AI, WebSocket, game logic
│   │   │   └── types/     # API and AI types
│   │   └── src/__tests__/ # Jest tests (roots to src/)
│   ├── cli/               # CLI interface
│   │   ├── src/
│   │   │   ├── cli.ts     # Game loop
│   │   │   ├── display.ts # Output formatting
│   │   │   └── parser.ts  # Input parsing
│   │   └── tests/
│   ├── core/              # Game engine
│   │   ├── src/
│   │   │   ├── game.ts    # Main engine
│   │   │   ├── cards.ts   # Card definitions
│   │   │   └── types.ts   # TypeScript types
│   │   └── tests/
│   ├── mcp-server/        # MCP integration
│   └── web/               # Web UI (React + Vite)
├── docs/                  # Documentation
│   ├── reference/         # API, performance guides
│   ├── requirements/      # Feature specifications
│   └── archive/           # Historical docs
└── .claude/               # Agent config, skills, hooks
```

### Package Dependencies

```
core            # No dependencies (standalone)
  ├── cli       # Depends on core
  ├── mcp-server# Depends on core
  ├── api-server# Depends on core
  └── web       # Depends on api-server (via HTTP/WS)
```

---

## Development Areas

### Core Engine (`packages/core/`)
- **Focus**: Game state, card effects, move validation
- **Testing**: Unit tests for all card mechanics
- **Commands**: `npm run play` for interactive testing

### CLI Interface (`packages/cli/`)
- **Focus**: Command-line UX and display
- **Testing**: Integration tests, turn-based mode
- **Commands**: Test with `--stable-numbers`, `--manual-cleanup`, etc.

### MCP Server (`packages/mcp-server/`)
- **Focus**: Model Context Protocol integration
- **Testing**: MCP tool tests, LLM gameplay
- **Commands**: Restart Claude Code after changes

### API Server (`packages/api-server/`)
- **Focus**: REST API, WebSocket server, AI player, turn coordination
- **Testing**: Jest (roots to `src/`, tests in `src/__tests__/`)
- **Commands**: `npm run dev --workspace=packages/api-server`

### Web UI (`packages/web/`)
- **Focus**: Browser-based interface
- **Testing**: Component tests, E2E with Playwright
- **Commands**: `npm run dev` in packages/web/

---

## Troubleshooting

### Build Failures

```bash
# Clean build artifacts
rm -rf packages/*/dist
rm -rf node_modules
npm install
npm run build
```

### Test Failures

```bash
# Clear Jest cache
npm test -- --clearCache

# Update snapshots (if applicable)
npm test -- -u
```

### Type Errors

```bash
# Check TypeScript compilation without running tests
npx tsc --noEmit

# Check specific file
npx tsc --noEmit packages/core/src/game.ts
```

---

## AI Gameplay with MCP (Phase 2.1)

### Batch Treasure Commands for Speed

Use `play_treasure all` to dramatically accelerate game play:

```bash
# Instead of playing 5 treasures individually (30-40 seconds):
play_treasure Copper
play_treasure Copper
play_treasure Silver
play_treasure Silver
play_treasure Gold

# Use batch command (3-5 seconds):
play_treasure all
```

**Performance**: 8-10x faster Buy phase execution.

### Auto-Returned Game State

Every `game_execute` response now includes:
- `gameState`: Current state with phase, hand, coins, actions, buys
- `validMoves`: Array of available move commands
- `gameOver`: Boolean flag

**No need to call `game_observe` between moves.**

Efficient turn flow:
```
1. game_observe (initial state)
2. play_treasure all (auto-returns state + validMoves)
3. buy Province (auto-returns state + validMoves)
4. end (auto-returns state for next turn)
```

### Testing AI Gameplay

Run AI game session:

```bash
# Play a full game with Haiku
npm run play --seed test-seed-123

# Monitor logs
tail -f dominion-game-session.log

# Check game-end detection (R2.0-NEW feature)
# Game should end correctly when Province pile empties or 3 piles empty
```

Expected output:
- Game duration: 2-3 minutes (vs 5 min baseline)
- No redundant move attempts
- Clean game-over detection with reason

### Skills for AI Guidance

Two Claude Code skills guide AI gameplay:

1. **dominion-mechanics** - Game rules and command syntax
   - Batch commands: `play_treasure all`
   - Efficient turn flow patterns
   - Phase transitions

2. **dominion-strategy** - Deck-building and decision-making
   - Big Money strategy baseline
   - Action card purchasing strategy
   - Efficiency tips for batch commands

Invoke skills during gameplay:
```
AI agent receives error → checks dominion-mechanics skill
AI agent needs strategy advice → checks dominion-strategy skill
```

### Performance Targets (R2.1-ACC)

| Metric | Baseline | Target | Status |
|--------|----------|--------|--------|
| Buy phase (5 treasures) | 30-40s | <2s | ✅ Batch command |
| Full game duration | 5 min | ≤3 min | ✅ Auto-return state |
| Redundant moves | 20+ | 0 | ✅ State awareness |
| API calls per game | 40-50 | ≤25 | ✅ Auto-return |

### Troubleshooting AI Gameplay

**AI plays treasures individually instead of using batch command**:
- Check: Is `play_treasure all` in valid moves?
- Fix: Update dominion-mechanics skill with clear batch command documentation
- Verify: Test with small game to confirm batch command parsing works

**AI makes redundant move attempts**:
- Check: Is game-execute returning auto-state correctly?
- Fix: Verify gameState and validMoves fields in response
- Debug: Add logging to track state changes between moves

**Game duration is still slow (>3 minutes)**:
- Check: Is AI using `play_treasure all` or playing treasures individually?
- Check: Is AI calling game_observe between moves (unnecessary)?
- Measure: Count API calls in session log - should be ≤25 total

---

## See Also

- [API.md](./API.md) - Detailed API reference including game_execute tool
- [PERFORMANCE.md](./PERFORMANCE.md) - Performance benchmarks
- [Requirements](../requirements/) - Feature specifications
- [CLAUDE.md](../../CLAUDE.md) - Project overview
