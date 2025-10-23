# Phase 2.1 Testing Specifications: AI Gameplay Enhancement

**Status**: ACTIVE
**Created**: 2025-10-22
**Phase**: 2.1
**Test Count**: 45-50 tests (15 unit + 15 integration + 15 E2E)
**Coverage Target**: 95%+

---

## Testing Overview

Phase 2.1 testing validates skill functionality and logging infrastructure across three levels:

- **Level 1: Unit Tests (15 tests)** - Skills load, content validates, logging formats correctly
- **Level 2: Integration Tests (15 tests)** - Skills integrate with Claude context, logging with MCP server
- **Level 3: E2E Tests (15 tests)** - Real Claude gameplay with skills and logging enabled

**Total**: 45 tests across all features

**Why Three Levels**:
- Unit tests ensure components work in isolation
- Integration tests verify components work together
- E2E tests validate complete user workflow with real Claude

---

## Test Strategy

### Quality Principles

**Test Completeness**: Each feature tested at all three levels
**Real Scenarios**: Tests based on actual Claude gameplay patterns
**Measurable Success**: Clear pass/fail criteria for each test
**Production Readiness**: E2E tests use real Claude API (cost managed via test selection)

### Test Tag System

All tests include structured tags:
- `@req`: Requirement being validated
- `@input`: Input parameters or scenario setup
- `@output`: Expected response structure
- `@edge`: Edge cases handled
- `@assert`: Specific assertions to verify
- `@level`: Unit | Integration | E2E
- `@cost`: Estimated Claude API cost (E2E only)

---

## Feature 1: Dominion Mechanics Skill (15 tests)

### Unit Tests (5 tests)

**UT1.1: Skill File Loads Correctly**
```typescript
// @req: SKILL.md loads and parses without errors
// @input: File path to .claude/skills/dominion-mechanics/SKILL.md
// @output: Valid markdown with > 200 lines, all sections present
// @assert: File exists, has required headers, no parse errors
// @level: Unit
```

**UT1.2: Examples File Structure**
```typescript
// @req: EXAMPLES.md contains 15+ detailed scenarios
// @input: File path to .claude/skills/dominion-mechanics/EXAMPLES.md
// @output: Each example has: problem, solution, explanation
// @assert: Count >= 15, each example complete, no broken references
// @level: Unit
```

**UT1.3: Content Validation - Game Rules**
```typescript
// @req: Core game mechanics correctly documented
// @input: Parse SKILL.md sections 1-6
// @output: All rules accurate (verified against core package)
// @assert: Coin generation section mentions "treasures must be PLAYED"
// @assert: Action economy section explains +1 action mechanics
// @assert: Phase flow section lists: action → buy → cleanup
// @level: Unit
```

**UT1.4: Content Validation - Card References**
```typescript
// @req: All 15 cards documented with correct costs/effects
// @input: Card quick reference section in SKILL.md
// @output: All 15 cards present with correct attributes
// @assert: Copper = 0 cost, treasure type, +1 coin effect
// @assert: Village = 3 cost, action type, +1 card +2 actions effect
// @assert: Province = 8 cost, victory type, +6 VP effect
// @level: Unit
```

**UT1.5: Syntax Reference Accuracy**
```typescript
// @req: Command syntax documentation matches game engine
// @input: Syntax section in SKILL.md
// @output: Examples show correct format ("play 0", "buy Copper", "end")
// @assert: All syntax examples are valid moves
// @assert: Error message examples are realistic from Phase 2.0 logs
// @level: Unit
```

### Integration Tests (5 tests)

**IT1.1: Skill Loads into Claude Context**
```typescript
// @req: Skill markdown can be injected into Claude's context
// @input: SKILL.md content, Claude API with skill injection
// @output: Claude receives context, acknowledges understanding
// @assert: Claude can answer "What's the coin cost of Province?"
// @assert: Claude can explain "Why must treasures be played?"
// @level: Integration
// @cost: $0.01 (small prompt)
```

**IT1.2: Example Scenario Comprehension**
```typescript
// @req: Claude understands examples from EXAMPLES.md
// @input: Specific example (e.g., Opening hand optimization)
// @output: Claude can apply knowledge to new scenario
// @assert: Claude correctly sequences Village → Smithy → Market
// @assert: Claude explains reasoning based on action economy
// @level: Integration
// @cost: $0.02 (moderate prompt)
```

**IT1.3: Error Recovery with Skill**
```typescript
// @req: Claude recovers from error when skill provided
// @input: Invalid move attempt + SKILL.md section for that error
// @output: Claude reads skill, corrects mistake, completes move
// @assert: Recovery within 3 tool calls
// @assert: Claude's correction is correct (verified by game engine)
// @level: Integration
// @cost: $0.02 (error recovery scenario)
```

**IT1.4: Skill Doesn't Break Valid Moves**
```typescript
// @req: Skill injection doesn't interfere with correct moves
// @input: Valid move sequence with skill in context
// @output: Claude continues normal gameplay
// @assert: All moves succeed
// @assert: No performance degradation (same latency as without skill)
// @level: Integration
// @cost: $0.03 (multiple moves)
```

**IT1.5: Auto-Invocation Trigger Detection**
```typescript
// @req: System detects when skill should be auto-invoked
// @input: Claude's response showing confusion (invalid move attempt, question)
// @output: System automatically includes SKILL.md in next context
// @assert: Trigger detected within 100ms
// @assert: Skill injection transparent to Claude (no message about injection)
// @level: Integration
```

