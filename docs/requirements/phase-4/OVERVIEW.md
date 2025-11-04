# Phase 4 Overview: Complete Dominion Base Set

**Status**: DRAFT
**Created**: 2025-11-02
**Phase**: 4
**Card Count**: 17 new cards (25 total kingdom cards)
**Owner**: requirements-architect
**Dependencies**: Phase 3 complete (multiplayer, rules-based AI, 93.4% test coverage)

---

## Executive Summary

Phase 4 expands Principality AI from 8 MVP kingdom cards to the complete 25-card Dominion base set, introducing 5 major new mechanics: trashing, gaining, attacks, reactions, and card duplication. This expansion transforms the game from a simplified prototype into a fully-featured Dominion implementation, enabling strategic depth and preparing the foundation for advanced AI strategies in Phase 5.

**What Phase 4 Achieves**:
- Complete Dominion base set (all 25 kingdom cards)
- 5 new game mechanics (trash pile, gaining, attacks, reactions, Throne Room)
- Enhanced AI compatibility (rules-based AI handles all new cards)
- Strategic diversity (40+ viable deck-building strategies)
- Backward compatibility (all Phase 1-3 functionality preserved)

**Primary Goal**: Transform Principality AI into a complete Dominion base game implementation while maintaining 95%+ test coverage, deterministic gameplay, and multiplayer compatibility.

---

## Problem Statement

**Phase 3 Achievement**: Multiplayer games work with 8 kingdom cards (Village, Smithy, Laboratory, Market, Woodcutter, Festival, Council Room, Cellar)

**Phase 4 Gap**: Current implementation lacks:
1. **Strategic depth**: Only 8 cards limits deck-building variety
2. **Core Dominion mechanics**: No trashing, no attacks, no reactions, no gaining
3. **Competitive gameplay**: Missing 17 essential base set cards reduces replayability
4. **AI strategy testing**: Limited card pool prevents advanced strategy development
5. **Dominion completeness**: Not a "real" Dominion game without full base set

**User Impact**:
- Repetitive gameplay (only ~10 viable strategies with 8 cards)
- Cannot replicate official Dominion strategies (Big Money Smithy, etc.)
- Limited AI training data (need full card set for Phase 5 ML)
- Missing iconic cards (Chapel, Witch, Moat, Throne Room)

---

## Solution Overview

### Five Major Features

**Feature 1: Trashing System** (4 cards)
- **Mechanic**: Trash pile for permanent card removal
- **Cards**: Chapel ($2), Remodel ($4), Mine ($5), Moneylender ($4)
- **Value**: Enables deck thinning strategies, removes weak cards
- **Implementation**: New `trash` array in GameState, new `trash_cards` move type

**Feature 2: Gaining System** (2 cards)
- **Mechanic**: Gain cards without buying (bypasses buy limit)
- **Cards**: Workshop ($3), Feast ($4)
- **Value**: Alternative card acquisition, deck-building flexibility
- **Implementation**: New `gain_card` move type, supply validation

**Feature 3: Attack System** (5 cards)
- **Mechanic**: Affect all opponents simultaneously
- **Cards**: Militia ($4), Witch ($5), Bureaucrat ($4), Spy ($4), Thief ($4)
- **Value**: Player interaction, defense strategy, offensive tactics
- **Implementation**: Attack resolution loop, opponent state modification

**Feature 4: Reaction System** (1 card)
- **Mechanic**: Block attacks by revealing cards
- **Cards**: Moat ($2)
- **Value**: Defensive counterplay, strategic hand management
- **Implementation**: Reaction reveal system, attack interrupt flow

**Feature 5: Duplication & Special Cards** (5 cards)
- **Mechanic**: Play actions twice, special draw mechanics, variable VP
- **Cards**: Throne Room ($4), Adventurer ($6), Chancellor ($3), Library ($5), Gardens ($4)
- **Value**: Combo potential, advanced strategies, variable victory points
- **Implementation**: Action replay system, conditional draw, Gardens VP calculation

### Card Distribution Summary

| Cost | Cards | Types |
|------|-------|-------|
| $2 | Chapel, Cellar, Moat | Trashing, Utility, Reaction |
| $3 | Village, Woodcutter, Workshop, Chancellor | Draw, Economy, Gaining, Special |
| $4 | Smithy, Remodel, Militia, Bureaucrat, Spy, Thief, Throne Room, Feast, Gardens | Draw, Trash, Attack, Duplication, Victory |
| $5 | Laboratory, Market, Festival, Council Room, Mine, Witch, Library | Draw, Economy, Utility, Attack, Special |
| $6 | Gold, Adventurer | Treasure, Special Draw |

**Total**: 25 kingdom cards + 7 basic cards (3 treasures, 3 victory, 1 curse) = 32 unique cards

---

## Feature List

