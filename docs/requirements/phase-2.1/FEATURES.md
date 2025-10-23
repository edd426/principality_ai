# Phase 2.1 Features: AI Gameplay Enhancement

**Status**: ACTIVE
**Created**: 2025-10-22
**Phase**: 2.1

---

## Feature Overview

Phase 2.1 implements 4 focused features to enhance Claude's Dominion gameplay:

1. **Feature 1**: Dominion Mechanics Skill (5-6.5 hours) - Rules reference and syntax help
2. **Feature 2**: Dominion Strategy Skill (5-6.5 hours) - Decision guidance and strategy frameworks
3. **Feature 3**: Enhanced Tool Logging (3-3.5 hours) - Comprehensive debugging and performance tracking
4. **Feature 4**: E2E Automated Haiku Gameplay Tests (1-2 hours) - Real Claude gameplay validation

**Total Effort**: 15-20 hours (4 features, integrated testing and documentation)

---

## Feature 1: Dominion Mechanics Skill

**Estimated Effort**: 5-6.5 hours (3-4h implementation + 1-1.5h testing + 1h documentation)
**Test Count**: 15 tests (5 unit + 5 integration + 5 E2E)
**Priority**: HIGH - Foundation for all gameplay

### Description

Create comprehensive Claude Code Skills documentation for Dominion game mechanics. This skill auto-invokes when Claude shows confusion, providing context-aware help for:
- Game rules and phase structure
- Coin generation mechanics
- Command syntax and move formats
- Common mistakes and recovery strategies

**Files to Create**:
- `.claude/skills/dominion-mechanics/SKILL.md` (~200 lines) - Core concepts, rules, syntax
- `.claude/skills/dominion-mechanics/EXAMPLES.md` (~300 lines) - Detailed scenarios with solutions
- `.claude/skills/dominion-mechanics/README.md` - Skill overview and usage

### Functional Requirements

**FR1.1: Core Concepts Coverage**
- Game phase flow (action → buy → cleanup → end)
- Coin generation (treasures must be PLAYED to generate coins)
- Action economy (starting 1 action, +1 action cards for more plays)
- Turn structure (action phase actions consumed, cleanup resets)
- Victory point mechanics (Estate=1, Duchy=3, Province=6)

**FR1.2: Command Syntax Documentation**
- Move syntax: "play 0", "buy Copper", "end phase"
- Error messages and recovery ("Try: play 0")
- Index-based card reference (how to identify cards in hand)
- Supply availability checking

**FR1.3: Common Mistake Scenarios**
- Forgetting to play treasures (attempting to buy without coins)
- Attempting invalid moves (too many actions, insufficient coins)
- Syntax errors (malformed commands)
- For each: Root cause → Solution → Example

**FR1.4: Quick Reference Cards**
- All 15 cards: Name, Cost, Type, Effect, Phase recommendations
- Action card combinations (which synergize)
- Treasure progression (Copper → Silver → Gold)
- Victory progression (Estate → Duchy → Province)

### Content Specifications

**SKILL.md Structure** (target: ~200 lines):
```
1. Game Flow Overview (10 lines)
2. Coin Generation Mechanics (20 lines)
3. Action Economy Deep Dive (20 lines)
4. Command Syntax Reference (15 lines)
5. Common Mistakes & Recovery (20 lines)
6. Rules Reference (30 lines)
7. Quick Reference Tables (50 lines)
8. When to Invoke This Skill (15 lines)
```

**EXAMPLES.md Structure** (target: ~300 lines):
```
EXAMPLE-1: Opening Hand Optimization (30 lines)
- Hand: Village, Smithy, Market, Copper, Copper
- Problem: Claude unsure of optimal play order
- Solution: Play Village first (actions), then Smithy (draw), then Market
- Why: More actions = more cards drawn

EXAMPLE-2: Coin Generation Mistake (25 lines)
- Claude tries to buy Province without playing treasures
- Error: Insufficient coins (need 8, have 0)
- Solution: Play treasures first, THEN check coins
- Key concept: Treasures must be played to generate coins

EXAMPLE-3: Action Phase Sequencing (30 lines)
- Hand: Village (x2), Smithy, Copper, Copper
- Decision: Which order maximizes card draw?
- Analysis: Villages first (+actions), Smithy last (uses actions)
- Result: Draw 5 additional cards (1+1+3)

EXAMPLE-4: Syntax Error Recovery (20 lines)
- Claude sends malformed command
- Error message: "Invalid syntax. Try: 'play 0', 'buy Silver', 'end'"
- Recovery: Correct format in next attempt
- Learning: Syntax is flexible but follows pattern

EXAMPLE-5: Cleanup Phase Transition (25 lines)
- Claude in action phase after playing all actions
- Question: When to end phase?
- Answer: "end" command transitions to buy phase
- Cleanup happens automatically after buy phase

...plus 10-15 more detailed scenarios...
```

