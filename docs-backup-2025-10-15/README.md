# Principality AI

A solo-first Dominion-inspired deck-building game designed for streamlined gameplay and AI integration through Model Context Protocol (MCP).

## Project Status

**Current Phase**: Phase 1 Complete (Core Game Engine & CLI)
**Next Phase**: Phase 2 (MCP Integration)

- ✅ Core game engine with immutable state pattern
- ✅ All 8 MVP kingdom cards implemented
- ✅ Comprehensive test suite (8 cards + edge cases)
- ✅ TypeScript compilation and linting
- ✅ CLI interface with interactive gameplay

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/edd426/principality_ai.git
cd principality_ai

# Install dependencies
npm install

# Build all packages
npm run build
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
cd packages/core && npm run test:watch
```

### Playing the Game

```bash
# Play with a random seed
npm run play

# Play with a specific seed for reproducible games
npm run play -- --seed=12345

# Quick engine validation
npm run test-engine
```

**CLI Commands:**
- Enter a number to select a move from the list
- `hand` - Show your current hand
- `supply` - Show all available cards
- `help` - Display help message
- `quit` or `exit` - End the game

## Project Structure

```
principality-ai/
├── packages/
│   ├── core/              # Game engine (Phase 1) ✅
│   │   ├── src/
│   │   │   ├── game.ts    # Main game engine
│   │   │   ├── cards.ts   # Card definitions
│   │   │   ├── types.ts   # TypeScript interfaces
│   │   │   ├── utils.ts   # Seeded random, scoring
│   │   │   └── index.ts   # Public API
│   │   └── tests/
│   ├── cli/               # CLI interface (Phase 1) ✅
│   │   ├── src/
│   │   │   ├── index.ts   # Entry point
│   │   │   ├── cli.ts     # Game loop
│   │   │   ├── display.ts # Display formatting
│   │   │   └── parser.ts  # Command parsing
│   ├── mcp-server/        # MCP integration (Phase 2)
│   ├── ai-simple/         # Rule-based AI (Phase 3)
│   └── web/               # Web UI (Phase 4)
├── docs/                  # Documentation
│   ├── principality-ai-design.md
│   ├── principality-ai-technical-specs.md
│   └── API_REFERENCE.md
└── CLAUDE.md              # Developer quick reference
```

## Development

### Commands

```bash
# Build all packages
npm run build

# Run linter
npm run lint

# Run tests
npm test

# Run tests with coverage (requires 95%+ per Phase 1 requirements)
npm run test:coverage
```

### Code Quality Standards

- **TypeScript**: Strict mode enabled
- **Testing**: Jest with 95%+ coverage target
- **Linting**: ESLint + Prettier
- **Architecture**: Immutable state pattern
- **Error Handling**: No thrown exceptions in public API (return error objects)

## Game Design

Principality AI is a streamlined deck-building game inspired by Dominion, designed for:

- **Solo-first gameplay**: Focus on sandbox exploration and optimization
- **AI integration**: Built for LLM opponents via Model Context Protocol
- **Phased development**: MVP → MCP → Multiplayer → Web UI

### Core Mechanics

- **Turn Structure**: Action Phase → Buy Phase → Cleanup Phase
- **Starting Deck**: 7 Copper + 3 Estate cards
- **Victory Condition**: Game ends when Province pile is empty OR any 3 piles are empty
- **8 Kingdom Cards** (MVP): Village, Smithy, Laboratory, Market, Woodcutter, Festival, Council Room, Cellar

See [Game Design Document](./principality-ai-design.md) for complete rules and card specifications.

## Development Phases

### Phase 1: Core Engine & CLI (✅ Complete)
- Immutable game state
- All basic cards and mechanics
- Seeded randomness
- Comprehensive test coverage
- Interactive CLI interface

### Phase 2: MCP Integration (Next)
- Azure Functions MCP server
- LLM plays solo games
- Natural language move parsing
- Performance: < 2 seconds per move

### Phase 3: Multiplayer
- 2-player games
- Simple rule-based AI opponent
- Real-time state synchronization (Azure SignalR)

### Phase 4: Web UI
- Graphical interface
- Drag-and-drop cards
- Visual animations
- Responsive design

## Documentation

- **[Game Design](./principality-ai-design.md)** - Rules, cards, and gameplay mechanics
- **[Technical Specs](./principality-ai-technical-specs.md)** - Architecture, infrastructure, and technology stack
- **[Developer Guide](./CLAUDE.md)** - Quick reference for common patterns and gotchas
- **[API Reference](./API_REFERENCE.md)** - Complete GameEngine API documentation
- **[Card Catalog](./CARD_CATALOG.md)** - Detailed card specifications and interactions

## Technology Stack

- **Language**: TypeScript (Node.js)
- **Package Manager**: npm workspaces
- **Testing**: Jest
- **Build**: TypeScript compiler
- **Cloud**: Azure (Functions, Static Web Apps, SignalR)
- **Linting**: ESLint + Prettier

## Contributing

This project uses a phased development approach. Current focus is on Phase 2 (MCP Integration).

### Development Workflow

1. **Branch from main** for new features
2. **Write tests first** (TDD approach)
3. **Ensure 95%+ coverage** (`npm run test:coverage`)
4. **Pass linting** (`npm run lint`)
5. **Update documentation** as needed

### Sub-Agent Development

This project is designed for use with Claude Code sub-agents:
- **dev-agent**: Implements features in `packages/*/src/`
- **test-architect**: Creates tests in `packages/*/tests/`
- **requirements-architect**: Plans features and documents requirements

## Performance Requirements

- Move execution: < 10ms
- Shuffle operation: < 50ms
- MCP response: < 2 seconds
- Session memory: < 1MB per game

## License

MIT License - see LICENSE file for details

## Author

Evan DeLord

## Links

- **Repository**: https://github.com/edd426/principality_ai
- **Issues**: https://github.com/edd426/principality_ai/issues

---

**Note**: This is an active development project. The core game engine (Phase 1) is complete and well-tested. Phase 2 (MCP integration) is next on the roadmap.
