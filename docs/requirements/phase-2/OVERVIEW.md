# Phase 2 Overview: MCP Server Integration for LLM Optimization

**Status**: COMPLETE
**Created**: 2025-10-21
**Revised**: 2025-10-22
**Completed**: 2025-10-22
**Phase**: 2.0
**Actual Effort**: 2 critical bug fixes, foundation complete

---

## Executive Summary

Phase 2 transforms Principality AI from a human-playable CLI game into an **LLM-accessible optimization platform** through **Model Context Protocol (MCP) integration**. This phase enables AI agents (specifically Claude) to play Dominion autonomously, **iteratively improving win rate and turn efficiency** through systematic learning.

**Core Problem**: Can LLMs learn to optimize strategy in deck-building games through repeated play and performance feedback?

**Solution**: Build an MCP server that exposes game engine capabilities as 3 core tools, allowing Claude to query game state + valid moves together, execute moves atomically, and manage game lifecycle for autonomous optimization.

**Primary Goal**: **Optimize win rate and turn efficiency through iterative learning** (previously: "Research LLM decision-making capabilities")

**Success Criteria**:
1. **Turn Optimization**: Reduce average turns per game by 10% after 10 games
2. **Win Rate**: Achieve >60% win rate against baseline random strategy
3. **Learning Evidence**: Measurable improvement in performance metrics session-over-session
4. **Consistency**: Complete 20/20 evaluation scenarios without errors

**Failure Criteria**:
- No improvement in win rate after 20 games
- Average turns per game increases or plateaus
- >5 evaluation scenarios fail

---

## Phase 2.0 Completion Status

**Status**: COMPLETE (2025-10-22)

### What Was Completed

Phase 2.0 established the MCP server foundation through two critical bug fixes:

**Bug Fix 1: MCP Server Connection to Stdio Transport** (commit f8b6c98)
- **Problem**: MCP server stdio transport was not properly initialized
- **Impact**: Claude could not establish connection to MCP server via stdio
- **Solution**: Implemented proper MCP protocol handshake and stream handling
- **Result**: ✅ Claude Desktop now connects successfully, can invoke tools

**Bug Fix 2: Treasure Move Parsing Fix** (commit 9425ad4)
- **Problem**: Treasure card moves were not being parsed correctly in game_execute
- **Impact**: Claude's move commands for treasures were failing silently
- **Solution**: Enhanced move parser to handle treasure syntax variations
- **Result**: ✅ All treasure moves now execute correctly

### Deliverables Completed

- ✅ MCP server infrastructure stable and functional
- ✅ Tool registration working (3 core tools: game_observe, game_execute, game_session)
- ✅ Tool invocation from Claude successful
- ✅ Error handling and recovery functional
- ✅ Initial gameplay loops working (basic autonomous play possible)
- ✅ Foundation ready for Phase 2.1 enhancements

### What's Next

Phase 2.1 builds on this foundation by enhancing AI capability with:
- **Mechanics Skill**: Context-aware help when Claude shows confusion
- **Strategy Skill**: Decision support for optimal purchases and action sequences
- **Tool Logging**: Comprehensive debugging and performance tracking

---

## Phase 2 Vision

### What Phase 2 IS

✅ **Optimization Platform**: Enable LLM learning through performance feedback loops
✅ **MCP Server**: 3 core tools for efficient LLM interaction (game_observe, game_execute, game_session)
✅ **Autonomous Play**: LLM controls all moves without human intervention
✅ **Token Efficiency**: Configurable detail levels, combined state + moves
✅ **Local Development**: Solo LLM gameplay on local machine (stdio transport only)

### What Phase 2 Is NOT

❌ **Not multiplayer**: Single LLM player only (multiplayer is Phase 3)
❌ **Not cloud deployment**: Local development only, no Azure/HTTP (Phase 3)
❌ **Not human-facing**: CLI remains for debugging, not primary interface
❌ **Not natural language**: JSON-based structured moves, not text parsing
❌ **Not advanced AI**: Simple LLM access, no custom training or fine-tuning

