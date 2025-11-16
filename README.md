# Principality AI

**Status**: ACTIVE
**Created**: 2025-09-14
**Last-Updated**: 2025-11-07
**Owner**: requirements-architect
**Phase**: 4

---

A solo-first Dominion-inspired deck-building game designed for streamlined gameplay and AI integration through Model Context Protocol (MCP).

## Project Status

**Current Phase**: Phase 4 (Complete Dominion Base Set)
**Status**: ✅ IMPLEMENTATION COMPLETE - 638/655 tests passing (97.4%)

### Completed
- ✅ **Phase 1**: Core game engine with immutable state pattern
- ✅ **Phase 1**: All 8 MVP kingdom cards implemented
- ✅ **Phase 1**: Comprehensive test suite (95%+ coverage)
- ✅ **Phase 1**: CLI interface with interactive gameplay
- ✅ **Phase 1.5**: Auto-play treasures command
- ✅ **Phase 1.5**: Stable card numbers for AI agents
- ✅ **Phase 1.5**: Multi-card chained submission
- ✅ **Phase 1.5**: Quick game mode (reduced piles)
- ✅ **Phase 1.5**: Victory points display
- ✅ **Phase 1.5**: Auto-skip cleanup phase
- ✅ **Phase 2.0**: MCP server foundation with stdio transport
- ✅ **Phase 2.0**: Move parsing and command handling
- ✅ **Phase 2.1**: Dominion mechanics skill (auto-invoked context)
- ✅ **Phase 2.1**: Big Money strategy skill (gameplay guidance)
- ✅ **Phase 2.1**: Rules-based AI with Big Money strategy
- ✅ **Phase 2.1**: Critical AI bug fixes (Province vs Gold priority)
- ✅ **Phase 3**: Multiplayer game engine (2+ players)
- ✅ **Phase 3**: Turn switching and player isolation
- ✅ **Phase 3**: Rules-based AI opponent with Big Money strategy
- ✅ **Phase 3**: CLI multiplayer interface and display
- ✅ **Phase 3**: MCP multiplayer tools (game_execute, game_observe)
- ✅ **Phase 4**: All 17 new kingdom cards implemented and tested
- ✅ **Phase 4**: Trashing system (Chapel, Remodel, Mine, Moneylender)
- ✅ **Phase 4**: Gaining system (Workshop, Feast)
- ✅ **Phase 4**: Attack system (Militia, Witch, Bureaucrat, Spy, Thief)
- ✅ **Phase 4**: Reaction system (Moat blocks attacks)
- ✅ **Phase 4**: Special cards (Throne Room, Adventurer, Chancellor, Library, Gardens)
- ✅ **Phase 4**: Test suite expanded to 655 tests (97.4% passing)

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

# For E2E testing with Claude API
# See: docs/testing/E2E_TESTING_GUIDE.md
```

### Playing the Game

```bash
# Play with a random seed
npm run play

# Play with a specific seed for reproducible games
npm run play -- --seed=12345

# Choose Dominion edition (1st, 2nd, or mixed)
npm run play -- --edition=2nd             # 2nd edition cards (default)
npm run play -- --edition=1st             # 1st edition cards
npm run play -- --edition=mixed           # All cards from both editions

# Use Phase 1.5 features
npm run play -- --stable-numbers          # Fixed card numbers for AI
npm run play -- --manual-cleanup          # Disable auto-skip cleanup

# Combine flags
npm run play -- --seed=test --stable-numbers --edition=1st
```

**CLI Commands:**
- `[number]` - Select a move by number
- `1, 2, 3` - Chain multiple moves (e.g., "1, 2, 3" or "1 2 3")
- `treasures` or `t` - Auto-play all treasure cards at once
- `hand` - Show your current hand with victory points
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
- **Kingdom Cards**: 25 total cards from Dominion base set (19 in both editions + 6 edition-specific)

See [Game Design Document](./principality-ai-design.md) for complete rules and card specifications.

### Edition Selection

The game supports Dominion's 1st and 2nd editions:

- **2nd Edition (Default)**: 19 core cards + 7 improved cards (Artisan, Bandit, Harbinger, Merchant, Poacher, Sentry, Vassal)
- **1st Edition**: 19 core cards + 6 original cards (Adventurer, Chancellor, Feast, Spy, Thief, Woodcutter)
- **Mixed Edition**: All 25 cards from both editions combined

Edition can be configured in `game-config.json` or via the `--edition` CLI flag.

For detailed edition differences, see [CARD_SET_EDITION_ANALYSIS.md](./docs/requirements/CARD_SET_EDITION_ANALYSIS.md).

## Development Phases

### Phase 1: Core Engine & CLI (✅ Complete)
- Immutable game state
- All basic cards and mechanics
- Seeded randomness
- Comprehensive test coverage
- Interactive CLI interface

### Phase 2: MCP Integration (✅ Complete)
- MCP server with stdio transport
- LLM plays solo games via MCP tools
- Natural language move parsing
- Dominion mechanics and strategy skills
- Rules-based AI with Big Money strategy

### Phase 3: Multiplayer (✅ Complete)
- 2-player games (human vs AI, AI vs AI)
- Rules-based AI opponent
- Turn switching and player isolation
- CLI multiplayer interface
- Test coverage: 93.4% (595/654 tests passing)

### Phase 4: Complete Dominion Base Set (In Progress)
- 17 new kingdom cards (25 total)
- Trashing system (Chapel, Remodel, Mine, Moneylender)
- Gaining mechanics (Workshop, Feast)
- Attack cards (Militia, Witch, Bureaucrat, Spy, Thief)
- Reaction system (Moat blocks attacks)
- Special cards (Throne Room, Adventurer, Chancellor, Library, Gardens)
- Requirements & Tests Complete (92 tests written)

### Phase 5: Web UI
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

This project uses a phased development approach. Current focus is on Phase 3 (Multiplayer Foundation).

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

**Note**: This is an active development project. Phases 1-3 are complete and well-tested (core engine, MCP integration, multiplayer). Phase 4 (Complete Dominion Base Set with 25 kingdom cards) is in progress - requirements and tests complete, implementation pending. Phase 5 (Web UI) follows after Phase 4.
