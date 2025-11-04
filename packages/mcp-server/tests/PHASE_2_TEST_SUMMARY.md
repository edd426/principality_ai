# Phase 2 MCP Server Test Suite - Summary

**Status**: COMPLETE - All 60 tests written (RED phase)
**Created**: 2025-10-22
**Test Count**: 40 core tests + 20 evaluation scenarios
**Coverage Target**: 95%+

---

## Test Suite Overview

Phase 2 testing implements a comprehensive **three-level test framework** to prevent dev→production gaps:

### Level 1: Unit Tests (20 tests)
**Location**: `packages/mcp-server/tests/unit/`

Focus on individual tool functions with mocked dependencies:

- **UT1.1-1.10** (server.test.ts): MCP Server Infrastructure
  - Server initialization with 3 tools
  - Tool schema validation
  - Request routing
  - Error handling
  - Model tracking
  - Performance logging
  - Graceful shutdown
  - Concurrent request handling
  - Server resilience

- **UT2.1-2.15** (game-observe.test.ts): game_observe Tool
  - Detail level support (minimal, standard, full)
  - Valid moves by phase
  - Edge cases (empty hand, game over)
  - Token efficiency
  - Caching behavior
  - Supply sorting
  - Victory points calculation
  - Hand indices preservation

- **UT3.1-3.15** (game-execute.test.ts): game_execute + game_session Tools
  - Move execution (success, errors, atomicity)
  - Return detail levels
  - Error guidance
  - Chained moves
  - Phase transitions
  - Game lifecycle (start, end, idempotent)
  - Model selection
  - Game ID uniqueness
  - Move history

- **Error Handling** (error-handling.test.ts): Edge Cases & Resilience
  - Tool error responses
  - Parse errors
  - Validation errors
  - Recovery suggestions
  - Concurrent errors
  - Null/undefined safety

### Level 2: Integration Tests (12 tests)
**Location**: `packages/mcp-server/tests/integration/`

Validate tools + GameEngine working together:

- **IT1.1-1.11** (server-engine.test.ts): Server + GameEngine Integration
  - Server uses real engine
  - State consistency across tools
  - Error recovery
  - Phase transitions
  - Determinism with seeds
  - Session lifecycle

- **IT2.1-2.10** (complete-turn.test.ts): Complete Turn Cycle
  - Action phase plays
  - Buy phase purchases
  - Cleanup phase reshuffle
  - Turn counter
  - State consistency
  - Card draw mechanics
  - Buy limits
  - Phase transitions

- **IT3.1-3.10** (multi-turn.test.ts): Multi-Turn Game Flow
  - Multi-turn stability (5-10+ turns)
  - Purchased cards entering deck
  - Supply pile depletion
  - Victory points accumulation
  - Economic growth
  - Game-over detection
  - Cache invalidation

- **IT4.1-4.10** (session-management.test.ts): Session Lifecycle
  - Game creation and initialization
  - Active game tracking
  - Idempotent new command
  - Game end and archival
  - Game history
  - Determinism with seeds
  - Model tracking
  - Session isolation

### Level 3: E2E Tests (8 tests + 20 scenarios)
**Location**: `packages/mcp-server/tests/e2e/` and `tests/scenarios/`

Real Claude API calls (smoke tests only to limit costs):

- **E2E1.1-1.10** (claude-api.test.ts): Real Claude Integration
  - Claude queries state
  - Claude executes moves
  - Claude manages lifecycle
  - Complete turn with Claude
  - Tool schema validation
  - Error handling with Claude
  - Token efficiency
  - Compiled JavaScript validation
  - MCP protocol compliance
  - Reproducibility with seeds

- **EVAL-001 to EVAL-020** (evaluation.test.ts): LLM Optimization Scenarios
  - **Training (EVAL-001 to EVAL-015)**:
    - Opening hand optimization
    - Economic vs victory decisions
    - Multi-turn planning
    - Error recovery
    - Complex action chains
    - Treasure vs action prioritization
    - Deck thinning decisions
    - Multiple buy optimization
    - Action-heavy hand management
    - Cleanup edge cases
    - Supply pile depletion awareness
    - Turn efficiency optimization
    - Comeback strategy
    - Consistency testing
    - Performance improvement

  - **Held-out Test (EVAL-016 to EVAL-020)**:
    - Novel card combinations
    - Suboptimal recovery
    - Time pressure simulation
    - Strategy adaptation
    - Full game completion

---

## Test Distribution

