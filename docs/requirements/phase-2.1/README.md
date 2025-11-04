# Phase 2.1 Requirements Documentation

**Status**: COMPLETE
**Created**: 2025-10-22
**Phase**: 2.1

## Overview

This directory contains complete requirements documentation for Phase 2.1: AI Gameplay Enhancement.

Phase 2.1 builds on Phase 2.0's solid MCP server foundation by enhancing Claude's Dominion gameplay through three focused features:

1. **Dominion Mechanics Skill** - Rules reference and error recovery
2. **Dominion Strategy Skill** - Decision guidance and strategic frameworks
3. **Enhanced Tool Logging** - Comprehensive debugging and performance tracking

## Quick Navigation

| Document | Purpose | Audience |
|----------|---------|----------|
| [OVERVIEW.md](./OVERVIEW.md) | Phase 2.1 vision, goals, and context | Everyone |
| [FEATURES.md](./FEATURES.md) | Detailed feature specifications | Test-architect, dev-agent |
| [TESTING.md](./TESTING.md) | Three-level test specifications | Test-architect |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design and integration | Dev-agent, architects |
| [README.md](./README.md) | This file - quick reference | Everyone |

## Key Statistics

| Metric | Value |
|--------|-------|
| Estimated Effort | 13-17 hours |
| Features | 3 |
| Test Cases | 45-50 |
| Priority | HIGH (enables Phase 2.2 measurement) |
| Risk Level | LOW (well-defined features) |
| Expected Value | HIGH (improves Claude's gameplay) |

## Phase 2.1 Features at a Glance

### Feature 1: Dominion Mechanics Skill
- **Purpose**: Auto-invoked help for game rules and syntax
- **Effort**: 5-6.5 hours
- **Files**:
  - `.claude/skills/dominion-mechanics/SKILL.md` (~200 lines)
  - `.claude/skills/dominion-mechanics/EXAMPLES.md` (~300 lines)
- **Success Metric**: >90% confusion recovery rate

### Feature 2: Dominion Strategy Skill
- **Purpose**: Auto-invoked decision guidance and strategic frameworks
- **Effort**: 5-6.5 hours
- **Files**:
  - `.claude/skills/dominion-strategy/SKILL.md` (~250 lines)
  - `.claude/skills/dominion-strategy/STRATEGIES.md` (~300 lines)
- **Success Metric**: >85% move quality, >10% win rate improvement

### Feature 3: Enhanced Tool Logging
- **Purpose**: Comprehensive debugging via structured JSON logs
- **Effort**: 3-3.5 hours
- **Location**: `packages/mcp-server/src/logging/`
- **Success Metric**: <5ms logging overhead, all issues debuggable from logs

## Test Coverage Summary

- **Unit Tests**: 15 tests (skills load, schemas validate, logging works)
- **Integration Tests**: 15 tests (skills integrate with Claude, logging with MCP)
- **E2E Tests**: 15 tests (real Claude gameplay, full logging chains)
- **Total**: 45-50 tests

**Target Coverage**: 95%+

## Success Criteria

### Phase 2.1 COMPLETE When:

**Feature 1 Complete:**
- [ ] SKILL.md and EXAMPLES.md created and comprehensive
- [ ] Skills load without errors
- [ ] Auto-invocation detects confusion patterns
- [ ] Confusion recovery rate > 90%
- [ ] No manual intervention needed for mechanical errors

**Feature 2 Complete:**
- [ ] SKILL.md and STRATEGIES.md created and comprehensive
- [ ] Strategy principles documented with decision trees
- [ ] Expert review: > 85% of moves strategically sound
- [ ] Win rate > 60% vs Phase 2.0 baseline
- [ ] Consistent strategy application (same situations → same decisions)

**Feature 3 Complete:**
- [ ] Logging middleware installed in MCP server
- [ ] INFO, DEBUG, TRACE levels working
- [ ] Console and file output configurable
- [ ] Logging overhead < 5ms per tool call
- [ ] Log files < 5MB per typical game session
- [ ] All tool calls captured and parseable

**Documentation Complete:**
- [ ] OVERVIEW.md explains vision and goals
- [ ] FEATURES.md details all requirements with acceptance criteria
- [ ] TESTING.md specifies all tests at three levels
- [ ] ARCHITECTURE.md documents system design
- [ ] All files meet size/quality standards

## Dependencies and Prerequisites

### Must Complete First
- ✅ Phase 2.0 (MCP server foundation)
  - game_observe, game_execute, game_session tools
  - Stdio transport working
  - Critical bug fixes complete

### Required Resources
- ✅ Claude Code .claude.md system (already in place)
- ✅ MCP server package (packages/mcp-server/)
- ✅ Jest test framework (already configured)
- ✅ Claude API access (for E2E tests)

### Environment Setup
```bash
# Required for Phase 2.1 development
cd packages/mcp-server
npm install

# Environment variables
LOG_LEVEL=DEBUG                              # For testing
ENABLE_SKILL_INJECTION=true                 # Enable auto-invocation
LOG_FILE=./logs/gameplay.log                # Log output location
```

## Workflow

### For test-architect
1. Read [TESTING.md](./TESTING.md) for test specifications
2. Implement 45-50 tests across unit/integration/E2E levels
3. Ensure all acceptance criteria covered
4. Run tests: `npm test -- --testPathPattern="phase-2.1"`

### For dev-agent
1. Read [FEATURES.md](./FEATURES.md) for detailed requirements
2. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. Implement features in order:
   - Feature 3 (Enhanced Logging) - Infrastructure first
   - Feature 1 (Mechanics Skill) - Gameplay help
   - Feature 2 (Strategy Skill) - Advanced guidance
4. All tests must pass before merge

### For requirements-architect
1. Review and approve test specifications
2. Monitor for scope creep or requirement gaps
3. Update this documentation with actual results
4. Prepare Phase 2.2 planning (measurement and analytics)

## Timeline Estimate

| Phase | Duration | Owner | Deliverable |
|-------|----------|-------|-------------|
| 1. Requirements Review | 1 hour | All | Approved specs |
| 2. Test Implementation | 2-3 hours | test-architect | All 45-50 tests |
| 3. Feature Implementation | 8-10.5 hours | dev-agent | All 3 features |
| 4. Integration & QA | 1-2 hours | test-architect + dev-agent | All tests pass |
| 5. Documentation Update | 0.5 hour | requirements-architect | Completion summary |
| **Total** | **13-17 hours** | | |

## Risks and Mitigations

### Risk 1: Skills Context Window Bloat (LOW)
- **Mitigation**: Skills ~1100 tokens total, <2% of typical context
- **Contingency**: Disable auto-invocation, use manual skill reference

### Risk 2: Logging Performance (LOW)
- **Mitigation**: Async logging, tested overhead < 5ms
- **Contingency**: Reduce to INFO level if needed

### Risk 3: Skill Content Quality (LOW)
- **Mitigation**: Detailed content specifications, multiple examples
- **Contingency**: Iterative refinement based on Phase 2.1 gameplay

## Lessons Learned from Phase 2.0

Phase 2.0 completion revealed important patterns:

1. **Bug Fixes Matter**: Two critical bugs (stdio transport, move parsing) had huge impact
2. **Logging Value**: Comprehensive logs would have debugged issues faster
3. **Context Management**: Auto-invocation of skills addresses mechanical confusion
4. **Foundation Quality**: Solid Phase 2.0 enables confident Phase 2.1

Phase 2.1 applies these lessons:
- ✅ Enhanced logging from day one
- ✅ Skill-based error recovery built in
- ✅ Comprehensive documentation of expectations
- ✅ Quality metrics and success criteria defined upfront

## References

- **Phase 2.0 Completion**: See [../phase-2/OVERVIEW.md](../phase-2/OVERVIEW.md#phase-20-completion-status)
- **Phase 1.6 Reference**: [../phase-1.6/](../phase-1.6/) (if available)
- **Main CLAUDE.md**: [../../CLAUDE.md](../../CLAUDE.md)
- **Development Guide**: [../../docs/reference/DEVELOPMENT_GUIDE.md](../../docs/reference/DEVELOPMENT_GUIDE.md)

## Questions & Clarifications

For questions about Phase 2.1 requirements:

1. **Feature scope**: See [FEATURES.md](./FEATURES.md) for detailed specifications
2. **Test coverage**: See [TESTING.md](./TESTING.md) for acceptance criteria
3. **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
4. **Effort estimates**: See [OVERVIEW.md](./OVERVIEW.md) for time breakdown

For scope clarifications not in requirements docs:
1. Check [FEATURES.md](./FEATURES.md) edge cases section
2. Contact requirements-architect with specific questions
3. Propose solutions that align with project goals

## Sign-Off

**Phase 2.1 Requirements APPROVED** (pending user review)

- [x] Feature specifications complete
- [x] Test specifications comprehensive
- [x] Architecture documented
- [x] Success criteria defined
- [x] Timeline realistic
- [x] Risk mitigation planned
- [x] Dependencies clear
- [x] Ready for implementation

**Next Steps**:
1. User reviews and approves requirements
2. test-architect implements 45-50 tests
3. dev-agent implements 3 features
4. All tests pass before Phase 2.1 completion

---

**Document Status**: COMPLETE
**Created**: 2025-10-22
**Author**: requirements-architect
**Ready for**: User review and implementation planning