---

## Problem Statement

### Current State (Phase 1.6)

**What Works:**
- Complete CLI game engine (648 tests passing, 95%+ coverage)
- 15 cards implemented (8 kingdom + 7 base)
- Excellent human UX (auto-play, chains, help system, quick games)
- Three-level test framework (unit/integration/E2E)
- Stable, production-ready codebase

**Critical Gap:**
- ❌ No programmatic API for external systems
- ❌ No LLM integration or AI player capability
- ❌ No structured move validation for automated play
- ❌ No game state query interface
- ❌ No optimization platform for AI learning

### Research Questions

Phase 2 aims to answer:

1. **Optimization Speed**: How quickly can LLMs improve win rate through feedback?
2. **Strategy Learning**: Do LLMs discover optimal strategies (economy vs victory points)?
3. **Consistency**: Can LLMs maintain performance across varied scenarios?
4. **Tool Efficiency**: Do minimal tools (3 vs 7) with combined state+moves improve LLM decision quality?
5. **Token Efficiency**: Do detail levels effectively reduce token usage while maintaining context?

### User Impact

**AI Researchers:**
- Study LLM optimization in complex strategy games
- Analyze learning curves and performance metrics
- Benchmark LLM performance across models (Haiku vs Sonnet)
- **Current solution**: No existing Dominion-like game with LLM API + optimization tracking

**Game AI Developers:**
- Prototype self-improving AI opponents for deck-building games
- Test LLM-based game agents with performance feedback
- Integrate AI into multiplayer experiences (Phase 3)
- **Current solution**: Build custom integrations from scratch

**LLM Developers:**
- Test Claude's strategic optimization capabilities
- Validate MCP protocol for game integration
- Explore structured decision-making interfaces with performance metrics
- **Current solution**: Use unstructured text-based games without feedback loops

---

## Phase 2 Goals

### Primary Goals

1. **Enable Autonomous LLM Play**: Claude can play complete games start-to-finish
2. **Optimize Performance**: Claude improves win rate and turn efficiency over time
3. **Structured Move Validation**: JSON-based moves with clear validation feedback
4. **Game State Queries**: LLM can inspect state to inform decisions
5. **Performance Tracking**: Metrics system tracks learning progress

### Success Criteria

**Functional Requirements:**
- ✅ MCP server exposes game engine via 3 core tools (game_observe, game_execute, game_session)
- ✅ game_observe returns state + valid moves together with configurable detail levels
- ✅ game_execute validates and executes moves atomically
- ✅ game_session manages game lifecycle (new, end)
- ✅ Complete 20 evaluation scenarios (15 train, 5 held-out test)
- ✅ All moves logged with timestamps and decision reasoning

**Quality Requirements:**
- ✅ 95%+ test coverage maintained (extend Phase 1.6 framework)
- ✅ Tool responses optimized per Anthropic best practices
- ✅ Error messages actionable with clear guidance
- ✅ Three-level tests (~40 tests: unit/integration/E2E)
- ✅ Token efficiency: Minimal/standard/full detail levels

**Optimization Requirements:**
- ✅ Turn count reduces by 10% after 10 games
- ✅ Win rate >60% against random baseline after 20 games
- ✅ Measurable improvement session-over-session
- ✅ Performance metrics tracked per game
- ✅ Learning trends visualized in performance tool

### Non-Goals (Deferred to Later Phases)

❌ **Cloud deployment**: Local development only (Azure Functions in Phase 3)
❌ **Multiplayer**: Single LLM player (multiplayer in Phase 3)
❌ **Natural language parsing**: Structured JSON moves only (text parsing if needed in Phase 4)
❌ **Advanced cards**: 15 base cards only (complex cards in Phase 5)
❌ **Performance metrics tracking**: Deferred to Phase 3 (focus on LLM optimization in Phase 2)
❌ **Web UI**: CLI + MCP only (web interface in Phase 4)

