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

```
principality-ai/
├── packages/
│   ├── core/              # Game engine (Phase 1)
│   │   ├── src/
│   │   │   ├── game.ts
│   │   │   ├── cards.ts
│   │   │   └── types.ts
│   │   └── tests/
│   ├── cli/               # CLI interface (Phase 1)
│   ├── mcp-server/        # MCP integration (Phase 2)
│   ├── ai-simple/         # Rule-based AI (Phase 3)
│   └── web/               # Web UI (Phase 4)
├── data/
│   └── cards.yaml         # Card definitions
├── .github/workflows/
└── azure/functions/
```

## Development Commands

**Common Tasks:**
- `npm run test` - Run Jest unit tests
- `npm run lint` - ESLint + Prettier check
- `npm run play -- --seed=12345` - CLI game with seed
- `npm run build` - Build all packages

**Phase-specific:**
- CLI testing: Navigate to `packages/cli` for game testing
- MCP server: Deploy via Azure Functions
- Core engine: Focus on `packages/core` for game logic

## Core Architecture

### Game Engine (Immutable State Pattern)
```typescript
interface GameState {
  readonly players: ReadonlyArray<PlayerState>
  readonly supply: ReadonlyMap<CardName, number>
  readonly currentPlayer: number
  readonly phase: 'action' | 'buy' | 'cleanup'
  readonly turnNumber: number
  readonly seed: string
}
```

### Card System
- Card definitions stored in `data/cards.yaml`
- Effects system: `+Cards`, `+Actions`, `+Buys`, `+$`
- MVP set: 8 simple kingdom cards (Village, Smithy, Laboratory, Market, etc.)

### MCP Integration (Phase 2)
- Azure Functions endpoints for `get_game_state()` and `make_move()`
- Natural language move parsing
- LLM plays solo games optimizing for minimum turns

### Multiplayer (Phase 3)
- Azure SignalR for real-time communication
- Lock-step synchronization (all clients acknowledge moves)
- Simple rule-based AI opponent

## Development Phases

**Phase 1 (Current)**: CLI-based solo sandbox game with core 8 kingdom cards
**Phase 2**: MCP server integration for LLM gameplay
**Phase 3**: Multiplayer with simple AI opponents
**Phase 4**: Web UI with drag-and-drop interface
**Phase 5+**: Advanced cards, tournaments, mobile apps

## Testing Strategy

- **Core game engine**: 95%+ coverage target
- **Card effects**: 100% coverage target
- **MCP interface**: Integration tests
- Use Claude Code sub-agents: Developer agent (source code) + Tester agent (test files)

## Game Rules (MVP)

- **Starting**: 7 Copper + 3 Estate cards
- **Turn phases**: Action → Buy → Cleanup
- **Victory conditions**: Game ends when Province pile empty or any 3 piles empty
- **Scoring**: Estate (1 VP), Duchy (3 VP), Province (6 VP)

## Performance Requirements

- Move execution: < 10ms
- Shuffle operation: < 50ms
- MCP response: < 2 seconds
- Session memory: < 1MB per game

## Data Storage

- **Session-based**: In-memory storage, no database required
- **Card definitions**: YAML files in `data/` directory
- **Game state**: Serializable JSON structures
- **Auto-cleanup**: Sessions expire after 1 hour inactivity