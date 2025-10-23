# Phase 2 Features: MCP Server Integration for LLM Optimization

**Status**: COMPLETE (Phase 2.0)
**Created**: 2025-10-21
**Revised**: 2025-10-22
**Completed**: 2025-10-22
**Phase**: 2.0

---

## Phase 2.0 Implementation Summary

**Status**: ✅ COMPLETE

### Features Implemented

**Feature 1: MCP Server Infrastructure** ✅ COMPLETE
- Status: Functional, stdio transport working
- Tool registration: 3 core tools registered (game_observe, game_execute, game_session)
- Error handling: Implemented with actionable error messages
- Logging: Structured logs with timestamps and request tracking

**Feature 2: game_observe Tool** ✅ COMPLETE
- Status: Functional with all detail levels
- Detail levels: minimal, standard, full (all working)
- Token efficiency: Demonstrated and measured
- Edge cases: Handled (no moves, game over, invalid detail levels)

**Feature 3: game_execute + game_session Tools** ✅ COMPLETE
- Status: Fully functional
- Move validation: Working with proper error messages
- Move execution: Atomic validation + execution working correctly
- Game lifecycle: New game, end game commands functional
- Idempotent operations: Working as expected

### Key Bug Fixes

**Critical Bug 1: Stdio Transport Connection** (commit f8b6c98)
- **Before**: Claude couldn't connect to MCP server
- **After**: Proper MCP handshake, Claude connects successfully

**Critical Bug 2: Treasure Move Parsing** (commit 9425ad4)
- **Before**: Treasure moves failed silently
- **After**: All treasure syntax variations parse correctly

### Actual vs Planned

| Aspect | Planned | Actual | Notes |
|--------|---------|--------|-------|
| Features | 3 (MCP server, game_observe, game_execute+game_session) | 3 | On track |
| Tools | 3 (game_observe, game_execute, game_session) | 3 | Consolidated as planned |
| Test Coverage | 95%+ | 95%+ | Maintained from Phase 1.6 |
| Tool Response Time | < 100ms | < 100ms | Performance targets met |
| API Stability | Stable, production-ready | Stable, production-ready | Bug fixes completed |

### Lessons Learned

1. **MCP Protocol Complexity**: Initial stdio transport setup required careful handshake sequencing - document for future phases
2. **Move Parsing Edge Cases**: Different treasure syntax formats caused issues - good test coverage caught this
3. **Foundation Quality**: Bug fixes were critical for usability - MCP server must be rock-solid
4. **Tool Consolidation Success**: 3 tools instead of 7 worked well - reduced complexity without losing functionality

### Status for Phase 2.1

Foundation is solid and ready for enhancement. All core capabilities working:
- ✅ Claude can connect to MCP server
- ✅ Claude can query game state
- ✅ Claude can execute valid moves
- ✅ Claude can manage game lifecycle
- ✅ Autonomous gameplay loops functional

---

## Feature Overview

Phase 2 implements 3 interconnected features that enable **autonomous LLM gameplay with performance optimization** through MCP protocol:

1. **Feature 1**: MCP Server Infrastructure (3-4 hours) - Core server with 3 tool registration
2. **Feature 2**: game_observe Tool (4-5 hours) - Combined state + moves query tool
3. **Feature 3**: game_execute + game_session Tools (5-7 hours) - Execution and lifecycle management

**Key Changes from 7-tool design**:
- **Tool count**: 7 → 3 (57% reduction via aggressive consolidation)
- **game_observe**: Combines game_get_state + game_get_valid_moves (natural LLM workflow)
- **game_session**: Combines game_start + game_reset (idempotent lifecycle)
- **Focus**: Win rate and turn efficiency optimization
- **Test count**: 72 → 40 (44% reduction)

**Total Effort**: 12-16 hours (33% reduction from 7-tool design)

---

## Feature 1: MCP Server Infrastructure

**Estimated Effort**: 3-4 hours (2-3h implementation + 1h testing + 0.5-1h documentation)
**Test Count**: 10 tests (5 unit + 3 integration + 2 E2E)
**Priority**: CRITICAL - Foundation for all other features

### Description

Build the foundational MCP server using TypeScript and `@modelcontextprotocol/sdk`. This server initializes, registers **3 core tools with `game_` namespace prefix**, handles requests, manages errors, and provides logging for debugging. The server uses **stdio transport only** for local development.