### Acceptance Criteria

**AC1.1: Skill Content Completeness**
- SKILL.md covers all core mechanics (game flow, coins, actions, syntax, rules)
- All 15 cards documented with cost/effect/type
- 10+ common mistake scenarios with solutions

**AC1.2: Example Quality**
- Each example has problem statement, solution, and explanation
- Examples progress from basic (syntax) to advanced (action sequencing)
- Real scenarios from actual Claude gameplay errors

**AC1.3: Auto-Invocation Triggers**
- Skill auto-invokes when Claude attempts invalid move
- Skill auto-invokes when Claude asks clarifying questions
- Skill NOT invoked for valid moves (no spam)
- Can be manually disabled for testing

**AC1.4: Confusion Recovery**
- After skill injection, Claude recovers within 3 tool calls
- Recovery rate > 90% for mechanical errors
- No manual intervention needed

### Edge Cases

**EC1.1: Invalid Move → Skill Injection**
- Claude: "buy Province" (insufficient coins)
- System: Inject SKILL.md coin generation section
- Claude: Reads, understands, recovers

**EC1.2: Syntax Error → Recovery**
- Claude: "play village" (lowercase, wrong syntax)
- System: Inject syntax reference
- Claude: Uses correct syntax next attempt

**EC1.3: Rule Question → Clarification**
- Claude: "Do I need to play treasures?"
- System: Inject coin generation section with examples
- Claude: Understands and continues

**EC1.4: Already Knowledgeable**
- Claude successfully plays optimal moves
- System: Does NOT inject skill (prevents context bloat)
- Skill remains available if needed later

### Implementation Notes

- Skills stored in `.claude/skills/dominion-mechanics/` directory
- Auto-invocation managed by MCP server (detects error conditions)
- Content embedded in Claude's context window when needed
- Size constraints: SKILL.md < 250 lines, EXAMPLES.md < 350 lines

---

## Feature 2: Dominion Strategy Skill

**Estimated Effort**: 5-6.5 hours (3-4h implementation + 1-1.5h testing + 1h documentation)
**Test Count**: 15 tests (5 unit + 5 integration + 5 E2E)
**Priority**: HIGH - Improves move quality

### Description

Create Claude Code Skills for Dominion strategy guidance covering:
- Buy priorities and economic progression
- VP timing and endgame awareness
- Action card evaluation and synergies
- Turn planning frameworks
- Context-specific decision support

**Files to Create**:
- `.claude/skills/dominion-strategy/SKILL.md` (~250 lines) - Strategy principles and frameworks
- `.claude/skills/dominion-strategy/STRATEGIES.md` (~300 lines) - Specific tactics and scenarios
- `.claude/skills/dominion-strategy/README.md` - Skill overview and usage

### Functional Requirements

**FR2.1: Strategic Principles**
- Big Money baseline strategy (buy order: Gold → Silver → Duchy → Province)
- Game phase awareness (early = economy, mid = accelerate VP, late = finish)
- VP timing (avoid early Estates, mid-game Provinces, late-game Duchies)
- Action economy synergies (which kingdom cards work together)

**FR2.2: Decision Frameworks**
- Action phase: "What gives best hand draw?"
- Buy phase: "Economy building or VP acquisition?"
- Late game: "Provinces remaining indicator" for endgame urgency
- Step-by-step decision trees for common scenarios