### E2E Tests (5 tests)

**E2E1.1: Full Confused → Recovery Cycle**
```typescript
// @req: End-to-end confused player → skill injection → recovery
// @input: Claude starting fresh game, attempting early mistakes
// @output: Claude struggles initially, then recovers with skill help
// @assert: Move success rate improves after turn 5
// @assert: Confusion errors < 2 per game (baseline ~5)
// @level: E2E
// @cost: $0.10 (full gameplay with errors)
```

**E2E1.2: Syntax Error Recovery E2E**
```typescript
// @req: Claude makes syntax error, skill helps recovery
// @input: New game, Claude makes invalid command
// @output: System injects syntax reference, Claude recovers
// @assert: Recovery within 3 tool calls
// @assert: Claude's next valid command executes successfully
// @level: E2E
// @cost: $0.08 (syntax error scenario)
```

**E2E1.3: Coin Generation Understanding**
```typescript
// @req: Claude understands coin generation mechanics end-to-end
// @input: Game state with treasures in hand, Claude in buy phase
// @output: Claude plays treasures first, then buys correctly
// @assert: Treasures played before buy attempt
// @assert: Buy decision matches available coins
// @level: E2E
// @cost: $0.08 (buy phase scenario)
```

**E2E1.4: Action Economy Mastery**
```typescript
// @req: Claude applies action economy principles consistently
// @input: 3 moves with different action card combinations
// @output: Claude sequences optimally (more actions first)
// @assert: Action cards played before non-action cards
// @assert: Card draw benefit maximized
// @level: E2E
// @cost: $0.10 (multiple scenarios)
```

**E2E1.5: Consistency Across Contexts**
```typescript
// @req: Claude consistently applies rules despite context changes
// @input: 3 separate games, same scenarios
// @output: Consistent behavior across all 3 games
// @assert: Move sequences match (same hand → same play order)
// @assert: Error recovery repeatable
// @level: E2E
// @cost: $0.15 (3 separate test runs)
```

---

## Feature 2: Dominion Strategy Skill (15 tests)

### Unit Tests (5 tests)

**UT2.1: Strategy File Loads**
```typescript
// @req: SKILL.md loads and contains strategy principles
// @input: File path to .claude/skills/dominion-strategy/SKILL.md
// @output: Valid markdown with > 250 lines, all sections
// @assert: File exists, Big Money section present, card evaluation matrix complete
// @level: Unit
```

**UT2.2: Strategy Examples Complete**
```typescript
// @req: STRATEGIES.md contains 15+ detailed strategy scenarios
// @input: File path to .claude/skills/dominion-strategy/STRATEGIES.md
// @output: Each strategy scenario has decision tree, examples, when to apply
// @assert: Count >= 15, complete tactical information, no vague advice
// @level: Unit
```

**UT2.3: Big Money Baseline Accuracy**
```typescript
// @req: Big Money strategy documented correctly
// @input: Big Money section from SKILL.md
// @output: Buy order documented: Gold → Silver → Duchy → Province
// @assert: Progression matches Phase 1.6 testing insights
// @assert: Timing guidelines clear (when to shift to VP)
// @level: Unit
```

**UT2.4: Card Evaluation Matrix Completeness**
```typescript
// @req: All 15 cards in evaluation matrix with ratings
// @input: Card evaluation table from SKILL.md
// @output: Each card has: cost, effect, early/mid/late game rating, synergies
// @assert: All 15 cards present
// @assert: Ratings make strategic sense (Village useful early, weak late)
// @level: Unit
```

**UT2.5: Game Phase Guidance**
```typescript
// @req: Clear guidance for each game phase
// @input: Sections on early/mid/late game strategies
// @output: Distinct strategies for each phase with decision trees
// @assert: Early game emphasizes economy (treasures > VP)
// @assert: Late game emphasizes speed (Provinces > treasures)
// @level: Unit
```

### Integration Tests (5 tests)

**IT2.1: Strategy Context Integration**
```typescript
// @req: Strategy skill integrates with Claude context
// @input: SKILL.md injected, Claude given buy decision
// @output: Claude references strategy principles in reasoning
// @assert: Claude can explain buy decisions using strategy framework
// @assert: Reasoning mentions economy, VP timing, or card synergy
// @level: Integration
// @cost: $0.02 (context injection + decision)
```

**IT2.2: Decision Consistency**
```typescript
// @req: Claude makes consistent decisions with strategy skill
// @input: Same game state (3 coins available) presented 3 times
// @output: Claude makes same decision all 3 times
// @assert: Same state → Silver buy (not Duchy) all 3 times
// @level: Integration
// @cost: $0.05 (3 decision scenarios)
```

**IT2.3: Endgame Recognition**
```typescript
// @req: Strategy skill enables endgame awareness
// @input: Late game state (2 Provinces remaining)
// @output: Claude recognizes urgency, changes strategy
// @assert: Claude buys final Provinces immediately
// @assert: Behavior differs from turn 5 equivalent (economy priority)
// @level: Integration
// @cost: $0.03 (endgame scenario)
```

**IT2.4: Strategy vs Rules Conflict**
```typescript
// @req: Strategy skill doesn't override rules
// @input: Strategy suggests move that violates rules
// @output: Claude follows rules (strategy only suggests, rules enforce)
// @assert: Claude cannot execute illegal move
// @assert: Strategy skill used to inform valid options
// @level: Integration
```

