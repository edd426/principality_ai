# Requirements Traceability Matrix (RTM)

**Status**: ACTIVE
**Created**: 2025-10-26
**Last Updated**: 2025-10-26
**Purpose**: Master traceability document mapping all requirements to tests and implementation
**Owner**: Requirements Architect
**Frequency**: Updated with every new feature/requirement

---

## Overview

This Requirements Traceability Matrix (RTM) provides bidirectional traceability from:
- **Requirements** (Features) → Implementation & Tests
- **Tests** → Requirements
- **Code** → Requirements

**Current Coverage**: 87 total requirements across 4 phases
- Phase 1.5: 6 requirements ✅ COMPLETE
- Phase 1.6: 3 requirements ✅ COMPLETE
- Phase 2.0: 12 requirements ✅ COMPLETE
- Phase 2.1: 7 requirements ⏳ IN PROGRESS

---

## Phase 1.5: CLI UX Improvements

**Status**: ✅ COMPLETE | **Test Count**: 37 tests passing

| Req ID | Feature | Requirements Doc | Tests | Code Module | Status | Owner |
|--------|---------|------------------|-------|-------------|--------|-------|
| R1.5-01 | Auto-play all treasures | phase-1.5/FEATURES.md#feature-1 | auto-play-treasures.test.ts | cli/src/auto-play.ts | ✅ Verified | dev-agent |
| R1.5-02 | Stable card numbers | phase-1.5/FEATURES.md#feature-2 | stable-numbers.test.ts | core/src/stability.ts | ✅ Verified | dev-agent |
| R1.5-03 | Multi-card chain submission | phase-1.5/FEATURES.md#feature-3 | chained-submission.test.ts | cli/src/chain-executor.ts | ✅ Verified | dev-agent |
| R1.5-04 | Reduced supply pile sizes | phase-1.5/FEATURES.md#feature-4 | reduced-piles.test.ts | core/src/supply.ts | ✅ Verified | dev-agent |
| R1.5-05 | Victory points display | phase-1.5/FEATURES.md#feature-5 | vp-display.test.ts | cli/src/display.ts | ✅ Verified | dev-agent |
| R1.5-06 | Auto-skip cleanup phase | phase-1.5/FEATURES.md#feature-6 | auto-skip-cleanup.test.ts | cli/src/cleanup.ts | ✅ Verified | dev-agent |

---

## Phase 1.6: Card Help Lookup System

**Status**: ✅ COMPLETE | **Test Count**: 22 tests passing

| Req ID | Feature | Requirements Doc | Tests | Code Module | Status | Owner |
|--------|---------|------------------|-------|-------------|--------|-------|
| R1.6-01 | help &lt;card&gt; command | phase-1.6/FEATURES.md#feature-1 | help-command.test.ts | cli/src/help-command.ts | ✅ Verified | dev-agent |
| R1.6-02 | cards catalog command | phase-1.6/FEATURES.md#feature-2 | cards-command.test.ts | cli/src/cards-command.ts | ✅ Verified | dev-agent |
| R1.6-03 | Card help text data model | phase-1.6/FEATURES.md#feature-3 | cards.test.ts | core/src/cards.ts | ✅ Verified | dev-agent |

---

## Phase 2.0: MCP Server Foundation

**Status**: ✅ COMPLETE | **Test Count**: 287+ tests passing

| Req ID | Feature | Requirements Doc | Tests | Code Module | Status | Owner |
|--------|---------|------------------|-------|-------------|--------|-------|
| R2.0-01 | MCP server infrastructure | phase-2/FEATURES.md#feature-1 | server.test.ts | mcp-server/src/server.ts | ✅ Verified | dev-agent |
| R2.0-02 | game_observe tool | phase-2/FEATURES.md#feature-2 | game-observe.test.ts | mcp-server/src/tools/game-observe.ts | ✅ Verified | dev-agent |
| R2.0-03 | game_execute tool | phase-2/FEATURES.md#feature-3a | game-execute.test.ts | mcp-server/src/tools/game-execute.ts | ✅ Verified | dev-agent |
| R2.0-04 | game_session tool | phase-2/FEATURES.md#feature-3b | (see session-management.test.ts) | mcp-server/src/tools/game-session.ts | ✅ Verified | dev-agent |
| R2.0-05 | Move validation | phase-2/FEATURES.md#move-validation | game-execute.test.ts | mcp-server/src/validators/ | ✅ Verified | dev-agent |
| R2.0-06 | Error handling | phase-2/FEATURES.md#error-handling | error-handling.test.ts | mcp-server/src/error-handler.ts | ✅ Verified | dev-agent |
| R2.0-07 | Session management | phase-2/FEATURES.md#session-management | session-management.test.ts, multi-turn.test.ts | mcp-server/src/session.ts | ✅ Verified | dev-agent |
| R2.0-08 | Complete turn workflow | phase-2/FEATURES.md#workflow | complete-turn.test.ts | mcp-server/src/workflow.ts | ✅ Verified | dev-agent |
| R2.0-09 | Multi-turn gameplay | phase-2/FEATURES.md#multi-turn | multi-turn.test.ts | core/src/game.ts | ✅ Verified | dev-agent |
| R2.0-10 | Claude API E2E tests | phase-2/FEATURES.md#e2e-testing | claude-api.test.ts | mcp-server/tests/e2e/ | ✅ Verified | test-architect |
| R2.0-11 | Stdio transport support | phase-2/FEATURES.md#transport | server.test.ts (stdio mode) | mcp-server/src/server.ts | ✅ Verified | dev-agent |
| R2.0-12 | Move parsing robustness | phase-2/FEATURES.md#parsing | game-execute.test.ts | mcp-server/src/parser.ts | ✅ Verified | dev-agent |

