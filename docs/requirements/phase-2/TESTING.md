# Phase 2 Testing Specifications: MCP Server Integration

**Status**: REVISED
**Created**: 2025-10-21
**Revised**: 2025-10-22
**Phase**: 2
**Test Count**: 40 tests (20 unit + 12 integration + 8 E2E + 20 evaluation scenarios)
**Coverage Target**: 95%+

---

## Testing Overview

Phase 2 applies the **three-level test framework** from Phase 1.6 to prevent dev→production gaps:

- **Level 1: Unit Tests (20 tests)** - Tool functions in isolation with mocked dependencies
- **Level 2: Integration Tests (12 tests)** - MCP server + game engine integration
- **Level 3: E2E Tests (8 tests)** - Actual Claude API calls in production environment
- **Bonus: Evaluation Scenarios (20 tests)** - Measure LLM optimization capabilities

**Total**: 40 core tests + 20 evaluation scenarios = 60 test activities across all features

**Why Three Levels**: Phase 1.6 taught us that unit tests alone are insufficient:
- Unit tests passed (help function worked)
- Integration tests passed (CLI components worked)
- But production FAILED (import paths wrong in compiled code)
- E2E tests would have caught this

**Phase 2 Prevention**: E2E tests validate compiled JavaScript with real Claude API, catching:
- MCP protocol mismatches
- Module import errors
- API integration issues
- Performance problems under real conditions

---

## Test Strategy

### Quality Over Quantity

**Focus**: High-quality tests that validate complete workflows, not just function signatures.

**Good Test**:
```typescript
// @req: game_get_state returns minimal detail with <100 tokens
// @input: detail_level="minimal"
// @output: {phase, turnNumber, activePlayer, playerCount}
// @edge: Excludes hand, supply, all other fields to save tokens
// @assert: Response contains exactly 4 fields, token_count < 100
// @level: Unit
```

**Bad Test**:
```typescript
// @req: game_get_state returns something
// @assert: result !== undefined
```

### Test Tag System

All tests include structured tags:
- `@req`: Requirement being validated
- `@input`: Input parameters or scenario setup
- `@output`: Expected response structure
- `@edge`: Edge cases handled
- `@assert`: Specific assertions to verify
- `@level`: Unit | Integration | E2E
- `@hint`: Implementation guidance for dev-agent (optional)

### Coverage Targets

- **Unit tests**: 100% for simple tools (get_state, get_valid_moves)
- **Integration tests**: 95%+ for complex workflows (autonomous play loops)
- **E2E tests**: Smoke tests only (~10% of scenarios to limit API costs)
- **Overall**: 95%+ combined coverage

---

## NEW: Evaluation Framework (20 Scenarios)

Phase 2 includes comprehensive evaluation scenarios to validate LLM optimization capabilities.

**Purpose**: Measure LLM learning through realistic gameplay challenges

**Structure**: 20 scenarios total
- **Training set**: 15 scenarios for development/iteration
- **Held-out test set**: 5 scenarios for validation (prevent overfitting)

### Scenario Design Principles (Anthropic Guidance)

**✅ GOOD Scenarios** (multi-step, realistic):
- Require strategic reasoning
- Multiple tool calls needed
- Clear success criteria
- Real gameplay situations

**❌ BAD Scenarios** (simplistic, one-step):
- Single tool call
- No reasoning required
- Trivial validation

### Evaluation Metrics

Track for each scenario:

1. **Accuracy**: Pass/fail based on expected outcome (target: 95%+ pass rate)
2. **Tool Call Count**: Total calls, types used, redundancy (target: <15 calls/scenario)
3. **Token Efficiency**: Total tokens consumed (target: <5,000/scenario)
4. **Error Rate**: Tool errors, validation failures (target: <1% error rate)
5. **Runtime**: Time to completion (target: <30s/scenario)

### Sample Evaluation Scenarios (10 detailed examples)

#### Scenario 1: Opening Hand Optimization (Training)