**IT2.5: Multi-Turn Planning**
```typescript
// @req: Claude can plan multiple turns with strategy guidance
// @input: Early game state, full strategy context
// @output: Claude can articulate 3-turn plan following strategy
// @assert: Plan mentions economy growth
// @assert: Plan identifies VP acquisition point
// @level: Integration
// @cost: $0.04 (planning scenario)
```

### E2E Tests (5 tests)

**E2E2.1: Full Game Quality Assessment**
```typescript
// @req: End-to-end game with strategy skill shows improved move quality
// @input: Complete game from start to finish with strategy skill
// @output: Move quality assessed by game engine heuristic
// @assert: Expert review: > 85% of moves strategically sound
// @assert: No obviously suboptimal moves (e.g., Duchy on turn 3)
// @level: E2E
// @cost: $0.12 (full game)
```

**E2E2.2: Win Rate Improvement**
```typescript
// @req: Win rate improves with strategy skill vs baseline
// @input: 5 complete games with strategy skill enabled
// @output: Win rate measured against deterministic opponent
// @assert: Win rate > 60% (Phase 2.0 baseline)
// @assert: 5/5 games show strategic consistency
// @level: E2E
// @cost: $0.60 (5 full games)
```

**E2E2.3: Economic Progression Optimization**
```typescript
// @req: Claude follows Big Money progression with strategy skill
// @input: Early game (turns 1-10)
// @output: Treasure purchases follow: Copper → Silver → Gold progression
// @assert: Duchies purchased after Silver base established
// @assert: Gold purchased before Province attempts
// @level: E2E
// @cost: $0.08 (early game focused)
```

**E2E2.4: VP Timing Strategy**
```typescript
// @req: Claude applies VP timing strategy end-to-end
// @input: Full game tracking VP purchases
// @output: Provinces purchased in mid-game (turns 5-15), not early/late
// @assert: Turn 3: No VP purchases (economy building)
// @assert: Turn 8: Provinces purchased when 8 coins available
// @assert: Turn 20: Only Provinces if still relevant
// @level: E2E
// @cost: $0.12 (full game with focus on VP decisions)
```

**E2E2.5: Strategy Consistency Across Players**
```typescript
// @req: Strategy skill produces consistent behavior across tests
// @input: 3 identical game seeds with strategy skill
// @output: Identical game progressions (same moves each time)
// @assert: Move sequences match perfectly (deterministic)
// @assert: Strategy applied consistently (not random variations)
// @level: E2E
// @cost: $0.30 (3 full games with same seed)
```

---

## Feature 3: Enhanced Tool Logging (15 tests)

### Unit Tests (5 tests)

**UT3.1: Logger Initialization**
```typescript
// @req: Logger initializes with correct configuration
// @input: Config with LOG_LEVEL=DEBUG, LOG_FILE=/tmp/test.log
// @output: Logger ready for use
// @assert: log_level set to DEBUG
// @assert: File handler created (or file creation deferred)
// @level: Unit
```

**UT3.2: Log Entry Schema Validation**
```typescript
// @req: Log entries conform to JSON schema
// @input: Typical INFO level log entry
// @output: JSON parseable with required fields
// @assert: Fields: timestamp, request_id, tool, duration_ms, level
// @assert: Timestamp in ISO 8601 format
// @assert: Duration numeric
// @level: Unit
```

**UT3.3: DEBUG Level State Snapshots**
```typescript
// @req: DEBUG level includes state snapshots
// @input: Tool call with DEBUG logging
// @output: Log entry includes state_before, state_after
// @assert: state_before.phase matches pre-move state
// @assert: state_after.phase matches post-move state
// @assert: Both include state_hash for verification
// @level: Unit
```

**UT3.4: TRACE Level Decision Annotation**
```typescript
// @req: TRACE level captures decision reasoning
// @input: Tool call with decision metadata
// @output: Log entry includes decision field with reasoning
// @assert: decision.reasoning text present
// @assert: decision.alternatives_considered array present
// @assert: decision.confidence level recorded
// @level: Unit
```

**UT3.5: Performance Overhead Measurement**
```typescript
// @req: Logging adds minimal overhead
// @input: Tool call with INFO, DEBUG, TRACE logging
// @output: Measured overhead for each level
// @assert: INFO overhead < 1ms
// @assert: DEBUG overhead < 3ms
// @assert: TRACE overhead < 5ms
// @level: Unit
```

### Integration Tests (5 tests)

**IT3.1: Logger Integrates with MCP Server**
```typescript
// @req: Logger middleware installed in MCP server
// @input: MCP server with logging enabled
// @output: All tool calls logged automatically
// @assert: game_observe calls logged
// @assert: game_execute calls logged
// @assert: game_session calls logged
// @level: Integration
```

**IT3.2: Log File Writing**
```typescript
// @req: Logs written to file correctly
// @input: Logger configured with LOG_FILE=/tmp/test.log
// @output: File created and populated with log entries
// @assert: File exists after tool calls
// @assert: File contains valid JSON lines (one entry per line)
// @assert: Entries parseable by JSON parser
// @level: Integration
```

**IT3.3: Log Rotation**
```typescript
// @req: Log files rotate when exceeding size limit
// @input: Logger with LOG_MAX_FILE_SIZE=1MB
// @output: Generate >1MB of logs
// @assert: File rotated (game.log.1 created)
// @assert: Current file size < 1MB
// @assert: No log entries lost
// @level: Integration
```