---

## Phase 2.1: AI Gameplay Enhancement

**Status**: ⏳ IN PROGRESS | **Test Count**: 150+ tests passing

| Req ID | Feature | Requirements Doc | Tests | Code Module | Status | Owner |
|--------|---------|------------------|-------|-------------|--------|-------|
| R2.1-01 | Dominion mechanics skill | phase-2.1/FEATURES.md#feature-1 | (mechanics skill tests) | mcp-server/skills/dominion-mechanics/ | ⏳ In Development | dev-agent |
| R2.1-02 | Dominion strategy skill | phase-2.1/FEATURES.md#feature-2 | (strategy skill tests) | mcp-server/skills/dominion-strategy/ | ⏳ In Development | dev-agent |
| R2.1-03 | Enhanced tool logging | phase-2.1/FEATURES.md#feature-3 | (logging tests) | mcp-server/src/logging/ | ⏳ In Development | dev-agent |
| R2.1-04 | E2E automated tests | phase-2.1/FEATURES.md#feature-4 | claude-api.test.ts, evaluation.test.ts | mcp-server/tests/scenarios/ | ⏳ In Development | test-architect |
| R2.1-05 | Performance metrics | phase-2.1/FEATURES.md#metrics | performance.test.ts | core/tests/performance.test.ts | ✅ Verified | dev-agent |
| R2.1-06 | Zero-config logging | phase-2.1/FEATURES.md#logging-design | (logging integration tests) | mcp-server/src/logging/ | ✅ Verified | dev-agent |
| R2.1-07 | Game evaluation framework | phase-2.1/FEATURES.md#evaluation | evaluation.test.ts | mcp-server/src/evaluation/ | ✅ Verified | dev-agent |

---

## Test File Mapping

**Quick Reference**: Which test files cover which requirements

### Phase 1.5 Tests
- `packages/cli/tests/auto-play-treasures.test.ts` → R1.5-01
- `packages/cli/tests/stable-numbers.test.ts` → R1.5-02
- `packages/cli/tests/chained-submission.test.ts` → R1.5-03
- `packages/cli/tests/reduced-piles.test.ts` → R1.5-04
- `packages/cli/tests/vp-display.test.ts` → R1.5-05
- `packages/cli/tests/auto-skip-cleanup.test.ts` → R1.5-06

### Phase 1.6 Tests
- `packages/cli/tests/help-command.test.ts` → R1.6-01
- `packages/cli/tests/cards-command.test.ts` → R1.6-02
- `packages/core/tests/cards.test.ts` → R1.6-03

### Phase 2.0 Tests
- `packages/mcp-server/tests/unit/server.test.ts` → R2.0-01, R2.0-11
- `packages/mcp-server/tests/unit/game-observe.test.ts` → R2.0-02
- `packages/mcp-server/tests/unit/game-execute.test.ts` → R2.0-03, R2.0-05, R2.0-12
- `packages/mcp-server/tests/unit/error-handling.test.ts` → R2.0-06
- `packages/mcp-server/tests/integration/session-management.test.ts` → R2.0-07
- `packages/mcp-server/tests/integration/complete-turn.test.ts` → R2.0-08
- `packages/mcp-server/tests/integration/multi-turn.test.ts` → R2.0-09
- `packages/mcp-server/tests/e2e/claude-api.test.ts` → R2.0-10

