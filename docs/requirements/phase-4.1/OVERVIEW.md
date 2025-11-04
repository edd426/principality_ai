# Phase 4.1: Game Polish & Refinement

**Status**: DRAFT
**Created**: 2025-11-02
**Last-Updated**: 2025-11-04
**Owner**: requirements-architect
**Phase**: 4.1

---

## Executive Summary

Phase 4.1 focuses on quality-of-life improvements and user experience refinements for the Principality AI game. Following the completion of Phase 4 (Complete Dominion Base Set), this phase addresses three critical areas that enhance gameplay authenticity and usability:

1. **Random Kingdom Card Selection**: Match classic Dominion gameplay by selecting 10 random action cards per game session (instead of including all 25 cards)
2. **CLI Interactive Prompts**: Fix and extend CLI interaction for all action cards requiring player choices
3. **Card Sorting Display**: Sort all card displays by cost (ascending) then alphabetically for consistent, intuitive browsing

These improvements align the game more closely with authentic Dominion gameplay while significantly improving the command-line interface user experience.

## Strategic Context

### Position in Roadmap

```
Phase 3 (Multiplayer) ✅ COMPLETE
    ↓
Phase 4 (Complete Dominion Base Set) ✅ COMPLETE
    ↓
Phase 4.1 (Game Polish & Refinement) ← WE ARE HERE
    ↓
Phase 5 (Web UI)
    ↓
Phase 6+ (Expansions, Tournaments)
```

### Why Phase 4.1 Now?

**Before Phase 5 (Web UI)**:
- Polish core game mechanics before building UI layer
- Establish proper game setup patterns (random kingdoms)
- Fix CLI UX blockers that affect testing and development
- Ensure game mechanics are production-ready

**After Phase 4 Complete**:
- All 25 kingdom cards are implemented and tested
- Perfect timing to refine card selection and interaction patterns
- Foundation is solid; ready for polish

## Scope

### In-Scope for Phase 4.1

**Feature 1: Random Kingdom Card Selection**
- Modify game initialization to select 10 random action cards per session
- Support seed-based randomization for reproducibility
- Maintain backward compatibility with existing tests
- Update CLI to display selected kingdom cards at game start

**Feature 2: CLI Interactive Prompts for Action Cards**
- Fix Cellar card (currently auto-executes without showing discard options)
- Extend to ALL 11 action cards with mandatory player choices:
  - Discard choices: Cellar
  - Trash choices: Chapel, Remodel, Mine
  - Gain choices: Workshop, Feast, Remodel (2-step), Mine (2-step)
  - Set-aside choices: Library
  - Action selection: Throne Room
  - Deck decisions: Chancellor
  - Attack decisions: Spy, Thief, Bureaucrat
- Implement consistent CLI prompt formatting across all cards
- Enhance parser to handle multi-step card interactions

**Feature 3: Card Sorting Display**
- Sort all card displays by cost (ascending), then alphabetically
- Apply to supply command, buy phase options, and all card lists
- Improve card browsing and selection experience
- Consistent presentation across all display contexts

### Out-of-Scope for Phase 4.1

- Web UI implementation (Phase 5)
- New card implementations (complete in Phase 4)
- AI opponent improvements (separate initiative)
- MCP server enhancements (covered in Phase 2.1)
- Performance optimizations (not user-facing)

## Features Overview

### Feature 1: Random Kingdom Card Selection

**Problem**: Currently, all 25 kingdom cards are available in every game, which:
- Doesn't match authentic Dominion gameplay (10 cards per kingdom)
- Reduces strategic variety and replayability
- Creates analysis paralysis with too many options
- Diverges from user expectations

**Solution**: Select 10 random action cards at game initialization
- Use seed-based randomization (reproducible games)
- Pass selected cards via `GameOptions.kingdomCards`
- Display selected kingdom at CLI game start
- Maintain all 25 cards in card pool for variety across games

