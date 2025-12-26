# Phase 4.3: Testing & Quality Assurance

**Status**: IN PROGRESS
**Created**: 2025-12-25
**Last-Updated**: 2025-12-25

---

## Executive Summary

Phase 4.3 establishes automated testing infrastructure for ensuring game quality across both MCP and CLI interfaces. This phase uses AI agents (primarily Haiku) to play games, find bugs, and evaluate user experience.

**Goals**:
1. Catch bugs before they reach users through automated playtesting
2. Enable AI agents to test CLI user experience
3. Create regression test suites for CI/CD integration

---

## Completed Work

### Feature 1: MCP Playtesting System

Haiku agents play games through MCP tools to find bugs and validate mechanics.

**Components Built**:

| Component | Location | Purpose |
|-----------|----------|---------|
| game-tester agent | `.claude/agents/game-tester.md` | Automated game player with structured reporting |
| Test scenarios | `docs/testing/mcp-playtests/SCENARIOS.md` | 29 scenarios covering cards, strategies, edge cases |
| Playtest skill | `.claude/skills/playtest/` | Parallel agent spawning with convergence analysis |
| Test reports | `docs/testing/mcp-playtests/reports/` | Structured Q&A format for each playtest |

**How It Works**:

```
1. Spawn 3 parallel Haiku agents with same scenario
2. Each agent plays game using MCP tools (game_session, game_execute, game_observe)
3. Agents write structured reports (Q1-Q7 format)
4. Compare results for convergence:
   - 0/3 report issue → ~95% no bug
   - 2/3 report issue → ~75% real bug
   - 3/3 report issue → ~95% real bug
5. Verify in game logs if issues found
```

**Coverage Achieved**:
- 22/29 scenarios tested (76%)
- 15 card tests passing
- 5 edge case tests passing
- 2 UX tests passing

**Bugs Found and Fixed**:
- Mine treasure placement (issue #80)
- Throne Room stuck state (issue #80)
- Moneylender pendingEffect stuck state (issue #79)
- MCP state desynchronization (issues #72, #77)
- Edition parameter missing from MCP schema

**Key Learnings**:
- Haiku excels at mechanical, deterministic tests
- Haiku struggles with complex multi-step reasoning
- Always provide explicit seeds and editions to agents
- Use `play_treasure all` to reduce agent decision complexity

See [SCENARIOS.md](../../testing/mcp-playtests/SCENARIOS.md) for full scenario list and coverage.
See [Haiku Agent Recommendations](../../testing/mcp-playtests/SCENARIOS.md#haiku-agent-recommendations) for best practices.

### Feature 2: CLI Turn-Based Mode ✅

Enable AI agents to test the CLI interface by making it non-interactive.

**Status**: COMPLETE

**Problem Solved**:
- CLI uses readline for interactive input
- AI agents can't "type" into running processes
- Agents get stuck waiting for stdin

**Solution Implemented**: Turn-based execution mode

```bash
# Initialize game, output state, exit
node packages/cli/dist/index.js --seed test-1 --init --state-file /tmp/game.json

# Execute single move, output result, exit
node packages/cli/dist/index.js --state-file /tmp/game.json --move "buy Silver"

# Execute by move number
node packages/cli/dist/index.js --state-file /tmp/game.json --move "1"
```

**Components Built**:

| Component | Location | Purpose |
|-----------|----------|---------|
| State persistence | `packages/cli/src/state-persistence.ts` | Map serialization, file I/O |
| Turn-based CLI | `packages/cli/src/turn-based-cli.ts` | initializeGameAndSave, executeMoveAndSave |
| Entry point | `packages/cli/src/index.ts` | --init, --state-file, --move flags |
| Tests | `packages/cli/tests/state-persistence.test.ts` | 23 tests with @req SP-* tags |
| Tests | `packages/cli/tests/turn-based-mode.test.ts` | 38 tests with @req TB-CLI-* tags |

**Key Design Decisions**:
- Each CLI invocation is non-blocking (runs to completion)
- State persisted to JSON file with schema version for forward compatibility
- Supply Map serialized as `[[cardName, count], ...]` tuples
- Agent sees full CLI output (same as interactive mode) for UX evaluation
- Valid moves always included in output
- Verbose error handling with debug context

**Test Coverage**: 56/61 tests passing (92%)

---

## Planned Work

### Feature 3: CLI Integration Tests (Jest)

Automated test suite for CLI that runs in CI/CD.

**Purpose**:
- Regression prevention
- Deterministic (no agents needed per run)
- Fast feedback on PRs

**Approach**:
- Pipe move sequences to CLI
- Verify game completes without errors
- Check for expected output patterns

**Implementation Location**: `packages/cli/tests/integration/`

### Feature 4: CLI UX Evaluation Agent

AI agent that evaluates CLI usability by playing through turn-based mode.

**Purpose**:
- Identify confusing prompts
- Rate screen clarity
- Suggest UX improvements
- Detect "stuck" states

**Agent Design**:
```yaml
name: cli-ux-tester
model: sonnet  # Needs reasoning ability
tools: Bash, Write
```

**Evaluation Criteria**:
- Clarity: "Is it obvious what phase I'm in?"
- Options: "Are available moves clearly listed?"
- Feedback: "Did my last move's result make sense?"
- Recovery: "Was the error message helpful?"

**Implementation Location**: `.claude/agents/cli-ux-tester.md`

---

## Requirements Approach

**This phase follows the test-first pattern**: Requirements are embedded in tests using `@req` tags rather than maintained in separate requirement documents.

| Component | Where Requirements Live |
|-----------|------------------------|
| MCP playtesting | `docs/testing/mcp-playtests/SCENARIOS.md` |
| CLI turn-based mode | `packages/cli/tests/` (with `@req` tags) |
| CLI integration tests | `packages/cli/tests/integration/` (with `@req` tags) |
| UX evaluation | `.claude/agents/cli-ux-tester.md` (agent prompt) |

---

## Success Criteria

Phase 4.3 is complete when:

- [ ] MCP playtest coverage reaches 90%+ (26/29 scenarios)
- [x] CLI turn-based mode implemented and tested ✅
- [ ] CLI integration test suite in place
- [ ] cli-ux-tester agent created and validated
- [ ] No P0/P1 bugs found in 5 consecutive playtest runs

---

## Related Documentation

- [MCP Playtest Scenarios](../../testing/mcp-playtests/SCENARIOS.md)
- [game-tester Agent](../../../.claude/agents/game-tester.md)
- [playtest Skill](../../../.claude/skills/playtest/)
- [PHASE_STATUS.md](../../PHASE_STATUS.md)
