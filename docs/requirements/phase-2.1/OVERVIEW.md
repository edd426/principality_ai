# Phase 2.1 Overview: AI Gameplay Enhancement

**Status**: ACTIVE
**Created**: 2025-10-22
**Phase**: 2.1
**Estimated Effort**: 15-20 hours
**Dependencies**: Phase 2.0 complete (MCP server foundation)

---

## Executive Summary

Phase 2.1 enhances Claude's Dominion gameplay capability by reducing confusion and improving decision quality through three focused features:

1. **Mechanics Skill**: Context-aware help documentation for game rules and command syntax
2. **Strategy Skill**: Decision guidance and strategic frameworks for optimal play
3. **Enhanced Tool Logging**: Comprehensive logging for debugging and performance analysis

*Note: E2E Haiku gameplay tests were initially planned but removed per testing audit best practices (non-deterministic, slow, expensive)*

**Primary Goal**: Improve Claude's gameplay consistency and reduce mechanical errors through auto-invoked skills and detailed debugging support. Validate all features work end-to-end with real Claude API.

**Success Criteria**:
- Claude recovers from mechanical errors without manual intervention
- Fewer "confused" responses (confusion recovery rate > 90%)
- Enhanced logs enable debugging of any gameplay issue
- Turnaround time on bug fixes < 2 hours from log analysis

---

## Problem Statement

**Phase 2.0 Foundation**: Claude can now play Dominion games autonomously with working MCP server

**Phase 2.1 Gap**: Claude makes mistakes due to:
1. **Mechanical confusion** (forgetting game rules, syntax, command formats)
2. **Strategic weakness** (buying suboptimal cards, poor action sequencing)
3. **Debugging difficulty** (unclear why Claude made specific decisions)

**User Impact**:
- Manual intervention needed to guide Claude through mistakes
- Optimization learning slowed by mechanical errors
- Hard to debug why specific moves were chosen
- Lost gameplay efficiency

---

## Solution Overview

### Feature 1: Dominion Mechanics Skill

**What**: Auto-invoked skills documentation covering:
- Game phase flow (action → buy → cleanup)
- Coin generation mechanics (treasures must be played to generate coins)
- Action economy (+1 action card, +2 actions = 4 cards next turn)
- Command syntax and examples ("play 0", "buy Province", "end")
- Common mistakes and how to avoid them

**How**: When Claude shows confusion (attempts invalid moves, asks clarifying questions), automatically inject Mechanics Skill context

**Format**:
- `.claude/skills/dominion-mechanics/SKILL.md` (~200 lines) - Core concepts and examples
- `.claude/skills/dominion-mechanics/EXAMPLES.md` (~300 lines) - Detailed scenarios with explanations

**Success**: Claude recovers from mechanical errors in < 3 tool calls

### Feature 2: Dominion Strategy Skill

**What**: Auto-invoked decision support covering:
- Buy priorities framework (Gold > Silver > Duchy > Estate progression)
- Economy vs Victory Point timing (early = economy, late = VP)
- Action card combinations (which cards synergize)
- Turn planning templates (step-by-step decision framework)

**How**: Auto-invoke at purchase decisions, detect strategy opportunities

**Format**:
- `.claude/skills/dominion-strategy/SKILL.md` (~250 lines) - Core strategy principles
- `.claude/skills/dominion-strategy/STRATEGIES.md` (~300 lines) - Specific tactics and scenarios

**Success**: Claude makes strategically sound purchases consistently (> 85% quality moves)

### Feature 3: Enhanced Tool Logging