**Benefits**:
- Authentic Dominion experience
- Increased replayability (millions of possible kingdoms)
- Reduced complexity per game
- Aligns with user expectations

### Feature 2: CLI Interactive Prompts for Action Cards

**Problem**: Action cards requiring player choices either:
- Auto-execute without showing options (Cellar bug)
- Show options but with poor UX formatting
- Lack consistent interaction patterns

**Solution**: Implement comprehensive CLI prompts for all 11 cards with choices
- Numbered options for each valid choice
- Clear descriptions of what each option does
- Consistent formatting and messaging
- Multi-step card support (Remodel, Mine)

**Benefits**:
- Players can actually play interactive cards
- Consistent, intuitive user experience
- Better testing and development workflow
- Professional CLI presentation

### Feature 3: Card Sorting Display

**Problem**: Cards are currently displayed in inconsistent order, which:
- Makes it hard to find specific cards quickly
- Creates cognitive load when comparing costs
- Feels unprofessional and unpolished
- Varies between different display contexts (supply, buy phase, etc.)

**Solution**: Implement consistent sorting across all displays
- Primary sort: Cost (ascending, $0 → $6)
- Secondary sort: Alphabetical (within same cost tier)
- Apply universally to supply command, buy phase, all card lists
- Pure display-layer change (no game logic impact)

**Benefits**:
- Faster card lookup and browsing
- Professional, polished user experience
- Consistent mental model across all displays
- Easier comparison of card costs

## Success Criteria

### Acceptance Metrics

**Feature 1 (Random Kingdoms)**:
- ✅ Each game session has exactly 10 kingdom cards (plus 6 basic + Curse)
- ✅ Kingdom cards are randomly selected from pool of 25
- ✅ Seed-based randomization allows reproducible games
- ✅ CLI displays selected kingdom cards at game start
- ✅ All Phase 1-4 tests still pass (backward compatibility)

**Feature 2 (CLI Prompts)**:
- ✅ All 11 action cards with choices show interactive prompts
- ✅ Each prompt displays all valid move options with numbers
- ✅ Players can select moves via numbered input
- ✅ Multi-step cards (Remodel, Mine) guide users through each step
- ✅ Error handling for invalid selections
- ✅ Consistent formatting across all card types

**Feature 3 (Card Sorting)**:
- ✅ All card displays sorted by cost (ascending) then alphabetically
- ✅ Supply command shows sorted card list
- ✅ Buy phase shows sorted purchase options
- ✅ Consistent sorting across all display contexts
- ✅ No impact on game logic or state (display-only)
- ✅ Performance < 5ms for sorting operations

### Quality Metrics

- **Test Coverage**: Maintain 95%+ coverage
- **Regression**: 100% Phase 1-4 tests passing
- **Performance**: No degradation in move execution time
- **UX**: All interactive cards playable via CLI without confusion

## Technical Impact

### Affected Components

**Core Engine** (`packages/core/`):
- `src/game.ts` - initializeGame() modification for random selection
- `src/types.ts` - GameOptions.kingdomCards parameter

**CLI** (`packages/cli/`):
- `src/cli.ts` - Game loop and move handling
- `src/display.ts` - Move option display formatting
- `src/parser.ts` - Enhanced command parsing for choices

**Tests** (`packages/core/tests/`):
- New Phase 4.1 test files
- Updates to existing tests for backward compatibility

### Backward Compatibility

**Guaranteed**:
- All existing Phase 1-4 tests pass without modification (except test setup)
- GameOptions.kingdomCards is optional (defaults to all 25 if not specified)
- Existing CLI commands continue to work
- No breaking changes to GameEngine API

**Migration Path**:
- Tests using custom supply can specify kingdomCards explicitly
- CLI games use random selection by default
- Seed parameter ensures reproducibility for testing

## Effort Estimate

### Feature Breakdown

**Feature 1: Random Kingdom Card Selection**
- Implementation: 3-4 hours
- Testing: 2-3 hours
- **Subtotal**: 5-7 hours

