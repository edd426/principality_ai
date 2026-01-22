# CLAUDE.md

**Status**: ACTIVE

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
├── api-server/ # HTTP API server
├── cli/        # CLI interface
├── core/       # Game engine
├── mcp-server/ # MCP integration
└── web/        # Web UI
```

## Commands

```bash
npm run build   # Build all packages
npm run test    # Run all tests
npm run lint    # Check code style
npm run play    # Start CLI game (--seed, --stable-numbers)
```

---

## Development Workflow

**This project prefers: Requirements → Tests → Implementation**

| Task | Workflow |
|------|----------|
| **New feature** | Define requirements → Write failing tests with `@req` tags → Implement |
| **Bug fix** | Write reproducing test → Verify fails → Fix → Verify passes |
| **Refactor** | Ensure tests exist → Run tests (green) → Refactor → Run tests (still green) |

**Agents**: Use `test-architect` for requirements/tests, `dev-agent` for implementation. For simple fixes with existing tests, work directly.

**TDD Skill**: The `/tdd-workflow` skill auto-activates for implementation tasks (implement, add, create, fix, build). It enforces the Requirements → Tests → Implementation workflow and guides subagent usage. See [.claude/skills/tdd-workflow/SKILL.md](./.claude/skills/tdd-workflow/SKILL.md).

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

## MCP Server Development

After modifying MCP server code, restart Claude Code for changes to take effect:
1. Run `npm run build` to compile
2. Restart Claude Code session (MCP server runs as child process)

---

## Development Standards

| Topic | Reference |
|-------|-----------|
| TDD Workflow | [docs/TDD_WORKFLOW.md](./docs/TDD_WORKFLOW.md) |
| Roadmap | [docs/ROADMAP.md](./docs/ROADMAP.md) |
| Documentation | [docs/DOCUMENTATION_GUIDELINES.md](./docs/DOCUMENTATION_GUIDELINES.md) |
| Agent Communication | [.claude/AGENT_COMMUNICATION.md](./.claude/AGENT_COMMUNICATION.md) |
| MCP Playtesting | [docs/testing/mcp-playtests/](./docs/testing/mcp-playtests/) |
| CLI Playtesting | [docs/testing/cli-playtests/](./docs/testing/cli-playtests/) |

**Playtest Report Validation**: Always validate agent claims against session logs - agents can get confused.

---

## Quick Links

- [API Reference](./docs/reference/API.md)
- [Development Guide](./docs/reference/DEVELOPMENT_GUIDE.md)
- [Requirements](./docs/requirements/)
- [MCP Playtest Scenarios](./docs/testing/mcp-playtests/SCENARIOS.md)
