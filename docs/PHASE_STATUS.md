# Phase Status

**Status**: ACTIVE
**Created**: 2025-12-20
**Last-Updated**: 2025-12-20

---

## Completed Phases

### Phase 1 - CLI Solo Sandbox
Core 8 kingdom cards, basic gameplay loop.

### Phase 1.5 - CLI UX Improvements
6 features (28 hours total):
1. Auto-Play Treasures - Command to play all treasures at once
2. Stable Card Numbers - Fixed numbers for AI consistency (`--stable-numbers`)
3. Multi-Card Chains - Submit multiple moves: `1, 2, 3` with rollback
4. Reduced Supply Piles - Configurable via `game-config.json` (default: 4 cards)
5. Victory Points Display - Show VP in game header
6. Auto-Skip Cleanup - Skip manual cleanup when no choices (`--manual-cleanup` to disable)

[Full specs](./requirements/phase-1.5/)

### Phase 1.6 - Card Help System
Card help system + comprehensive testing framework.

### Phase 2.0 - MCP Server Foundation
Critical bug fixes (stdio transport, move parsing).

### Phase 2.1 - AI Gameplay Enhancement
Mechanics Skill, Strategy Skill, AI Bug Fixes.

### Phase 3 - Multiplayer
Human vs Rules-based AI, 2-player support, 93.4% test coverage.

### Phase 4 - Complete Dominion Base Set
All 17 new cards implemented (25 total). 638/655 tests passing (97.4%).

**Implemented Mechanics**:
- Trashing: Chapel, Remodel, Mine, Moneylender
- Gaining: Workshop, Feast
- Attacks: Militia, Witch, Bureaucrat, Spy, Thief
- Reactions: Moat blocks attacks
- Special: Throne Room, Adventurer, Chancellor, Library, Gardens

**Remaining test issues** (17 tests):
- 10 Big Money strategy statistical tests (need new baselines)
- 5 E2E move limit tests (games complete, just longer than 8-card expectations)
- 2 other edge cases

[Full specs](./requirements/phase-4/)

---

## Future Phases

### Phase 5 - Web UI
Drag-and-drop interface.

### Phase 6+ - Expansions
Dominion expansions, tournaments, mobile apps.