---

## Relationship to Roadmap

### Project Phases

**Phase 1 (Complete)**: Core game engine + 8 kingdom cards
**Phase 1.5 (Complete)**: CLI UX improvements (6 features)
**Phase 1.6 (Complete)**: Card help system + comprehensive testing
**Phase 2.0 (Complete)**: MCP server foundation + critical bug fixes
**➡️ Phase 2.1 (Current)**: AI Gameplay Enhancement (Mechanics Skill, Strategy Skill, Tool Logging) ⬅️
**Phase 3 (Next)**: Multiplayer + AI opponents + cloud deployment
**Phase 4**: Web UI with drag-and-drop interface
**Phase 5+**: Advanced cards, tournaments, mobile apps

### Why Phase 2 Before Phase 3

**Phase 3 (Multiplayer) Requires:**
1. **Proven AI agents**: Need working LLM gameplay first
2. **Move validation API**: Structured interface for remote play
3. **Game state serialization**: JSON-based state for network transfer
4. **Performance baseline**: Know latency/throughput requirements

**Phase 2 Provides:**
1. ✅ Working LLM gameplay (Claude plays autonomously)
2. ✅ 3 core MCP tools (game_observe, game_execute, game_session - reusable for multiplayer API)
3. ✅ JSON game state (already serializable)
4. ✅ Performance benchmarks (measure API latency)

**Bottom Line**: Phase 2 validates AI gameplay locally before building cloud infrastructure.

### Phase 2 Enables Phase 3

Phase 3 will reuse Phase 2 components:
- **game_observe tool** → REST `/observe` endpoint (Azure Functions)
- **game_execute tool** → REST `/execute` endpoint for multiplayer move validation
- **game_session tool** → REST `/session` endpoint for game lifecycle
- **Autonomous play** → AI opponent logic (reuse same LLM integration)
- **Performance tracking** → Player skill ratings (extends optimization metrics)

By validating locally first, we derisk Phase 3 cloud deployment.

---

## Feature Scope

### Features Included (3 Total - Core Tools)

**Feature 1: MCP Server Infrastructure** (3-4 hours)
- TypeScript MCP server using @modelcontextprotocol/sdk
- Tool registration (3 core tools with game_ namespace prefix)
- Request routing and error handling
- Local development server (stdio transport)
- Configuration management (seed, model selection)

**Feature 2: game_observe Tool** (4-5 hours)
- **Purpose**: Query current game state + valid moves together
- **Parameters**: detail_level: "minimal" | "standard" | "full"
- **Returns**: {state, validMoves, moveSummary}
- **Consolidates**: game_get_state + game_get_valid_moves (combined for natural LLM workflow)
- **Token Efficiency**: Minimal ~60 tokens, Standard ~250 tokens, Full ~1000 tokens

**Feature 3: game_execute + game_session Tools** (5-7 hours)
- `game_execute` (atomic validation + execution with return_detail options)
- `game_session` (manage lifecycle: new game, end game)
- Session management (seed for reproducibility, model tracking)
- Idempotent operations (new game implicitly ends previous game)

**Total Effort**: 12-16 hours (33% reduction from 7-tool design due to consolidation)

### Tool Count Reduction Rationale

**Before (7 tools)**: Required multiple sequential calls
- `game_get_state` + `game_get_valid_moves` → 2 calls to get context
- `game_execute_move` validates + executes → 1 call per move

**After (3 tools)**: Optimized for natural LLM workflow
- `game_observe` (state + valid moves together) → 1 call for full context
- `game_execute` (atomic validate + execute) → 1 call per move
- `game_session` (manage lifecycle) → 1-2 calls per game
- Follows Anthropic best practice: "Pair tools that LLMs naturally use together"