**IT3.4: Multiple Log Levels Simultaneously**
```typescript
// @req: INFO, DEBUG, TRACE logs distinguish correctly
// @input: Single tool call logged at all 3 levels
// @output: Different log entries for each level
// @assert: INFO entry: minimal fields
// @assert: DEBUG entry: includes state snapshots
// @assert: TRACE entry: includes decision reasoning
// @level: Integration
```

**IT3.5: Request ID Correlation**
```typescript
// @req: Multiple logs for same tool call share request_id
// @input: Tool call with pre/post logging
// @output: All logs have same request_id
// @assert: request_id format: UUID or similar
// @assert: Can group all logs for single request
// @level: Integration
```

### E2E Tests (5 tests)

**E2E3.1: Full Game Logging**
```typescript
// @req: Complete game fully logged with all details
// @input: Run full game with DEBUG logging
// @output: Game.log file contains all moves
// @assert: One log entry per tool call
// @assert: Move sequence traceable from logs
// @assert: File size < 5MB for typical game
// @level: E2E
// @cost: $0.05 (logging overhead test)
```

**E2E3.2: Log Analysis - State Progression**
```typescript
// @req: Full game state progression reconstructible from logs
// @input: Parse game.log from complete game
// @output: Reconstruct game state at each turn
// @assert: Reconstructed state matches actual state
// @assert: Phase transitions correct (action → buy → cleanup)
// @assert: Turn numbers increment properly
// @level: E2E
```

**E2E3.3: Log Analysis - Move Validation**
```typescript
// @req: All moves logged and validated correct
// @input: Parse game.log, validate each move
// @output: All moves legal (verified against rules)
// @assert: 100% of moves logged
// @assert: All logged moves succeed (no failures expected in log)
// @level: E2E
```

**E2E3.4: Performance Metrics Extraction**
```typescript
// @req: Performance metrics extractable from logs
// @input: Parse game.log for duration metrics
// @output: Tool latency statistics
// @assert: Tool latencies < 100ms (average)
// @assert: P95 latency < 150ms
// @assert: No timeout errors (tools complete successfully)
// @level: E2E
```

**E2E3.5: Decision Reasoning Tracking**
```typescript
// @req: Claude's decision reasoning fully logged
// @input: Full game with TRACE logging and decision annotations
// @output: Parse game.log for decision reasoning
// @assert: Each buy decision logged with reasoning
// @assert: Alternative considerations captured
// @assert: Confidence levels recorded
// @level: E2E
// @cost: $0.12 (full game with decision tracking)
```

---

## Feature 4: E2E Automated Haiku Gameplay Tests

**Status**: NEW for Phase 2.1
**Test Count**: 8-10 automated gameplay tests using real Claude Haiku API
**Total Cost**: < $0.50 for complete suite
**Duration**: 40-100 minutes total execution (5-12 minutes per test)
**Location**: `packages/mcp-server/tests/e2e/haiku-gameplay.test.ts` (NEW)

### Context: Existing E2E Infrastructure

Phase 2.0 created 17 baseline E2E tests in `packages/mcp-server/tests/e2e/claude-api.test.ts`:
- 15 tests passed successfully
- 2 tests had aspirational token goals (real Claude behavior was correct)
- All tests validated MCP server + Claude API integration
- Tests use `claude-api-helpers.ts` with token tracking

**Phase 2.1 Enhancement**: Build on this infrastructure with 8-10 new automated gameplay tests specifically measuring Phase 2.1 improvements (Mechanics Skill, Strategy Skill, Enhanced Logging).

### Why Automated Haiku Gameplay Tests?

**Requirements**:
1. Validate skills actually work in real Claude gameplay (not just loaded)
2. Measure Phase 2.1 improvements: fewer errors, better strategy
3. Cost-efficient: Haiku model ~$0.05/game vs Sonnet ~$0.20/game
4. Regression testing: Run before each release to catch regressions
5. Behavioral metrics: Focus on real Claude behavior, not aspirational targets

**Success Definition**: Tests pass consistently without aspirational expectations (based on actual Haiku capability, Phase 2.0 baseline, not ideal theoretical performance)

### Test Suite A: Mechanics Skill Validation (3 tests)

**E2E4.1: Mechanics Skill Auto-Invocation During Error Recovery**

**Requirement**: When Claude makes mechanical error, auto-invoke Mechanics Skill and Claude recovers correctly

**Scenario**:
1. Start new game with deterministic seed
2. Play until Claude attempts invalid move (detected by server)
3. MCP server auto-injects Mechanics Skill context
4. Claude reads skill, understands mistake, makes valid next move

**Unit Test Specification**:
```typescript
// @req: Mechanics Skill loads and contains error recovery sections
// @input: File .claude/skills/dominion-mechanics/SKILL.md
// @output: Contains sections for "Common Mistakes", "Error Recovery", examples
// @assert: "play treasures before buying" concept documented
// @assert: "syntax error" recovery guidance present
// @level: Unit
// @test: UT4.1 - Skill file structure validation
```

**Integration Test Specification**:
```typescript
// @req: System detects when Mechanics Skill should be auto-invoked
// @input: Invalid move attempt: Claude sends "play village" (lowercase, wrong syntax)
// @output: System detects error, marks for skill injection
// @assert: Error detected within 100ms
// @assert: Skill markdown can be injected into next Claude context
// @level: Integration
// @test: IT4.1 - Error detection and skill injection trigger
```