```
Scenario ID: EVAL-001
Category: Action Phase Optimization
Difficulty: Medium
Phase: Training

Prompt: "Turn 1, opening hand: Village, Smithy, Market, Copper, Copper. Execute the optimal action phase sequence to maximize card draw for this turn. Explain your reasoning step-by-step."

Expected Outcome:
1. Play Village first (+1 card, +2 actions, draw 1)
2. Play Smithy next (+3 cards, 1 action remaining)
3. Play Market last (+1 card, +1 action, +1 buy, +1 coin)
4. Final state: Drew 5 total cards, 1 action remaining, 1 buy, 1 coin

Verification:
- Check move sequence matches optimal order
- Verify final hand size = 10 cards (5 starting + 5 drawn)
- Verify actions remaining = 1
- Check reasoning mentions action economy

Tools Expected:
- game_get_state (detail_level: "standard") - 1 call
- game_get_valid_moves (response_format: "concise") - 1 call
- game_execute_move - 3 calls (Village, Smithy, Market)

Token Budget: <2,000 tokens total
Success Criteria: Optimal sequence played, reasoning coherent
```

#### Scenario 2: Economic vs Victory Decision (Training)

```
Scenario ID: EVAL-002
Category: Strategic Decision Making
Difficulty: Hard
Phase: Training

Prompt: "Turn 8, you have 8 coins in buy phase. Supply shows: Province (6), Gold (30), Silver (40). Your deck contains 5 Copper, 3 Silver, 2 Gold, 3 Estates. What should you buy and why?"

Expected Outcome:
Decision: Buy Province (not Gold)
Reasoning:
- Game likely ending soon (6 Provinces left)
- Already have decent economy (5 treasures)
- Province worth 6 VP (instant scoring)
- Gold only helps future turns (may not get many)

Verification:
- Check buy decision is Province
- Verify reasoning mentions game phase (late game)
- Check consideration of province count
- Validate VP calculation understanding

Tools Expected:
- game_get_state (detail_level: "full") - 1 call
- game_get_valid_moves (response_format: "detailed") - 1 call
- game_execute_move (move: "buy Province") - 1 call

Token Budget: <3,000 tokens
Success Criteria: Correct buy decision + strategic reasoning
```

#### Scenario 3: Multi-Turn Planning (Training)

```
Scenario ID: EVAL-003
Category: Strategic Planning
Difficulty: Hard
Phase: Training

Prompt: "Turn 5, you have 6 coins. Supply: Village (10), Smithy (9), Gold (30), Duchy (8). Plan your next 3 turns to maximize VP acquisition while maintaining economy."

Expected Outcome:
Multi-turn strategy:
- Turn 5: Buy Gold (strengthen economy)
- Turn 6: Buy Duchy (early VP if sufficient coins)
- Turn 7: Buy Province (if 8 coins) or Gold (if not)

Verification:
- Check strategy considers economy first
- Verify VP timing is appropriate
- Validate understanding of economic snowball effect

Tools Expected:
- game_get_state (detail_level: "full") - 1 call
- game_get_performance - 1 call (check trends)
- game_execute_move - 1 call (current turn)

Token Budget: <4,000 tokens
Success Criteria: Multi-turn plan considers economy + VP balance
```

#### Scenario 4: Error Recovery (Training)

```
Scenario ID: EVAL-004
Category: Error Handling
Difficulty: Easy
Phase: Training

Prompt: "Try to buy a Province when you only have 5 coins. Interpret the error message and make a valid alternative purchase."

Expected Outcome:
1. Attempt: game_execute_move(move="buy Province")
2. Error: "Cannot buy Province (cost 8). You have 5 coins."
3. Recovery: game_get_valid_moves to see affordable cards
4. Purchase: Buy Duchy or Silver (valid 5-coin options)

Verification:
- Check LLM attempts invalid move
- Verify error message interpreted correctly
- Validate recovery with valid alternative
- Check no repeated invalid attempts

Tools Expected:
- game_execute_move - 2 calls (failed Province, successful alternative)
- game_get_valid_moves - 1 call (after error)

Token Budget: <2,000 tokens
Success Criteria: LLM recovers from error, makes valid purchase
```

#### Scenario 5: Complex Action Chain (Training)

```
Scenario ID: EVAL-005
Category: Action Chaining
Difficulty: Hard
Phase: Training

Prompt: "Hand: Village, Village, Smithy, Copper, Copper. Maximize cards drawn this turn using optimal action sequencing."

Expected Outcome:
1. Play Village #1 (+1 card, +2 actions)
2. Play Village #2 (+1 card, +2 actions)
3. Play Smithy (+3 cards, 1 action remaining)
4. Total cards drawn: 5 (1+1+3)

Verification:
- Check Villages played before Smithy (action economy)
- Verify all actions utilized efficiently
- Validate understanding of +action mechanics

Tools Expected:
- game_get_state (detail_level: "standard") - 1 call
- game_execute_move - 3 calls (Village, Village, Smithy)

Token Budget: <2,500 tokens
Success Criteria: Optimal chaining (+actions before card draw)
```

