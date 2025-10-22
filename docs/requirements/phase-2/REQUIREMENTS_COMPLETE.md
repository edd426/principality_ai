# Phase 2 Complete Requirements: MCP Server Integration (3-Tool Architecture)

**Status**: REVISED
**Created**: 2025-10-21
**Revised**: 2025-10-22 (3-tool consolidation from 7-tool design)
**Phase**: 2
**Estimated Effort**: 12-16 hours (3 features, 3 tools, 40 core tests + 20 evaluation scenarios)

---

## Executive Summary

Phase 2 implements Model Context Protocol (MCP) server integration to enable autonomous LLM gameplay through **3 consolidated core tools**. This document consolidates all requirements, test specifications, and acceptance criteria.

**Status**: REVISED - 3-tool consolidation reduces complexity while improving token efficiency

**Revised Tool Architecture** (from 7 tools → 3 tools):
1. **Feature 1**: MCP Server Infrastructure (3-4h, 10 tests)
2. **Feature 2**: game_observe Tool (4-5h, 15 tests) - **Consolidates state + moves queries**
3. **Feature 3**: game_execute + game_session Tools (5-7h, 15 tests) - **Consolidates execution + lifecycle**

**Total Effort**: 12-16 hours (33% reduction from 7-tool design)
**Total Tests**: 40 core tests (20 unit + 12 integration + 8 E2E) + 20 evaluation scenarios
**Tool Reduction**: 7 → 3 tools (57% reduction via aggressive consolidation)

**Key Improvements Over 7-Tool Design**:
- Simpler architecture (fewer tools = less agent cognitive load)
- Better token efficiency (~30% reduction via consolidated queries)
- Fewer API calls (~25% reduction per game)
- Faster implementation (33% time savings)
- Maintained quality (95%+ test coverage, three-level framework)

---

## THREE-LEVEL TEST SPECIFICATION FRAMEWORK

Applies Phase 1.6 three-level test pattern to prevent integration gaps:

### Level 1: Unit Tests (63 tests)
- **What**: Test tool functions in isolation
- **Environment**: TypeScript/Jest dev environment
- **Dependencies**: Mocked GameEngine, file system
- **Purpose**: Verify tool logic correctness
- **Coverage Target**: 100% for simple tools (state, validation)

### Level 2: Integration Tests (34 tests)
- **What**: Test MCP server + game engine together
- **Environment**: TypeScript/Jest dev environment
- **Dependencies**: Real GameEngine, mocked Claude API
- **Purpose**: Verify tools work in MCP server context
- **Coverage Target**: 95%+ for complex workflows

### Level 3: E2E Tests (21 tests)
- **What**: Test actual Claude API integration
- **Environment**: Compiled JavaScript, Node runtime, real Claude API
- **Dependencies**: Real MCP server, real Claude API (rate-limited)
- **Purpose**: Validate production environment works end-to-end
- **Coverage Target**: Smoke tests only (limit API costs)

---

## FEATURE 1: MCP Server Infrastructure

**Estimated Effort**: 6-8 hours
**Test Count**: 16 tests (8 unit + 5 integration + 3 E2E)

### Functional Requirements

**FR1.1**: Server initializes with MCP SDK and registers 5 tools
**FR1.2**: Routes tool requests to appropriate handlers
**FR1.3**: Handles errors gracefully (no crashes)
**FR1.4**: Logs all requests/responses for debugging
**FR1.5**: Supports graceful shutdown on SIGINT

### Acceptance Criteria

**AC1.1**: Server starts on localhost with stdio transport
**AC1.2**: All 5 tools discoverable by Claude Desktop
**AC1.3**: Tool invocations route correctly to handlers
**AC1.4**: Errors return structured error responses
**AC1.5**: Server continues after errors (no crashes)

### Test Summary

| Test Level | Count | Coverage |
|------------|-------|----------|
| Unit | 8 | Server init, tool registration, routing, errors |
| Integration | 5 | Server + GameEngine, multiple tool calls |
| E2E | 3 | MCP protocol communication, real Claude API |