**Performance Impact**:
- ~25% fewer API calls per game (2 calls → 1.5 calls for context queries)
- ~35% token reduction via configurable detail levels
- Faster decision loops (consolidated state + moves in single response)
- Better context window utilization (moves directly tied to game state)

### Card Coverage

**Phase 2 uses existing 15 cards from Phase 1**:
- Kingdom Cards (8): Village, Smithy, Laboratory, Festival, Market, Woodcutter, Council Room, Cellar
- Base Cards (7): Copper, Silver, Gold, Estate, Duchy, Province, Curse

No new cards added in Phase 2 - focus is on optimization API, not game content.

---

## Implementation Approach

### Technical Strategy

**MCP Server Package (`packages/mcp-server/`)**:
- New npm workspace package
- Dependencies: `@modelcontextprotocol/sdk`, `@principality/core`
- Entry point: `src/index.ts` (MCP server initialization)
- Tools: `src/tools/` (state, execution, performance)
- Transport: **stdio only** (local process communication, no HTTP)

**Core Package Enhancements (`packages/core/`)**:
- No breaking changes to existing API
- Ensure GameState is fully serializable
- Performance optimizations for repeated queries

**Testing Strategy**:
- **Unit tests**: Tool functions in isolation (mock game engine)
- **Integration tests**: MCP server + game engine (local environment)
- **E2E tests**: Actual Claude API calls (Haiku default, Sonnet validation)

**Development Environment**:
- Local MCP server runs via stdio
- Connect via: `claude mcp add --transport stdio principality -- npm run mcp:start`
- CLI remains for debugging and manual testing
- All game state in-memory (no database)

**Model Selection**:
- **Default**: Claude Haiku 4.5 (cost-effective for iteration and testing)
- **Override**: Claude Sonnet 4.5 (for quality validation and comparison)
- **Configuration**: Via `game_start` tool parameter or CLI flag `--model haiku|sonnet`
- **Cost Tracking**: `game_get_performance` logs API usage per model

### Why This Approach

**1. MCP Protocol**:
- Standard for LLM tool access (Anthropic-supported)
- Structured JSON request/response
- Type-safe TypeScript SDK
- Future-proof for Phase 3 (convert tools to REST API)

**2. Tool Consolidation**:
- Fewer tools = simpler agent mental model
- Configurable detail levels = token efficiency
- Atomic validation + execution = fewer errors
- Follows Anthropic engineering best practices

**3. Stdio Transport (Not HTTP)**:
- Phase 2 is local development only
- No Azure deployment yet (deferred to Phase 3)
- Simpler testing and debugging
- Direct process communication

**4. JSON Moves (Not Natural Language)**:
- Deterministic parsing (no ambiguity)
- Easy validation and error reporting
- Faster than text parsing
- Structured for research analysis
- Can add NL layer in Phase 4 if desired

**5. Model Selection Strategy**:
- Haiku for development/testing (cheap, fast)
- Sonnet for quality validation (expensive, better quality)
- Track performance delta between models
- Budget: ~$50/month for E2E tests

---

## Time Estimates

### Feature Breakdown

| Feature | Implementation | Testing | Documentation | Total |
|---------|---------------|---------|---------------|-------|
| Feature 1: MCP Server | 2-3h | 1h | 0.5-1h | 3-4h |
| Feature 2: game_observe Tool | 2-3h | 1h | 0.5-1h | 4-5h |
| Feature 3: game_execute + game_session Tools | 3-4h | 1h | 0.5-1h | 5-7h |
| **Total** | **7-10h** | **3h** | **1.5-3h** | **12-16h** |

**Reduction from 7-tool design**: -6 hours (18-23h → 12-16h) due to:
- Aggressive tool consolidation (game_observe combines state + moves, game_session combines game lifecycle)
- Fewer tests required (~40 vs 72)
- Simpler implementation (3 core tools vs 7)