**Key Design Decisions**:
- **Stdio transport**: Local development only, no HTTP (Phase 3)
- **3 core tools with `game_` prefix**: game_observe, game_execute, game_session
- **Model selection**: Haiku default (cost), Sonnet override (quality)
- **Session-based state**: In-memory only, no persistence required
- **Idempotent operations**: game_session handles implicit game lifecycle

### Functional Requirements

**FR1.1: Server Initialization**
- Start MCP server using stdio transport (no port needed)
- Load configuration from environment variables or config file
- Initialize game engine instance (singleton for session)
- Register all 3 tools with `game_` namespace prefix
- Log startup success with timestamp, version, and tool list

**FR1.2: Tool Registration (3 Core Tools with `game_` Prefix)**
- Register exactly 3 tools:
  1. `game_observe` (Feature 2 - query state + valid moves together with detail_level)
  2. `game_execute` (Feature 3 - atomic validate + execute with return_detail)
  3. `game_session` (Feature 3 - manage game lifecycle with idempotent operations)
- Each tool has complete JSON schema (name, description, parameters, return type)
- Tool schemas follow MCP protocol specification
- Schemas include examples and token limit guidance
- **Namespace rationale**: `game_` prefix prevents tool confusion in multi-tool environments
- **Consolidation rationale**: Tools paired based on natural LLM usage patterns

**FR1.3: Request Handling**
- Accept MCP tool invocation requests via stdio
- Parse JSON request body (MCP protocol format)
- Validate request structure (tool name, parameters)
- Route to appropriate tool handler
- Return JSON response (success or actionable error)
- Log all requests/responses for debugging with request IDs

**FR1.4: Error Handling**
- Catch and handle all errors gracefully (no server crashes)
- Return **actionable** structured error responses with guidance
- Log errors with stack traces and request context
- Continue serving requests after errors (resilient)

**FR1.5: Logging and Performance Tracking**
- Log levels: DEBUG, INFO, WARN, ERROR
- Structured logs (JSON format for parsing)
- Include timestamps, request IDs, tool names, durations
- Configurable log output (console, file, both)
- Performance metrics per tool (average latency, p95, p99)

### Acceptance Criteria

**AC1.1: Successful Startup**
- Server starts with stdio transport
- Logs "MCP Server v2.0.0 ready (stdio, 3 tools)"
- All 3 `game_*` tools are registered
- No errors logged

**AC1.2: Tool Registration**
- MCP server running receives list of 3 tools (game_observe, game_execute, game_session)
- Each tool has name (with `game_` prefix), description, and parameter schema
- Schemas are valid JSON Schema format
- Schemas include token limit guidance and consolidation rationale

**AC1.3: Tool Invocation**
- MCP server successfully routes "game_observe" tool calls to correct handler
- Returns game state JSON response
- Logs request/response with duration < 100ms

**AC1.4: Error Recovery**
- Tool invocation causes error (e.g., invalid params)
- Server returns structured error response with suggestion
- Logs error with context
- Continues running (accepts next request)

### Technical Approach

**Package Structure**:
```
packages/mcp-server/
├── src/
│   ├── index.ts           # Server entry point
│   ├── server.ts          # MCPGameServer class
│   ├── tools/             # Tool implementations
│   │   ├── observe.ts     # game_observe implementation
│   │   ├── execute.ts     # game_execute implementation
│   │   └── session.ts     # game_session implementation
│   ├── schemas/           # JSON schemas for 3 tools
│   ├── logger.ts          # Logging utility
│   └── config.ts          # Configuration management
├── tests/
│   ├── unit/              # 5 unit tests
│   ├── integration/       # 3 integration tests
│   └── e2e/               # 2 E2E tests
├── package.json
└── tsconfig.json
```

### Dependencies

- **Depends on**: `@modelcontextprotocol/sdk` (npm package)
- **Depends on**: `@principality/core` (game engine, Phase 1.6)
- **Depended on by**: Features 2-3 (all tools run on this server)

### Testing Requirements

See [TESTING.md](./TESTING.md) for detailed test specifications.

**Summary**:
- Unit tests: 5 test cases (initialization, tool registration, error handling)
- Integration tests: 3 test cases (server + game engine)
- E2E tests: 2 test cases (actual MCP protocol communication with Claude)
- Total: 10 tests for Feature 1

---

## Feature 2: game_observe Tool