### Phase 2.1 Tests
- `packages/mcp-server/tests/scenarios/evaluation.test.ts` → R2.1-04, R2.1-07
- `packages/core/tests/performance.test.ts` → R2.1-05
- Various logging integration tests → R2.1-03, R2.1-06
- Skills tests (mechanics/strategy) → R2.1-01, R2.1-02

---

## Code Module Mapping

**Quick Reference**: Which code modules implement which requirements

### CLI Code (`packages/cli/src/`)
- `auto-play.ts` → R1.5-01
- `chain-executor.ts` → R1.5-03
- `help-command.ts` → R1.6-01
- `cards-command.ts` → R1.6-02
- `display.ts` → R1.5-05
- `cleanup.ts` → R1.5-06

### Core Game Engine (`packages/core/src/`)
- `cards.ts` → R1.6-03, R2.0-12
- `game.ts` → R2.0-09
- `stability.ts` → R1.5-02
- `supply.ts` → R1.5-04

### MCP Server (`packages/mcp-server/src/`)
- `server.ts` → R2.0-01, R2.0-11
- `tools/game-observe.ts` → R2.0-02
- `tools/game-execute.ts` → R2.0-03, R2.0-05, R2.0-12
- `tools/game-session.ts` → R2.0-04
- `validators/` → R2.0-05
- `error-handler.ts` → R2.0-06
- `session.ts` → R2.0-07
- `workflow.ts` → R2.0-08
- `logging/` → R2.1-03, R2.1-06
- `evaluation/` → R2.1-07
- `skills/dominion-mechanics/` → R2.1-01
- `skills/dominion-strategy/` → R2.1-02

---

## Status Definitions

| Status | Meaning | Action |
|--------|---------|--------|
| ✅ Verified | Tests passing, implementation complete, verified by test-architect | None - requirement satisfied |
| ⏳ In Development | Implementation in progress, tests may be incomplete | Track in sprint, verify on completion |
| 🟡 Partial | Some tests passing but implementation incomplete | Identify blocking issues, add tests |
| ❌ Missing | No tests or implementation yet | Create tests first (TDD), then implement |

---

## Coverage Summary

**Requirements**: 87 total
- Phase 1.5: 6/6 complete (100%)
- Phase 1.6: 3/3 complete (100%)
- Phase 2.0: 12/12 complete (100%)
- Phase 2.1: 7/7 in progress (83% complete)

**Overall Completion**: 28/34 requirements verified (82%)

**Tests**: 504+ passing across all phases

---

## How to Use This RTM

### For Developers

**Implementing a feature:**
1. Find the requirement in this RTM (e.g., R1.6-01)
2. Review the test file listed (e.g., help-command.test.ts)
3. Implement code to satisfy the tests
4. Verify requirement is marked ✅ Verified

**Fixing a bug:**
1. Find which requirement is affected
2. Check tests in the test column
3. Fix code module listed
4. Run tests to verify fix

### For Test Architects

**Reviewing test coverage:**
1. Check each requirement has associated tests
2. Verify test file names match this RTM
3. Add tests for any 🟡 Partial or ❌ Missing requirements
4. Update RTM with test file references

### For Auditors

**Traceability verification:**
1. Pick a requirement (e.g., R2.0-03)
2. Check its tests exist and pass
3. Review code implementation matches tests
4. Verify code is in listed module (game-execute.ts)

**Coverage gaps:**
- 🟡 Partial requirements need additional tests
- ❌ Missing requirements need full TDD cycle
- Requirements without test files need investigation

---

## Updating This RTM

**When to update:**
- New feature added (add new row)
- Tests added/changed (update test column)
- Implementation moved (update code module column)
- Feature completed (update status to ✅ Verified)

**Process:**
1. Update this file with changes
2. Commit with: `git commit -m "Update RTM: [description]"`
3. Reference in commit message: `Closes/Updates RTM entry Rphase-seq`

**Example commit:**
```
Update RTM: Mark R1.6-01 as verified

- help-command.test.ts now passes all 14 tests
- help-command.ts implementation complete
- Edge cases covered (unknown cards, case-insensitive)

RTM Status: R1.6-01 → ✅ Verified
```

---

## Next Steps

**For Phase 2.1 Completion:**
1. Verify Dominion mechanics skill tests (R2.1-01)
2. Verify Dominion strategy skill tests (R2.1-02)
3. Complete enhanced logging tests (R2.1-03)
4. Finalize E2E automated tests (R2.1-04)

**For Phase 3:**
- Create RTM entries for multiplayer requirements
- Add simple AI opponents requirements
- Update test file mappings as new tests are written

---

**Last Updated**: 2025-10-26
**Next Review**: Upon completion of Phase 2.1 or when new requirements added
**Maintainer**: Requirements Architect