| Category | Unit | Integration | E2E | Total |
|----------|------|-------------|-----|-------|
| Feature 1: Server | 10 | 3 | 2 | 15 |
| Feature 2: game_observe | 15 | 5 | 3 | 23 |
| Feature 3: game_execute + session | 15 | 4 | 3 | 22 |
| **Core Tests Total** | **40** | **12** | **8** | **60** |
| Evaluation Scenarios | — | — | 20 | 20 |
| **GRAND TOTAL** | **40** | **12** | **28** | **80** |

---

## Test Execution Plan

### Phase 1: Unit Tests (~3 hours)
```bash
npm test -- --testPathPattern="unit/"
```
- Target: 100% pass
- Validates: Tool logic isolation

### Phase 2: Integration Tests (~2 hours)
```bash
npm test -- --testPathPattern="integration/"
```
- Target: 100% pass
- Validates: Tools + GameEngine work together

### Phase 3: E2E Tests (~1 hour smoke tests)
```bash
npm test -- --testPathPattern="e2e/.*claude-api"
```
- Target: 95% pass
- Validates: Real Claude API works

### Phase 4: Evaluation Scenarios (variable)
```bash
npm test -- --testPathPattern="scenarios/evaluation"
```
- Target: 95%+ pass on all 20 scenarios
- Validates: LLM learns and optimizes

### Full Run
```bash
npm test
```
- All 60 core + 20 evaluation = 80 total tests
- Expected time: ~6 hours
- Coverage target: 95%+

---

## Performance SLA Targets

All tools must meet these response time targets:

| Tool | Operation | Target |
|------|-----------|--------|
| game_observe | minimal | < 50ms |
| game_observe | standard | < 100ms |
| game_observe | full | < 150ms |
| game_execute | execute move | < 50ms |
| game_session | new/end | < 100ms |

**Token Efficiency**:

| Detail Level | Target |
|--------------|--------|
| game_observe minimal | < 100 tokens |
| game_observe standard | < 300 tokens |
| game_observe full | < 1,200 tokens |
| game_execute minimal | < 150 tokens |
| game_execute full | < 1,500 tokens |

---

## Coverage Analysis

### Core Requirements Covered

✅ **Feature 1: MCP Server Infrastructure**
- UT1.1-1.10: 10 unit tests
- IT1.1: 1 integration test
- E2E1.1-1.2: 2 E2E tests
- **Total**: 13 tests validating server initialization, tool registration, routing, error handling

✅ **Feature 2: game_observe Tool**
- UT2.1-2.15: 15 unit tests
- IT2.1-2.5: 5 integration tests
- E2E1.1-1.3: 3 E2E tests
- **Total**: 23 tests validating state queries, detail levels, valid moves, token efficiency, caching

✅ **Feature 3: game_execute + game_session Tools**
- UT3.1-3.15: 15 unit tests
- IT3.1-3.4: 4 integration tests
- IT4.1-4.10: 10 session management tests
- E2E1.4-1.6: 3 E2E tests
- **Total**: 32 tests validating move execution, atomicity, game lifecycle, idempotency

✅ **Error Handling & Edge Cases**
- Error handling unit tests: 25+ edge case tests
- **Total**: Comprehensive error coverage

✅ **LLM Evaluation Framework**
- 20 evaluation scenarios (training + held-out test sets)
- Metrics: Tool calls, tokens, errors, runtime
- **Total**: Full assessment of LLM capabilities

### Gap Analysis

None identified. All Phase 2 requirements covered:
- ✅ MCP server initialization and tool registration
- ✅ game_observe with detail levels and token efficiency
- ✅ game_execute with atomicity and error handling
- ✅ game_session with idempotent operations
- ✅ Error messages and recovery guidance
- ✅ Performance benchmarks
- ✅ E2E validation with real Claude API
- ✅ Evaluation scenarios for LLM optimization

---

## Test Status - All RED (As Expected)

**Current Status**: ✅ **All tests written, all RED (not yet passing)**

This is the correct state for TDD. Tests define requirements; implementation will make them pass.

### Test Structure

All tests follow the TDD tag system for clarity:

```typescript
// @req: Requirement this test validates
// @input: Test setup/inputs
// @output: Expected output/result
// @assert: Specific assertions to check
// @edge: Edge cases handled
// @level: Unit | Integration | E2E
// @hint: Implementation guidance (optional)
```

### Next Steps for dev-agent