### Assumptions

- ✅ Core game engine stable (Phase 1.6 complete)
- ✅ MCP SDK documentation available
- ✅ TypeScript/Node.js development environment ready
- ✅ Test framework established (extend Phase 1.6 patterns)
- ✅ Anthropic best practices understood

### Risk Factors

**MEDIUM RISK** - New technology (MCP) but well-documented:

**Risk 1: MCP Protocol Learning Curve** (MEDIUM)
- **Impact**: Slower implementation, API design iterations
- **Mitigation**: Start with simple tool (game_get_state), iterate gradually
- **Time**: +2-4 hours for learning and experimentation

**Risk 2: Claude API Rate Limits** (MEDIUM)
- **Impact**: E2E tests slow or throttled
- **Mitigation**: Mock most tests, limit real API calls to smoke tests, use Haiku
- **Time**: No additional time if mocked properly

**Risk 3: Optimization Goals Not Met** (LOW - RESEARCH RISK)
- **Impact**: LLM doesn't improve performance after 20 games
- **Mitigation**: This is research! Document patterns regardless of improvement
- **Time**: No impact on Phase 2 completion

**Risk 4: Tool Design Iterations** (LOW)
- **Impact**: Detail_level parameter refinement needed
- **Mitigation**: Start with 3 levels (minimal/standard/full), adjust based on usage
- **Time**: +1-2 hours for parameter tuning

**Overall Risk Assessment**: MEDIUM
Phase 2 introduces new protocol (MCP) but leverages stable game engine and reduces complexity via consolidation.

---

## Success Metrics

### How We'll Know Phase 2 Is Complete

**Functional Completeness:**
- [ ] MPC server starts and registers 3 core tools successfully
- [ ] Claude can query game state + valid moves via `game_observe`
- [ ] Claude can execute moves via `game_execute` with atomic validation
- [ ] Claude can manage game lifecycle via `game_session`
- [ ] Claude can complete 20 evaluation scenarios
- [ ] All moves logged with decision reasoning
- [ ] Error messages guide LLM to legal moves

**Quality Metrics:**
- [ ] 95%+ test coverage maintained
- [ ] All tests passing (~40 tests: unit + integration + E2E)
- [ ] Tool responses optimized per Anthropic guidelines
- [ ] Token efficiency demonstrated (minimal vs standard vs full detail levels)
- [ ] No regressions in core game engine
- [ ] E2E tests validate actual Claude gameplay

**Optimization Metrics:**
- [ ] Turn count reduces by 10% after 10 games (baseline → optimized)
- [ ] Win rate >60% against random strategy after 20 games
- [ ] Measurable improvement session-over-session (tracked in logs)
- [ ] 20/20 evaluation scenarios pass
- [ ] Performance trends visualized in `game_get_performance`

**User Validation:**
- [ ] Claude completes ≥3 full games successfully
- [ ] Strategic decisions improve over time (not random)
- [ ] Error recovery works (LLM learns from mistakes)
- [ ] Performance logs provide optimization insights
- [ ] Games complete in reasonable time (Haiku <2min, Sonnet <5min per game)

---

## Evaluation Framework (20 Scenarios)

**Scenario Count**: 20 total
- **Training set**: 15 scenarios for development/iteration
- **Held-out test set**: 5 scenarios for validation (prevent overfitting)

**Scenario Complexity** (following Anthropic guidance):

✅ **GOOD** (multi-step, realistic):
- "Turn 5, you have 7 coins in buy phase. Optimize buying strategy to reach 8 provinces fastest. Consider economy vs victory point balance."
- "Opponent has 4 provinces. You have 2 provinces but 3 Silver, 2 Gold economy. What's your optimal strategy for the next 3 turns?"
- "Opening hand: Village, Smithy, Market, Copper, Copper. Execute optimal action phase sequence and explain reasoning."