#### Scenario 6: Endgame Rush (Held-out Test)

```
Scenario ID: EVAL-006
Category: Endgame Strategy
Difficulty: Hard
Phase: Held-out Test

Prompt: "Turn 15, Provinces: 2 remaining. You have 7 coins. Opponent has 4 Provinces. You have 2 Provinces. What's your optimal strategy?"

Expected Outcome:
Decision: Buy Duchy (3 VP) + Silver (with extra coins)
Reasoning:
- Cannot afford Province (need 8 coins)
- Opponent likely to buy remaining Provinces
- Duchy provides VP toward final score
- Silver maintains economy for remaining turns

Verification:
- Check endgame urgency understood
- Verify VP calculation (opponent ahead)
- Validate decision under pressure

Tools Expected:
- game_get_state (detail_level: "full") - 1 call
- game_get_valid_moves - 1 call
- game_execute_move - 2 calls (Duchy, Silver)

Token Budget: <3,500 tokens
Success Criteria: Strategic decision under endgame pressure
```

#### Scenario 7: Economic Optimization (Held-out Test)

```
Scenario ID: EVAL-007
Category: Economic Building
Difficulty: Medium
Phase: Held-out Test

Prompt: "Turn 3, you have 5 coins. Supply: Gold (30), Silver (40), Duchy (8). Build optimal economy for long game."

Expected Outcome:
Decision: Buy Silver (not Duchy)
Reasoning:
- Turn 3 is early game
- Duchy provides 0 economic value
- Silver accelerates gold purchases
- Long game requires strong economy first

Verification:
- Check game phase awareness (early vs late)
- Verify economic prioritization
- Validate understanding of economic snowball

Tools Expected:
- game_get_state (detail_level: "standard") - 1 call
- game_execute_move (move: "buy Silver") - 1 call

Token Budget: <2,000 tokens
Success Criteria: Correct economic decision in early game
```

#### Scenario 8: Defensive Play (Held-out Test)

```
Scenario ID: EVAL-008
Category: Competitive Strategy
Difficulty: Hard
Phase: Held-out Test

Prompt: "Turn 12, Provinces: 3 remaining. Opponent just bought Province (has 3 total). You have 2 Provinces and 8 coins. Optimal move?"

Expected Outcome:
Decision: Buy Province immediately
Reasoning:
- Opponent ahead by 1 Province
- Only 2 Provinces left after your purchase
- Prevents opponent runaway
- Keeps game within reach

Verification:
- Check competitive awareness
- Verify urgency understood
- Validate VP gap consideration

Tools Expected:
- game_get_state (detail_level: "full") - 1 call
- game_execute_move (move: "buy Province") - 1 call

Token Budget: <2,500 tokens
Success Criteria: Defensive purchase to stay competitive
```

#### Scenario 9: Tempo vs Greed (Held-out Test)

```
Scenario ID: EVAL-009
Category: Risk Management
Difficulty: Hard
Phase: Held-out Test

Prompt: "Turn 6, you have 7 coins. Buy Gold (greedy economy) or Duchy (safe VP)?"

Expected Outcome:
Decision: Context-dependent
- If Provinces > 6: Buy Gold (game not ending soon)
- If Provinces ≤ 3: Buy Duchy (game ending, grab VP)

Reasoning:
- Check Province count (game pace indicator)
- Weigh economic growth vs VP security
- Consider turn count (early = greedy, late = safe)

Verification:
- Check game state queried
- Verify decision logic sound
- Validate reasoning explains tradeoff

Tools Expected:
- game_get_state (detail_level: "full") - 1 call
- game_execute_move - 1 call

Token Budget: <3,000 tokens
Success Criteria: Decision justified by game state analysis
```

#### Scenario 10: Victory Point Counting (Held-out Test)

```
Scenario ID: EVAL-010
Category: Score Calculation
Difficulty: Medium
Phase: Held-out Test

Prompt: "Game ending. You have: 3 Provinces, 2 Duchies, 5 Estates. Opponent has: 4 Provinces, 1 Duchy. Who wins and by how much?"

Expected Outcome:
Calculation:
- You: 3*6 + 2*3 + 5*1 = 18+6+5 = 29 VP
- Opponent: 4*6 + 1*3 = 24+3 = 27 VP
- Result: You win by 2 VP

Verification:
- Check VP math correct
- Verify winner identified correctly
- Validate margin calculated

Tools Expected:
- game_get_state (detail_level: "full") - 1 call
- (Manual calculation, no move execution)

Token Budget: <1,500 tokens
Success Criteria: Correct VP calculation and winner determination
```