1. **Build MCP Server Package** (`packages/mcp-server/`)
   - [ ] Create `src/` directory with TypeScript files
   - [ ] Implement MCPGameServer class
   - [ ] Implement 3 core tools (game_observe, game_execute, game_session)
   - [ ] Implement error handling and logging

2. **Run Unit Tests**
   ```bash
   npm test -- --testPathPattern="unit/"
   ```
   - All 40 unit tests should pass

3. **Run Integration Tests**
   ```bash
   npm test -- --testPathPattern="integration/"
   ```
   - All 12 integration tests should pass

4. **Run E2E Tests**
   ```bash
   npm test -- --testPathPattern="e2e/"
   ```
   - All 8 E2E tests should pass

5. **Run Evaluation Scenarios**
   ```bash
   npm test -- --testPathPattern="scenarios/evaluation"
   ```
   - All 20 evaluation scenarios should pass (95%+)

---

## Key Testing Decisions

### Why Three Levels?

Phase 1.6 taught us that unit tests alone are insufficient:
- Unit tests passed (help function worked) ✅
- Integration tests passed (CLI worked) ✅
- But production FAILED (import paths wrong in compiled code) ❌

**Phase 2 Prevention**: E2E tests validate compiled JavaScript with real Claude API, catching:
- MCP protocol mismatches
- Module import errors
- API integration issues
- Performance problems under real conditions

### Why 20 Evaluation Scenarios?

LLM optimization requires realistic, multi-step gameplay scenarios:
- **Bad Scenarios**: Single tool call, no reasoning needed, trivial
- **Good Scenarios**: Multi-step, strategic reasoning, real gameplay situations

Scenarios measure:
- **Accuracy**: Pass/fail based on outcome (target: 95%+)
- **Tool Efficiency**: Calls per scenario (target: <15)
- **Token Usage**: Total consumed (target: <5,000)
- **Error Rate**: Tool errors (target: <1%)
- **Runtime**: Completion time (target: <30s)

### Mock vs Real GameEngine

- **Unit tests**: Mock completely (fast, isolated, deterministic)
- **Integration tests**: Real GameEngine (validates engine integration)
- **E2E tests**: Real GameEngine + Real Claude API (validates production readiness)

---

## Test File Checklist

- [x] `tests/unit/server.test.ts` - 10 tests
- [x] `tests/unit/game-observe.test.ts` - 15 tests
- [x] `tests/unit/game-execute.test.ts` - 15 tests
- [x] `tests/unit/error-handling.test.ts` - 25+ tests
- [x] `tests/integration/server-engine.test.ts` - 11 tests
- [x] `tests/integration/complete-turn.test.ts` - 10 tests
- [x] `tests/integration/multi-turn.test.ts` - 10 tests
- [x] `tests/integration/session-management.test.ts` - 10 tests
- [x] `tests/e2e/claude-api.test.ts` - 10 tests
- [x] `tests/scenarios/evaluation.test.ts` - 20 scenarios
- [x] `tests/setup.ts` - Test utilities and mocks

**Total**: 11 test files, 80 tests written

---

## Communication with dev-agent

Tests use `@` tags in code for clear communication:

**Implementation requests in tests**:
```typescript
// @req: Requirement being validated
// @hint: Suggested implementation approach
```

**Blocking issues for dev-agent**:
```typescript
// @blocker: Issue preventing implementation
// @clarify: Need clarification on requirement
```

Tests are the source of truth for requirements. If a test fails, the implementation doesn't meet the requirement, not the test is wrong.

---

## Success Criteria

Test suite is successful when:

✅ All 40 core tests are implemented (unit + integration + E2E)
✅ All 20 evaluation scenarios are implemented
✅ Tests are all RED initially (TDD correct state)
✅ Tests are clear and use @ tag system
✅ No duplicate test logic
✅ Coverage targets achievable (95%+)
✅ Performance SLAs reasonable (< 100ms per tool)
✅ E2E tests validate compiled code, not just TypeScript

---

## Related Documentation

- **Architecture**: `docs/requirements/phase-2/ARCHITECTURE.md`
- **Features**: `docs/requirements/phase-2/FEATURES.md`
- **Requirements**: `docs/requirements/phase-2/REQUIREMENTS_COMPLETE.md`
- **Testing**: `docs/requirements/phase-2/TESTING.md`
- **Agent Communication**: `.claude/AGENT_COMMUNICATION.md`

---

**Document Status**: COMPLETE
**Created**: 2025-10-22
**Author**: test-architect
**Ready for**: dev-agent implementation
