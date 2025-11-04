# Phase 2 Test Suite - Quick Reference

**Complete test suite for MCP Server written in TDD style (RED phase)**

## File Structure

```
packages/mcp-server/tests/
├── unit/                          # 40 unit tests
│   ├── server.test.ts             # MCP server infrastructure (10 tests)
│   ├── game-observe.test.ts       # game_observe tool (15 tests)
│   ├── game-execute.test.ts       # game_execute + game_session (15 tests)
│   └── error-handling.test.ts     # Error cases & edge cases (25+ tests)
│
├── integration/                   # 12 integration tests
│   ├── server-engine.test.ts      # Server + GameEngine (11 tests)
│   ├── complete-turn.test.ts      # Full turn cycle (10 tests)
│   ├── multi-turn.test.ts         # Multi-turn gameplay (10 tests)
│   └── session-management.test.ts # Game lifecycle (10 tests)
│
├── e2e/                           # 8 E2E tests (smoke)
│   └── claude-api.test.ts         # Real Claude API (10 tests)
│
├── scenarios/                     # 20 evaluation scenarios
│   └── evaluation.test.ts         # LLM optimization (20 scenarios)
│
├── setup.ts                       # Test utilities and mocks
├── PHASE_2_TEST_SUMMARY.md        # Full documentation
└── TEST_REFERENCE.md              # This file
```

## Quick Test Commands

```bash
# Run all tests
npm test

# Run only unit tests
npm test -- --testPathPattern="unit/"

# Run only integration tests
npm test -- --testPathPattern="integration/"

# Run only E2E tests
npm test -- --testPathPattern="e2e/"

# Run only evaluation scenarios
npm test -- --testPathPattern="scenarios/evaluation"

# Run specific test file
npm test -- server.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Verbose output
npm test -- --verbose
```

## Test Count by Category

| Category | Count | Status |
|----------|-------|--------|
| Server Infrastructure | 10 | RED |
| game_observe Tool | 15 | RED |
| game_execute Tool | 15 | RED |
| Error Handling | 25+ | RED |
| Server + Engine Integration | 11 | RED |
| Complete Turn Cycle | 10 | RED |
| Multi-Turn Gameplay | 10 | RED |
| Session Management | 10 | RED |
| Real Claude API | 10 | RED (skipped without API key) |
| Evaluation Scenarios | 20 | RED (skipped without API key) |
| **TOTAL** | **80+** | **ALL RED** |

## Test Features

### 1. Unit Tests - Tool Logic (40 tests)

**Server Infrastructure (UT1.1-1.10)**
- Initialization with 3 tools
- Tool schema validation
- Request routing
- Error handling
- Model tracking
- Performance logging
- Graceful shutdown
- Concurrency handling

**game_observe Tool (UT2.1-2.15)**
- Detail levels (minimal, standard, full)
- Valid moves by phase
- Edge cases
- Token efficiency
- Caching behavior
- Supply sorting
- Victory calculations
- Hand indices

**game_execute + game_session (UT3.1-3.15)**
- Move execution (success/error)
- Atomicity and rollback
- Return detail levels
- Game lifecycle
- Deterministic seeds
- Move history
- Idempotent operations

**Error Handling (25+ tests)**
- Parse errors
- Validation errors
- Recovery guidance
- Concurrent errors
- Null/undefined safety

### 2. Integration Tests - Tool Chains (12 tests)

**Server + GameEngine (IT1.1-1.11)**
- Tool responses match engine state
- State consistency across tools
- Error recovery
- Phase transitions
- Determinism validation

**Complete Turn Cycle (IT2.1-2.10)**
- Action phase mechanics
- Buy phase mechanics
- Cleanup phase mechanics
- Turn counter
- State invariants
- Card draw logic
- Buy limits

**Multi-Turn Gameplay (IT3.1-3.10)**
- Multi-turn stability (5-10+ turns)
- Card flow into deck
- Supply depletion tracking
- Victory point accumulation
- Economic growth
- Game-over detection

**Session Management (IT4.1-4.10)**
- Game creation and seeding
- Active game tracking
- Idempotent new command
- Game end and archival
- Game history
- Model tracking