❌ **BAD** (simplistic, one-step):
- "Buy a Province"
- "Play card 1"
- "Get game state"

**Evaluation Metrics** (track for each scenario):
1. **Accuracy**: Scenario completion rate (%)
2. **Tool calls**: Total count, types called, redundancy
3. **Token efficiency**: Total tokens consumed per scenario
4. **Error rate**: Tool errors, parameter validation failures
5. **Runtime**: Average ms per tool call, per scenario

**Verification**:
- Ground truth responses for each scenario
- Use Claude to judge responses (with clear rubric)
- Avoid overly strict verifiers (allow valid alternatives)

**Implementation**:
- Programmatic API calls (not manual)
- Simple agentic loop: `while not done: call_llm() → execute_tools()`
- System prompt includes reasoning/feedback blocks
- Enable extended thinking for Sonnet runs

---

## Dependencies and Risks

### Dependencies

**No External Blockers**: Phase 2 can start immediately

**Required:**
- ✅ Phase 1.6 complete (stable game engine, 648 tests passing)
- ✅ TypeScript/Node.js environment
- ✅ MCP SDK (@modelcontextprotocol/sdk)
- ✅ Claude API access (for E2E tests)
- ✅ Jest test framework (already configured)

**Optional (for E2E):**
- Claude API key (for automated E2E tests)
- Rate limit headroom (for repeated test runs)
- Budget: ~$50/month for E2E tests (Haiku is cheap)

### Risks and Mitigation

**Risk 1: MCP Protocol Incompatibility** (LOW)
- **Impact**: Tools don't work with Claude Desktop
- **Mitigation**: Follow MCP SDK examples, test incrementally
- **Fallback**: Use REST API instead of MCP (more work, but proven)
- **Time**: +4-6 hours if fallback needed

**Risk 2: LLM Doesn't Optimize** (MEDIUM - RESEARCH RISK)
- **Impact**: Claude doesn't improve win rate after 20 games
- **Mitigation**: This is research! Document patterns regardless
- **Fallback**: Not a blocker - gather data regardless of win rate
- **Time**: No impact on Phase 2 completion

**Risk 3: Performance Issues** (LOW)
- **Impact**: API calls too slow for smooth gameplay
- **Mitigation**: Optimize state queries, cache where possible, use Haiku
- **Fallback**: Document performance, optimize in Phase 3
- **Time**: +2-3 hours for optimization

**Risk 4: Scope Creep** (MEDIUM)
- **Impact**: Adding features beyond 7 core tools
- **Mitigation**: Strict scope adherence - defer extras to Phase 3
- **Fallback**: Cut Feature 3 (performance tracking) if time constrained
- **Time**: Stay within 18-23 hour estimate

**Overall Risk Assessment**: MEDIUM
New technology (MCP) with optimization-oriented goals (LLM learning unknown).

---

## Next Steps

### Requirements Phase (Current)

1. **requirements-architect defines specifications** (this document + 4 more)
   - OVERVIEW.md (this file) - Context and goals
   - FEATURES.md - Detailed 7 tool specs with acceptance criteria
   - TESTING.md - Three-level test specifications (~72 tests)
   - ARCHITECTURE.md - MCP server design, tool schemas, Anthropic best practices
   - REQUIREMENTS_COMPLETE.md - Comprehensive test cases + evaluation scenarios

2. **User reviews and approves requirements** (before implementation)
   - Validate feature scope (7 tools, 3 features)
   - Confirm success criteria (optimization focus)
   - Approve time estimates (18-23 hours)
   - Agree on evaluation framework (20 scenarios)

### Implementation Phase (After Approval)

1. **test-architect writes tests** (~5.5 hours)
   - Unit tests for each tool (isolated)
   - Integration tests (MCP server + game engine)
   - E2E tests (Haiku default, Sonnet validation)
   - Evaluation scenario infrastructure

