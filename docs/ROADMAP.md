# Roadmap

**Status**: ACTIVE

---

## Project Vision

Principality AI is a solo-first Dominion-inspired deck-building game with deep AI integration. The goal is to create a game where humans can play against Claude AI opponents across multiple interfaces.

---

## What's Built

### Core Game Engine
- Complete Dominion Base Set (25 kingdom cards)
- Immutable state pattern with deterministic randomness
- 97%+ test coverage

### Card Mechanics
- **Trashing**: Chapel, Remodel, Mine, Moneylender
- **Gaining**: Workshop, Feast
- **Attacks**: Militia, Witch, Bureaucrat, Spy, Thief
- **Reactions**: Moat blocks attacks
- **Special**: Throne Room, Adventurer, Chancellor, Library, Gardens

### Interfaces
- **CLI**: Solo and 2-player modes, turn-based mode for AI testing
- **MCP Server**: Full game control via Model Context Protocol
- **Web UI**: React-based interface (in development)
- **API Server**: REST API for web client

### AI Integration
- Rules-based Big Money AI opponent
- MCP tools for Claude gameplay
- Claude Code skills for strategy and mechanics guidance

### Testing Infrastructure
- MCP playtesting with Haiku agents
- CLI playtesting with automated agents
- 29 test scenarios (76% coverage)

---

## Future Vision

### Human vs Claude AI
Enable humans to play against Claude AI opponents with:
- Hybrid game mode (CLI/Web human + MCP AI)
- Turn synchronization between interfaces
- Claude opponent selection (Haiku, Sonnet, Opus)
- Optional game narration from AI

### Advanced AI & Strategy
Improve Claude's gameplay beyond rules-based strategy:
- Strategy learning from game outcomes
- Deck composition analysis
- Adaptive play based on opponent behavior
- Strategic commentary mode

### Web Experience
Full graphical interface:
- Drag-and-drop card play
- Visual animations
- Responsive design
- Spectator mode

### Expansions & Competitive
- Dominion 2E replacement cards
- Tournament mode
- Leaderboards
- Card bans/restrictions

---

## Development Areas

| Area | Focus |
|------|-------|
| Core | Game engine, card mechanics, state management |
| CLI | Command-line interface and UX |
| MCP | Model Context Protocol server and AI tools |
| Web | Browser-based interface |
| AI | Claude integration and strategy |
| Testing | Automated playtesting and quality assurance |

---

## Requirements

Detailed requirements for each development area are in `docs/requirements/`.