### 3. E2E Tests - Real Claude (8 tests)

- Claude queries game state
- Claude executes moves
- Claude manages lifecycle
- Complete turns with Claude
- Tool schema validation
- Error handling with Claude
- Token efficiency validation
- Compiled JavaScript validation
- MCP protocol compliance
- Reproducibility verification

### 4. Evaluation Scenarios - LLM Learning (20 scenarios)

**Training Scenarios (EVAL-001 to EVAL-015)**
- Opening hand optimization
- Economic vs victory decisions
- Multi-turn planning
- Error recovery
- Complex action chains
- Card prioritization
- Deck thinning
- Multiple buys
- Action economy
- Cleanup mechanics
- Supply awareness
- Turn efficiency
- Comeback strategy
- Consistency testing
- Learning/improvement

**Held-out Test Scenarios (EVAL-016 to EVAL-020)**
- Novel combinations (generalization)
- Suboptimal recovery
- Time pressure
- Strategy adaptation
- Full game completion

## Test Tag System

All tests use structured tags for clarity:

```typescript
// @req: Requirement being validated
// @input: Test setup/inputs
// @output: Expected result
// @assert: Specific assertions
// @edge: Edge cases
// @level: Unit | Integration | E2E
// @hint: Implementation guidance (optional)
```

## Performance Targets

| Tool | Operation | Target | Status |
|------|-----------|--------|--------|
| game_observe | minimal | <50ms | TBD |
| game_observe | standard | <100ms | TBD |
| game_observe | full | <150ms | TBD |
| game_execute | execute | <50ms | TBD |
| game_session | new/end | <100ms | TBD |

## Token Efficiency Targets

| Detail Level | Target | Status |
|--------------|--------|--------|
| minimal | <100 | TBD |
| standard | <300 | TBD |
| full | <1200 | TBD |

## Test Dependencies

- Jest 29+
- TypeScript 5+
- Node 18+
- Claude API key (optional, for E2E/evaluation)

## Setup and Utilities

File: `tests/setup.ts`

Provides:
- `createMockGameEngine()` - Full mock for unit tests
- `createMockMCPRequest()` - MCP request factory
- `createGameState()` - Game state builder
- `assertValidToolResponse()` - Response validator
- `testUtils` - All utilities exported
- `CARD_DEFINITIONS` - Card lookup table
- `TEST_ENV` - Environment configuration

## TDD Status

**Phase**: RED (tests written, implementation pending)

Expected progression:
1. ✅ Tests written (current state)
2. ⏳ dev-agent implements features
3. ⏳ Tests pass (GREEN)
4. ⏳ Code cleanup if needed (REFACTOR)
5. ⏳ Repeat for other features

## Communication with dev-agent

Tests communicate requirements through:

1. **Structured comments** with @ tags
2. **Clear assertions** that define "done"
3. **Error expectations** for error handling
4. **Performance requirements** in test setup

If test fails:
- Implementation doesn't meet requirement
- Requirement needs clarification
- Test needs adjustment (rare)

## Coverage Validation

After implementation, verify coverage:

```bash
npm test -- --coverage
```

Target: **95%+ across all files**

- Statements: 95%+
- Branches: 95%+
- Functions: 95%+
- Lines: 95%+

## Next Steps

1. **dev-agent builds** `packages/mcp-server/src/`
2. **dev-agent runs** tests: `npm test`
3. **All tests pass** (GREEN phase)
4. **E2E validated** with real Claude API
5. **Evaluation runs** on all 20 scenarios

## Documentation

- **Full Test Specs**: `PHASE_2_TEST_SUMMARY.md`
- **Requirements**: `docs/requirements/phase-2/TESTING.md`
- **Architecture**: `docs/requirements/phase-2/ARCHITECTURE.md`
- **Agent Communication**: `.claude/AGENT_COMMUNICATION.md`

---

**Created**: 2025-10-22
**Status**: Complete - Ready for dev-agent
**Total Lines**: 4,292 lines of test code
**Test Count**: 80+ tests
**Estimated Effort**: ~6 hours to run full suite