### Feature 1: Trashing System
- **Requirement**: Players can permanently remove cards from the game
- **Scope**: 4 trashing cards (Chapel, Remodel, Mine, Moneylender)
- **Implementation**: Trash pile in GameState, `trash_cards` move type
- **Test Count**: 20 tests (12 unit, 5 integration, 3 E2E)

### Feature 2: Gaining System
- **Requirement**: Players can gain cards without buying
- **Scope**: 2 gaining cards (Workshop, Feast)
- **Implementation**: `gain_card` move type, supply deduction
- **Test Count**: 12 tests (6 unit, 4 integration, 2 E2E)

### Feature 3: Attack System
- **Requirement**: Attack cards affect all opponents
- **Scope**: 5 attack cards (Militia, Witch, Bureaucrat, Spy, Thief)
- **Implementation**: Attack resolution loop, opponent modification
- **Test Count**: 30 tests (15 unit, 10 integration, 5 E2E)

### Feature 4: Reaction System
- **Requirement**: Moat blocks attacks when revealed
- **Scope**: 1 reaction card (Moat)
- **Implementation**: Reaction reveal, attack interrupt
- **Test Count**: 12 tests (6 unit, 4 integration, 2 E2E)

### Feature 5: Duplication & Special Cards
- **Requirement**: Throne Room, variable draw, Gardens VP
- **Scope**: 5 special cards (Throne Room, Adventurer, Chancellor, Library, Gardens)
- **Implementation**: Action replay, conditional draw, variable VP
- **Test Count**: 18 tests (9 unit, 6 integration, 3 E2E)

**Total Test Count**: 92 tests (48 unit, 29 integration, 15 E2E)

---

## Success Metrics

### Test Coverage
- **Target**: 95%+ overall coverage
- **Unit Tests**: 48 tests (card mechanics, edge cases)
- **Integration Tests**: 29 tests (multi-card interactions, game flow)
- **E2E Tests**: 15 tests (full games with new mechanics)
- **Zero Regressions**: All Phase 1-3 tests continue passing

### Performance
- **Move Execution**: < 15ms per move (including attack loops)
- **Attack Processing**: < 50ms for 4-player attacks (future-proofing)
- **Trash Pile Operations**: < 5ms (add/query)
- **Gaining Operations**: < 10ms (supply deduction, validation)

### AI Compatibility
- **Rules-based AI**: Handles all 25 cards correctly
- **Big Money Strategy**: Works with new cards (ignores attacks, uses trashing)
- **Deterministic Decisions**: Same state = same move (reproducible)
- **Valid Move Generation**: 100% of AI moves pass validation

### Strategic Depth
- **Viable Strategies**: 40+ distinct deck-building approaches
- **Card Combinations**: 100+ meaningful card synergies
- **Replayability**: 10,000+ unique game states with 25 cards
- **Win Rate Variance**: No single strategy dominates (< 65% win rate)

### Backward Compatibility
- **Phase 1-3 Tests**: 100% pass rate (no regressions)
- **Solo Games**: Continue working with 8 or 25 cards
- **Multiplayer**: Works with 25-card pool
- **MCP Tools**: Compatible with new mechanics

---

## Relationship to Roadmap

### Phase 3 → Phase 4: Multiplayer to Full Base Set

**Phase 3 Foundation**:
- ✅ Multiplayer game engine (2+ players)
- ✅ Rules-based AI opponent (Big Money strategy)
- ✅ MCP tools for game management
- ✅ 93.4% test coverage

**Phase 4 Builds On**:
- **GameState**: Add `trash` pile, Curse supply
- **Move Types**: Add `trash_cards`, `gain_card`, `reveal_reaction`, `select_action_for_throne`
- **AI Decision Engine**: Extend to handle 17 new cards
- **MCP Tools**: No changes needed (move types handled automatically)

### Phase 4 → Phase 5: Full Base Set to Advanced AI

**Phase 5 Prerequisites** (enabled by Phase 4):
- Full 25-card dataset for ML training
- Complex card interactions for strategy learning
- Attack/reaction mechanics for adversarial AI
- Trashing/gaining for deck optimization algorithms

**Phase 5 Features** (unlocked by Phase 4):
- Machine learning AI opponents
- Strategy recommendation engine
- Deck composition analysis
- Tournament mode with card bans

---

## Time Estimates

### Requirements Phase (Complete)
| Task | Estimated | Actual |
|------|-----------|--------|
| OVERVIEW.md | 2h | 2h |
| FEATURES.md | 6h | 6h |
| ARCHITECTURE.md | 4h | 4h |
| TESTING.md | 5h | 5h |
| CARD_SPECIFICATIONS.md | 3h | 3h |
| **Total** | **20h** | **20h** |

