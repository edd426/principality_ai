# CLAUDE.md

**Status**: ACTIVE | **Phase**: 4 | **Last-Updated**: 2025-12-27

---

## Development Workflow Guidance

**This project prefers: Requirements → Tests → Implementation**

Before editing production code (`packages/*/src/*.ts`), consider:

| Check | Question |
|-------|----------|
| 1. Requirements defined? | Are the requirements clear? (Check `@req` tags in tests or GitHub issues) |
| 2. Test exists? | Is there a failing test that defines what you're about to implement? |
| 3. Tests run? | Have you run `npm test` to confirm the current state? |
| 4. Bug fix? | If fixing a bug, consider writing a test that reproduces it first |

### Workflow by Task Type

| Task | Workflow |
|------|----------|
| **New feature** | 1. Define requirements → 2. Write failing tests with `@req` tags → 3. Implement |
| **Bug fix** | 1. Write test reproducing bug → 2. Verify test fails → 3. Fix → 4. Verify test passes |
| **Refactor** | 1. Ensure tests exist → 2. Run tests (green) → 3. Refactor → 4. Run tests (still green) |

### Agent Usage Guidelines

**test-architect**: Owns requirements and tests. Use for defining what code should do.
**dev-agent**: Owns implementation. Use for writing production code to make tests pass.

#### When to use agents vs. working directly

| Scenario | Recommendation |
|----------|----------------|
| New feature with multiple components | Use test-architect first, then dev-agent |
| Complex bug requiring investigation | Use test-architect to write reproducing test |
| Simple one-line fix with existing tests | Work directly - run tests to verify |
| Adding tests to existing code | Use test-architect for proper @req tags |
| Quick exploratory changes | Work directly, but run tests before committing |
| Refactoring across multiple files | Use dev-agent after verifying test coverage |

#### Examples

**Use agents:**
- "Add user authentication" → test-architect defines requirements, dev-agent implements
- "Game crashes when playing Throne Room with no actions" → test-architect writes reproducing test first

**Work directly:**
- "Fix typo in error message" → just fix it, run tests
- "Update card cost from 4 to 5" → simple change, existing tests cover it
- "Run the tests and tell me what's failing" → investigation, no agents needed

This workflow does NOT apply to:
- Documentation changes
- Configuration changes
- Pure investigation/research tasks

---

## Project Overview

**Principality AI** is a solo-first Dominion-inspired deck-building game with MCP integration. Phased development from CLI sandbox → multiplayer → web UI.

## Technology Stack

- **Language**: TypeScript (Node.js)
- **Package Manager**: npm workspaces
- **Testing**: Jest (unit), Playwright (E2E)
- **Linting**: ESLint + Prettier

## Repository Structure

```
packages/
├── core/       # Game engine
├── cli/        # CLI interface
├── mcp-server/ # MCP integration
└── web/        # Web UI (Phase 5)
```

## Commands

```bash
npm run build   # Build all packages
npm run test    # Run all tests
npm run lint    # Check code style
npm run play    # Start CLI game (--seed, --stable-numbers)
```

## MCP Server Development

**After modifying MCP server code**, you must restart Claude Code for changes to take effect:
1. Run `npm run build` to compile changes
2. Restart Claude Code session (the MCP server runs as a child process)
3. MCP tools will now use the updated code

Note: Unit tests run against compiled code directly and don't require restart.

---

## Core Architecture

**Immutable state pattern** with functional updates:
- `GameState` contains players, supply, phase, turn number
- All moves return new state (no mutations)
- Deterministic randomness via seed parameter

### Common Gotchas

```typescript
// GameEngine requires seed
const engine = new GameEngine('seed-string');

// executeMove returns result object, not state
const result = engine.executeMove(state, move);
if (result.success) state = result.gameState;

// Card names are strings
const move = {type: 'play_action', card: 'Village'};

// Supply is a Map
supply.get('Copper')  // ✓
supply['Copper']      // ✗
```

---

## Game Rules

- **Starting deck**: 7 Copper + 3 Estate
- **Turn phases**: Action → Buy → Cleanup
- **Game end**: Province pile empty OR any 3 piles empty
- **Scoring**: Estate (1), Duchy (3), Province (6)

---

## Development Standards

**TDD is strongly encouraged.** Tests first, implementation follows.
→ See [docs/TDD_WORKFLOW.md](./docs/TDD_WORKFLOW.md)

**Current phase**: 4 (Complete Dominion Base Set) - 25 cards, 638/655 tests passing.
→ See [docs/PHASE_STATUS.md](./docs/PHASE_STATUS.md)

**Documentation**: Root allows only README.md, CLAUDE.md, CONTRIBUTING.md.
→ See [docs/DOCUMENTATION_GUIDELINES.md](./docs/DOCUMENTATION_GUIDELINES.md)

**Agent communication**: Via @ tags in code/tests.
→ See [.claude/AGENT_COMMUNICATION.md](./.claude/AGENT_COMMUNICATION.md)

**Session reports**: Work logs, playtests, and reviews go in `docs/sessions/`.
→ Keep `.claude/` for configuration only (agents, skills, settings).

**MCP playtesting**: Use `game-tester` agent to run automated game tests.
→ See [docs/testing/mcp-playtests/](./docs/testing/mcp-playtests/)

**CLI playtesting**: Use `cli-tester` agent to test CLI turn-based mode.
→ See [docs/testing/cli-playtests/](./docs/testing/cli-playtests/)

### Playtest Report Validation

When reviewing cli-tester or game-tester agent reports:
1. **Always validate claims against session logs** - playtest agents can get confused
2. Session logs are at the path in the report's "Session Log" field
3. Cross-reference specific claims (turn numbers, errors, card purchases)
4. Note discrepancies between report and log evidence

---

## Quick Links

- [API Reference](./docs/reference/API.md)
- [Development Guide](./docs/reference/DEVELOPMENT_GUIDE.md)
- [Performance Benchmarks](./docs/reference/PERFORMANCE.md)
- [Phase 4 Requirements](./docs/requirements/phase-4/)
- [MCP Playtest Scenarios](./docs/testing/mcp-playtests/SCENARIOS.md)
