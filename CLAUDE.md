# CLAUDE.md

**Status**: ACTIVE | **Phase**: 4 | **Last-Updated**: 2025-12-21

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
