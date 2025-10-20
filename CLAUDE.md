# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Principality AI** is a solo-first Dominion-inspired deck-building game designed for streamlined gameplay and AI integration through Model Context Protocol (MCP). The project follows a phased development approach from MVP solo sandbox to full multiplayer with web UI.

## Technology Stack

- **Language**: TypeScript throughout (Node.js runtime)
- **Package Manager**: npm with workspaces
- **Testing**: Jest for unit tests, Playwright for E2E (Phase 4+)
- **Build Tool**: Vite or esbuild for fast builds
- **Linting**: ESLint + Prettier
- **Cloud Infrastructure**: Azure (Static Web Apps, Functions, SignalR Service)

## Repository Structure

**Monorepo** (npm workspaces):
- `packages/core/` - Game engine (TypeScript)
- `packages/cli/` - CLI interface
- `packages/mcp-server/` - MCP integration (Phase 2)
- `packages/web/` - Web UI (Phase 4)

See [DEVELOPMENT_GUIDE.md](./docs/reference/DEVELOPMENT_GUIDE.md#project-structure) for full structure.

## Development Commands

- `npm run build` - Build all packages
- `npm run test` - Run all tests
- `npm run lint` - Check code style
- `npm run play` - Start CLI game (supports `--seed`, `--quick-game`, `--stable-numbers`)

See [DEVELOPMENT_GUIDE.md](./docs/reference/DEVELOPMENT_GUIDE.md) for detailed workflows and testing.

## Core Architecture

**Game Engine**: Immutable state pattern with functional updates
- `GameState` contains players, supply, phase, turn number
- All moves return new state (no mutations)
- Deterministic randomness via seed parameter

**Card System**: Type-safe definitions in `packages/core/src/cards.ts`

**MCP Integration** (Phase 2): Azure Functions with natural language parsing

**Common Gotchas**:
- `new GameEngine()` requires seed parameter
- `executeMove()` returns `{success, gameState}` object (not state directly)
- Card names are strings: `'Copper'` not `{name: 'Copper'}`
- Supply is a Map: use `.get('Copper')` not `['Copper']`

See [API.md](./docs/reference/API.md) for detailed API reference.

---

## Development Phases

**Phase 1 (Complete)**: CLI-based solo sandbox game with core 8 kingdom cards
**Phase 1.5 (Approved - Ready for Implementation)**: CLI UX improvements - 6 features approved
**Phase 2**: MCP server integration for LLM gameplay
**Phase 3**: Multiplayer with simple AI opponents
**Phase 4**: Web UI with drag-and-drop interface
**Phase 5+**: Advanced cards, tournaments, mobile apps

### Phase 1.5 Features (APPROVED - Ready for Implementation)

**Status**: 6 features, 28 hours total effort

1. **Auto-Play Treasures** (4h) - Command to play all treasures at once
2. **Stable Card Numbers** (6h) - Fixed numbers for AI consistency (opt-in via `--stable-numbers`)
3. **Multi-Card Chains** (8h) - Submit multiple moves: `1, 2, 3` with full rollback
4. **Reduced Supply Piles** (2h) - `--quick-game` for faster testing (40% faster games)
5. **Victory Points Display** (5h) - Show VP in game header (must-have, was missing)
6. **Auto-Skip Cleanup** (3h) - Skip manual cleanup when no choices (opt-out via `--manual-cleanup`)

**Full specifications**: [Phase 1.5 Requirements](./docs/requirements/phase-1.5/)

---

## Game Rules (MVP)

- **Starting**: 7 Copper + 3 Estate cards
- **Turn phases**: Action → Buy → Cleanup
- **Victory conditions**: Game ends when Province pile empty or any 3 piles empty
- **Scoring**: Estate (1 VP), Duchy (3 VP), Province (6 VP)

## Data Storage & Performance

- **Session-based**: In-memory storage, no database required
- **Game state**: Serializable JSON structures
- **Performance**: Move execution < 10ms, shuffle < 50ms
- See [PERFORMANCE.md](./docs/reference/PERFORMANCE.md) for detailed benchmarks

## Documentation Guidelines for Agents

⚠️ **CRITICAL**: Before creating or modifying ANY .md file, follow these rules:

### Before Creating New Files
1. **Check for existing files first**: Search docs/, .claude/, and root for similar content
2. **Consult the system**: Read [docs/DOCUMENTATION_SYSTEM.md](./docs/DOCUMENTATION_SYSTEM.md) for structure
3. **Use correct location**:
   - Permanent docs → `docs/` (reference, guides, requirements)
   - Session notes → `.claude/sessions/{date}/`
   - Agent communication → `.claude/communication/`
   - Root → **ONLY** README.md, CLAUDE.md, CONTRIBUTING.md

### File Size Limits
- Root .md files: **< 400 lines**
- Requirements docs: **< 800 lines**
- Communication logs: **< 500 lines** (rotate monthly)
- Session notes: **< 300 lines**
- Reference docs: **< 1000 lines**

### Required Metadata Header
Every new .md file must start with:
```markdown
# {Title}
**Status**: DRAFT | ACTIVE | APPROVED | ARCHIVED
**Created**: YYYY-MM-DD
**Phase**: {1, 1.5, 2, etc.}
```

### When to Update vs Create
- **Update existing** if content is related and file is < size limit
- **Create new** only if genuinely new topic or existing file would exceed limit
- **Split file** if updating would exceed size limit

### Enforcement
- Root directory accepts ONLY: README.md, CLAUDE.md, CONTRIBUTING.md
- Any other .md file at root will be flagged for reorganization
- Communication logs automatically rotate at 500 lines

**See Full System**: [docs/DOCUMENTATION_SYSTEM.md](./docs/DOCUMENTATION_SYSTEM.md)