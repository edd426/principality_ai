# Principality AI - Technical Specification

## Technology Stack

### Core Technologies
- **Language**: TypeScript throughout (Node.js runtime)
- **Package Manager**: npm with workspaces
- **Testing**: Jest for unit tests, Playwright for E2E (Phase 4+)
- **Build Tool**: Vite or esbuild for fast builds
- **Linting**: ESLint + Prettier

### Cloud Infrastructure (Azure)
- **Phase 1-2**: Azure Static Web Apps (free tier)
- **Phase 2**: Azure Functions (Consumption plan for MCP)
- **Phase 3**: Azure SignalR Service (Free tier: 20 connections)
- **Storage**: JSON/YAML files in repo + session storage (no database)

## Architecture Overview

### Repository Structure
```
principality-ai/
├── packages/
│   ├── core/              # Game engine (Phase 1)
│   │   ├── src/
│   │   │   ├── game.ts
│   │   │   ├── cards.ts
│   │   │   └── types.ts
│   │   └── tests/
│   ├── cli/               # CLI interface (Phase 1)
│   ├── mcp-server/        # MCP integration (Phase 2)
│   ├── ai-simple/         # Rule-based AI (Phase 3)
│   └── web/               # Web UI (Phase 4)
├── data/
│   └── cards.yaml         # Card definitions
├── .github/
│   └── workflows/
│       └── main.yml       # Single workflow file
└── azure/
    └── functions/         # Azure Function configs
```

### Phase-by-Phase Architecture

## Phase 1: CLI Game Engine

### Core Components

**Game Engine (`packages/core`)**
```typescript
// Immutable state pattern
interface GameState {
  readonly players: ReadonlyArray<PlayerState>
  readonly supply: ReadonlyMap<CardName, number>
  readonly currentPlayer: number
  readonly phase: 'action' | 'buy' | 'cleanup'
  readonly turnNumber: number
  readonly seed: string
}

// Command pattern for moves
interface Move {
  type: 'play_action' | 'play_treasure' | 'buy' | 'end_phase'
  card?: CardName
  additionalData?: any  // For Cellar discards, etc.
}

class GameEngine {
  constructor(seed: string)
  executeMove(state: GameState, move: Move): GameState | Error
  getValidMoves(state: GameState): Move[]
  isGameOver(state: GameState): boolean
}
```

**CLI Interface (`packages/cli`)**
```typescript
// Simple REPL for testing
npm run play -- --seed=12345

> hand: [Copper, Copper, Silver, Village, Estate]
> actions: 1, buys: 1, coins: 0
> play Village
> hand: [Copper, Copper, Silver, Estate, Smithy]
> actions: 2
> play Smithy
> hand: [Copper, Copper, Silver, Estate, Gold, Market, Copper]
```

### Data Storage
- **Card Definitions**: `data/cards.yaml`
```yaml
village:
  name: "Village"
  cost: 3
  type: "action"
  effects:
    cards: 1
    actions: 2
  description: "+1 Card, +2 Actions"
```

## Phase 2: MCP Integration

### Why Azure Functions for MCP?

**Perfect Fit for LLM Gaming:**
- **Latency Tolerance**: LLM turns naturally take 2-5 seconds (thinking time)
- **Cold Start Mitigation**: Keep-warm strategies for active games
- **Cost Efficiency**: Pay only for actual AI computation time
- **Scaling**: Auto-scales if multiple AI games run simultaneously

**MCP Server Implementation**
```typescript
// Azure Function endpoint
export async function mcpHandler(context, req) {
  const { tool, params } = req.body
  
  switch(tool) {
    case 'get_game_state':
      return getCurrentGameState(params.gameId)
    case 'make_move':
      return executeMove(params.gameId, params.move)
  }
}

// Function configuration for performance
{
  "functionTimeout": "00:02:00",  // 2 min max for complex turns
  "alwaysReady": true              // Premium plan option if needed
}
```

### MCP Protocol Implementation
```typescript
interface MCPTools {
  get_game_state: {
    params: { gameId: string }
    returns: GameState
  }
  make_move: {
    params: { 
      gameId: string
      move: string  // Natural language or structured
    }
    returns: { 
      success: boolean
      newState?: GameState
      error?: string 
    }
  }
}
```

## Phase 3: Multiplayer

### Why Azure SignalR?

**Real-time Communication Needs:**
- **Turn Notifications**: Instant updates when opponent plays
- **Game State Sync**: Live card plays and purchases
- **Connection Management**: Handles reconnections automatically
- **Cost**: Free tier supports 20 concurrent connections (10 games)

