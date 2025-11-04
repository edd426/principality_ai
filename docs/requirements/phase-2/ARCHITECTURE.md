# Phase 2 Architecture: MCP Server Design

**Status**: REVISED
**Created**: 2025-10-21
**Revised**: 2025-10-22 (3-tool architecture, consolidated from 7 tools)
**Phase**: 2

---

## Architecture Overview

Phase 2 introduces an MCP (Model Context Protocol) server that exposes the Principality AI game engine as structured tools for LLM (Claude) consumption. The architecture follows a clean separation between game logic (core package) and LLM interface (mcp-server package).

**Key Design Principles**:
1. **Separation of Concerns**: Game engine remains pure, MCP server is thin adapter layer
2. **Stateless Tools**: Each tool invocation is independent (state managed by game engine)
3. **Type Safety**: Full TypeScript types for requests/responses
4. **Testability**: Tools can be unit tested with mocked engine
5. **Performance**: Tool responses < 100ms, support concurrent requests

---

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude (LLM)                            │
│            Anthropic API / Claude Desktop App                │
└────────────────────┬────────────────────────────────────────┘
                     │ MCP Protocol (JSON-RPC over stdio)
                     │
┌────────────────────▼────────────────────────────────────────┐
│                 MCP Server Package                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Server (MCPGameServer)                               │   │
│  │  - Tool Registration                                 │   │
│  │  - Request Routing                                   │   │
│  │  - Error Handling                                    │   │
│  └────────────┬─────────────────────────────────────────┘   │
│               │                                              │
│  ┌────────────▼──────────────────────────────────────┐      │
│  │ Tools Layer (3 Core Tools)                         │      │
│  │  - game_observe (state + moves together)          │      │
│  │  - game_execute (atomic validation + execution)   │      │
│  │  - game_session (lifecycle management)            │      │
│  └────────────┬───────────────────────────────────────┘      │
└───────────────┼──────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────┐
│              Core Package (Game Engine)                       │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ GameEngine                                           │    │
│  │  - initializeGame(players, seed)                     │    │
│  │  - getCurrentState() → GameState                     │    │
│  │  - executeMove(state, move) → MoveResult            │    │
│  │  - getValidMoves(state) → Move[]                    │    │
│  │  - validateMove(state, move) → ValidationResult     │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Game State (Immutable)                               │    │
│  │  - players: Player[]                                 │    │
│  │  - supply: Map<string, SupplyPile>                   │    │
│  │  - phase: 'action' | 'buy' | 'cleanup'               │    │
│  │  - turnNumber, activePlayer, gameOver, winner        │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

---

## Package Structure

### MCP Server Package (`packages/mcp-server/`)

```
packages/mcp-server/
├── src/
│   ├── index.ts                # Entry point: starts server
│   ├── server.ts               # MCPGameServer class
│   ├── config.ts               # Configuration management
│   ├── logger.ts               # Structured logging utility
│   │
│   ├── tools/                  # Tool implementations
│   │   ├── state.ts            # Feature 2: StateQueryTools
│   │   ├── validation.ts       # Feature 3: ValidationTools
│   │   ├── execution.ts        # Feature 4: ExecutionTools
│   │   └── reasoning.ts        # Feature 5: ReasoningTools
│   │
│   ├── schemas/                # MCP tool schemas (JSON Schema)
│   │   ├── state-tools.json    # get_game_state, get_hand, etc.
│   │   ├── validation-tools.json
│   │   ├── execution-tools.json
│   │   └── reasoning-tools.json
│   │
│   └── types/                  # TypeScript types
│       ├── mcp.ts              # MCP protocol types
│       ├── tools.ts            # Tool request/response types
│       └── game.ts             # Game-specific types (re-export from core)
│
├── tests/                      # Tests (see TESTING.md)
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── package.json
├── tsconfig.json
└── README.md
```

### Configuration (`config.ts`)

```typescript
export interface MCPServerConfig {
  // Server settings
  name: string;                  // 'principality-mcp-server'
  version: string;               // '2.0.0'

  // Game engine settings
  defaultSeed?: string;          // For reproducible games
  defaultPlayerCount: number;    // 1 for Phase 2

  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logFormat: 'json' | 'text';
  logFile?: string;              // Optional file logging

  // Performance
  maxConcurrentRequests: number; // Limit concurrent tool calls
  requestTimeout: number;        // Max time per tool call (ms)

  // Research/debugging
  saveDecisions: boolean;        // Save reasoning logs to file
  decisionLogPath?: string;      // Where to save decision logs
}
```