**Estimated Effort**: 4-5 hours (2-3h implementation + 1h testing + 0.5-1h documentation)
**Test Count**: 15 tests (7 unit + 5 integration + 3 E2E)
**Priority**: HIGH - Core gameplay observation

### Description

Implement the **game_observe** tool that queries current game state **AND** valid moves in a single call, eliminating the need for separate state + moves queries. This consolidation follows Anthropic's best practice: *"Pair tools that LLMs naturally use together."*

**Consolidation Rationale**:
- Real LLM gameplay always queries state THEN valid moves before deciding
- Combining into one tool saves API round-trip (2 calls → 1 call)
- Ensures consistent game context (moves reflect current state snapshot)
- Improves token efficiency by 30%+ via configurable detail levels
- Reduces LLM cognitive load (single tool for observation phase)

### Tool Specification: game_observe

**Purpose**: Query current game state + valid moves together with configurable detail levels

**Parameters**:
```typescript
{
  detail_level: "minimal" | "standard" | "full" // Required, default: "standard"
}
```

**Returns**:
```typescript
{
  success: true,
  detail_level: "minimal" | "standard" | "full",
  state: {
    phase: "action" | "buy" | "cleanup",
    turnNumber: number,
    activePlayer: number,
    playerCount: number,
    // ... additional fields based on detail_level
  },
  validMoves: [
    { type: "play" | "buy" | "end_phase", cardName?: string, cardIndex?: number, ... }
  ],
  moveSummary: { playableCount: number, buyableCount: number, endPhaseAvailable: boolean }
}
```

### Functional Requirements

**FR2.1: Minimal Detail Level**
- Returns: phase, turnNumber, activePlayer, playerCount + valid moves (concise)
- Returns move types and card names (no descriptions)
- Use case: Quick state checks, fast decision-making
- Token cost: ~60 tokens total
- Response time: < 50ms

**Example Minimal Response**:
```json
{
  "success": true,
  "detail_level": "minimal",
  "state": {
    "phase": "action",
    "turnNumber": 5,
    "activePlayer": 0,
    "playerCount": 1
  },
  "validMoves": [
    {"type": "play", "cardName": "Village", "cardIndex": 0},
    {"type": "play", "cardName": "Smithy", "cardIndex": 1},
    {"type": "end_phase"}
  ],
  "moveSummary": {"playableCount": 2, "buyableCount": 0, "endPhaseAvailable": true}
}
```

**FR2.2: Standard Detail Level**
- Returns: Minimal + hand summary (card type counts), actions/buys/coins, move descriptions
- Include move effects preview ("+1 card, +2 actions" for Village)
- Use case: Normal decision-making (most common)
- Token cost: ~250 tokens total
- Response time: < 100ms

**Example Standard Response**:
```json
{
  "success": true,
  "detail_level": "standard",
  "state": {
    "phase": "action",
    "turnNumber": 5,
    "activePlayer": 0,
    "playerCount": 1,
    "hand": {
      "action": 2,
      "treasure": 2,
      "victory": 1,
      "total": 5
    },
    "current": {
      "actions": 1,
      "buys": 1,
      "coins": 0
    }
  },
  "validMoves": [
    {"type": "play", "cardName": "Village", "cardIndex": 0, "effect": "+1 card, +2 actions"},
    {"type": "play", "cardName": "Smithy", "cardIndex": 1, "effect": "+3 cards"},
    {"type": "end_phase", "description": "End action phase, move to buy phase"}
  ],
  "moveSummary": {"playableCount": 2, "buyableCount": 0, "endPhaseAvailable": true}
}
```

**FR2.3: Full Detail Level**
- Returns: Standard + complete hand (all cards with indices), full supply, detailed player stats
- Include supply availability for each card
- Use case: Comprehensive strategic analysis
- Token cost: ~1000 tokens total
- Response time: < 150ms