**FR2.3: Card Evaluation**
- Each kingdom card: Cost, effect, when to buy, synergies
- Treasure progression: Copper (base) → Silver (3) → Gold (6)
- VP progression: Estate (2) → Duchy (5) → Province (8)
- Curse damage assessment (when to worry about opponent's Curses)

**FR2.4: Endgame Recognition**
- Provinces remaining as game phase indicator
- Coin requirements for winning path
- Remaining turn estimation
- Acceleration opportunities

### Content Specifications

**SKILL.md Structure** (target: ~250 lines):
```
1. Game Phases Overview (15 lines)
   - Early game (turns 1-5): Build economy
   - Mid game (turns 5-15): Accelerate VP
   - Late game (turns 15+): Finish fast

2. Big Money Strategy (40 lines)
   - Foundational buying sequence
   - When to buy each treasure level
   - Province acquisition timing

3. VP Timing Analysis (30 lines)
   - Early: Avoid Estates (waste deck space)
   - Mid: Buy Provinces for acceleration
   - Late: Provinces + Duchies for final scoring

4. Action Economy (25 lines)
   - Which kingdom cards to prioritize
   - How many actions needed
   - Synergy patterns

5. Strategic Principles (40 lines)
   - Deck consistency (predictable hands)
   - Economic snowball (5 → 6 → 7 → 8 coins)
   - Endgame urgency (fewer Provinces left = hurry)

6. Card Evaluation Matrix (50 lines)
   - Each kingdom card rated: Cost, Effect, Phase, Priority
   - Synergies table
   - When to buy/skip each card

7. Decision Templates (30 lines)
   - "What's my best action phase play?"
   - "Buy economy or VP?"
   - "Can I win this turn?"
```

**STRATEGIES.md Structure** (target: ~300 lines):
```
STRATEGY-1: Big Money Baseline (40 lines)
- Foundation for all decisions
- Buy: Copper (free), Silver (3 coins), Duchy (5), Province (8)
- When: Buy available treasures, Province when ≥8 coins

STRATEGY-2: Action Card Prioritization (35 lines)
- Which kingdom cards to buy?
- Village: +1 action, simple, always useful
- Smithy: +3 cards, action-hungry, needs Villages
- Evaluation: Compare cost vs benefit

STRATEGY-3: Early Game Economy (35 lines)
- First 5 turns focused on treasures
- Avoid VP cards (waste deck space)
- Build consistent Copper + Silver hands

STRATEGY-4: Mid Game Acceleration (35 lines)
- Turns 5-15: Add Provinces as they become affordable
- Balance: 2-3 Provinces per 2-3 Silvers
- Acceleration: More actions = more purchases

STRATEGY-5: Endgame Recognition (25 lines)
- Provinces ≤ 4: Game ending soon
- Calculate: How many more turns until Provinces gone?
- Final push: Buy remaining Provinces quickly

STRATEGY-6: Economic Snowball (25 lines)
- 5 coins: Buy Silver (improve hand quality)
- 6 coins: Buy second Silver or Duchy
- 7 coins: Ready for Province (8 coins)
- 8 coins: Buy Province (or second Gold if aggressive)

...plus 10-15 more specific scenarios...
```

### Acceptance Criteria

**AC2.1: Strategy Framework Completeness**
- Big Money baseline documented with buy order
- Game phase progression (early/mid/late) clear
- Card evaluation matrix covers all 15 cards
- Decision trees provided for common scenarios

**AC2.2: Decision Support Quality**
- Frameworks provide actionable guidance (not vague)
- Strategies testable against real gameplay (optimal vs suboptimal moves)
- Examples show reasoning for decisions

**AC2.3: Endgame Awareness**
- Skill enables Claude to recognize game urgency
- Provinces remaining affects buying decisions
- Late-game VP strategy differs from mid-game

**AC2.4: Move Quality Improvement**
- Expert review: > 85% of Claude's moves are strategically sound
- Consistency: Same game state → same decision (not random)
- Win rate improvement: > 10% vs Phase 2.0 baseline

### Edge Cases

**EC2.1: Early Game Decision**
- Turn 3, 4 coins available
- Bad: Buy Duchy (wastes deck space, not enough treasures)
- Good: Buy Silver (builds economy foundation)
- Skill enables Claude to recognize economy priority

**EC2.2: Mid-Game Acceleration**
- Turn 10, 7 coins available
- Provinces: 6 remaining
- Bad: Buy Silver (too conservative, game has time)
- Good: Buy Duchy or wait for 8 coins Province
- Skill helps with VP acceleration timing

**EC2.3: Endgame Urgency**
- Turn 15, Provinces: 2 remaining
- Same buy decision as turn 5?
- No - endgame means different strategy
- Skill recognizes Provinces < 4 = finish fast

### Implementation Notes

- Skills stored in `.claude/skills/dominion-strategy/` directory
- Invoked at buy phase decisions (automatic)
- Can be disabled manually for A/B testing
- Frameworks designed for extension (Phase 2.2+ can add more cards/strategies)

---

## Feature 3: Enhanced Tool Logging

**Estimated Effort**: 3-3.5 hours (2-2.5h implementation + 0.5-1h testing + 0.5h documentation)
**Test Count**: 12 tests (4 unit + 4 integration + 4 E2E)
**Priority**: HIGH - Foundation for debugging and improvement

### Description

Enhance MCP server with comprehensive logging middleware to track:
- All tool calls (what Claude requests, server responses)
- Game state snapshots (state before/after each move)
- Performance metrics (latency, token estimates, resource usage)
- Decision reasoning (Claude's stated reasoning for moves)
- Phase transitions and game lifecycle

### Functional Requirements

**FR3.1: Tool Call Logging**
- Log every tool invocation (game_observe, game_execute, game_session)
- Capture request parameters and response results
- Include timestamp, duration, request ID for correlation
- Record success/failure with error details if applicable

**FR3.2: Game State Snapshots**
- State hash (fingerprint to detect unexpected changes)
- State before and after each move
- Phase information (current phase, turn number)
- Player stats (coins, actions, buys, hand size)

**FR3.3: Performance Metrics**
- Tool call latency (min/max/average per tool)
- Token count estimates
- Memory usage tracking
- Request queue depth

**FR3.4: Configuration & Control**
- Environment variables for log level (INFO, DEBUG, TRACE)
- Console and file output (configurable)
- Log rotation (prevent unlimited file growth)
- Structured JSON format (parseable)

**FR3.5: Decision Annotation**
- Optional: Claude can include reasoning with moves
- Log includes reasoning text when provided
- Tagged as "optimal", "suboptimal", "exploratory" for analysis
- Enables post-game review and improvement

### Log Entry Schema

**Basic Tool Call Log Entry**:
```json
{
  "timestamp": "2025-10-22T15:30:45.123Z",
  "request_id": "req-12345",
  "level": "INFO",
  "tool": "game_execute",
  "request": {
    "move": "play 0"
  },
  "response": {
    "success": true,
    "phase_changed": null
  },
  "duration_ms": 12,
  "tokens_estimated": 150
}
```

**DEBUG Level - State Snapshot**:
```json
{
  "timestamp": "2025-10-22T15:30:45.123Z",
  "request_id": "req-12345",
  "level": "DEBUG",
  "tool": "game_execute",
  "request": {"move": "play 0"},
  "response": {"success": true},
  "state_before": {
    "phase": "action",
    "turn_number": 5,
    "active_player": 0,
    "player_stats": {
      "hand_size": 5,
      "actions": 1,
      "buys": 1,
      "coins": 0
    },
    "state_hash": "abc123..."
  },
  "state_after": {
    "phase": "action",
    "turn_number": 5,
    "active_player": 0,
    "player_stats": {
      "hand_size": 4,
      "actions": 2,
      "buys": 1,
      "coins": 0
    },
    "state_hash": "def456..."
  },
  "duration_ms": 12
}
```

**TRACE Level - Decision Reasoning**:
```json
{
  "timestamp": "2025-10-22T15:30:45.123Z",
  "request_id": "req-12345",
  "level": "TRACE",
  "tool": "game_execute",
  "request": {"move": "buy Silver"},
  "response": {"success": true},
  "decision": {
    "reasoning": "I have 3 coins, buying Silver to improve hand economy",
    "alternatives_considered": ["buy Copper", "end phase"],
    "confidence": "high",
    "move_quality": "optimal"
  },
  "state_before": {...},
  "state_after": {...},
  "duration_ms": 12,
  "tokens_used": 450
}
```

### Configuration

**Environment Variables**:
```bash
# Logging configuration
LOG_LEVEL=INFO                          # INFO | DEBUG | TRACE
LOG_FILE=/var/log/principality/game.log # Optional: file output
LOG_CONSOLE=true                        # true | false
LOG_FORMAT=json                         # json | text

# Log management
LOG_MAX_FILE_SIZE=5242880              # 5MB default
LOG_BACKUP_COUNT=5                      # Keep 5 backup files
LOG_ROTATION_INTERVAL=86400             # Rotate daily
```

### Acceptance Criteria

**AC3.1: Logging Completeness**
- All tool calls logged (100% coverage)
- Every log entry includes: timestamp, request_id, tool_name, duration, result
- State snapshots available at DEBUG level
- Decision reasoning captured at TRACE level

**AC3.2: Performance Impact**
- Logging overhead < 5ms per tool call (measured)
- Log files < 5MB per full game session (typical)
- Log parsing/analysis < 100ms per session
- No perceptible impact on gameplay latency

**AC3.3: Debuggability**
- Any gameplay issue reproducible from logs
- State progression traceable through log
- Move sequence verifiable from tool calls
- Performance bottlenecks identifiable

**AC3.4: Configuration & Control**
- LOG_LEVEL environment variable respected
- Console + file logging independently configurable
- Log rotation prevents unlimited disk usage
- DEBUG/TRACE levels can be toggled without restart

### Edge Cases

**EC3.1: High-Volume Logging**
- Problem: Verbose logging at TRACE level → huge files
- Solution: Automatic rotation at 5MB, keep 5 backups
- Result: Disk usage stays controlled

**EC3.2: Performance Impact**
- Problem: Logging adds latency to tools
- Solution: Async logging where possible, buffered writes
- Result: Overhead < 5ms (verified by tests)

**EC3.3: Sensitive Data in Logs**
- Problem: Game state + moves might include sensitive strategy info
- Solution: Optional encryption or masking
- Result: Logs safe for sharing (future enhancement)

### Implementation Notes

- Logging middleware added to MCP server request handler
- Uses existing Node.js logging libraries (winston or pino)
- Log entries written to stdout (INFO) and file (DEBUG/TRACE)
- Async logging prevents blocking tool execution
- Parse utilities provided for log analysis

---

## Inter-Feature Dependencies

```
Feature 1 (Mechanics Skill)
    ├─ Standalone (no dependencies)
    └─ Used by: Claude when confused

Feature 2 (Strategy Skill)
    ├─ Standalone (no dependencies)
    └─ Used by: Claude during buy/action decisions

Feature 3 (Enhanced Logging)
    ├─ Depends on: MCP Server (Phase 2.0)
    └─ Used by: Debugging and improvement tracking
```

**Implementation Order**:
1. Feature 3 (Enhanced Logging) - Infrastructure, low risk
2. Feature 1 (Mechanics Skill) - Foundation for gameplay help
3. Feature 2 (Strategy Skill) - Advanced gameplay enhancement

---

## Success Metrics Summary

| Metric | Target | Measurement |
|--------|--------|-------------|
| Confusion recovery rate | > 90% | % of mechanical errors self-resolved |
| Error frequency reduction | 50% drop | Errors in Phase 2.1 vs Phase 2.0 |
| Move quality (expert review) | > 85% optimal | Human evaluation of buy/action decisions |
| Win rate improvement | > 10% | Measured games Phase 2.1 vs Phase 2.0 |
| Logging overhead | < 5ms | Measured tool call latency increase |
| Log file size | < 5MB/game | Typical session log size |
| Parse time | < 100ms | Time to analyze typical session |
| Debuggability | 100% | All issues traceable from logs |

---

## Feature 4: E2E Automated Haiku Gameplay Tests

**Estimated Effort**: 1-2 hours (mostly test specification and infrastructure setup, automation runs via CI/CD)
**Test Count**: 8-10 automated E2E tests using real Claude Haiku API
**Priority**: HIGH - Validates Phase 2.1 features work in production
**Cost**: < $0.50 total for complete suite
**Duration**: 40-100 minutes total execution (5-12 minutes per test)

### Description

Automated end-to-end gameplay tests using real Claude Haiku API to validate Phase 2.1 features actually work in production. Builds on Phase 2.0's existing E2E infrastructure (17 tests in `claude-api.test.ts`) with focused gameplay validation tests.

**Why Automated Haiku Tests**:
1. **Validate Skills**: Mechanics and Strategy skills must work with real Claude, not just be loaded
2. **Measure Improvements**: Quantify Phase 2.1 benefits (fewer errors, better strategy)
3. **Cost-Efficient**: Haiku model ~$0.05/game vs Sonnet ~$0.20/game
4. **Regression Testing**: Run before each release to catch regressions
5. **Behavioral Validation**: Focus on actual Claude behavior, not aspirational targets

**Files to Create/Update**:
- `packages/mcp-server/tests/e2e/haiku-gameplay.test.ts` (NEW) - 8-10 automated gameplay tests
- `packages/mcp-server/tests/e2e/claude-api-helpers.ts` (EXTEND) - Add gameplay-specific helpers

### Functional Requirements

**FR4.1: Mechanics Skill Validation (E2E4.1-E2E4.3)**
- Test auto-invocation when Claude makes mechanical errors
- Test coin generation understanding (treasures must be played first)
- Test phase transition correctness (action → buy → cleanup)

**FR4.2: Strategy Skill Validation (E2E4.4-E2E4.6)**
- Test economic progression (treasure buying follows Big Money)
- Test strategy consistency (same situations → same decisions)
- Test full game completion with wins

**FR4.3: Logging Infrastructure Validation (E2E4.7-E2E4.8)**
- Test full game logging completeness (all tool calls captured)
- Test log analysis and game state reconstruction from logs

### Test Specifications

#### Test Suite A: Mechanics Skill Validation (3 tests)

**E2E4.1: Mechanics Skill Auto-Invocation During Error Recovery**
- Requirement: Skill auto-invokes when Claude attempts invalid move
- Measurement: Error recovery rate > 85%, recovery within 3 tool calls
- Success: 2-3 errors occur early game, all recovered with skill help
- Cost: ~$0.08, Duration: 5-10 minutes

**E2E4.2: Coin Generation Understanding**
- Requirement: Claude plays treasures before buying
- Measurement: 0 coin generation errors by turn 3
- Success: All buys have sufficient coins, no "insufficient coins" errors
- Cost: ~$0.07, Duration: 5-8 minutes

**E2E4.3: Phase Transitions and Move Validity**
- Requirement: All moves execute in correct phase
- Measurement: 0 phase errors, 100% move validity
- Success: All 36+ phase transitions correct, no invalid phase moves
- Cost: ~$0.06, Duration: 4-6 minutes

#### Test Suite B: Strategy Skill Validation (3 tests)

**E2E4.4: Economic Progression and Buy Decisions**
- Requirement: Claude follows Big Money progression
- Measurement: > 85% of buys match optimal progression
- Success: Treasure buys follow Copper → Silver → Gold, VP timing 5-10 turns
- Cost: ~$0.08, Duration: 6-8 minutes

**E2E4.5: Strategy Consistency Across Decisions**
- Requirement: Same seed → same decisions (deterministic strategy)
- Measurement: > 95% move sequence similarity
- Success: Two runs with same seed produce identical/near-identical games
- Cost: ~$0.16 (2 games), Duration: 10-12 minutes

**E2E4.6: Full Game Completion and Win**
- Requirement: Claude wins the game end-to-end
- Measurement: 100% win rate, < 30 turns
- Success: Game completes successfully with Claude victory
- Cost: ~$0.10, Duration: 8-12 minutes

#### Test Suite C: Logging Infrastructure Validation (2 tests)

**E2E4.7: Full Game Session Logging**
- Requirement: All tool calls logged with state snapshots
- Measurement: 100% log coverage, file < 2MB, parse < 100ms
- Success: 50+ log entries, all valid JSON, state snapshots present
- Cost: ~$0.05, Duration: 8-10 minutes

**E2E4.8: Log Analysis and Game Reconstruction**
- Requirement: Game state reconstructible from logs
- Measurement: > 98% reconstruction accuracy, 100% move validity
- Success: All 48+ moves and 18+ phase transitions reconstructed correctly
- Cost: ~$0.00 (local parsing only), Duration: 2-3 minutes

### Acceptance Criteria

**AC4.1: Test Infrastructure**
- Tests reuse existing `claude-api-helpers.ts` functions
- New gameplay-specific helpers for move validation, metrics collection
- Cost tracking accurate (within ±10% of actual API costs)
- Tests run successfully with CLAUDE_API_KEY environment variable

**AC4.2: Test Coverage**
- All Phase 2.1 features (Mechanics, Strategy, Logging) tested end-to-end
- Each feature has multiple validation scenarios
- Edge cases covered (error recovery, consistency, completeness)

**AC4.3: Behavioral Metrics**
- All metrics based on actual Claude behavior, not aspirational targets
- Pass/fail criteria realistic (e.g., > 85% not 100% for strategy moves)
- Success rates validated against Phase 2.0 baseline

**AC4.4: Documentation**
- Each test has clear specification with unit/integration/E2E levels
- Metrics output documented (JSON schema)
- Test tagging enables selective execution

### Edge Cases

**EC4.1: Skill Not Auto-Invoked for Valid Moves**
- Claude plays optimally without errors
- Skill not invoked (prevents context bloat)
- Test validates no unnecessary skill injections

**EC4.2: Logging Overhead Acceptable**
- Logging adds < 10ms per tool call
- No perceptible impact on gameplay experience
- File rotation prevents unlimited disk usage

**EC4.3: Consistency Across API Rate Limits**
- Tests handle transient API errors with retry logic
- Same seed + retry = identical game progressions
- Retries transparent to metrics collection

### Implementation Notes

- Tests use deterministic seeds for reproducibility
- All costs tracked and logged (reusable for Phase 2.2 billing)
- Metrics output in JSON for analysis and CI/CD integration
- Tests can run individually or as suite
- Parallel execution supported (max 5 games simultaneously for cost control)
- Existing Phase 2.0 E2E tests (17 total) run as baseline
- Phase 2.1 E2E gameplay tests (8-10 total) run in addition

---

## Inter-Feature Dependencies

```
Feature 1 (Mechanics Skill)
    ├─ Standalone (no dependencies)
    └─ Used by: Feature 4 (E2E tests validate it)

Feature 2 (Strategy Skill)
    ├─ Standalone (no dependencies)
    └─ Used by: Feature 4 (E2E tests validate it)

Feature 3 (Enhanced Logging)
    ├─ Depends on: MCP Server (Phase 2.0)
    └─ Used by: Feature 4 (E2E tests validate logging works)

Feature 4 (E2E Gameplay Tests)
    ├─ Depends on: Features 1, 2, 3 (tests validate them)
    ├─ Depends on: MCP Server (Phase 2.0)
    └─ Produces: Metrics for Phase 2.2 comparison
```

**Implementation Order**:
1. Features 1-3 (Mechanics, Strategy, Logging) - Independent implementation
2. Feature 4 (E2E Tests) - Depends on Features 1-3 being mostly complete
3. Test suite runs during Phase 2.1 validation
4. Metrics baseline captured for Phase 2.2 before/after comparison

---

## Test Count Summary

**Phase 2.1 Testing Breakdown**:

| Level | Feature 1 | Feature 2 | Feature 3 | Feature 4 | Total |
|-------|-----------|-----------|-----------|-----------|-------|
| Unit | 5 | 5 | 5 | 0 | 15 |
| Integration | 5 | 5 | 5 | 0 | 15 |
| E2E (Baseline) | 0 | 0 | 0 | 17* | 17 |
| E2E (Gameplay) | 3 | 3 | 2 | 0 | 8-10 |
| **Total** | **13** | **13** | **12** | **17-19** | **55-57** |

*Phase 2.0 E2E baseline tests (reference, not new)

**Total Phase 2.1 New Tests**: 40-42 (excluding Phase 2.0 baseline)
**Coverage Target**: 95%+ across all levels
**API Cost**: ~$2.00 total (baseline + gameplay tests + margin)

---

## Conclusion

Phase 2.1's four features work together to significantly improve Claude's Dominion gameplay:

1. **Mechanics Skill**: Eliminates confusion, enables self-recovery
2. **Strategy Skill**: Improves decision quality, enables learning
3. **Enhanced Logging**: Enables debugging and progress measurement
4. **E2E Automated Tests**: Validates all features work in production

Together, these features transform Claude from a "functional but confused" player to a "competent and improving" player, setting the stage for Phase 2.2's optimization measurement and Phase 3's multiplayer integration.

**Total Effort**: 15-20 hours (integrated across 4 features)
**Test Coverage**: 55-57 tests total (unit + integration + E2E baseline + E2E gameplay)
**Risk Level**: Low (well-defined features, clear acceptance criteria)
**Value**: High (directly improves gameplay, enables measurement, provides regression testing)

**Next Step**: Proceed to TESTING.md for comprehensive test specifications.

---

**Document Status**: ACTIVE
**Created**: 2025-10-22
**Author**: requirements-architect
**Ready for**: Test specification and implementation planning