2. **dev-agent implements features** (~10-13 hours)
   - Feature 1: MCP server infrastructure
   - Feature 2: State & execution tools (5 tools)
   - Feature 3: Performance & history tools (2 tools)
   - All tests passing before moving to next feature

3. **requirements-architect documents completion** (~1 hour)
   - Update Phase 2 status to COMPLETE
   - Add to CLAUDE.md
   - Prepare Phase 3 planning
   - Capture optimization insights

### User Validation (Final Step)

Manual validation:
- Run MCP server locally
- Connect Claude Desktop app or CLI
- Observe autonomous gameplay
- Review performance metrics and improvement trends
- Confirm optimization goals met

---

## Appendix: Frequently Asked Questions

**Q: Why 3 tools instead of 7?**
A: Anthropic best practice: "Pair tools that LLMs naturally use together." game_observe combines state + moves (naturally queried together). game_execute and game_session are atomic operations. This reduces context fragmentation and improves LLM decision quality.

**Q: Why consolidate game_observe instead of separate tools?**
A: Real LLM workflows always query state THEN valid moves before deciding. Combining them in one tool: (1) saves API round-trip, (2) ensures consistent game context, (3) improves token efficiency by 30%+.

**Q: Why Haiku vs Sonnet model selection?**
A: Cost/quality tradeoff. Haiku is 10x cheaper for iteration. Sonnet validates quality. Track performance delta to inform Phase 3 deployment.

**Q: Why stdio transport instead of HTTP?**
A: Phase 2 is local development only. Stdio is simpler, faster, easier to debug. HTTP deployment deferred to Phase 3 (Azure Functions).

**Q: Will Claude actually optimize performance?**
A: Unknown - that's the research! Phase 2 measures optimization capability, not guarantees it. Poor learning is still valuable data.

**Q: How do we test with actual Claude API?**
A: E2E tests make real API calls (limited to avoid rate limits). Most tests use mocks. Haiku default for cost management.

**Q: What if LLM doesn't improve after 20 games?**
A: Research insight! Document patterns, analyze logs. Phase 2 succeeds by completing games and tracking metrics, regardless of improvement.

**Q: How long will games take?**
A: Haiku: <2 min/game. Sonnet: <5 min/game. Measured in Phase 2, optimized in Phase 3 if needed.

**Q: Can we add more cards in Phase 2?**
A: No - scope creep risk. Use existing 15 cards. Phase 5+ adds complex cards.

**Q: What's the success threshold?**
A: Complete 20/20 evaluation scenarios. Optimization improvement is measured, not enforced (research goal).

---

## Conclusion

Phase 2 transforms Principality AI into an **LLM optimization platform** through 3 consolidated MCP tools designed per Anthropic best practices. By focusing on **win rate and turn efficiency improvement**, we enable:

1. ✅ Autonomous LLM gameplay (Claude plays complete games)
2. ✅ Performance optimization (measurable improvement over time)
3. ✅ Atomic move validation (game_execute validates + executes, no state corruption)
4. ✅ Efficient tool design (3 tools, game_observe combines state+moves, token optimized)
5. ✅ Research foundation (measure LLM learning in strategy games)

This unlocks competitive AI for Phase 3 multiplayer while providing research insights into LLM optimization capabilities. The 3-tool design is significantly simpler than the 7-tool version while improving LLM decision quality through consolidated state+moves responses.

**Estimated Effort**: 12-16 hours (3 features, 3 tools, ~40 tests)
**Risk Level**: Low-Medium (new MCP protocol but simpler architecture)
**Value**: High (enables competitive AI, unlocks future phases, research insights, faster implementation)

**Next Step**: Review and approve 3-tool design, then proceed to test-driven implementation.

---

**Document Status**: REVISED
**Created**: 2025-10-21
**Revised**: 2025-10-22 (3-tool consolidation, reduced from 7 tools, 12-16h effort)
**Author**: requirements-architect
**Ready for**: User review and approval