**E2E Test Specification**:
```typescript
// @req: E2E4.1 - Claude confused → error → skill injection → recovery
// @input: Full game, Claude starting fresh, attempting early mistakes
// @output: Claude struggles, recovers with skill help
// @assert: Confusion errors < 2 per game (Phase 2.0 baseline ~5)
// @assert: Recovery within 3 tool calls of error
// @assert: Next move after recovery is valid
// @metrics:
//   - move_error_count (starts high, drops after skill injection)
//   - recovery_success_rate (1.0 = always recovers)
//   - recovery_move_validity (1.0 = all recovery moves valid)
// @level: E2E
// @cost: ~$0.08 (game with errors and skill injection)
// @duration: 5-10 minutes
// @assertions:
//   - Minimum 1 error occurs (validates test catches something)
//   - Error recovery success rate > 85% (skill helps)
//   - No game crashes or exceptions
```

**Metrics Output** (JSON):
```json
{
  "test_id": "E2E4.1",
  "game_seed": "deterministic-seed-123",
  "total_moves": 45,
  "errors_encountered": 2,
  "skills_invoked": [
    {"skill": "dominion-mechanics", "turn": 5, "trigger": "invalid_move"}
  ],
  "recovery_success": 2,
  "recovery_attempts": 2,
  "average_recovery_moves": 1.5,
  "tokens_used": 850,
  "cost": "$0.0034",
  "duration_seconds": 285,
  "pass": true,
  "reasoning": "2 errors encountered, both recovered successfully with skill help"
}
```

---

**E2E4.2: Coin Generation Understanding**

**Requirement**: Claude understands coin generation and plays treasures before buying

**Scenario**:
1. Mid-game state with mixed treasures and action cards
2. Claude attempts to buy without playing treasures
3. MCP detects insufficient coins error
4. Skill injection provides coin generation guidance
5. Claude realizes must play treasures first

**E2E Test Specification**:
```typescript
// @req: E2E4.2 - Claude learns coin generation flow
// @input: Full game, multiple turns with treasure plays and buying
// @output: Claude correctly plays treasures before attempting buy
// @metrics:
//   - treasure_play_count (all treasures played before buy)
//   - buy_coin_availability (coins available when buy executed)
//   - move_validity_percentage (100% for turns 3+)
// @assert: By turn 3: 100% of buys have coins available
// @assert: No "insufficient coins" errors after first 2 turns
// @assert: Treasure → Coin → Buy sequence correct
// @level: E2E
// @cost: ~$0.07
// @duration: 5-8 minutes
```

**Metrics Output**:
```json
{
  "test_id": "E2E4.2",
  "game_seed": "deterministic-seed-456",
  "total_turns": 12,
  "coin_generation_errors": 0,
  "treasure_plays_before_buy": 12,
  "buy_success_rate": 1.0,
  "average_coins_at_buy": 4.2,
  "tokens_used": 720,
  "cost": "$0.0029",
  "pass": true
}
```

---

**E2E4.3: Phase Transitions and Move Validity**

**Requirement**: Claude executes moves appropriate to each phase (action → buy → cleanup)

**Scenario**:
1. Full turn cycle with clear phase transitions
2. Track move types per phase (action cards in action phase, buying in buy phase)
3. Validate phase-appropriate move execution
4. No invalid phase moves

**E2E Test Specification**:
```typescript
// @req: E2E4.3 - Claude understands phase transitions
// @input: Full game session with clear logging of phases
// @output: All moves execute in correct phase
// @metrics:
//   - phase_error_count (invalid moves for phase)
//   - action_phase_move_validity (% of moves valid for action phase)
//   - buy_phase_move_validity (% of moves valid for buy phase)
//   - phase_transition_count (should equal turn count)
// @assert: phase_error_count = 0 (after skill injection)
// @assert: move_validity_percentage > 95%
// @level: E2E
// @cost: ~$0.06
// @duration: 4-6 minutes
```

**Metrics Output**:
```json
{
  "test_id": "E2E4.3",
  "game_seed": "deterministic-seed-789",
  "total_phases": 36,
  "phase_errors": 0,
  "valid_phase_moves": 36,
  "phase_transition_accuracy": 1.0,
  "tokens_used": 650,
  "cost": "$0.0026",
  "pass": true
}
```

---

### Test Suite B: Strategy Skill Validation (3 tests)

**E2E4.4: Economic Progression and Buy Decisions**

**Requirement**: Claude follows economically sound progression: treasures build economy, VP timing appropriate

**Scenario**:
1. Track all buy decisions throughout game
2. Verify progression: Copper → Silver → Gold (when available)
3. Verify VP acquisition timing (not too early, not too late)
4. Compare to Big Money baseline strategy

**E2E Test Specification**:
```typescript
// @req: E2E4.4 - Claude makes economically sound decisions
// @input: Full game with buy decision tracking
// @output: Buy sequence follows Big Money progression
// @metrics:
//   - treasure_progression_adherence (% moves follow progression)
//   - vp_acquisition_timing (turn VP first purchased)
//   - economic_accumulation_rate (coins available over time)
// @assert: > 85% of buy decisions match optimal progression
// @assert: VP acquired between turns 5-10 (not turn 1, not turn 15)
// @assert: Final VP count > 6
// @level: E2E
// @cost: ~$0.08
// @duration: 6-8 minutes
```

**Metrics Output**:
```json
{
  "test_id": "E2E4.4",
  "game_seed": "deterministic-seed-abc",
  "total_buys": 25,
  "optimal_buys": 22,
  "progression_adherence": 0.88,
  "treasure_buys": 18,
  "vp_buys": 7,
  "first_vp_turn": 7,
  "final_vp_total": 9,
  "economic_growth_rate": 1.15,
  "tokens_used": 880,
  "cost": "$0.0035",
  "pass": true
}
```