---

## MCP Protocol Integration

### Tool Registration

Each tool is registered with MCP server using JSON Schema:

```typescript
// Example: get_game_state tool schema
{
  "name": "get_game_state",
  "description": "Get current game state including phase, turn number, active player, and game-over status",
  "inputSchema": {
    "type": "object",
    "properties": {},
    "required": []
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "success": { "type": "boolean" },
      "state": {
        "type": "object",
        "properties": {
          "phase": { "type": "string", "enum": ["action", "buy", "cleanup"] },
          "turnNumber": { "type": "integer" },
          "activePlayer": { "type": "integer" },
          "playerCount": { "type": "integer" },
          "gameOver": { "type": "boolean" },
          "winner": { "type": "integer" }
        },
        "required": ["phase", "turnNumber", "activePlayer", "playerCount", "gameOver"]
      }
    },
    "required": ["success", "state"]
  }
}
```

### Request/Response Flow

```typescript
// 1. Claude sends MCP request
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_game_state",
    "arguments": {}
  }
}

// 2. MCP Server routes to tool handler
async handleRequest(request: MCPRequest): Promise<MCPResponse> {
  const { name, arguments } = request.params;

  switch (name) {
    case 'get_game_state':
      return await this.stateTools.getGameState();
    // ... other tools
  }
}

// 3. Tool executes and returns result
async getGameState(): Promise<StateResponse> {
  const state = this.gameEngine.getCurrentState();
  return {
    success: true,
    state: {
      phase: state.phase,
      turnNumber: state.turnNumber,
      // ... rest of state
    }
  };
}

// 4. MCP Server returns response
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\":true,\"state\":{\"phase\":\"action\",\"turnNumber\":1,...}}"
      }
    ]
  }
}
```

---

## Tool Implementations

### Feature 2: State Query Tools

```typescript
export class StateQueryTools {
  constructor(private gameEngine: GameEngine) {}

  async getGameState(): Promise<StateResponse> {
    const state = this.gameEngine.getCurrentState();
    return {
      success: true,
      state: {
        phase: state.phase,
        turnNumber: state.turnNumber,
        activePlayer: state.activePlayer,
        playerCount: state.players.length,
        gameOver: state.gameOver,
        winner: state.winner
      }
    };
  }

  async getHand(playerId?: number): Promise<HandResponse> {
    const state = this.gameEngine.getCurrentState();
    const targetPlayer = playerId ?? state.activePlayer;
    const player = state.players[targetPlayer];

    if (!player) {
      return {
        success: false,
        error: `Invalid player ID: ${playerId}`
      };
    }

    // Group duplicate cards
    const handMap = new Map<string, CardInfo>();
    player.hand.forEach(card => {
      const existing = handMap.get(card.name);
      if (existing) {
        existing.count++;
      } else {
        handMap.set(card.name, {
          name: card.name,
          type: card.type,
          cost: card.cost,
          count: 1
        });
      }
    });

    return {
      success: true,
      hand: Array.from(handMap.values())
    };
  }

  async getSupply(): Promise<SupplyResponse> {
    const state = this.gameEngine.getCurrentState();

    const supply = Array.from(state.supply.entries()).map(([name, pile]) => ({
      name,
      type: pile.type,
      cost: pile.cost,
      remaining: pile.remaining,
      description: pile.description
    }));

    // Sort by type, then cost, then name
    supply.sort((a, b) => {
      const typeOrder = { action: 0, treasure: 1, victory: 2, curse: 3 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      if (a.cost !== b.cost) {
        return a.cost - b.cost;
      }
      return a.name.localeCompare(b.name);
    });

    return {
      success: true,
      supply
    };
  }

  async getPlayerStats(playerId?: number): Promise<PlayerStatsResponse> {
    const state = this.gameEngine.getCurrentState();
    const targetPlayer = playerId ?? state.activePlayer;
    const player = state.players[targetPlayer];

    if (!player) {
      return {
        success: false,
        error: `Invalid player ID: ${playerId}`
      };
    }

    return {
      success: true,
      stats: {
        handCount: player.hand.length,
        deckCount: player.deck.length,
        discardCount: player.discard.length,
        victoryPoints: this.calculateVictoryPoints(player),
        currentCoins: state.phase === 'buy' ? state.currentCoins : 0,
        currentActions: state.phase === 'action' ? state.currentActions : 0,
        currentBuys: state.currentBuys
      }
    };
  }

  private calculateVictoryPoints(player: Player): number {
    let vp = 0;
    const allCards = [...player.hand, ...player.deck, ...player.discard];
    allCards.forEach(card => {
      if (card.type === 'victory') {
        vp += card.victoryPoints || 0;
      }
    });
    return vp;
  }
}
```