### Testing Phase (test-architect)
| Task | Estimated |
|------|-----------|
| Unit tests (48 tests) | 18h |
| Integration tests (29 tests) | 12h |
| E2E tests (15 tests) | 8h |
| Test documentation | 2h |
| **Total** | **40h** |

### Implementation Phase (dev-agent)
| Task | Estimated |
|------|-----------|
| Trashing system | 8h |
| Gaining system | 5h |
| Attack system | 12h |
| Reaction system | 6h |
| Duplication/special cards | 10h |
| AI integration | 8h |
| Bug fixes and refinement | 6h |
| **Total** | **55h** |

### Total Phase 4 Effort
- **Requirements**: 20h (complete)
- **Testing**: 40h
- **Implementation**: 55h
- **Total**: 115h (~3 weeks for 1 developer)

---

## Dependencies and Risks

### Dependencies

**Technical Dependencies**:
- ✅ Phase 3 complete (multiplayer, AI, 93.4% coverage)
- ✅ TypeScript with immutable state pattern
- ✅ Jest testing framework
- ✅ GameEngine with move validation

**Knowledge Dependencies**:
- Official Dominion base set rules (online rulebook)
- Card interaction edge cases (FAQ/errata)
- Attack resolution order (official ruling)

### Risks

**High Risk**: Attack system complexity
- **Issue**: 5 attack cards with different effects, multiplayer loops
- **Mitigation**: Sequential attack processing (simpler, deterministic)
- **Fallback**: Implement Militia only, defer other attacks to Phase 4.1

**Medium Risk**: Throne Room edge cases
- **Issue**: Playing actions twice creates complex interactions
- **Mitigation**: Comprehensive test coverage for all 25 cards with Throne Room
- **Fallback**: Disable Throne Room with certain cards (mark as incompatible)

**Low Risk**: AI decision quality with 25 cards
- **Issue**: Rules-based AI may make poor choices with complex cards
- **Mitigation**: Extend Big Money strategy with simple heuristics (trash Estates, gain Silver)
- **Fallback**: AI ignores complex cards (plays only treasures)

**Low Risk**: Performance degradation
- **Issue**: More cards = larger state space = slower execution
- **Mitigation**: Target 15ms move execution (3ms buffer from current 12ms)
- **Fallback**: Optimize hot paths (supply lookup, card filtering)

### Risk Mitigation Summary

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Attack complexity | 40% | High | Sequential processing, comprehensive tests |
| Throne Room bugs | 30% | Medium | Test all 25 combinations, defer if needed |
| AI quality | 20% | Low | Simple heuristics, ignore complex cards |
| Performance | 10% | Low | 15ms target, optimize if needed |

---

## Next Steps

### Immediate Actions (Requirements Complete)

1. **Review and Approve** (stakeholder decision)
   - Validate feature scope (17 cards, 5 mechanics)
   - Approve time estimates (115h total)
   - Confirm success metrics (95% coverage, 15ms moves)

2. **Proceed to Testing Phase** (test-architect)
   - Read TESTING.md for detailed test specifications
   - Implement 92 tests (48 unit, 29 integration, 15 E2E)
   - Validate RED phase (all tests fail before implementation)

3. **Implementation Phase** (dev-agent, after tests written)
   - Read FEATURES.md for card specifications
   - Read ARCHITECTURE.md for technical design
   - Implement features to pass tests (GREEN phase)

### Sequential Dependencies

```
Requirements (DONE)
  ↓
Testing Phase (test-architect writes 92 tests)
  ↓
RED Phase Validation (all 92 tests fail)
  ↓
Implementation Phase (dev-agent implements features)
  ↓
GREEN Phase Validation (all 92 tests pass)
  ↓
Refactoring (optional, tests still pass)
  ↓
Phase 4 Complete → Phase 5
```

---

## Conclusion

Phase 4 represents the most significant content expansion in Principality AI's roadmap, adding 17 new cards and 5 major mechanics to complete the Dominion base set. This expansion enables strategic depth, competitive gameplay, and advanced AI development while maintaining the project's high standards for test coverage, performance, and deterministic behavior.

**Key Deliverables**:
- ✅ 5 comprehensive requirement documents
- ⏳ 92 comprehensive tests (test-architect)
- ⏳ 17 fully-functional cards (dev-agent)
- ⏳ 95%+ test coverage maintained
- ⏳ Zero regressions from Phase 1-3

**Estimated Effort**: 115 hours (3 weeks)
**Risk Level**: Medium (attack complexity, Throne Room edge cases)
**Value**: Very High (complete Dominion base set, strategic depth, Phase 5 foundation)

**Recommended Decision**: Proceed to testing phase (test-architect implements TESTING.md specifications)

---

**Document Status**: DRAFT - Pending Review
**Created**: 2025-11-02
**Author**: requirements-architect
**Next Document**: [FEATURES.md](./FEATURES.md) - Detailed card specifications and mechanics