---

**E2E4.5: Strategy Consistency Across Decisions**

**Requirement**: Claude applies strategy consistently (same situations → same decisions)

**Scenario**:
1. Replay same game seed twice with strategy skill
2. Compare move sequences
3. Verify identical/near-identical decisions
4. Validate consistency (strategy not random)

**E2E Test Specification**:
```typescript
// @req: E2E4.5 - Claude applies strategy consistently
// @input: Same seed, run twice, compare move sequences
// @output: Identical game progressions
// @metrics:
//   - move_sequence_similarity (% of moves identical)
//   - decision_consistency_score (deterministic scoring)
// @assert: move_sequence_similarity > 95%
// @assert: same_situation → same_decision (verified manually)
// @level: E2E
// @cost: ~$0.16 (2 full games)
// @duration: 10-12 minutes
```

**Metrics Output** (Run 1):
```json
{
  "test_id": "E2E4.5-run1",
  "game_seed": "consistency-seed-def",
  "total_moves": 48,
  "tokens_used": 920,
  "cost": "$0.0037",
  "move_sequence": ["play 0", "play 1", "buy Copper", ...]
}
```

**Metrics Output** (Run 2 - Comparison):
```json
{
  "test_id": "E2E4.5-run2",
  "game_seed": "consistency-seed-def",
  "total_moves": 48,
  "move_sequence_match": 0.98,
  "identical_moves": 47,
  "different_moves": 1,
  "decision_consistency": 0.98,
  "tokens_used": 895,
  "cost": "$0.0036",
  "pass": true,
  "note": "1 move difference in non-critical decision (both valid)"
}
```

---

**E2E4.6: Full Game Completion and Win**

**Requirement**: Claude wins the game with strategy skill

**Scenario**:
1. Play complete game (20-30 turns) with strategy skill enabled
2. Track turns to completion
3. Verify victory condition (Provinces empty or 3 piles empty)
4. Measure final VP total

**E2E Test Specification**:
```typescript
// @req: E2E4.6 - Claude wins game with strategy skill
// @input: Full game from start to victory condition
// @output: Game reaches completion with Claude victory
// @metrics:
//   - game_completion_status (WIN | LOSS | ERROR)
//   - turns_to_completion
//   - final_vp_total
//   - province_count_final
//   - victory_type (Provinces empty | Piles empty)
// @assert: status = WIN
// @assert: turns_to_completion <= 30 (reasonable time)
// @assert: final_vp_total >= 8 (competitive score)
// @level: E2E
// @cost: ~$0.10
// @duration: 8-12 minutes
```

**Metrics Output**:
```json
{
  "test_id": "E2E4.6",
  "game_seed": "full-game-seed-123",
  "game_completion_status": "WIN",
  "victory_type": "Provinces empty",
  "turns_completed": 18,
  "final_vp_total": 12,
  "province_count_final": 0,
  "estate_count_final": 3,
  "duchy_count_final": 2,
  "tokens_used": 1100,
  "cost": "$0.0044",
  "pass": true
}
```

---

### Test Suite C: Logging Infrastructure Validation (2 tests)

**E2E4.7: Full Game Session Logging**

**Requirement**: Complete game fully logged with all tool calls, state snapshots, and metrics

**Scenario**:
1. Run full game with LOG_LEVEL=DEBUG
2. Verify all tool calls logged
3. Check state snapshots exist (pre/post move)
4. Validate JSON structure and parseability
5. Measure file size and overhead

**E2E Test Specification**:
```typescript
// @req: E2E4.7 - Full game fully logged at DEBUG level
// @input: Full game with DEBUG logging enabled
// @output: game.log file with all tool calls and state snapshots
// @metrics:
//   - log_entry_count (should equal tool_call_count)
//   - file_size_bytes
//   - parse_success_rate
//   - state_snapshot_coverage (% of moves with state snapshots)
// @assert: log_entry_count = tool_call_count
// @assert: 100% of entries are valid JSON
// @assert: file_size < 2MB (reasonable for full game)
// @assert: parse_time < 100ms
// @assert: state_snapshot_coverage > 90%
// @level: E2E
// @cost: ~$0.05 (logging adds minimal overhead)
// @duration: 8-10 minutes
```

**Metrics Output**:
```json
{
  "test_id": "E2E4.7",
  "game_seed": "logging-seed-456",
  "log_file": "game-logging-seed-456.log",
  "log_entries": 52,
  "tool_calls": 52,
  "log_entry_match": 1.0,
  "file_size_bytes": 125480,
  "json_parse_success": 1.0,
  "state_snapshot_count": 48,
  "state_snapshot_coverage": 0.96,
  "parse_duration_ms": 45,
  "logging_overhead_ms": 8,
  "tokens_used": 950,
  "cost": "$0.0038",
  "pass": true
}
```

---

**E2E4.8: Log Analysis and Game Reconstruction**

**Requirement**: Full game state and move sequence reconstructible from logs

**Scenario**:
1. Parse generated game.log from E2E4.7
2. Extract move sequence
3. Reconstruct game state at each step
4. Validate reconstructed state matches actual game
5. Verify timestamps and phase transitions