**Example Full Response**:
```json
{
  "success": true,
  "detail_level": "full",
  "state": {
    "phase": "action",
    "turnNumber": 5,
    "activePlayer": 0,
    "playerCount": 1,
    "hand": [
      {"index": 0, "name": "Village", "type": "action", "cost": 3},
      {"index": 1, "name": "Smithy", "type": "action", "cost": 4},
      {"index": 2, "name": "Copper", "type": "treasure", "cost": 0},
      {"index": 3, "name": "Copper", "type": "treasure", "cost": 0},
      {"index": 4, "name": "Estate", "type": "victory", "cost": 2}
    ],
    "supply": [
      {"name": "Copper", "type": "treasure", "cost": 0, "remaining": 46},
      {"name": "Silver", "type": "treasure", "cost": 3, "remaining": 30},
      {"name": "Gold", "type": "treasure", "cost": 6, "remaining": 30},
      {"name": "Estate", "type": "victory", "cost": 2, "remaining": 8},
      {"name": "Duchy", "type": "victory", "cost": 5, "remaining": 8},
      {"name": "Province", "type": "victory", "cost": 8, "remaining": 8},
      {"name": "Village", "type": "action", "cost": 3, "remaining": 10},
      {"name": "Smithy", "type": "action", "cost": 4, "remaining": 10},
      {"name": "Laboratory", "type": "action", "cost": 5, "remaining": 10},
      {"name": "Festival", "type": "action", "cost": 5, "remaining": 10},
      {"name": "Market", "type": "action", "cost": 5, "remaining": 10},
      {"name": "Woodcutter", "type": "action", "cost": 3, "remaining": 10},
      {"name": "Council Room", "type": "action", "cost": 5, "remaining": 10},
      {"name": "Cellar", "type": "action", "cost": 2, "remaining": 10},
      {"name": "Curse", "type": "curse", "cost": 0, "remaining": 10}
    ],
    "stats": {
      "handCount": 5,
      "deckCount": 8,
      "discardCount": 2,
      "victoryPoints": 3,
      "currentActions": 1,
      "currentBuys": 1,
      "currentCoins": 0
    }
  },
  "validMoves": [
    {"type": "play", "cardName": "Village", "cardIndex": 0, "description": "Play Village", "effect": "+1 card, +2 actions", "cost": 3},
    {"type": "play", "cardName": "Smithy", "cardIndex": 1, "description": "Play Smithy", "effect": "+3 cards", "cost": 4},
    {"type": "end_phase", "description": "End action phase, move to buy phase"}
  ],
  "moveSummary": {"playableCount": 2, "buyableCount": 0, "endPhaseAvailable": true}
}
```

### Acceptance Criteria

**AC2.1: Minimal Detail Returns Expected Fields**
- Response contains phase, turnNumber, activePlayer, playerCount
- Response includes valid moves (concise format)
- Token count < 100
- Response time < 50ms

**AC2.2: Standard Detail Includes Hand Summary**
- Response includes hand: {action: count, treasure: count, victory: count, total: count}
- Response includes current actions/buys/coins
- Response includes move descriptions and effect previews
- Token count < 300
- Response time < 100ms

**AC2.3: Full Detail Includes Everything**
- Response includes complete hand (all cards with indices)
- Response includes full supply (all 15 cards with quantities)
- Response includes player stats (deck/discard counts, VP, etc.)
- Token count < 1500
- Response time < 150ms

**AC2.4: Token Efficiency Demonstrated**
- Minimal response uses ~50% fewer tokens than standard
- Standard response uses ~25% fewer tokens than full
- Users can choose detail level based on decision complexity

### Edge Cases

**EC2.1: No Valid Moves**
- Scenario: Action phase with no actions remaining
- Solution: Return `validMoves: [{type: "end_phase"}]`

**EC2.2: Game Over**
- Scenario: game_observe called after game ends
- Solution: Return state with gameOver: true, validMoves: []

**EC2.3: Invalid Detail Level**
- Scenario: game_observe(detail_level="ultra")
- Solution: Error with list of valid options: "minimal", "standard", "full"

### Dependencies

- **Depends on**: Feature 1 (MCP server infrastructure)
- **Depends on**: `@principality/core` (GameEngine, GameState)
- **Depended on by**: Feature 3 (LLM uses observe to inform execute calls)

### Testing Requirements

See [TESTING.md](./TESTING.md) for detailed test specifications.

**Summary**:
- Unit tests: 7 test cases (detail levels, token limits, edge cases)
- Integration tests: 5 test cases (real GameEngine, state updates)
- E2E tests: 3 test cases (Claude queries via MCP, chooses detail levels)
- Total: 15 tests for Feature 2

---

## Feature 3: game_execute + game_session Tools

**Estimated Effort**: 5-7 hours (3-4h implementation + 1h testing + 0.5-1h documentation)
**Test Count**: 15 tests (8 unit + 5 integration + 2 E2E)
**Priority**: HIGH - Core execution and lifecycle

### Description

Implement 2 tightly coupled tools:

1. **game_execute**: Atomically validate + execute a single move
2. **game_session**: Manage game lifecycle (new game, end game) with idempotent operations

These tools complete the autonomous gameplay loop: observe → decide → execute → manage lifecycle.

### Tool 3.1: game_execute

**Purpose**: Atomically validate and execute a move

**Parameters**:
```typescript
{
  move: string, // e.g., "play 0", "buy Province", "end"
  return_detail?: "minimal" | "full" // Optional, default: "minimal"
}
```

**Returns**:
```typescript
{
  success: true | false,
  phaseChanged?: "action→buy" | "buy→cleanup" | "cleanup→action",
  message?: string,
  state?: GameState, // if return_detail="full"
  error?: {
    code: string,
    message: string,
    suggestion: string
  }
}
```

### Functional Requirements - game_execute

**FR3.1.1: Move Parsing**
- Parse natural move strings: "play 0" → play card at index 0
- Parse: "buy Village", "end", "end action phase"
- Return clear error for unparseable moves
- Response time: < 50ms

**FR3.1.2: Atomic Validation + Execution**
- Validate move legality BEFORE execution
- If valid, execute and return success
- If invalid, return error with actionable guidance (never corrupt state)
- Error format: "Cannot play card 7. Valid indices: 0-4. Try: 'play 3'"

**FR3.1.3: Minimal Return Detail**
- Returns: {success: true, phaseChanged?: "action→buy"}
- Use case: LLM trusts execution, doesn't need full state update
- Token savings: ~90% vs full detail
- Response time: < 50ms

**FR3.1.4: Full Return Detail**
- Returns: Minimal + complete updated game state
- Use case: LLM wants confirmation of state changes
- Response time: < 100ms

### Acceptance Criteria - game_execute

**AC3.1: Successful Move Execution**
- Card at valid index in action phase executes successfully
- Response shows {success: true, phaseChanged: null}
- State updates (e.g., +1 card for Village)

**AC3.2: Invalid Move Returns Actionable Error**
- Card index out of range returns: "Cannot play card 7. Valid indices: 0-4"
- Insufficient coins returns: "Cannot buy Province (cost 8). You have 5 coins"
- State unchanged after failed move

**AC3.3: Full Return Detail Includes State**
- game_execute(..., return_detail="full") includes updated GameState in response
- Full response shows new phase if phase changed
- Token count < 2000

**AC3.4: Phase Transitions Work**
- "end" in action phase transitions to buy phase
- "end" in buy phase transitions to cleanup phase
- Game end detected correctly

### Tool 3.2: game_session

**Purpose**: Manage game lifecycle (start new game, end game) with idempotent operations

**Parameters**:
```typescript
{
  command: "new" | "end",
  seed?: string, // Optional, for reproducibility (new only)
  model?: "haiku" | "sonnet" // Optional, default: "haiku" (new only)
}
```

**Returns**:
```typescript
{
  success: true | false,
  gameId: string, // Unique game identifier
  command: "new" | "end",
  state?: GameState, // Returned for "new" command
  finalState?: GameState, // Returned for "end" command
  winner?: number, // Returned for "end" command
  error?: string
}
```

### Functional Requirements - game_session

**FR3.2.1: New Game (Idempotent)**
- "new" command starts fresh game
- If game active, "new" implicitly ends it first (idempotent)
- Seed parameter (if provided) ensures deterministic randomness
- Model parameter (if provided) tracks for performance analysis
- Returns gameId + initial game state
- Response time: < 100ms

**FR3.2.2: End Game**
- "end" command archives current game
- Determines winner and calculates VP
- Logs game to history for performance tracking
- Returns finalState + winner
- Response time: < 100ms

**FR3.2.3: Seed Support**
- If seed provided to "new", shuffle uses that seed
- Same seed + same moves = identical game progression
- Enables reproducible testing and research

**FR3.2.4: Model Tracking**
- Track which model (Haiku/Sonnet) played each game
- Separate performance metrics per model
- Enable cost/quality comparison

### Acceptance Criteria - game_session

**AC3.5: New Game Starts Correctly**
- game_session(command="new") initializes with starting hand + supply
- Returns gameId for reference
- Initial state: phase="action", turnNumber=1, activePlayer=0

**AC3.6: Seed Provides Reproducibility**
- Two games with same seed execute identically
- Different seeds produce different shuffles
- Useful for debugging and research

**AC3.7: End Game Archives Correctly**
- game_session(command="end") ends active game
- Returns final state + winner
- Game added to history for performance tracking