### Additional Scenarios (Brief Descriptions)

**Training Scenarios 6-15**:
- EVAL-006: Treasure vs Action card prioritization
- EVAL-007: Deck thinning decision (buy Estate to end game faster?)
- EVAL-008: Multiple buy optimization (2 Silvers vs 1 Duchy)
- EVAL-009: Action-heavy hand management
- EVAL-010: Cleanup phase edge cases
- EVAL-011: Supply pile depletion awareness
- EVAL-012: Turn efficiency optimization (fewest turns to 8 Provinces)
- EVAL-013: Comeback strategy (behind by 12 VP)
- EVAL-014: Consistency test (repeat same scenario 3 times)
- EVAL-015: Performance improvement (play same game twice, measure optimization)

**Held-out Test Scenarios 16-20**:
- EVAL-016: Novel combination (cards not seen in training)
- EVAL-017: Suboptimal recovery (LLM made mistake, can it fix?)
- EVAL-018: Time pressure simulation (limited turns remaining)
- EVAL-019: Strategy adaptation (switch from greedy to aggressive)
- EVAL-020: Full game completion (start → finish autonomously)

### Evaluation Implementation

**Programmatic Execution**:
```typescript
// Simple agentic loop
async function evaluateScenario(scenario: EvaluationScenario): Promise<ScenarioResult> {
  const metrics = { toolCalls: 0, tokens: 0, errors: 0, runtime: 0 };
  const startTime = Date.now();

  // Setup game state per scenario
  await setupScenarioState(scenario.setup);

  // Execute LLM loop
  while (!scenario.isDone()) {
    const llmResponse = await callClaude(scenario.prompt, metrics);
    const toolCalls = parseToolCalls(llmResponse);

    for (const call of toolCalls) {
      metrics.toolCalls++;
      const result = await executeTool(call.name, call.params);
      metrics.tokens += estimateTokens(result);
      if (!result.success) metrics.errors++;
    }
  }

  metrics.runtime = Date.now() - startTime;

  // Verify outcome
  const passed = scenario.verify(currentGameState);

  return { scenario: scenario.id, passed, metrics };
}
```

**Claude Configuration**:
- Default: Claude Haiku 4.5 (cost-effective, $0.25/$1.25 per M tokens)
- Quality validation: Claude Sonnet 4.5 (select scenarios)
- Enable extended thinking for Sonnet
- System prompt includes reasoning/feedback blocks

**Budget Management**:
- Haiku: ~15 scenarios × 5k tokens = 75k tokens × $0.25/$1.25 = ~$0.12
- Sonnet: ~5 scenarios × 5k tokens = 25k tokens × $3/$15 = ~$0.45
- **Total**: ~$0.60 per full evaluation run
- **Monthly**: ~$50 (assumes 80-100 runs during development)

---

## Test Distribution Summary

| Feature | Unit | Integration | E2E | Total |
|---------|------|-------------|-----|-------|
| Feature 1: MCP Server | 5 | 3 | 2 | 10 |
| Feature 2: game_observe | 7 | 5 | 3 | 15 |
| Feature 3: game_execute + game_session | 8 | 4 | 3 | 15 |
| **CORE TESTS TOTAL** | **20** | **12** | **8** | **40** |
| Evaluation Scenarios | - | - | 20 | 20 |
| **GRAND TOTAL** | **20** | **12** | **28** | **60** |

---

## Feature 1: MCP Server Infrastructure (10 tests)

### Unit Tests (5 tests)

**UT1.1: Server Initialization**
```typescript
// @req: MCPGameServer initializes with correct configuration
// @input: Default config
// @output: Server instance with 7 registered tools
// @assert: server.tools.length === 7, all have game_ prefix
// @level: Unit
```

**UT1.2: Tool Registration**
```typescript
// @req: All 7 tools registered with valid JSON schemas
// @input: Server initialization
// @output: Each tool has name, description, inputSchema
// @assert: Schemas validate as JSON Schema
// @level: Unit
```

**UT1.3: Request Routing**
```typescript
// @req: Requests routed to correct handler
// @input: Mock request for "game_get_state"
// @output: Handler called with correct args
// @assert: Correct handler invoked
// @level: Unit
```