**Alternative if Avoiding SignalR:**
- Long polling with Azure Functions (higher latency, simpler)
- Server-Sent Events (one-way communication only)

### State Management: Lock-Step Approach

**Simplest Synchronization Model:**
```typescript
class MultiplayerGame {
  // Both clients must acknowledge each move
  async executeMove(move: Move): Promise<void> {
    // 1. Send move to server
    const validated = await server.validateMove(move)
    
    // 2. Server broadcasts to all players
    await server.broadcast(validated)
    
    // 3. All clients apply move in lock-step
    this.applyMove(validated)
    
    // 4. Wait for all confirmations
    await server.waitForConfirmations()
  }
}
```

**Benefits:**
- Deterministic: All clients see same state
- Simple: No prediction or rollback needed
- Reliable: Can detect desyncs easily

**Trade-off:**
- Latency: Each move waits for slowest client
- Acceptable for turn-based card game

## Phase 4: Web UI

### Frontend Architecture
```typescript
// React or Vue components
components/
├── Game/
│   ├── Board.tsx
│   ├── Hand.tsx
│   ├── Supply.tsx
│   └── PlayArea.tsx
├── Card/
│   ├── Card.tsx
│   └── CardStack.tsx
└── UI/
    ├── ActionLog.tsx
    └── PhaseIndicator.tsx
```

## Development Workflow

### GitHub Actions CI/CD
```yaml
name: Main Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Azure
        run: |
          # Deploy based on changed packages
          if [[ $CHANGED_FILES == *"packages/web"* ]]; then
            az staticwebapp deploy
          fi
          if [[ $CHANGED_FILES == *"packages/mcp-server"* ]]; then
            az functionapp deploy
          fi
```

### Testing Strategy with Claude Code Sub-Agents

**Developer Agent Responsibilities:**
- Write game logic in `packages/*/src/`
- Implement new features
- Fix bugs identified by tester
- Cannot modify test files

**Tester Agent Responsibilities:**
- Write tests in `packages/*/tests/`
- Create test scenarios for edge cases
- Validate game rules implementation
- Cannot modify source files

**Test Coverage Targets:**
- Core game engine: 95%+ coverage
- Card effects: 100% coverage
- MCP interface: Integration tests
- CLI: Smoke tests only
- Web UI (Phase 4): E2E critical paths

### Session Storage Strategy

**No Database Required:**
```typescript
// In-memory game storage for active sessions
class GameSessionManager {
  private sessions = new Map<string, GameState>()
  
  createGame(seed: string): string {
    const id = generateId()
    this.sessions.set(id, initializeGame(seed))
    return id
  }
  
  // Auto-cleanup after 1 hour of inactivity
  scheduleCleanup(id: string) {
    setTimeout(() => this.sessions.delete(id), 3600000)
  }
}
```

**Benefits:**
- Zero database costs
- Fast access (memory)
- Simple implementation
- Appropriate for development/testing phases

## Performance Requirements

### Target Metrics
- **Move Execution**: < 10ms
- **Shuffle Operation**: < 50ms  
- **MCP Response**: < 2 seconds (including LLM thinking)
- **Multiplayer Sync**: < 200ms per move
- **Session Memory**: < 1MB per game

### Optimization Strategies
- Immutable state with structural sharing
- Lazy evaluation for valid moves
- Card effects as pure functions
- Minimal network payloads (send moves, not states)

## Security Considerations

### Phase 2-3 Concerns
- **MCP Endpoints**: API key validation
- **Move Validation**: Server-side only
- **Session Isolation**: Unique IDs, no cross-contamination
- **Rate Limiting**: Azure Functions built-in throttling

## Cost Analysis

### Estimated Monthly Costs
- **Phase 1**: $0 (local development)
- **Phase 2**: ~$5 (Functions consumption plan)
- **Phase 3**: ~$10 (SignalR free tier + Functions)
- **Phase 4**: ~$10 (Static Web Apps + above)

### Cost Optimization
- Use Azure free tiers where possible
- Implement caching for static content
- Session cleanup to minimize memory
- Consider CDN for Phase 4 assets

## Monitoring & Logging

### Application Insights (Free Tier)
```typescript
// Structured logging
logger.info('Move executed', {
  gameId,
  player,
  move,
  turnNumber,
  duration: Date.now() - start
})
```

### Key Metrics to Track
- Move execution times
- MCP completion rates
- Error frequencies
- Session durations
- Memory usage patterns