**AC3.8: Idempotent New Operations**
- Two consecutive game_session(command="new") calls
- First ends any active game, second starts new one
- Only one active game at a time

### Edge Cases

**EC3.1: Move Parse Failure**
- Scenario: game_execute(move="foobar")
- Solution: Error with examples: "Try: 'play 0', 'buy Village', 'end'"

**EC3.2: No Active Game**
- Scenario: game_execute before any game_session(command="new")
- Solution: Error: "No active game. Use 'game_session' to start."

**EC3.3: Game Already Ended**
- Scenario: game_session(command="end") with no active game
- Solution: Error: "No active game to end"

**EC3.4: Multiple Consecutive New Calls**
- Scenario: Two game_session(command="new") without end
- Solution: First implicitly ends previous game (idempotent)

### Dependencies

- **Depends on**: Feature 1 (MCP server infrastructure)
- **Depends on**: Feature 2 (uses game_observe for state queries)
- **Depends on**: `@principality/core` (GameEngine)

### Testing Requirements

See [TESTING.md](./TESTING.md) for detailed test specifications.

**Summary**:
- Unit tests: 8 test cases (parsing, validation, state integrity, lifecycle)
- Integration tests: 5 test cases (real engine execution, phase transitions)
- E2E tests: 2 test cases (Claude autonomous gameplay, game completion)
- Total: 15 tests for Feature 3

---

## Inter-Feature Dependencies

```
Feature 1 (MCP Server)
    ├─> Feature 2 (game_observe tool)
    └─> Feature 3 (game_execute + game_session tools)

Feature 2 (game_observe)
    └─> Used by LLM to query state before Feature 3 moves

Feature 3 (game_execute + game_session)
    └─> Depends on Feature 1 + Feature 2 infrastructure
```

**Implementation Order**:
1. Feature 1 (infrastructure) - MUST be first
2. Feature 2 (game_observe) - Core gameplay observation
3. Feature 3 (game_execute + game_session) - Complete autonomous loop

---

## Time Estimates Summary

| Feature | Implementation | Testing | Documentation | Total |
|---------|---------------|---------|---------------|-------|
| Feature 1: MCP Server | 2-3h | 1h | 0.5-1h | 3-4h |
| Feature 2: game_observe | 2-3h | 1h | 0.5-1h | 4-5h |
| Feature 3: game_execute + game_session | 3-4h | 1h | 0.5-1h | 5-7h |
| **Total** | **7-10h** | **3h** | **1.5-3h** | **12-16h** |

**Reduction from 7-tool design**: -6 hours (18-23h → 12-16h) due to:
- Aggressive tool consolidation (game_observe combines 2 tools, game_session combines 2 tools)
- Fewer implementation files (~3 tool files vs 7)
- Simpler test suite (~40 tests vs 72)
- Clearer architecture (3 tools vs 7)

---

## Anthropic Best Practices Applied

1. **Tool Consolidation**: Pairs tools LLMs naturally use together (observe state + moves in 1 call)
2. **Configurable Detail**: Detail levels prevent unnecessary token usage
3. **Actionable Errors**: Every error includes specific guidance ("Try: ...")
4. **Natural IDs**: Tool names describe purpose (game_observe, game_execute, game_session)
5. **Token Efficiency**: Consolidation reduces API calls by ~25%
6. **Namespace Clarity**: `game_` prefix prevents tool confusion

---

## Conclusion

Phase 2 features transform Principality AI into an **LLM optimization platform** through 3 consolidated MCP tools designed per Anthropic best practices:

1. ✅ Feature 1: MCP Server Infrastructure (3 tools)
2. ✅ Feature 2: game_observe Tool (state + moves combined)
3. ✅ Feature 3: game_execute + game_session Tools (execution + lifecycle)

**Total Effort**: 12-16 hours (3 features, 3 tools, 40 tests)
**Risk Level**: Low-Medium (new MCP protocol but simpler architecture)
**Value**: High (enables competitive AI, unlocks future phases, faster implementation)

**Next Step**: Proceed to [TESTING.MD](./TESTING.md) for three-level test specifications and evaluation framework.

---

**Document Status**: REVISED
**Created**: 2025-10-21
**Revised**: 2025-10-22 (3-tool consolidation, reduced from 7 tools)
**Author**: requirements-architect
**Ready for**: Test specification review and implementation planning
