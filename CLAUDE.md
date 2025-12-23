# CLAUDE.md

**Status**: ACTIVE | **Phase**: 4 | **Last-Updated**: 2025-12-23

---

## STOP: Development Workflow Checkpoint

**This project follows: Requirements → Tests → Implementation**

**Before editing ANY production code** (`packages/*/src/*.ts`), verify:

| Check | Question |
|-------|----------|
| 1. Requirements defined? | Are the requirements clear? (Check `@req` tags in tests or GitHub issues) |
| 2. Test exists? | Is there a failing test that defines what you're about to implement? |
| 3. Tests run? | Have you run `npm test` to confirm the current state? |
| 4. Bug fix? | If fixing a bug, did you write a test that reproduces it FIRST? |

**If you answered "no" to any of these: STOP.**

### Workflow by Task Type

| Task | Workflow |
|------|----------|
| **New feature** | 1. Define requirements → 2. Write failing tests with `@req` tags → 3. Implement |
| **Bug fix** | 1. Write test reproducing bug → 2. Verify test fails → 3. Fix → 4. Verify test passes |
| **Refactor** | 1. Ensure tests exist → 2. Run tests (green) → 3. Refactor → 4. Run tests (still green) |

### Agent Responsibilities

- **test-architect**: Owns requirements and tests. Use for defining what code should do.
- **dev-agent**: Owns implementation. Use for writing production code to make tests pass.

This does NOT apply to:
- Documentation changes
- Test file changes (that's test-architect's job)
- Configuration changes

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

**TDD is mandatory.** Tests first, implementation follows.
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

---

## Quick Links

- [API Reference](./docs/reference/API.md)
- [Development Guide](./docs/reference/DEVELOPMENT_GUIDE.md)
- [Performance Benchmarks](./docs/reference/PERFORMANCE.md)
- [Phase 4 Requirements](./docs/requirements/phase-4/)
- [MCP Playtest Scenarios](./docs/testing/mcp-playtests/SCENARIOS.md)