**UT1.4: Error Handling - Invalid Tool**
```typescript
// @req: Unknown tool returns actionable error
// @input: Request for "invalid_tool"
// @output: Error with tool list suggestion
// @assert: Error message includes available tools
// @level: Unit
```

**UT1.5: Malformed Request**
```typescript
// @req: Invalid JSON returns helpful error
// @input: Malformed JSON
// @output: Error with format example
// @assert: Server continues running
// @level: Unit
```

**UT1.6: Model Selection**
```typescript
// @req: Model tracked in session metadata
// @input: game_start(model="sonnet")
// @output: Session tracks model
// @assert: currentModel === "sonnet"
// @level: Unit
```

**UT1.7: Performance Logging**
```typescript
// @req: Tool calls logged with duration
// @input: game_get_state call
// @output: Log entry with timestamp, duration
// @assert: Log contains required fields
// @level: Unit
```

**UT1.8: Graceful Shutdown**
```typescript
// @req: Server shuts down cleanly
// @input: SIGINT signal
// @output: Graceful shutdown, exit code 0
// @assert: No crashes, clean exit
// @level: Unit
```

### Integration Tests (3 tests)

**IT1.1: Server + Engine Integration**
**IT1.2: Sequential Tool Calls**
**IT1.3: Error Recovery**

### E2E Tests (2 tests)

**E2E1.1: Claude Desktop Connection**
**E2E1.2: MCP Tool Discovery and Invocation**

---

## Feature 2: game_observe Tool (15 tests)

**Unit Tests (7 tests)**:
- UT2.1-2.3: Detail levels (minimal/standard/full)
- UT2.4-2.5: Token limits and efficiency
- UT2.6-2.7: Edge cases (no moves, game over)

**Integration Tests (5 tests)**:
- IT2.1: game_observe with real GameEngine
- IT2.2: State reflects after move execution
- IT2.3: Valid moves accurate for each phase
- IT2.4: Token counting accurate
- IT2.5: Multiple queries consistent

**E2E Tests (3 tests)**:
- E2E2.1: Claude queries state via game_observe
- E2E2.2: Claude chooses detail_level based on complexity
- E2E2.3: Claude interprets moves from response

---

## Feature 3: game_execute + game_session Tools (15 tests)

**Unit Tests (8 tests)**:
- UT3.1-3.3: game_execute (success, errors, parsing)
- UT3.4-3.5: game_execute atomicity and state integrity
- UT3.6-3.7: game_session (new, end)
- UT3.8: Idempotent operations

**Integration Tests (4 tests)**:
- IT3.1: game_execute with real GameEngine
- IT3.2: game_session lifecycle management
- IT3.3: Phase transitions work correctly
- IT3.4: Error doesn't corrupt state

**E2E Tests (3 tests)**:
- E2E3.1: Claude executes single move via game_execute
- E2E3.2: Claude manages game lifecycle via game_session
- E2E3.3: Claude completes full game autonomously

---

## Test Execution Plan

**Phase 1: Unit Tests** (~3 hours)
- Run: `npm test -- --testPathPattern="unit/"`
- Target: 100% pass

**Phase 2: Integration Tests** (~2 hours)
- Run: `npm test -- --testPathPattern="integration/"`
- Target: 100% pass

**Phase 3: E2E Tests** (~1 hour)
- Run: `npm test -- --testPathPattern="e2e/"`
- Target: 95% pass

---

## Performance Benchmarks

**SLA Targets**:
- game_get_state (minimal): < 50ms
- game_get_state (standard): < 100ms
- game_get_state (full): < 150ms
- game_get_valid_moves: < 50ms
- game_execute_move: < 50ms
- game_get_performance: < 100ms
- game_get_history: < 100ms

---

## Conclusion

Phase 2 testing provides comprehensive validation across 40 core tests + 20 evaluation scenarios to measure LLM optimization.

**Coverage**: 95%+ target maintained
**Effort**: ~3 hours test implementation (vs ~5.5 for 72-test suite)
**Value**: Prevents integration gaps, validates LLM learning, simpler test suite

**Test Suite Reduction**: 72 → 40 core tests (44% reduction) while maintaining:
- ✅ All three-level framework (unit/integration/E2E)
- ✅ Full feature coverage (3 core tools)
- ✅ Production readiness (E2E validates compiled code + MCP protocol)
- ✅ 95%+ coverage target
- ✅ 20 evaluation scenarios unchanged

---

**Document Status**: REVISED
**Created**: 2025-10-21
**Revised**: 2025-10-22 (40 core tests from 72, three-level framework maintained)
**Author**: requirements-architect