**Feature 2: CLI Interactive Prompts**
- Implementation (11 cards): 6-8 hours
- Testing (all cards): 4-5 hours
- UX refinement: 1-2 hours
- **Subtotal**: 11-15 hours

**Feature 3: Card Sorting Display**
- Implementation: 2-3 hours
- Testing: 1-2 hours
- **Subtotal**: 3-5 hours

**Documentation & Polish**
- Update README and CLAUDE.md: 1 hour
- Integration testing: 2 hours
- **Subtotal**: 3 hours

**Total Estimated Effort**: 22-30 hours

### Development Phases

1. **Requirements & Planning** (COMPLETE after this document): 2-3 hours
2. **Test Specification** (test-architect): 4-5 hours
3. **Implementation** (dev-agent): 12-16 hours
4. **Testing & Refinement**: 3-4 hours
5. **Documentation Updates**: 1 hour

## Risks & Mitigation

### Risk 1: Test Compatibility
**Risk**: Random kingdom selection breaks existing tests
**Mitigation**:
- Make kingdomCards optional in GameOptions
- Update test setups to explicitly specify cards if needed
- Maintain backward compatibility mode

### Risk 2: CLI Parsing Complexity
**Risk**: Handling 11 different card interaction patterns is complex
**Mitigation**:
- Consistent pattern for all prompts
- Shared helper functions for option generation
- Comprehensive test coverage for each card type

### Risk 3: User Confusion
**Risk**: Too many numbered options overwhelming
**Mitigation**:
- Group similar options
- Clear descriptions for each option
- Examples and help text
- Progressive disclosure (show most common options first)

## Dependencies

### Prerequisites
- ✅ Phase 4 complete (all 25 kingdom cards implemented)
- ✅ Phase 3 complete (multiplayer and CLI working)
- ✅ TDD workflow established (test-architect, dev-agent)

### Blocking Issues
None. Phase 4.1 is ready to start immediately.

## Relationship to Other Phases

### Phase 4 (Complete Dominion Base Set)
- **Builds on**: Uses all 25 implemented kingdom cards
- **Complements**: Random selection enhances value of card variety
- **Fixes**: Addresses UX issues discovered during Phase 4 testing

### Phase 5 (Web UI)
- **Prepares for**: Establishes card selection and interaction patterns
- **De-risks**: Solves interaction design before UI implementation
- **Enables**: Web UI can reuse random kingdom logic

### Phase 3 (Multiplayer)
- **Compatible with**: Works seamlessly with multiplayer games
- **Enhances**: Better CLI experience for multiplayer testing

## Next Steps

### Completed (This Session)
1. ✅ Create Phase 4.1 planning documents (OVERVIEW, FEATURES, TESTING, TECHNICAL)
2. ✅ Have test-architect write comprehensive test specifications (121 tests, 3,229 lines)
3. ✅ All tests in RED phase ready for implementation

### Next Session
1. Have dev-agent implement Feature 1 (Random Kingdoms)
2. Have dev-agent implement Feature 3 (Card Sorting)
3. Have dev-agent implement Feature 2 (CLI Prompts)
4. Run full regression test suite (100% Phase 1-4 tests must pass)
5. Verify all 121 Phase 4.1 tests pass
6. Update project README and CLAUDE.md

## References

- [Phase 4 OVERVIEW](../phase-4/OVERVIEW.md) - Complete Dominion Base Set
- [Phase 3 OVERVIEW](../phase-3/OVERVIEW.md) - Multiplayer Foundation
- [DEVELOPMENT_GUIDE](../../reference/DEVELOPMENT_GUIDE.md) - Dev workflow
- [Dominion Rules](https://www.riograndegames.com/games/dominion/) - Official game rules

---

**Document Status**: COMPLETE - Requirements and tests ready for implementation
**Next Action**: Invoke dev-agent to implement features (GREEN phase)