**E2E Test Specification**:
```typescript
// @req: E2E4.8 - Game state reconstructible from logs
// @input: Parse game.log from previous test
// @output: Reconstructed game state and move sequence
// @metrics:
//   - reconstruction_accuracy (% of state fields match)
//   - move_sequence_validity (% of moves valid)
//   - timestamp_consistency (monotonically increasing)
//   - phase_transition_accuracy
// @assert: reconstruction_accuracy > 98%
// @assert: move_sequence_validity = 100%
// @assert: timestamp_consistency = true
// @assert: phase_transitions = expected count
// @level: E2E
// @cost: ~$0.00 (local parsing only)
// @duration: 2-3 minutes
```

**Metrics Output**:
```json
{
  "test_id": "E2E4.8",
  "log_file": "game-logging-seed-456.log",
  "reconstruction_status": "SUCCESS",
  "log_entries_parsed": 52,
  "moves_reconstructed": 48,
  "state_snapshots_reconstructed": 48,
  "reconstruction_accuracy": 0.99,
  "move_sequence_validity": 1.0,
  "timestamp_consistency": true,
  "timestamp_monotonic": true,
  "phase_transitions_found": 18,
  "phase_transitions_expected": 18,
  "phase_accuracy": 1.0,
  "parse_duration_ms": 32,
  "pass": true,
  "sample_reconstructed_moves": [
    {"turn": 1, "phase": "action", "move": "play 0", "valid": true},
    {"turn": 1, "phase": "action", "move": "play 1", "valid": true},
    {"turn": 1, "phase": "buy", "move": "buy Copper", "valid": true}
  ]
}
```

---

### Test Suite D: Before/After Comparison (Optional for 2.1, Required for 2.2)

**E2E4.9: Phase 2.0 vs Phase 2.1 Haiku Gameplay Comparison** (OPTIONAL - Future)

**Note**: Phase 2.2 will include before/after comparison testing. For Phase 2.1, we establish baseline performance metrics that Phase 2.2 will compare against.

**Planned E2E Test Specification** (Phase 2.2):
```typescript
// @req: E2E4.9 - Phase 2.0 vs Phase 2.1 improvement measurement
// @input: Same seed, Phase 2.0 MCP vs Phase 2.1 MCP with skills
// @output: Comparison metrics showing improvements
// @metrics:
//   - error_count_reduction_percent
//   - move_quality_improvement_percent
//   - win_rate_delta
//   - tokens_per_game_efficiency
// @assertions (Phase 2.2):
//   - error_reduction > 40%
//   - move_quality_improvement > 15%
//   - win_rate_delta > 5%
// @level: E2E
// @cost: ~$0.20 (2 full games for comparison)
// @duration: 15-20 minutes
// @status: BLOCKED - requires Phase 2.0 snapshot for comparison
```

---

### Test Execution Infrastructure

**File Location**: `packages/mcp-server/tests/e2e/haiku-gameplay.test.ts` (NEW)

**Required Setup**:
```bash
# Environment variables
export CLAUDE_API_KEY=sk-ant-...        # Claude API key (required)
export LOG_LEVEL=DEBUG                  # Enable comprehensive logging
export LOG_FILE=/tmp/game-debug.log     # Optional: file output

# Run specific test
npm test -- packages/mcp-server/tests/e2e/haiku-gameplay.test.ts

# Run all E2E tests
npm test -- --testPathPattern="e2e/"

# Run with timeout (tests may take 5-12 minutes each)
npm test -- --testTimeout=900000 packages/mcp-server/tests/e2e/haiku-gameplay.test.ts
```

**Test Helper Functions** (reuse from `claude-api-helpers.ts`):
- `callClaudeWithTools()` - Make Claude API calls with MCP tools
- `extractToolUse()`, `extractAllToolUses()` - Parse responses
- `getTokenUsage()`, `estimateCost()` - Track costs
- `measureTime()` - Measure execution time

**New Gameplay-Specific Helpers** (to be added):
```typescript
// Game state analysis
function analyzeGameState(logEntries): GameMetrics
function reconstructMoveSequence(logEntries): Move[]
function calculateEconomicProgression(moves): ProgressionMetrics

// Move validation
function validateMoveForPhase(move, phase): boolean
function validateMoveSequence(moves, gameState): ValidationResult

// Strategy analysis
function analyzeBuyDecisions(moves): StrategyMetrics
function compareDecisionSequences(game1, game2): ComparisonResult

// Metrics collection
function collectGameMetrics(moves, state, logs): GameMetrics
function formatMetricsReport(metrics): string
```

**Cost Monitoring**:
```javascript
// E2E4.1-4.6: 6 tests × ~$0.07 average = $0.42
// E2E4.7: ~$0.05 (logging overhead test)
// E2E4.8: ~$0.00 (local parsing only)
// Total: < $0.50 for complete Phase 2.1 E2E suite

// Parallel execution (max 5 games simultaneously):
// All 6 gameplay tests in parallel = $0.42 total
// Sequential execution (safer, clearer logs) = $0.42 total
```

---

### Test Tagging and Organization

**Test Tags for Filtering**:
```typescript
// @phase: 2.1
// @category: Mechanics | Strategy | Logging | Integration
// @cost: ~$0.08
// @duration: 5-10 minutes
// @requires: CLAUDE_API_KEY
// @requires: LOG_LEVEL
// @parallelizable: true | false
// @seed: deterministic-seed-123
```

**Example Tag Usage**:
```bash
# Run only Mechanics tests
npm test -- --testNamePattern="E2E4.[123]"

# Run only Strategy tests
npm test -- --testNamePattern="E2E4.[456]"

# Run only Logging tests
npm test -- --testNamePattern="E2E4.[78]"

# Skip expensive cost tests
npm test -- --testNamePattern="E2E4.8" # Parsing only, no API calls
```