**Key Tests**:
- UT1.1: Server initializes with correct name/version
- UT1.2: Registers all 5 tools on start
- UT1.3: Routes tool requests to correct handlers
- IT1.1: Server + GameEngine integration
- E2E1.1: Claude Desktop discovers tools via MCP
- E2E1.2: Tool invocation via MCP protocol

**Performance**: Request handling < 100ms average

---

## FEATURE 2: Game State Query Tools

**Estimated Effort**: 4-5 hours
**Test Count**: 22 tests (12 unit + 6 integration + 4 E2E)

### Tools Implemented

1. **get_game_state**: Returns phase, turn number, active player, game-over status
2. **get_hand**: Returns hand contents (grouped duplicates)
3. **get_supply**: Returns all 15 cards with costs and remaining quantities
4. **get_player_stats**: Returns deck/discard counts, VP, current coins/actions/buys

### Functional Requirements

**FR2.1**: get_game_state returns current game state (< 100ms)
**FR2.2**: get_hand groups duplicate cards, supports player ID parameter (< 50ms)
**FR2.3**: get_supply sorts by type→cost→name (< 50ms)
**FR2.4**: get_player_stats calculates VP from victory cards (< 50ms)

### Acceptance Criteria

**AC2.1**: get_game_state shows correct phase and turn number
**AC2.2**: get_hand groups duplicates (e.g., 3x Copper)
**AC2.3**: get_supply lists all 15 cards sorted correctly
**AC2.4**: get_player_stats calculates VP accurately
**AC2.5**: All queries < 100ms average

### Test Specifications

**Unit Tests (12)**:
- UT2.1-2.2: get_game_state (action phase, game over)
- UT2.3-2.5: get_hand (groups duplicates, empty hand, specific player)
- UT2.6-2.7: get_supply (all cards, sorted correctly)
- UT2.8-2.9: get_player_stats (complete stats, buy phase coins)
- UT2.10-2.12: Performance tests + error handling