### Feature 3: Move Validation Tools

```typescript
export class ValidationTools {
  private moveHistory: MoveHistoryEntry[] = [];

  constructor(private gameEngine: GameEngine) {}

  async getValidMoves(phase?: string): Promise<ValidMovesResponse> {
    const state = this.gameEngine.getCurrentState();
    const targetPhase = phase || state.phase;

    const validMoves = this.gameEngine.getValidMoves(state, targetPhase);

    return {
      success: true,
      moves: validMoves.map(move => ({
        type: move.type,
        cardName: move.cardName,
        cardIndex: move.cardIndex,
        description: this.formatMoveDescription(move)
      }))
    };
  }

  async validateMove(move: Move): Promise<ValidationResponse> {
    const state = this.gameEngine.getCurrentState();
    const result = this.gameEngine.validateMove(state, move);

    if (result.valid) {
      return {
        success: true,
        valid: true,
        message: 'Move is legal'
      };
    } else {
      return {
        success: true,
        valid: false,
        error: result.error,
        suggestion: this.generateSuggestion(result.error)
      };
    }
  }

  async getMoveHistory(lastN?: number): Promise<MoveHistoryResponse> {
    const history = lastN
      ? this.moveHistory.slice(-lastN)
      : this.moveHistory;

    return {
      success: true,
      history
    };
  }

  addMoveToHistory(entry: MoveHistoryEntry): void {
    this.moveHistory.push({
      ...entry,
      timestamp: new Date().toISOString()
    });
  }

  private formatMoveDescription(move: Move): string {
    switch (move.type) {
      case 'play':
        return `Play ${move.cardName} (index ${move.cardIndex})`;
      case 'buy':
        return `Buy ${move.cardName} (cost ${move.cost})`;
      case 'end_phase':
        return 'End current phase';
      default:
        return 'Unknown move';
    }
  }

  private generateSuggestion(error: string): string {
    if (error.includes('Insufficient coins')) {
      return 'Use get_supply to see cards you can afford';
    }
    if (error.includes('not available in supply')) {
      return 'Check get_supply for available cards';
    }
    if (error.includes('No actions remaining')) {
      return 'Use end_phase to move to buy phase';
    }
    return 'Use get_valid_moves to see all legal moves';
  }
}
```

### Feature 4: Execution Tools

