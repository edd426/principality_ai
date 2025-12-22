# Dominion Card Set: 1st Edition vs 2nd Edition Analysis

**Status**: ACTIVE
**Created**: 2025-11-05
**Last-Updated**: 2025-11-05
**Owner**: requirements-architect
**Phase**: 4

---

## Executive Summary

**Problem**: The current Principality AI implementation includes 1st edition cards (Adventurer, Chancellor, Feast, Spy, Thief, Woodcutter) which were replaced in the official Dominion 2nd Edition base set released in Fall 2016.

**Impact**:
- Game does not match current official Dominion experience
- Uses weaker/problematic cards that were removed for balance reasons
- Missing 7 improved cards designed for better strategic depth

**Recommendation**: Migrate to 2nd Edition base set (26 kingdom cards total: 19 unchanged + 7 new)

**Migration Complexity**: MEDIUM
- Remove 6 cards
- Add 7 new cards (more complex mechanics than removed cards)
- Update tests and AI strategy
- Estimated effort: 35-40 hours

---

## Table of Contents

1. [Edition Comparison](#edition-comparison)
2. [Removed Cards Analysis](#removed-cards-analysis)
3. [New Cards Analysis](#new-cards-analysis)
4. [Strategic Impact](#strategic-impact)
5. [Implementation Impact](#implementation-impact)
6. [Migration Roadmap](#migration-roadmap)
7. [Backward Compatibility](#backward-compatibility)

---

## Edition Comparison

### Summary of Changes

| Metric | 1st Edition | 2nd Edition | Change |
|--------|-------------|-------------|--------|
| Total Kingdom Cards | 25 | 26 | +1 |
| Cards Removed | - | 6 | -6 |
| Cards Added | - | 7 | +7 |
| Unchanged Cards | 19 | 19 | 0 |
| Total Basic Cards | 7 | 7 | 0 |
| **Total Unique Cards** | **32** | **33** | **+1** |

### Cards Removed (6)

1. **Adventurer** ($6)
2. **Chancellor** ($3)
3. **Feast** ($4)
4. **Spy** ($4)
5. **Thief** ($4)
6. **Woodcutter** ($3)

### Cards Added (7)

1. **Artisan** ($6)
2. **Bandit** ($5)
3. **Harbinger** ($3)
4. **Merchant** ($3)
5. **Poacher** ($4)
6. **Sentry** ($5)
7. **Vassal** ($3)

### Unchanged Cards (19)

**From Phase 1-3** (8 cards):
- Village ($3)
- Smithy ($4)
- Laboratory ($5)
- Market ($5)
- Festival ($5)
- Council Room ($5)
- Cellar ($2)

**From Phase 4** (12 cards):
- Chapel ($2)
- Remodel ($4)
- Mine ($5)
- Moneylender ($4)
- Workshop ($3)
- Militia ($4)
- Witch ($5)
- Bureaucrat ($4)
- Moat ($2)
- Throne Room ($4)
- Library ($5)
- Gardens ($4)

**Total**: 19 unchanged cards remain in 2nd edition

---

## Removed Cards Analysis

### Why These Cards Were Removed

**Designer's Rationale** (Donald X. Vaccarino):
> "The first edition of the base set had several big money enablers, but not a lot of engine support, leading some players to view it as a solved game. The second edition added several cantrips to balance the set strategically and removed weaker cards that experienced players rarely bought."

### 1. Adventurer ($6)

**Effect**: Reveal cards from your deck until you reveal 2 Treasure cards. Put those Treasures into your hand and discard the other revealed cards.

**Why Removed**:
- **Too expensive** ($6) for the benefit
- **Unreliable**: Depends on treasure density in deck
- **Rarely bought** by experienced players (Big Money prefers Province at $8)
- **Better alternatives exist**: Smithy ($4) often better value

**Usage Statistics**: Low priority in competitive play

**Replacement**: **Artisan** ($6) - More versatile and strategic

---

### 2. Chancellor ($3)

**Effect**: +$2. You may immediately put your deck into your discard pile.

**Why Removed**:
- **Weak effect**: +$2 alone is underwhelming for an action
- **Rarely useful**: Deck cycling via Chancellor is situational and often suboptimal
- **Confusing for new players**: Effect is non-intuitive
- **Better alternatives**: Village, Woodcutter (also removed)

**Usage Statistics**: One of the least-bought cards in the base set

**Replacement**: **Harbinger** ($3) - More useful deck manipulation

---

### 3. Feast ($4)

**Effect**: Trash this card. Gain a card costing up to $5.

**Why Removed**:
- **Rules confusion**: Self-trashing caused frequent misunderstandings
- **Narrow use case**: One-time benefit, then gone
- **Better alternatives exist**: Workshop ($3) repeatable, Remodel ($4) more flexible

**Usage Statistics**: Moderate use but problematic rules questions

**Replacement**: **Poacher** ($4) - Cleaner design, interesting risk/reward

---

### 4. Spy ($4)

**Effect**: +1 Card, +1 Action. Each player (including you) reveals the top card of their deck and discards it or puts it back, your choice.

**Why Removed**:
- **Annoying to play**: Slows down game significantly
- **Weak impact**: Effect rarely game-changing
- **Fiddly multiplayer interaction**: Many small decisions bog down play
- **Anti-synergy**: Affects yourself as well as opponents

**Usage Statistics**: Low priority; avoided in multiplayer

**Replacement**: **Sentry** ($5) - Similar effect but only affects you (faster, cleaner)

---

### 5. Thief ($4)

**Effect**: Each other player reveals the top 2 cards of their deck. If they revealed any Treasure cards, they trash one of them that you choose. You may gain any or all of these trashed cards.

**Why Removed**:
- **Swingy**: Can be devastating or useless depending on reveals
- **Multiplayer slowdown**: Lots of reveals and decisions
- **Anti-fun**: Stealing opponent's treasures is frustrating without enough counterplay
- **Moat defense exists but rare**

**Usage Statistics**: Moderate use but polarizing

**Replacement**: **Bandit** ($5) - Similar concept but more streamlined

---

### 6. Woodcutter ($3)

**Effect**: +1 Buy, +2 Coins.

**Why Removed**:
- **Terminal silver**: Essentially a $2 coin that costs an action
- **Weak in engine decks**: Terminal action with no card draw
- **Rarely optimal**: Big Money prefers treasures; engines prefer Villages/Labs
- **Boring**: No interesting strategic decisions

**Usage Statistics**: Low priority; rarely purchased

**Replacement**: **Vassal** ($3) - More interesting and powerful

---

## New Cards Analysis

### Design Philosophy of New Cards

The 7 new cards focus on:
1. **Cantrips**: +1 Card, +1 Action (Harbinger, Merchant, Vassal)
2. **Engine support**: Cards that help action chains
3. **Interactive effects**: Triggered abilities and conditions
4. **Strategic depth**: More interesting decision points
5. **Balanced power**: Avoiding "solved" strategies

---

### 1. Harbinger ($3)

**Type**: Action
**Cost**: $3
**Effect**: +1 Card, +1 Action. Look through your discard pile. You may put a card from it onto your deck.

**Strategic Value**:
- **Cantrip**: Replaces itself (+1 Card, +1 Action)
- **Deck control**: Retrieve specific cards from discard
- **Engine enabler**: Action-neutral, helps action chains
- **Tactical flexibility**: Can topdeck key cards (Gold, Province, etc.)

**Synergies**:
- Village/Laboratory (action chains)
- Chapel/Moneylender (retrieve trashed cards... wait, no, trashed ≠ discarded)
- Combos well with discard effects

**AI Priority**: Medium (useful in engines, less so in Big Money)

**Implementation Complexity**: MEDIUM
- Requires discard pile visibility
- Interactive prompt to select card
- Topdeck mechanic

---

### 2. Merchant ($3)

**Type**: Action
**Cost**: $3
**Effect**: +1 Card, +1 Action. The first time you play a Silver this turn, +$1.

**Strategic Value**:
- **Cantrip**: Replaces itself
- **Triggered bonus**: Rewards playing Silver (conditional +$1)
- **Early game value**: Silver is common in early decks
- **Scales**: Multiple Merchants stack (3 Merchants + 1 Silver = +$3)

**Synergies**:
- Silver (obviously)
- Mine (upgrade Copper → Silver, gain +$1 bonus)
- Big Money strategies

**AI Priority**: Medium (good early-mid game card)

**Implementation Complexity**: MEDIUM
- Requires tracking "first Silver played this turn"
- Triggered effect system
- State tracking for multiple Merchants

---

### 3. Vassal ($3)

**Type**: Action
**Cost**: $3
**Effect**: +$2. Discard the top card of your deck. If it's an Action card, you may play it.

**Strategic Value**:
- **Economy boost**: +$2 coins
- **Deck cycling**: Discards top card
- **Free action play**: Can trigger action cards from deck
- **High variance**: Depends on deck composition

**Synergies**:
- Action-heavy decks (higher chance to hit actions)
- Village (if you hit a terminal action)
- Smithy/Laboratory (if you hit them, you draw more)

**AI Priority**: Medium (good in action-heavy decks)

**Implementation Complexity**: MEDIUM
- Requires deck top reveal
- Optional action play from deck (not hand)
- May trigger further pending effects

---

### 4. Poacher ($4)

**Type**: Action
**Cost**: $4
**Effect**: +1 Card, +1 Action, +$1. Discard a card per empty Supply pile.

**Strategic Value**:
- **Cantrip+**: +1 Card, +1 Action, +$1 (strong early game)
- **Scaling weakness**: Gets worse as piles empty
- **Risk/reward**: Great early, liability late
- **Pressure mechanic**: Encourages rushing piles

**Synergies**:
- Early game power (no empty piles = pure upside)
- Gardens (discard fodder)
- Cellar (can discard then redraw)

**AI Priority**: High early game, Low late game

**Implementation Complexity**: MEDIUM
- Count empty supply piles
- Interactive discard prompt (if piles empty)
- Dynamic power level

---

### 5. Bandit ($5)

**Type**: Action - Attack
**Cost**: $5
**Effect**: Gain a Gold. Each other player reveals the top 2 cards of their deck, trashes a Treasure other than Copper that you choose, and discards the rest.

**Strategic Value**:
- **Gold gain**: Immediate economy boost
- **Attack component**: Trashes opponent's Silver/Gold
- **Streamlined Thief**: Simpler rules, no stealing
- **Can't trash Copper**: Less swingy than Thief

**Synergies**:
- Big Money acceleration (gain Gold)
- Moat (blocks attack)
- Throne Room (gain 2 Gold, attack twice)

**AI Priority**: Medium-High (attack + economy)

**Implementation Complexity**: HIGH
- Gain Gold to discard pile
- Reveal opponent's top 2 cards
- Attacker chooses which treasure to trash (interactive)
- Reaction system (Moat)
- Multiplayer sequencing

---

### 6. Sentry ($5)

**Type**: Action
**Cost**: $5
**Effect**: +1 Card, +1 Action. Look at the top 2 cards of your deck. Trash and/or discard any number of them. Put the rest back on top in any order.

**Strategic Value**:
- **Cantrip**: Action-neutral
- **Deck control**: Trash bad cards (Copper, Estates)
- **Digging**: Discard to cycle faster
- **Ordering**: Choose topdeck order

**Synergies**:
- Chapel-like thinning (but less aggressive)
- Action chains (cantrip)
- Combo decks (control draw order)

**AI Priority**: Medium-High (versatile, powerful)

**Implementation Complexity**: HIGH
- Interactive multi-choice prompt:
  1. Which cards to trash?
  2. Which cards to discard?
  3. Which cards to topdeck?
  4. What order for topdecked cards?
- Complex state management

---

### 7. Artisan ($6)

**Type**: Action
**Cost**: $6
**Effect**: Gain a card to your hand costing up to $5. Put a card from your hand onto your deck.

**Strategic Value**:
- **Flexible gaining**: Gain any card ≤ $5 to hand
- **Immediate use**: Gained card can be played same turn (if action)
- **Topdeck mechanic**: Control next draw
- **Expensive but powerful**

**Synergies**:
- Action cards (gain to hand, play immediately)
- Victory cards (gain Duchy, topdeck for endgame)
- Any $5 card (Market, Laboratory, Duchy)

**AI Priority**: Medium (expensive but flexible)

**Implementation Complexity**: HIGH
- Interactive 2-step prompt:
  1. Choose card to gain (up to $5)
  2. Choose card from hand to topdeck
- Gain to hand (not discard pile)
- Complex decision space

---

## Strategic Impact

### Game Balance Improvements

**1st Edition Problems**:
- **Big Money dominance**: Smithy + Gold + Province strategy too strong
- **Weak engine support**: Few cantrips, hard to build action chains
- **Boring "solved" games**: Optimal strategy too clear

**2nd Edition Solutions**:
- **More cantrips**: Harbinger, Merchant, Sentry (all +1 Card, +1 Action)
- **Better engine cards**: Vassal (action from deck), Poacher (early power)
- **Strategic diversity**: More viable deck archetypes

### Archetype Support

| Archetype | 1st Edition | 2nd Edition | Improvement |
|-----------|-------------|-------------|-------------|
| **Big Money** | Strong | Moderate | Balanced (removed Woodcutter, Adventurer) |
| **Engine** | Weak | Strong | Added cantrips (Harbinger, Merchant, Sentry) |
| **Rush** | Moderate | Strong | Poacher encourages pile pressure |
| **Control** | Weak | Moderate | Sentry, Bandit offer control options |
| **Gardens** | Exists | Unchanged | Still viable |

### Competitive Play Impact

- **Replayability**: Higher variance in game setup (more viable strategies)
- **Skill ceiling**: Raised (more complex decision points)
- **New player experience**: Better (removed confusing cards like Chancellor)
- **Tournament viability**: Improved (balanced meta)

---

## Implementation Impact

### Current Codebase Analysis

**Implemented Cards** (from removed list):
- Adventurer ✓ (implemented)
- Chancellor ✓ (implemented)
- Feast ✓ (implemented)
- Spy ✓ (implemented)
- Thief ✓ (implemented)
- Woodcutter ✓ (implemented)

**Implementation Status**: All 6 removed cards are currently implemented and tested

**Impact**:
- 6 card definitions to remove
- 7 new card definitions to add
- Tests for removed cards to deprecate
- Tests for new cards to create
- AI strategy to update

### Complexity Comparison

| Card | Edition | Complexity | Pending Effect | Interactive Steps |
|------|---------|------------|----------------|-------------------|
| Adventurer | 1st | MEDIUM | Yes | 0 (auto-reveal) |
| Chancellor | 1st | LOW | Yes | 1 (yes/no) |
| Feast | 1st | MEDIUM | Yes | 1 (gain selection) |
| Spy | 1st | HIGH | Yes | N (per player) |
| Thief | 1st | HIGH | Yes | N (per player) |
| Woodcutter | 1st | LOW | No | 0 |
| **Harbinger** | **2nd** | **MEDIUM** | **Yes** | **1 (card selection)** |
| **Merchant** | **2nd** | **MEDIUM** | **No** | **0 (triggered effect)** |
| **Vassal** | **2nd** | **MEDIUM** | **Yes** | **1 (play action?)** |
| **Poacher** | **2nd** | **MEDIUM** | **Maybe** | **0-N (discard per pile)** |
| **Bandit** | **2nd** | **HIGH** | **Yes** | **N (per opponent)** |
| **Sentry** | **2nd** | **HIGH** | **Yes** | **1 (multi-step choice)** |
| **Artisan** | **2nd** | **HIGH** | **Yes** | **2 (gain + topdeck)** |

**Complexity Analysis**:
- **Removed**: 2 LOW, 2 MEDIUM, 2 HIGH
- **Added**: 0 LOW, 4 MEDIUM, 3 HIGH
- **Net Change**: +1 average complexity (more strategic depth)

### New Mechanics Required

**Triggered Effects** (Merchant):
- Track "first Silver played this turn"
- Apply bonus on trigger
- Multiple Merchant stacking

**Action Play from Deck** (Vassal):
- Reveal top card
- Conditional action play from non-hand zone
- Nested action resolution

**Dynamic Empty Pile Count** (Poacher):
- Count empty supply piles
- Scale discard requirement
- Interactive discard if needed

**Multi-Step Interactive** (Sentry, Artisan):
- Complex branching choices
- Multiple decision points per card
- State management across steps

**Attacker-Chooses Trashing** (Bandit):
- Opponent reveals cards
- Attacker selects which to trash
- Asymmetric interaction

---

## Migration Roadmap

### Phase 4.2: Remove 1st Edition Cards

**Effort**: 8-10 hours

**Tasks**:
1. Mark cards as deprecated in cards.ts
2. Add deprecation warnings if used
3. Update documentation to note 1st edition status
4. Keep tests for backward compatibility mode

**Deliverables**:
- `packages/core/src/cards.ts` - Add deprecation flags
- `docs/requirements/DEPRECATED_CARDS.md` - Document removed cards
- Keep existing tests (with deprecation notes)

### Phase 4.3: Add 2nd Edition Cards

**Effort**: 25-30 hours

**Sub-Phases**:

#### 4.3.1: Simple Cards (8h)
- Harbinger ($3)
- Merchant ($3)
- Vassal ($3)

#### 4.3.2: Medium Cards (10h)
- Poacher ($4)
- Bandit ($5)

#### 4.3.3: Complex Cards (12h)
- Sentry ($5)
- Artisan ($6)

**Tasks per card**:
1. Define card in cards.ts
2. Implement game engine logic
3. Write unit tests (95%+ coverage)
4. Write integration tests
5. Add AI strategy
6. Document in CARD_SPECIFICATIONS.md
7. Add to CLI help system

**Deliverables**:
- 7 new card definitions
- 150+ new tests
- AI strategy updates
- Documentation updates

### Phase 4.4: Update Default Kingdom

**Effort**: 2 hours

**Tasks**:
1. Change default kingdom selection to use 2nd edition cards only
2. Add `--edition=1` flag for backward compatibility
3. Update README.md with edition info

**Deliverables**:
- GameOptions.edition parameter
- CLI flag support
- Documentation

### Phase 4.5: Migration Testing

**Effort**: 5 hours

**Tasks**:
1. Run full test suite with 2nd edition
2. Regression test 1st edition mode
3. Performance benchmarks
4. AI gameplay validation

**Deliverables**:
- Test report
- Performance comparison
- Migration validation

### Total Estimated Effort

| Phase | Effort | Status |
|-------|--------|--------|
| Phase 4.2: Remove 1st edition | 8-10h | Not Started |
| Phase 4.3: Add 2nd edition | 25-30h | Not Started |
| Phase 4.4: Update defaults | 2h | Not Started |
| Phase 4.5: Testing | 5h | Not Started |
| **Total** | **40-47h** | **Not Started** |

---

## Backward Compatibility

### Compatibility Modes

**Mode 1: 2nd Edition (Default)**
- 26 kingdom cards (19 unchanged + 7 new)
- Modern Dominion experience
- Recommended for all new games

**Mode 2: 1st Edition (Legacy)**
- 25 kingdom cards (19 unchanged + 6 removed)
- Historical compatibility
- Required for old savegames/replays

**Mode 3: Mixed (Advanced)**
- All 32 kingdom cards available
- Custom selection via GameOptions.kingdomCards
- For testing or variant play

### GameOptions Extension

```typescript
export interface GameOptions {
  victoryPileSize?: number;
  kingdomCards?: ReadonlyArray<CardName>;
  edition?: '1st' | '2nd' | 'mixed';  // NEW PARAMETER
}
```

**Behavior**:
- `edition: '2nd'` - Use 19 unchanged + 7 new (default)
- `edition: '1st'` - Use 19 unchanged + 6 removed
- `edition: 'mixed'` - Use all 32 cards
- If `kingdomCards` specified, `edition` is ignored

### CLI Flag Support

```bash
npm run play                      # 2nd edition (default)
npm run play -- --edition=1       # 1st edition
npm run play -- --edition=mixed   # All cards
```

### Test Compatibility

**Approach**: Maintain both test suites

**Structure**:
```
packages/core/tests/
  ├── cards/
  │   ├── 1st-edition/      # Tests for removed cards
  │   ├── 2nd-edition/      # Tests for new cards
  │   └── unchanged/        # Tests for 19 common cards
  └── game/                 # Game engine tests
```

**CI Pipeline**:
- Run 2nd edition tests (primary)
- Run 1st edition tests (legacy validation)
- Ensure no regressions in either mode

---

## Recommendation

**Adopt 2nd Edition as Default** for these reasons:

1. **Official Standard**: 2nd edition is the current official version
2. **Better Balance**: Improved strategic diversity
3. **Modern Experience**: Matches what new Dominion players expect
4. **Design Quality**: Removed problematic cards, added better ones
5. **Future-Proof**: Expansions built on 2nd edition foundation

**Maintain 1st Edition Support** for:
- Backward compatibility
- Historical accuracy
- Savegame replay
- User preference

**Migration Timeline**: Phase 4.2-4.5 (after Phase 4.1 completes)

---

## Appendix A: Full Card Comparison Table

| Card Name | Cost | Edition | Type | Status |
|-----------|------|---------|------|--------|
| Cellar | $2 | Both | Action | ✓ Implemented |
| Chapel | $2 | Both | Action | ✓ Implemented |
| Moat | $2 | Both | Action-Reaction | ✓ Implemented |
| Harbinger | $3 | 2nd | Action | ⚠ To Implement |
| Merchant | $3 | 2nd | Action | ⚠ To Implement |
| Vassal | $3 | 2nd | Action | ⚠ To Implement |
| Village | $3 | Both | Action | ✓ Implemented |
| Workshop | $3 | Both | Action | ✓ Implemented |
| Chancellor | $3 | 1st | Action | ⚠ To Deprecate |
| Woodcutter | $3 | 1st | Action | ⚠ To Deprecate |
| Bureaucrat | $4 | Both | Action-Attack | ✓ Implemented |
| Gardens | $4 | Both | Victory | ✓ Implemented |
| Militia | $4 | Both | Action-Attack | ✓ Implemented |
| Moneylender | $4 | Both | Action | ✓ Implemented |
| Poacher | $4 | 2nd | Action | ⚠ To Implement |
| Remodel | $4 | Both | Action | ✓ Implemented |
| Smithy | $4 | Both | Action | ✓ Implemented |
| Throne Room | $4 | Both | Action | ✓ Implemented |
| Feast | $4 | 1st | Action | ⚠ To Deprecate |
| Spy | $4 | 1st | Action-Attack | ⚠ To Deprecate |
| Thief | $4 | 1st | Action-Attack | ⚠ To Deprecate |
| Bandit | $5 | 2nd | Action-Attack | ⚠ To Implement |
| Council Room | $5 | Both | Action | ✓ Implemented |
| Festival | $5 | Both | Action | ✓ Implemented |
| Laboratory | $5 | Both | Action | ✓ Implemented |
| Library | $5 | Both | Action | ✓ Implemented |
| Market | $5 | Both | Action | ✓ Implemented |
| Mine | $5 | Both | Action | ✓ Implemented |
| Sentry | $5 | 2nd | Action | ⚠ To Implement |
| Witch | $5 | Both | Action-Attack | ✓ Implemented |
| Artisan | $6 | 2nd | Action | ⚠ To Implement |
| Adventurer | $6 | 1st | Action | ⚠ To Deprecate |

**Summary**:
- **19 cards** implemented and staying (Both editions)
- **6 cards** implemented but will be deprecated (1st edition only)
- **7 cards** not yet implemented (2nd edition only)

---

**Document Status**: ACTIVE - Ready for review and migration planning

**Next Steps**:
1. Review and approve 2nd edition migration plan
2. Schedule Phase 4.2-4.5 work
3. Begin deprecation of 1st edition cards
4. Implement 7 new 2nd edition cards

**Related Documents**:
- `/docs/requirements/phase-4/CARD_SPECIFICATIONS.md` (to be updated)
- `/docs/requirements/phase-4.2/` (to be created)
- `/docs/requirements/phase-4.3/` (to be created)
