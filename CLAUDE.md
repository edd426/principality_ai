# CLAUDE.md

**Status**: ACTIVE
**Created**: 2025-09-14
**Last-Updated**: 2025-10-24
**Owner**: requirements-architect
**Phase**: 2.1

---

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

---

## Development Standards: Test-Driven Development (TDD)

**🚨 MANDATORY**: All code changes follow Test-Driven Development (TDD).

### TDD Philosophy

This project maintains high quality through TDD:
- Tests are written **first** (before implementation)
- Tests define the contract (what "done" means)
- Implementation follows tests
- Tests prevent regressions forever

### Feature Development Workflow

**For NEW FEATURES**:
```
1. Requirements defined (FEATURES.md, TESTING.md)
   ↓
2. Tests written (test-architect)
   ↓
3. All tests FAIL (red phase)
   ↓
4. Implementation written (dev-agent)
   ↓
5. All tests PASS (green phase)
   ↓
6. Refactoring if needed (tests still pass)
```

### Bug Fix Workflow

**For BUGS**:
```
1. Bug discovered / reported
   ↓
2. Test written that reproduces bug (test-architect)
   ↓
3. Test FAILS (validates bug exists)
   ↓
4. Bug fix implemented (dev-agent)
   ↓
5. Test PASSES (validates fix works)
   ↓
6. Test stays in suite forever (prevents regression)
```

### Agent Responsibilities

**test-architect**:
- Implement all tests FIRST (before development)
- Create tests that validate requirements
- Ensure edge cases are covered
- Target 95%+ coverage

**dev-agent**:
- Implement code to PASS existing tests
- Refuse code-only requests (push back with reason)
- Can suggest tests if missing
- Verify no regressions

**requirements-architect**:
- Ensure requirements are clear before testing
- Review TDD compliance
- Document test specifications

### When Tests Are Missing

**If dev-agent receives code without tests**:
> "Tests required before implementation. Per project TDD standard:
> - For features: Requirements → Tests → Implementation
> - For bugs: Tests → Bug Fix
>
> Please submit tests first."

**If test-architect receives implementation request**:
> "Implementation cannot proceed without tests. Submit test specifications first."

### Quality Metrics

- **All tests must pass** before PR submission
- **Coverage must be 95%+** (enforced by CI)
- **Zero regressions** (existing tests continue passing)
- **Performance targets met** (as defined in tests)

### Documentation

- Test specifications defined in: `docs/requirements/phase-X/TESTING.md`
- Test location: `packages/{core,cli}/tests/`
- Coverage report: `npm run test -- --coverage`

---

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
**Phase 1.5 (Complete)**: CLI UX improvements - All 6 features implemented and tested
**Phase 1.6 (Complete)**: Card help system + comprehensive testing framework
**Phase 2.0 (Complete)**: MCP server foundation - Critical bug fixes (stdio transport, move parsing)
**Phase 2.1 (Current)**: AI Gameplay Enhancement - Mechanics Skill, Strategy Skill, Enhanced Logging
**Phase 3**: Multiplayer with simple AI opponents
**Phase 4**: Web UI with drag-and-drop interface
**Phase 5+**: Advanced cards, tournaments, mobile apps

### Phase 1.5 Features (COMPLETE)

**Status**: ✅ All 6 features implemented and tested (28 hours total effort)

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

⚠️ **CRITICAL ENFORCEMENT**: Root directory accepts ONLY these files:
- `README.md` (project overview)
- `CLAUDE.md` (developer instructions)
- `CONTRIBUTING.md` (optional, if exists)

**ANY other .md file at root violates project policy** and will be flagged for reorganization. See audit results: `.claude/audits/documentation/AUDIT_SUMMARY.md`

### Before Creating New Files
1. **Check for existing files first**: Search docs/, .claude/, and root for similar content
2. **Consult the system**: Read [docs/DOCUMENTATION_SYSTEM.md](./docs/DOCUMENTATION_SYSTEM.md) for structure
3. **Verify root policy**: Will this violate the "max 3 files at root" rule?
4. **Use correct location**:
   - Permanent docs → `docs/` (reference, guides, requirements)
   - Session notes → `.claude/sessions/{date}/`
   - Agent communication → **In code/tests via @ tags** (see `.claude/AGENT_COMMUNICATION.md`)
   - Root → **ONLY** README.md, CLAUDE.md, CONTRIBUTING.md

### Correct File Placement (Examples from Recent Audit Fix)

✅ **GOOD** - Correct locations:
- E2E testing guide → `docs/testing/E2E_TESTING_GUIDE.md`
- Quick start for tests → `docs/testing/E2E_TESTING_QUICK_START.md`
- Session implementation notes → `.claude/sessions/YYYY-MM-DD/e2e-implementation-summary.md`
- Interactive gameplay guide → `docs/reference/INTERACTIVE_GAMEPLAY_SETUP.md`
- Session debugging notes → `.claude/sessions/YYYY-MM-DD/mcp-gameplay-debugging.md`

❌ **BAD** - Violations (now fixed):
- E2E_TESTING_GUIDE.md at root
- QUICK_START.md at root
- IMPLEMENTATION_SUMMARY.md at root
- MCP_GAMEPLAY_DEBUGGING.md at root

### Preventing Content Redundancy

⚠️ **DUPLICATION CHECK** before creating setup/installation instructions:

**Single source of truth for:**
- Game installation → `README.md` (keep minimal)
- Development setup → `docs/reference/DEVELOPMENT_GUIDE.md`
- E2E testing setup → `docs/testing/E2E_TESTING_GUIDE.md`

**Rule**: If setup instructions exist, LINK to them. Do NOT copy-paste across files.

See `.claude/audits/documentation/AUDIT_SUMMARY.md` for redundancy analysis.

### File Size Limits
- Root .md files: **< 400 lines**
- Requirements docs: **< 800 lines**
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

### Documentation Quality Standards

See `.claude/audits/documentation/` for authoritative framework and audit results:
- `DOC_QUALITY_BEST_PRACTICES.md` - Industry-standard framework (5 quality dimensions)
- `AUDIT_SUMMARY.md` - Quick reference with anti-patterns
- `2025-10-24-doc-quality-audit.md` - Detailed audit of project documentation

**Key anti-patterns to avoid:**
1. ❌ **Root directory clutter** - Max 3 files only
2. ❌ **Content duplication** - Single source of truth required
3. ❌ **Missing metadata** - All docs need Status, Created, Last-Updated, Owner, Phase
4. ❌ **Backup folders** - Don't leave backup directories in active repo
5. ❌ **Unclear file purposes** - Use clear names and proper locations

### Agent Communication System
- test-architect and dev-agent communicate via **@ tags in code/tests**
- No separate communication files needed
- Minimal token format optimized for agent parsing
- **See**: `.claude/AGENT_COMMUNICATION.md` for full protocol

**See Full System**: [docs/DOCUMENTATION_SYSTEM.md](./docs/DOCUMENTATION_SYSTEM.md)