```typescript
export class ExecutionTools {
  private currentGame?: GameInstance;
  private gameHistory: GameHistory[] = [];

  constructor(
    private gameEngine: GameEngine,
    private validationTools: ValidationTools
  ) {}

  async executeMove(move: Move): Promise<ExecutionResponse> {
    if (!this.currentGame) {
      return {
        success: false,
        error: 'No active game. Call start_game first.'
      };
    }

    // Validate first
    const validation = await this.validationTools.validateMove(move);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Execute
    const result = this.gameEngine.executeMove(this.currentGame.state, move);

    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    // Update state and log
    this.currentGame.state = result.gameState;
    this.validationTools.addMoveToHistory({
      move,
      turnNumber: result.gameState.turnNumber,
      playerId: result.gameState.activePlayer,
      result: 'success'
    });

    return {
      success: true,
      state: result.gameState,
      effects: this.calculateEffects(move, result.gameState)
    };
  }

  async startGame(seed?: string, playerCount: number = 1): Promise<StartGameResponse> {
    const gameId = `game-${Date.now()}`;
    const state = this.gameEngine.initializeGame(playerCount, seed);

    this.currentGame = {
      id: gameId,
      state,
      startTime: new Date().toISOString()
    };

    return {
      success: true,
      gameId,
      state
    };
  }

  async endGame(): Promise<EndGameResponse> {
    if (!this.currentGame) {
      return {
        success: false,
        error: 'No active game'
      };
    }

    const finalState = this.currentGame.state;
    this.gameHistory.push({
      ...this.currentGame,
      endTime: new Date().toISOString()
    });

    this.currentGame = undefined;

    return {
      success: true,
      finalState,
      winner: finalState.winner
    };
  }

  async resetGame(keepHistory: boolean = true): Promise<ResetGameResponse> {
    if (this.currentGame && !keepHistory) {
      this.gameHistory = [];
    }

    const gameId = `game-${Date.now()}`;
    const state = this.gameEngine.initializeGame(1);

    this.currentGame = {
      id: gameId,
      state,
      startTime: new Date().toISOString()
    };

    return {
      success: true,
      state
    };
  }

  private calculateEffects(move: Move, newState: GameState): MoveEffects {
    // Compare state before/after to determine effects
    // For Phase 2, simple effect extraction
    return {};
  }
}
```

### Feature 5: Reasoning Tools

```typescript
export class ReasoningTools {
  private decisions: Decision[] = [];
  private logFile?: string;

  constructor(logFile?: string) {
    this.logFile = logFile;
  }

  async explainDecision(params: ExplainDecisionParams): Promise<ExplainResponse> {
    const decisionId = `decision-${Date.now()}-${Math.random()}`;

    const decision: Decision = {
      id: decisionId,
      move: params.move,
      reasoning: params.reasoning,
      confidence: params.confidence || 'medium',
      alternatives: params.alternatives || [],
      timestamp: new Date().toISOString()
    };

    this.decisions.push(decision);

    // Log to file for research
    if (this.logFile) {
      await this.logToFile(decision);
    }

    return {
      success: true,
      logged: true,
      decisionId
    };
  }

  async getDecisionHistory(lastN?: number, includeReasoning: boolean = true): Promise<DecisionHistoryResponse> {
    const decisions = lastN
      ? this.decisions.slice(-lastN)
      : this.decisions;

    return {
      success: true,
      decisions: decisions.map(d => ({
        ...d,
        reasoning: includeReasoning ? d.reasoning : undefined
      }))
    };
  }

  generateAnalytics(): DecisionAnalytics {
    return {
      totalDecisions: this.decisions.length,
      averageReasoningLength: this.avgLength(this.decisions.map(d => d.reasoning)),
      confidenceDistribution: this.calcConfidenceDistribution(),
      alternativesConsidered: this.decisions.filter(d => d.alternatives.length > 0).length
    };
  }

  private async logToFile(decision: Decision): Promise<void> {
    if (!this.logFile) return;

    const logEntry = {
      timestamp: decision.timestamp,
      decisionId: decision.id,
      move: decision.move,
      reasoning: decision.reasoning,
      confidence: decision.confidence
    };

    // Append to JSONL file
    await fs.appendFile(this.logFile, JSON.stringify(logEntry) + '\n');
  }

  private avgLength(strings: string[]): number {
    if (strings.length === 0) return 0;
    return strings.reduce((sum, s) => sum + s.length, 0) / strings.length;
  }

  private calcConfidenceDistribution(): { low: number; medium: number; high: number } {
    const dist = { low: 0, medium: 0, high: 0 };
    this.decisions.forEach(d => {
      dist[d.confidence]++;
    });
    return dist;
  }
}
```

---

## Error Handling Strategy

### Error Types

```typescript
export enum MCPErrorCode {
  TOOL_NOT_FOUND = 'TOOL_NOT_FOUND',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  EXECUTION_ERROR = 'EXECUTION_ERROR',
  GAME_NOT_INITIALIZED = 'GAME_NOT_INITIALIZED',
  INVALID_MOVE = 'INVALID_MOVE',
  TIMEOUT = 'TIMEOUT'
}

export interface MCPError {
  code: MCPErrorCode;
  message: string;
  details?: any;
}
```

### Error Response Format

