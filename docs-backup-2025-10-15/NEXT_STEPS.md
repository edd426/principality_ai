# Next Steps for AI Agent

This document outlines the specific tasks for the next AI agent to complete Phase 1 of the Principality AI project.

## 🎯 Primary Goal: Complete Phase 1

**Current Status**: Core engine complete ✅
**Missing**: CLI interface
**Goal**: Make `npm run play` functional for interactive gameplay

## 📋 Immediate Tasks (Priority Order)

### 1. Create CLI Package Structure
```bash
mkdir -p packages/cli/src
cd packages/cli
```

**Files to create:**
- `packages/cli/package.json` - Package configuration
- `packages/cli/src/index.ts` - Main CLI entry point
- `packages/cli/src/cli.ts` - Interactive CLI logic
- `packages/cli/tsconfig.json` - TypeScript config
- `packages/cli/README.md` - CLI documentation

### 2. Implement Basic CLI Structure

**Package.json template:**
```json
{
  "name": "@principality/cli",
  "version": "1.0.0",
  "description": "CLI interface for Principality AI",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc && node dist/index.js"
  },
  "dependencies": {
    "@principality/core": "workspace:*"
  }
}
```

### 3. CLI Features to Implement

#### 3.1 Game Initialization
- Accept seed parameter: `npm run play -- --seed=12345`
- Default to random seed if none provided
- Initialize GameEngine and create new game

#### 3.2 Game State Display
```
=== Turn 1 - Action Phase ===
Hand: Copper, Copper, Copper, Estate, Copper
Actions: 1 | Buys: 1 | Coins: 0

Supply: Village (10), Smithy (10), Laboratory (10)...
```

#### 3.3 Move Input System
- Show available moves: "Available: [1] Play Copper [2] End Phase"
- Accept user input (numbers or text)
- Validate moves against `engine.getValidMoves()`
- Execute moves with error handling

#### 3.4 Game Loop
- Display current state
- Show available moves
- Accept user input
- Execute move
- Update display
- Continue until game end

#### 3.5 Victory Detection
- Detect game over condition
- Calculate and display winner
- Show final scores

### 4. CLI Implementation Approach

#### 4.1 Basic Structure
```typescript
import { GameEngine } from '@principality/core';
import * as readline from 'readline';

class PrincipalityCLI {
  private engine: GameEngine;
  private gameState: GameState;
  private rl: readline.Interface;

  async startGame(seed?: string) {
    // Initialize game
    // Start game loop
  }

  async gameLoop() {
    // Display state
    // Get moves
    // Accept input
    // Execute move
    // Repeat
  }
}
```

#### 4.2 User Interface
- Clear, readable game state display
- Numbered menu for available moves
- Error messages for invalid input
- Progress indicators for long operations

### 5. Update Root Package.json
```json
"scripts": {
  "play": "npm run start --workspace=packages/cli"
}
```

### 6. Testing Strategy

#### 6.1 Manual Testing Scenarios
- Start new game with seed
- Play action cards (Village, Smithy)
- Buy cards with different costs
- Complete full game to victory
- Test invalid moves and error handling
- Test different victory conditions

#### 6.2 Command Testing
```bash
npm run build
npm run play
npm run play -- --seed=12345
```

## 🛠 Development Tips

### Use Existing Core API
```typescript
// Game setup
const engine = new GameEngine(seed);
const gameState = engine.initializeGame(1);

// Get available moves
const validMoves = engine.getValidMoves(gameState);

// Execute moves
const result = engine.executeMove(gameState, move);
if (result.success) {
  gameState = result.gameState;
}
```

### Common Move Types
```typescript
// End current phase
{type: 'end_phase'}

// Play action card
{type: 'play_action', card: 'Village'}

// Buy card
{type: 'buy', card: 'Silver'}

// Play treasure
{type: 'play_treasure', card: 'Copper'}
```

### Error Handling
- Always check `result.success` before updating state
- Display helpful error messages to user
- Validate user input before attempting moves

## 📝 Code Quality Requirements

### Standards to Follow
- TypeScript strict mode
- ESLint compliance (`npm run lint` must pass)
- Clear variable names and comments
- Error handling for all user input
- Proper async/await patterns

### File Organization
```
packages/cli/
├── src/
│   ├── index.ts        # Entry point, argument parsing
│   ├── cli.ts          # Main CLI class
│   ├── display.ts      # Game state display logic
│   └── input.ts        # User input handling
├── package.json
├── tsconfig.json
└── README.md
```

## ✅ Success Criteria

### CLI Implementation Complete When:
1. `npm run play` starts interactive game ✅
2. Can complete full game from start to finish ✅
3. All game phases work (action/buy/cleanup) ✅
4. Clear game state display ✅
5. Proper error handling for invalid moves ✅
6. Game victory detection works ✅
7. Code passes linting (`npm run lint`) ✅
8. No runtime errors or crashes ✅

### Testing Checklist:
- [ ] Start game with default seed
- [ ] Start game with custom seed
- [ ] Play action cards (Village, Smithy, etc.)
- [ ] Buy different cards (Copper, Silver, Estate, etc.)
- [ ] End phases correctly
- [ ] Complete full game to victory
- [ ] Handle invalid moves gracefully
- [ ] Display clear error messages

## 🚀 After CLI Completion

**Phase 1 will be complete!** Next agent can then:
1. Prepare for Phase 2 (MCP server integration)
2. Or enhance CLI with additional features
3. Or start implementing data/cards.yaml structure

## 💡 Optional Enhancements (After Basic CLI Works)

- Save/load game state to file
- Undo last move functionality
- Game history/replay
- Color-coded output
- ASCII art for cards
- Statistics tracking

---

**Start Here**: Create `packages/cli/package.json` and basic TypeScript setup.
**Goal**: Make the game playable via command line interface.
**Foundation**: Solid core engine ready to use - focus on user interface!