---

### Success Criteria for E2E Haiku Gameplay Tests

**Overall Suite Success**:
- ✅ All 8-10 tests pass consistently (95%+ pass rate)
- ✅ Total cost < $0.50
- ✅ Total duration < 100 minutes
- ✅ No aspirational expectations (based on real Haiku behavior)

**Per-Test Metrics**:

| Test | Metric | Target | Status |
|------|--------|--------|--------|
| E2E4.1 | Recovery rate | > 85% | TBD |
| E2E4.2 | Coin gen errors | = 0 | TBD |
| E2E4.3 | Phase errors | = 0 | TBD |
| E2E4.4 | Buy progression | > 85% | TBD |
| E2E4.5 | Consistency | > 95% | TBD |
| E2E4.6 | Game wins | 100% | TBD |
| E2E4.7 | Log coverage | 100% | TBD |
| E2E4.8 | Reconstruction accuracy | > 98% | TBD |

---

## Test Execution Plan

**Phase 1: Unit Tests** (~2-3 hours)
- Run: `npm test -- --testPathPattern="unit/"`
- Target: 100% pass
- Setup: No API calls needed, mock all dependencies

**Phase 2: Integration Tests** (~2-3 hours)
- Run: `npm test -- --testPathPattern="integration/"`
- Target: 100% pass
- Setup: Local MCP server, Claude API (limited calls)

**Phase 3: E2E Baseline Tests** (~1-2 hours)
- Run: `npm test -- packages/mcp-server/tests/e2e/claude-api.test.ts`
- Target: 95%+ pass
- Setup: Full Claude API access, budget managed
- **Note**: These are existing tests from Phase 2.0 (17 tests total)

**Phase 4: E2E Haiku Gameplay Tests** (~1-2 hours for full suite or individual)
- Run: `npm test -- packages/mcp-server/tests/e2e/haiku-gameplay.test.ts`
- Target: 95%+ pass
- Setup: Full Claude API access, cost-managed
- **Can run individually**: Each test ~5-12 minutes
- **Can run in parallel**: All 6 gameplay tests ~10-15 minutes total

**Total Test Runtime**:
- Sequential: ~8-11 hours (all tests in order)
- Parallel E2E: ~5-8 hours (unit/integration sequential, E2E parallel)
- **Estimated API Cost**: ~$2.00 total
  - Phase 2.0 baseline tests: ~$0.50
  - Phase 2.1 E2E gameplay: ~$0.50
  - Margin for retries/diagnostics: ~$1.00

---

## Success Criteria Summary

| Metric | Target | Validation |
|--------|--------|-----------|
| Unit test pass rate (Features 1-3) | 100% | All 15 tests pass |
| Integration test pass rate (Features 1-3) | 100% | All 15 tests pass |
| E2E baseline test pass rate (Phase 2.0) | 95%+ | 15-16/17 tests pass |
| E2E gameplay test pass rate (Feature 4) | 95%+ | 8-10/10 tests pass |
| Skill content completeness | 100% | All required sections present |
| Confusion recovery rate | > 90% | E2E4.1 validates > 85% |
| Move quality (expert review) | > 85% | E2E4.4 validates progression |
| Strategy consistency | > 95% | E2E4.5 validates move matching |
| Game win rate | 100% | E2E4.6 validates wins |
| Logging coverage | 100% | E2E4.7 validates 100% coverage |
| Log reconstruction accuracy | > 98% | E2E4.8 validates accuracy |
| Log overhead | < 5ms | Unit tests validate |
| Total E2E suite cost | < $0.50 | Feature 4 tracks actual costs |

---

## Conclusion

Phase 2.1 testing provides comprehensive validation of skill functionality, logging infrastructure, and end-to-end gameplay through 55-57 tests across three levels:

- **Unit Tests (15 tests)**: Validate skill content, logging schema, infrastructure correctness
- **Integration Tests (15 tests)**: Validate skills integrate with Claude context, logging with MCP server
- **E2E Baseline Tests (17 tests)**: Phase 2.0 foundation tests (existing infrastructure)
- **E2E Gameplay Tests (8-10 tests)**: Real Claude gameplay validation of all Phase 2.1 features

**By testing at all levels, we ensure**:

1. ✅ Skills load and contain correct content (unit)
2. ✅ Skills integrate properly with Claude's context (integration)
3. ✅ Skills improve Claude's gameplay consistency (E2E gameplay)
4. ✅ Logging captures complete gameplay details (unit + integration + E2E)
5. ✅ Logs enable debugging and analysis (E2E4.8)
6. ✅ Mechanics Skill reduces confusion errors (E2E4.1-4.3)
7. ✅ Strategy Skill improves move quality (E2E4.4-4.6)
8. ✅ All features work with real Claude (E2E4.1-4.8)

**Coverage**: 95%+ target maintained across all levels
**Effort**: ~5-8 hours test execution (unit/integration sequential, E2E parallel)
**Value**: Production-ready skills + comprehensive debugging + regression testing infrastructure
**Cost**: ~$2.00 total (baseline tests + gameplay tests + margin)

---

**Document Status**: ACTIVE
**Created**: 2025-10-22
**Updated**: 2025-10-22 (added Feature 4 E2E Haiku Gameplay Tests)
**Author**: requirements-architect
**Ready for**: Test-architect and dev-agent implementation