```typescript
{
  "success": false,
  "error": {
    "code": "INVALID_MOVE",
    "message": "Cannot buy Province: insufficient coins (need 8, have 5)",
    "details": {
      "requiredCoins": 8,
      "availableCoins": 5,
      "cardName": "Province"
    }
  }
}
```

### Error Handling Flow

```typescript
async handleRequest(request: MCPRequest): Promise<MCPResponse> {
  try {
    // Validate request
    if (!request.params.name) {
      throw new MCPError(MCPErrorCode.INVALID_PARAMETERS, 'Tool name required');
    }

    // Route to tool
    const result = await this.routeToTool(request.params.name, request.params.arguments);

    return {
      success: true,
      result
    };

  } catch (error) {
    if (error instanceof MCPError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      };
    } else {
      // Unexpected error
      logger.error('Unexpected error', error);
      return {
        success: false,
        error: {
          code: MCPErrorCode.EXECUTION_ERROR,
          message: 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      };
    }
  }
}
```

---

## Performance Optimizations

### Caching Strategy

```typescript
class CachedGameEngine {
  private cache = new Map<string, any>();

  async getSupply(): Promise<SupplyResponse> {
    const cacheKey = `supply-${this.gameEngine.getCurrentState().turnNumber}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = await this.computeSupply();
    this.cache.set(cacheKey, result);
    return result;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
```

### Concurrency Control

```typescript
class RequestQueue {
  private queue: Promise<any>[] = [];
  private maxConcurrent = 10;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Wait for slot if queue full
    while (this.queue.length >= this.maxConcurrent) {
      await Promise.race(this.queue);
    }

    const promise = fn();
    this.queue.push(promise);

    promise.finally(() => {
      this.queue = this.queue.filter(p => p !== promise);
    });

    return promise;
  }
}
```

---

## Deployment (Local Development Only for Phase 2)

### Development Setup

```bash
# Install dependencies
cd packages/mcp-server
npm install

# Build
npm run build

# Run server
npm start

# Run with debug logging
DEBUG=* npm start
```

### Claude Desktop Configuration

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "principality": {
      "command": "node",
      "args": ["/path/to/principality_ai/packages/mcp-server/dist/index.js"]
    }
  }
}
```

### Environment Variables

```bash
# .env file
NODE_ENV=development
LOG_LEVEL=debug
LOG_FILE=./logs/mcp-server.log
SAVE_DECISIONS=true
DECISION_LOG_PATH=./logs/decisions.jsonl
DEFAULT_SEED=test-seed
```

---

## Future Architecture (Phase 3+)

### Phase 3: Cloud Deployment (Azure Functions)

```
┌─────────────────────────────────────────────────┐
│              Web Clients / Claude                │
└────────────────────┬────────────────────────────┘
                     │ HTTPS / WebSocket
                     │
┌────────────────────▼────────────────────────────┐
│       Azure Static Web Apps + Functions         │
│  ┌──────────────────────────────────────────┐   │
│  │ API Gateway (Azure Functions)           │   │
│  │  - /api/state                           │   │
│  │  - /api/validate                        │   │
│  │  - /api/execute                         │   │
│  └────────────┬─────────────────────────────┘   │
│               │                                  │
│  ┌────────────▼─────────────────────────────┐   │
│  │ Game Engine Service (Stateful)          │   │
│  │  - Redis for state persistence          │   │
│  │  - SignalR for real-time updates        │   │
│  └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

### Phase 4: Web UI Integration

- Convert MCP tools to REST API endpoints
- Add WebSocket for real-time game updates
- Shared game state via Redis
- Spectator mode for watching LLM play

---

## Conclusion

Phase 2 architecture provides a clean, testable MCP server that exposes game engine capabilities to Claude while maintaining separation of concerns. The design supports local development for Phase 2 and sets the foundation for cloud deployment in Phase 3.

**Key Architectural Decisions**:
1. ✅ MCP server is thin adapter (game logic stays in core package)
2. ✅ Immutable state pattern preserved
3. ✅ Tools are stateless (state managed by GameEngine)
4. ✅ Full TypeScript type safety
5. ✅ Performance optimized (< 100ms responses)
6. ✅ Extensible for future cloud deployment

---

**Document Status**: DRAFT
**Created**: 2025-10-21
**Author**: requirements-architect
**Ready for**: Implementation planning