**What**: MCP server enhancement for comprehensive debugging:
- Tool call logging (what Claude called, with inputs/outputs)
- Game state snapshots (state before/after each move)
- Phase transition tracking (when/why phases change)
- Performance metrics (response times, token counts)
- Decision reasoning (Claude's stated reasoning for moves)

**How**: Enable via environment variables, output to console + file

**Format**: JSON Lines (one entry per line for easy parsing)
- Configurable log levels (INFO, DEBUG, TRACE)
- Structured fields (timestamp, tool_name, duration, result, state_hash)

**Success**: Any gameplay issue diagnosable from logs alone


## Feature Details

### Feature 1: Dominion Mechanics Skill (6-8 hours)

**Implementation**:
- Create `.claude/skills/dominion-mechanics/SKILL.md` with core concepts
- Create `.claude/skills/dominion-mechanics/EXAMPLES.md` with detailed scenarios
- Integrate into Claude Code .claude.md context (auto-loaded)
- Document auto-invocation triggers in MCP server

**Content Outline** (SKILL.md ~200 lines):
1. Game Flow Overview (10 lines)
   - Action phase → Buy phase → Cleanup phase
   - Each phase has specific valid moves
   - Turn ends when cleanup completes

2. Coin Generation (20 lines)
   - Treasures generate coins (Copper=1, Silver=2, Gold=3)
   - Treasures must be PLAYED to generate coins
   - Playing = consuming action (you start with 1 action)
   - After playing treasures, you spend coins to buy cards

3. Action Economy (20 lines)
   - Starting: 1 action, 1 buy, 0 coins
   - Action cards grant +1 action (more plays possible)
   - Play order matters (more actions = more plays)
   - Example: 2 Villages + 1 Smithy = draw 5 cards total

4. Command Syntax (15 lines)
   - "play 0" plays card at hand index 0
   - "buy Copper" buys Copper card from supply
   - "end" or "end phase" ends current phase
   - Invalid syntax error messages guide correction

5. Common Mistakes (20 lines)
   - Forgetting to play treasures before buying
   - Playing action cards when no actions left
   - Wrong command syntax
   - Recovery suggestions

6. Rules Reference (30 lines)
   - Victory point calculations
   - Supply pile rules
   - Game end conditions

7. Quick Reference Cards (40 lines)
   - All 15 cards with costs, effects, types
   - Action card combinations table
   - Phase flow diagram

**Content Outline** (EXAMPLES.md ~300 lines):
- EXAMPLE-1: Opening hand optimization (Village, Smithy combo)
- EXAMPLE-2: Coin generation step-by-step
- EXAMPLE-3: Buy phase decision tree
- EXAMPLE-4: Error recovery scenarios
- Plus 10-15 more detailed scenarios

### Feature 2: Dominion Strategy Skill (6-8 hours)

**Implementation**:
- Create `.claude/skills/dominion-strategy/SKILL.md` with strategy principles
- Create `.claude/skills/dominion-strategy/STRATEGIES.md` with specific tactics
- Integrate into Claude Code context
- Document decision-point triggers

**Content Outline** (SKILL.md ~250 lines):
1. Game Phases (15 lines)
   - Early game (turns 1-5): Build economy
   - Mid game (turns 5-15): Accelerate VP acquisition
   - Late game (turns 15+): Fast finish

2. Big Money Strategy (40 lines)
   - Foundational buying sequence
   - Always buy available treasures (Gold > Silver > Copper)
   - Buy Province when ≥ 8 coins
   - Simple, effective baseline

3. VP Timing (30 lines)
   - Early Duchy/Estate = wasted deck space
   - Mid-game VP (5-7 Provinces) = acceleration point
   - Late-game VP = only option when economy maxed

4. Action Economy (25 lines)
   - Which action cards to prioritize
   - How many actions needed for good hands
   - Action + Treasure synergies

5. Strategic Principles (40 lines)
   - Deck thinning (remove weak cards)
   - Consistency (predictable hand quality)
   - Acceleration (reaching 8 coins faster)
   - Endgame awareness (Provinces left indicator)

6. Card Evaluation Table (50 lines)
   - Each kingdom card rated by phase
   - Synergies with other cards
   - When to prioritize each

7. Decision Templates (40 lines)
   - Action phase: "What gives best card draw?"
   - Buy phase: "Economy or VP?"
   - Late game: "Provinces or final treasures?"

**Content Outline** (STRATEGIES.md ~300 lines):
- STRATEGY-1: Big Money baseline (when/how to buy each card)
- STRATEGY-2: Early VP avoidance (why not to buy Estates early)
- STRATEGY-3: Action card prioritization (Village vs Smithy evaluation)
- STRATEGY-4: Endgame acceleration (recognizing final turn window)
- STRATEGY-5: Economic snowball (5-6-7-8 coin progression)
- Plus 10-15 more specific scenarios with decision trees

### Feature 3: Enhanced Tool Logging (4-5 hours)

**Implementation**:
- Add logging middleware to MCP server tool invocation
- Implement structured JSON logging
- Add environment variable configuration
- Create log parsing utilities

**Configuration** (Environment Variables):
```
LOG_LEVEL=INFO|DEBUG|TRACE          # Default: INFO
LOG_FILE=/path/to/gameplay.log      # Optional file output
LOG_CONSOLE=true|false              # Default: true
LOG_FORMAT=json|text                # Default: json
```

**Log Entry Format** (JSON Lines):
```json
{
  "timestamp": "2025-10-22T15:30:45.123Z",
  "tool": "game_execute",
  "request": {"move": "play 0"},
  "response": {"success": true},
  "duration_ms": 12,
  "tokens_estimated": 250,
  "state_hash": "abc123...",
  "phase_before": "action",
  "phase_after": "action"
}
```

**Configurable Logging Levels**:
- **INFO**: Tool calls, success/failure, phase transitions
- **DEBUG**: Request/response details, state snapshots, timing
- **TRACE**: Full game state before/after moves, decision reasoning

**Log Analysis Tools**:
- Simple parsing script to extract gameplay patterns
- State progression visualization
- Decision annotation (mark moves as optimal/suboptimal)
- Performance metrics aggregation

---

## Success Metrics

**Feature 1: Mechanics Skill**
- Confusion recovery rate > 90% (Claude recovers within 3 tool calls)
- Error frequency drops by 50% compared to Phase 2.0
- No manual intervention needed for mechanical issues
- Unit tests validate skill content completeness
- Integration tests validate auto-invocation triggers

**Feature 2: Strategy Skill**
- Move quality assessment > 85% (expert review of purchase decisions)
- Win rate improvement > 10% vs Phase 2.0 baseline
- Consistent strategy application (same situations → same decisions)
- Unit tests validate strategy framework completeness
- Integration tests validate decision consistency

**Feature 3: Enhanced Logging**
- 100% of tool calls logged with metadata
- Log files < 5MB per full game session
- Parse time < 100ms for typical session logs
- All bugs debuggable from logs alone
- Unit tests validate log schema and formatting
- Integration tests validate logging middleware integration

---

## Relationship to Roadmap

### Phase 2.1 in Context

**Phase 2.0 → 2.1**: Foundation to Enhancement
- Phase 2.0: "Claude can play games" (basic functionality)
- Phase 2.1: "Claude plays well" (improved capability)

**Phase 2.1 → Phase 3**: Enhancement to Multiplayer
- Skills improve Claude's autonomous play (reusable in Phase 3)
- Logging infrastructure supports AI opponent benchmarking
- Strategy framework scales to multiple players
- Comprehensive logs enable gameplay analysis without separate analytics phase

---

## Time Estimates

| Feature | Implementation | Testing | Documentation | Total |
|---------|---------------|---------|---------------|-------|
| Feature 1: Mechanics Skill | 3-4h | 1-1.5h | 1h | 5-6.5h |
| Feature 2: Strategy Skill | 3-4h | 1-1.5h | 1h | 5-6.5h |
| Feature 3: Enhanced Logging | 2-2.5h | 0.5-1h | 0.5h | 3-3.5h |
| **Total** | **8-10.5h** | **3-4h** | **2.5h** | **21-27h** |

**Note**: Feature 4 (E2E Haiku Tests) removed per testing audit best practices

---

## Next Steps

1. **Requirements Review** (this document)
   - Validate feature scope and priorities
   - Approve time estimates

2. **Test Specifications** (TESTING.md - separate document)
   - Define test coverage for each feature
   - Specify acceptance criteria

3. **Feature Specifications** (FEATURES.md - separate document)
   - Detailed requirements for each skill
   - Implementation guidance

4. **Architecture** (ARCHITECTURE.md - separate document)
   - How skills integrate with Claude Code context
   - Logging infrastructure design

---

## Dependencies and Risks

### Dependencies
- ✅ Phase 2.0 complete (MCP server foundation)
- ✅ Claude Code .claude.md system (documented in main CLAUDE.md)
- ✅ MCP server running (for logging middleware)

### Risks
**Low Risk - Well-Defined Features**
1. Skills may need refinement based on usage
2. Log volume might exceed expectations (mitigate with compression)
3. Auto-invocation triggers might need tuning

**Risk Mitigation**:
- Start with conservative logging (INFO level only)
- Disable auto-invocation triggers initially (manual trigger first)
- Iterative refinement based on Phase 2.1 gameplay results

---

## Conclusion

Phase 2.1 builds on Phase 2.0's solid foundation by enhancing Claude's gameplay through focused skills, comprehensive logging, and automated E2E validation. By reducing mechanical confusion, providing strategic guidance, and validating everything works with real Claude, we improve Claude's consistency and autonomous capability while establishing regression testing for future phases.

**Estimated Effort**: 15-20 hours (integrated across 4 features)
**Risk Level**: Low (well-defined features, clear success criteria)
**Value**: High (directly improves Claude's gameplay, enables Phase 2.2 measurement, provides regression testing)

**Next Step**: Proceed to FEATURES.md for detailed feature specifications and acceptance criteria.

---

**Document Status**: ACTIVE
**Created**: 2025-10-22
**Author**: requirements-architect
**Ready for**: Test specification and implementation planning
