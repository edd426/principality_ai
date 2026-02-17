# Principality AI

A solo-first Dominion-inspired deck-building game designed for streamlined gameplay and AI integration through Model Context Protocol (MCP).

## Features

- **Complete Dominion Base Set**: All 25 kingdom cards from 1st and 2nd editions
- **Multiple Interfaces**: CLI, MCP server, and Web UI
- **AI Integration**: Play against rules-based AI or Claude via MCP
- **Multiplayer**: 2-player support with human vs AI
- **Deterministic**: Seeded randomness for reproducible games
- **Well-tested**: 97%+ test coverage

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

# Additional options
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
│   ├── core/              # Game engine
│   ├── cli/               # CLI interface
│   ├── mcp-server/        # MCP integration
│   ├── api-server/        # HTTP API server
│   └── web/               # Web UI
├── docs/                  # Documentation
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

# Run tests with coverage (95%+ target)
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
- **Incremental development**: Core engine → MCP integration → Multiplayer → Web UI

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

For detailed edition differences, see [CARD_SET_EDITION_ANALYSIS.md](./docs/reference/CARD_SET_EDITION_ANALYSIS.md).

## Roadmap

See [docs/ROADMAP.md](./docs/ROADMAP.md) for project vision and future plans.

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

### Development Workflow

1. **Branch from main** for new features
2. **Write tests first** (TDD approach)
3. **Ensure 95%+ coverage** (`npm run test:coverage`)
4. **Pass linting** (`npm run lint`)
5. **Update documentation** as needed

### Sub-Agent Development

This project is designed for use with Claude Code sub-agents:
- **test-architect**: Defines requirements and creates tests in `packages/*/tests/`
- **dev-agent**: Implements features in `packages/*/src/` to pass tests

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