**Integration Tests (6)**:
- IT2.1: get_game_state with real GameEngine
- IT2.2: get_hand reflects state after move execution
- IT2.3: get_supply shows decreasing piles after purchase
- IT2.4: get_player_stats calculates VP correctly
- IT2.5: Multiple queries in sequence
- IT2.6: State queries are read-only (don't modify game)

**E2E Tests (4)**:
- E2E2.1: Claude queries game state via MCP
- E2E2.2: Claude gets hand to inform decisions
- E2E2.3: Claude checks supply before buying
- E2E2.4: Claude gets player stats for strategy

**Performance Targets**:
- get_game_state: < 100ms average
- get_hand, get_supply, get_player_stats: < 50ms average

---

## FEATURE 3: Move Validation API

**Estimated Effort**: 5-6 hours
**Test Count**: 28 tests (15 unit + 8 integration + 5 E2E)

### Tools Implemented

1. **get_valid_moves**: Returns list of all legal moves for current phase
2. **validate_move**: Validates specific move, returns error if illegal
3. **get_move_history**: Returns recent moves with timestamps

### Functional Requirements

**FR3.1**: get_valid_moves returns complete list of legal moves (< 50ms)
**FR3.2**: validate_move checks legality, returns clear error messages (< 30ms)
**FR3.3**: Error messages include suggestions (e.g., "use get_supply")
**FR3.4**: Move history tracks all executed moves with timestamps (< 100ms)

### Acceptance Criteria

**AC3.1**: get_valid_moves lists playable cards in action phase
**AC3.2**: get_valid_moves lists affordable cards in buy phase
**AC3.3**: validate_move confirms legal moves
**AC3.4**: validate_move rejects illegal moves with helpful errors
**AC3.5**: Move history accumulates correctly

### Test Specifications

**Unit Tests (15)**:
- UT3.1-3.3: get_valid_moves (action phase, buy phase, no actions)
- UT3.4-3.8: validate_move (legal play, insufficient coins, empty pile, wrong phase, no actions)
- UT3.9-3.10: get_move_history (all moves, last N)
- UT3.11-3.12: Move description formatting, suggestion generation
- UT3.13-3.15: Performance tests, edge cases

**Integration Tests (8)**:
- IT3.1: get_valid_moves with real GameEngine
- IT3.2: Validate legal move succeeds
- IT3.3: Validate illegal move fails with error
- IT3.4: Validation after move execution
- IT3.5: Move history tracking
- IT3.6: Validation across multiple turns
- IT3.7: Empty valid moves (no actions)
- IT3.8: Validation suggestion accuracy

**E2E Tests (5)**:
- E2E3.1: Claude gets valid moves before decision
- E2E3.2: Claude validates move before execution
- E2E3.3: Claude recovers from invalid move error
- E2E3.4: Claude uses move history for learning
- E2E3.5: Validation performance in real usage

**Performance Targets**:
- get_valid_moves: < 50ms average
- validate_move: < 30ms average
- get_move_history: < 100ms average

---

## FEATURE 4: Autonomous Play Loop

**Estimated Effort**: 6-7 hours
**Test Count**: 34 tests (18 unit + 10 integration + 6 E2E)

### Tools Implemented

1. **execute_move**: Executes single move, validates first
2. **start_game**: Initializes new game with seed
3. **end_game**: Ends current game, determines winner
4. **reset_game**: Resets to new game, preserves history

### Functional Requirements

**FR4.1**: execute_move validates, then executes move (< 50ms)
**FR4.2**: Returns updated state and move effects
**FR4.3**: start_game initializes game with seed for reproducibility
**FR4.4**: end_game determines winner, archives game history
**FR4.5**: reset_game starts fresh game, optionally keeps history

### Acceptance Criteria

**AC4.1**: execute_move validates before executing
**AC4.2**: Execution fails gracefully on invalid move (no state change)
**AC4.3**: Complete turn executes (action → buy → cleanup)
**AC4.4**: Complete game reaches victory condition
**AC4.5**: Multi-game session preserves history

### Test Specifications

**Unit Tests (18)**:
- UT4.1-4.4: execute_move (success, failure, effects, edge cases)
- UT4.5-4.7: start_game (initialization, seed, player count)
- UT4.8-4.10: end_game (winner determination, history archival, no game error)
- UT4.11-4.13: reset_game (fresh state, history preservation, config)
- UT4.14-4.18: Session management, concurrent moves, performance

**Integration Tests (10)**:
- IT4.1: execute_move with real GameEngine
- IT4.2: Complete turn execution (action → buy → cleanup)
- IT4.3: Complete game execution (start → victory)
- IT4.4: Multi-game session
- IT4.5: Move validation before execution
- IT4.6: State persistence across moves
- IT4.7: Game history accumulation
- IT4.8: Error recovery (invalid move doesn't corrupt state)
- IT4.9: Concurrent move handling
- IT4.10: Performance (full turn < 200ms)

**E2E Tests (6)**:
- E2E4.1: Claude executes single move via MCP
- E2E4.2: Claude completes full turn
- E2E4.3: Claude completes full game (start → victory)
- E2E4.4: Claude plays multiple games in session
- E2E4.5: Claude recovers from execution errors
- E2E4.6: Autonomous play performance (game completes in < 5 minutes)

**Performance Targets**:
- execute_move: < 50ms average
- Full turn (action + buy + cleanup): < 200ms
- Complete game: < 5 minutes (research timing, not SLA)

---

## FEATURE 5: Reasoning/Explanation System

**Estimated Effort**: 4-5 hours
**Test Count**: 18 tests (10 unit + 5 integration + 3 E2E)

### Tools Implemented

1. **explain_decision**: Logs LLM reasoning for move
2. **get_decision_history**: Retrieves logged decisions
3. **Decision Analytics** (internal): Calculates quality metrics

### Functional Requirements

**FR5.1**: explain_decision logs reasoning alongside move
**FR5.2**: Supports confidence levels (low/medium/high)
**FR5.3**: Optionally logs alternatives considered
**FR5.4**: get_decision_history retrieves decisions with reasoning
**FR5.5**: Analytics calculate reasoning quality metrics

### Acceptance Criteria

**AC5.1**: explain_decision logs reasoning successfully
**AC5.2**: get_decision_history retrieves logged decisions
**AC5.3**: Analytics calculate metrics (avg reasoning length, confidence distribution)
**AC5.4**: Reasoning exported to file for research
**AC5.5**: Empty reasoning accepted (not required)

### Test Specifications

**Unit Tests (10)**:
- UT5.1-5.3: explain_decision (logging, file export, decision ID)
- UT5.4-5.6: get_decision_history (all decisions, last N, filtering)
- UT5.7-5.9: Analytics (reasoning length, confidence distribution, patterns)
- UT5.10: Edge cases (empty reasoning, very long reasoning)

**Integration Tests (5)**:
- IT5.1: explain_decision + execute_move correlation
- IT5.2: Decision history accumulation across game
- IT5.3: Analytics on completed game
- IT5.4: File logging persistence
- IT5.5: Reasoning quality over multiple games

**E2E Tests (3)**:
- E2E5.1: Claude provides reasoning via MCP
- E2E5.2: Reasoning logged and retrievable
- E2E5.3: Analytics generated from real gameplay

**Research Value**:
- Decision logs exported as JSONL for analysis
- Metrics: avg reasoning length, confidence accuracy, strategic patterns
- Pattern analysis: similar situations → similar decisions?

---

## COMPREHENSIVE TEST SUMMARY

### Test Distribution by Feature

| Feature | Unit | Integration | E2E | Total | Hours |
|---------|------|-------------|-----|-------|-------|
| Feature 1: MCP Server | 8 | 5 | 3 | 16 | 6-8h |
| Feature 2: State Queries | 12 | 6 | 4 | 22 | 4-5h |
| Feature 3: Move Validation | 15 | 8 | 5 | 28 | 5-6h |
| Feature 4: Autonomous Play | 18 | 10 | 6 | 34 | 6-7h |
| Feature 5: Reasoning | 10 | 5 | 3 | 18 | 4-5h |
| **TOTAL** | **63** | **34** | **21** | **118** | **25-30h** |

### Test Coverage by Level

- **Level 1 (Unit)**: 63 tests - Functions work in isolation
- **Level 2 (Integration)**: 34 tests - Components work together
- **Level 3 (E2E)**: 21 tests - Production environment validation

**Total**: 118 comprehensive tests across all three levels

---

## GAPS IDENTIFICATION

### Potential Issues Addressed by Three-Level Testing

**Gap 1: MCP Protocol Compatibility**
- **Risk**: Tools work in unit tests but fail with actual MCP protocol
- **Mitigation**: E2E tests validate MCP communication with Claude
- **Tests**: E2E1.1, E2E1.2, E2E1.3

**Gap 2: Performance Under Real Conditions**
- **Risk**: Mocked tests fast, real API calls slow
- **Mitigation**: E2E performance tests with actual Claude API
- **Tests**: E2E3.5, E2E4.6

**Gap 3: LLM Decision Quality**
- **Risk**: LLM makes poor strategic decisions
- **Mitigation**: This is research! Capture data regardless of quality
- **Tests**: E2E4.3, E2E5.3 (measure, don't enforce quality)

**Gap 4: API Rate Limits**
- **Risk**: E2E tests hit rate limits
- **Mitigation**: Mock most tests, limit real API calls
- **Strategy**: 21 E2E tests, but only ~5 use real API (rest mocked)

**Gap 5: Module Import Paths** (lesson from Phase 1.6)
- **Risk**: TypeScript tests pass, compiled JavaScript fails
- **Mitigation**: E2E tests run compiled code
- **Validation**: Import paths must be module-level, not source-level

---

## ACCEPTANCE CRITERIA: PHASE 2 COMPLETE

All of the following must be true for Phase 2 to be considered complete:

**Functionality**:
- [ ] MCP server starts and registers 5 tools
- [ ] Claude can discover and invoke all tools
- [ ] State query tools return correct game information
- [ ] Move validation prevents illegal moves
- [ ] Claude can execute complete turns autonomously
- [ ] Claude can complete full games (start → victory)
- [ ] Reasoning captured and logged for research

**Test Coverage**:
- [ ] All 118 tests passing (63 unit + 34 integration + 21 E2E)
- [ ] 95%+ overall coverage maintained
- [ ] No regressions in Phase 1/1.5/1.6 tests
- [ ] E2E tests validate production-compiled code
- [ ] Performance tests meet SLAs

**Implementation**:
- [ ] Feature 1: MCP server infrastructure complete
- [ ] Feature 2: State query tools complete
- [ ] Feature 3: Move validation API complete
- [ ] Feature 4: Autonomous play loop complete
- [ ] Feature 5: Reasoning system complete
- [ ] Module import paths production-ready
- [ ] No TypeScript or compilation errors

**Production Readiness**:
- [ ] `npm run build` succeeds with no errors
- [ ] MCP server starts without errors
- [ ] Claude Desktop can connect via MCP protocol
- [ ] Tools visible and invokable by Claude
- [ ] Complete game playable start-to-finish
- [ ] Game logs and reasoning exported for research

**Research Validation**:
- [ ] Claude completes ≥3 full games successfully
- [ ] Decision reasoning captured per turn
- [ ] Strategic decisions make sense (not random)
- [ ] Game logs provide research insights
- [ ] Error recovery works (LLM learns from mistakes)

---

## IMPLEMENTATION PRIORITY

### Phase 2 Implementation Order

**Week 1 (12-15 hours)**:
1. Feature 1: MCP Server Infrastructure (6-8h)
   - Critical foundation for all other features
   - Must be solid before proceeding
2. Feature 2: State Query Tools (4-5h)
   - Simple, no dependencies except Feature 1
   - Enables Claude to inspect game state

**Week 2 (13-15 hours)**:
3. Feature 3: Move Validation API (5-6h)
   - Depends on Feature 2 (state queries)
   - Critical for preventing illegal moves
4. Feature 4: Autonomous Play Loop (6-7h)
   - Depends on Features 1, 2, 3
   - Enables complete autonomous gameplay
5. Feature 5: Reasoning System (4-5h)
   - Depends on Feature 4 (execution)
   - Research-focused, can be simplified if time-constrained

**Total**: 25-30 hours over ~2 weeks

---

## RISK ASSESSMENT

### Phase 2 Risks and Mitigation

**Risk 1: MCP Protocol Learning Curve** (MEDIUM)
- **Impact**: Slower implementation, API design iterations
- **Probability**: 60%
- **Mitigation**: Start with simple tool (get_game_state), iterate gradually
- **Time Impact**: +2-4 hours
- **Mitigation Success**: HIGH (MCP SDK well-documented)

**Risk 2: Claude API Rate Limits** (MEDIUM)
- **Impact**: E2E tests slow or throttled
- **Probability**: 70%
- **Mitigation**: Mock most tests, limit real API calls to smoke tests
- **Time Impact**: None if mocked properly
- **Mitigation Success**: HIGH (mocking strategy in place)

**Risk 3: LLM Decision Quality** (LOW - RESEARCH RISK)
- **Impact**: Claude makes poor strategic decisions
- **Probability**: Unknown (this is research!)
- **Mitigation**: Not a blocker - gather data regardless of win rate
- **Time Impact**: None (research insight, not implementation issue)
- **Mitigation Success**: N/A (expected outcome variability)

**Risk 4: Performance Issues** (LOW)
- **Impact**: API calls too slow for smooth gameplay
- **Probability**: 30%
- **Mitigation**: Optimize state queries, cache where possible
- **Time Impact**: +2-3 hours for optimization
- **Mitigation Success**: HIGH (performance targets achievable)

**Risk 5: Scope Creep** (MEDIUM)
- **Impact**: Adding features beyond 5 core tools
- **Probability**: 50%
- **Mitigation**: Strict scope adherence - defer extras to Phase 3
- **Time Impact**: Could exceed 30 hour estimate
- **Mitigation Success**: HIGH (clear requirements, discipline)

**Overall Risk Level**: MEDIUM
- New technology (MCP) with research-oriented goals
- Mitigations in place for all identified risks
- Realistic time estimates with buffer

---

## LESSON LEARNED: THREE-LEVEL VALIDATION

Phase 2 applies the three-level test framework established in Phase 1.6:

**Phase 1.6 Problem**:
```
✅ Unit tests passed (function worked)
✅ Integration tests added (parser+routing wired)
❌ But production FAILED: "Cannot find module '@principality/core/src/cards'"
```

**Root Cause**: Gap between TypeScript tests (source paths work) and JavaScript runtime (module paths needed)

**Phase 2 Solution**: Three-level testing ensures:
1. **Unit**: Functions work (mocked dependencies)
2. **Integration**: Components work together (real GameEngine)
3. **E2E**: Production environment works (compiled code + real API)

**Specific Preventions for Phase 2**:
- E2E tests run compiled JavaScript (catches import path errors)
- E2E tests use real MCP protocol (catches protocol mismatches)
- E2E tests with real Claude API (catches API integration issues)

**Success Metric**: If all 118 tests pass (especially E2E), Phase 2 will work in production.

---

## NEXT STEPS

### 1. User Review and Approval

User should review:
- [ ] Feature scope (5 tools - correct?)
- [ ] Success criteria (complete ≥3 games - sufficient?)
- [ ] Time estimates (25-30 hours - realistic?)
- [ ] Research goals (decision quality measurement - aligned?)

### 2. Test Implementation (8-10 hours)

**test-architect** writes all 118 tests:
- 63 unit tests (tools in isolation)
- 34 integration tests (MCP server + engine)
- 21 E2E tests (actual Claude API)

### 3. Feature Implementation (14-19 hours)

**dev-agent** implements features to pass tests:
- Feature 1: MCP server infrastructure
- Feature 2: State query tools
- Feature 3: Move validation API
- Feature 4: Autonomous play loop
- Feature 5: Reasoning system

### 4. Validation and Documentation (1-2 hours)

**requirements-architect** documents completion:
- Update Phase 2 status to COMPLETE
- Add to CLAUDE.md
- Capture research insights
- Prepare Phase 3 planning

### 5. User Acceptance (Manual Testing)

User validates:
- Run MCP server locally
- Connect Claude Desktop app
- Observe autonomous gameplay
- Review game logs and reasoning
- Confirm research goals met

---

## CONCLUSION

Phase 2 requirements are comprehensive, testable, and achievable within 25-30 hours. The three-level test framework (118 tests) ensures production readiness and prevents gaps like those found in Phase 1.6.

**Key Deliverables**:
1. ✅ MCP server with 5 tools (game state, validation, execution, reasoning)
2. ✅ Autonomous LLM gameplay (Claude completes full games)
3. ✅ Research platform (decision logging, reasoning capture)
4. ✅ 118 comprehensive tests (unit/integration/E2E)
5. ✅ Foundation for Phase 3 (cloud deployment, multiplayer)

**Value Proposition**:
- **Research**: Measure LLM decision quality in deck-building games
- **Technical**: Validate MCP protocol for game integration
- **Strategic**: Foundation for multiplayer (Phase 3) and web UI (Phase 4)

**Risk Level**: MEDIUM (new MCP protocol, research goals)
**Confidence**: HIGH (building on stable Phase 1.6 foundation)

**Status**: ✅ READY FOR USER APPROVAL AND IMPLEMENTATION

---

**Document Status**: DRAFT
**Created**: 2025-10-21
**Author**: requirements-architect
**Ready for**: User review, test implementation, feature development

---

## APPENDIX: Quick Reference

### Total Effort Breakdown

| Activity | Hours | Responsibility |
|----------|-------|----------------|
| Test Writing | 8-10h | test-architect |
| Feature Implementation | 14-19h | dev-agent |
| Documentation | 1-2h | requirements-architect |
| User Validation | 2-3h | User (manual testing) |
| **TOTAL** | **25-34h** | **Full team** |

### Test Count by Level

- Unit Tests: 63
- Integration Tests: 34
- E2E Tests: 21
- **Total**: 118 tests

### Performance SLAs

- get_game_state: < 100ms
- State queries: < 50ms
- Move validation: < 30ms
- Execute move: < 50ms
- Full turn: < 200ms

### Coverage Targets

- Overall: 95%+
- State queries: 100%
- Move validation: 100%
- Execution: 95%+
- Reasoning: 90%+

### Files to Create

- `packages/mcp-server/src/server.ts`
- `packages/mcp-server/src/tools/state.ts`
- `packages/mcp-server/src/tools/validation.ts`
- `packages/mcp-server/src/tools/execution.ts`
- `packages/mcp-server/src/tools/reasoning.ts`
- `packages/mcp-server/tests/` (118 test files)

### Dependencies

- @modelcontextprotocol/sdk
- @principality/core (Phase 1.6)
- Claude API access (for E2E tests)
