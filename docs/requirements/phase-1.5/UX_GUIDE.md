# CLI Phase 2 Visual Guide

**Status**: COMPLETE ✅
**Created**: 2025-10-05
**Last Updated**: 2025-10-20 (marked complete - all features implemented and tested)
**Phase**: 1.5
**Purpose**: Visual comparison of BEFORE and AFTER for each feature

---

## Feature 1: Auto-Play All Treasures

### BEFORE (Current) - 7 steps to play 3 treasures

```
┌─────────────────────────────────────────┐
│ === Buy Phase ===                       │
│ Hand: Copper, Copper, Silver, Estate    │
│                                         │
│ Available Moves:                        │
│   [1] Play Copper                       │
│   [2] Play Copper                       │
│   [3] Play Silver                       │
│   [4] End Phase                         │
└─────────────────────────────────────────┘
> 1                                        ← Input 1
✓ Played Copper (+$1)

┌─────────────────────────────────────────┐
│ Available Moves:                        │
│   [1] Play Copper                       │
│   [2] Play Silver                       │
│   [3] End Phase                         │
└─────────────────────────────────────────┘
> 1                                        ← Input 2
✓ Played Copper (+$1)

┌─────────────────────────────────────────┐
│ Available Moves:                        │
│   [1] Play Silver                       │
│   [2] End Phase                         │
└─────────────────────────────────────────┘
> 1                                        ← Input 3
✓ Played Silver (+$2)

┌─────────────────────────────────────────┐
│ Coins: $4                               │
│ Available Moves:                        │
│   [1] Buy Silver                        │
│   [2] Buy Estate                        │
│   [3] End Phase                         │
└─────────────────────────────────────────┘
> 1                                        ← Input 4
```

**User Inputs**: 4 (play 3 treasures + 1 buy)
**Time**: ~20-30 seconds

---

### AFTER (Auto-Play) - 1 step to buy

```
┌─────────────────────────────────────────┐
│ === Buy Phase ===                       │
│ Hand: Copper, Copper, Silver, Estate    │
│                                         │
│ Auto-playing treasures:                 │
│   Copper (+$1), Copper (+$1),           │
│   Silver (+$2)                          │
│ Total: $4                               │
│                                         │
│ Available Moves:                        │
│   [1] Buy Silver                        │
│   [2] Buy Estate                        │
│   [3] End Phase                         │
└─────────────────────────────────────────┘
> 1                                        ← Only input
✓ Bought Silver
```

**User Inputs**: 1 (just the buy)
**Time**: ~5 seconds

**Improvement**: 75% fewer inputs, 80% faster

---

## Feature 2: Stable Card Numbers

### BEFORE (Sequential) - Numbers change every turn

**Turn 1 - Action Phase**
```
┌─────────────────────────────────────────┐
│ Hand: Village, Smithy, Copper, Copper   │
│                                         │
│ Available Moves:                        │
│   [1] Play Village      ← Village is #1 │
│   [2] Play Smithy       ← Smithy is #2  │
│   [3] End Phase                         │
└─────────────────────────────────────────┘
```

**Turn 2 - Action Phase** (different hand)
```
┌─────────────────────────────────────────┐
│ Hand: Smithy, Market, Laboratory        │
│                                         │
│ Available Moves:                        │
│   [1] Play Smithy       ← Smithy now #1 │
│   [2] Play Market       ← Market is #2  │
│   [3] Play Laboratory                   │
│   [4] End Phase                         │
└─────────────────────────────────────────┘
```

**Problem**: Smithy changed from [2] to [1]
**AI Impact**: Must re-parse text every turn, can't learn patterns

---

### AFTER (Stable Numbers) - Numbers never change

**Turn 1 - Action Phase**
```
┌─────────────────────────────────────────┐
│ Hand: Village, Smithy, Copper, Copper   │
│                                         │
│ Available Moves:                        │
│   [7] Play Village      ← Always [7]    │
│   [6] Play Smithy       ← Always [6]    │
│   [50] End Phase        ← Always [50]   │
└─────────────────────────────────────────┘
```

**Turn 2 - Action Phase**
```
┌─────────────────────────────────────────┐
│ Hand: Smithy, Market, Laboratory        │
│                                         │
│ Available Moves:                        │
│   [6] Play Smithy       ← Still [6]!    │
│   [5] Play Market       ← Always [5]    │
│   [4] Play Laboratory   ← Always [4]    │
│   [50] End Phase        ← Still [50]    │
└─────────────────────────────────────────┘
```

**Benefit**: AI can learn "7 = Village, 6 = Smithy, always"

---

### AFTER (Hybrid Mode - Recommended)

**Shows both sequential AND stable**
```
┌─────────────────────────────────────────┐
│ Hand: Village, Smithy, Copper, Copper   │
│                                         │
│ Available Moves:                        │
│   [1] (S7)  Play Village   ← Human: 1   │
│   [2] (S6)  Play Smithy    ← or AI: S7  │
│   [3] (S50) End Phase                   │
└─────────────────────────────────────────┘

> 1              ← Human types sequential
✓ Played Village

> S6             ← AI types stable
✓ Played Smithy
```

**Benefit**: Best of both worlds - humans use 1,2,3 / AI uses S7,S6,S50

---

## Feature 3: Multi-Card Chained Submission

### BEFORE (One move at a time) - 6 interactions

```
┌─────────────────────────────────────────┐
│ Available Moves:                        │
│   [1] Play Village                      │
│   [2] Play Smithy                       │
│   [3] Play Market                       │
│   [4] End Phase                         │
└─────────────────────────────────────────┘
> 1                                        ← Input 1
✓ Played Village (+1 Card, +2 Actions)

┌─────────────────────────────────────────┐
│ Available Moves:                        │
│   [1] Play Smithy                       │
│   [2] Play Market                       │
│   [3] End Phase                         │
└─────────────────────────────────────────┘
> 1                                        ← Input 2
✓ Played Smithy (+3 Cards)

┌─────────────────────────────────────────┐
│ Available Moves:                        │
│   [1] Play Market                       │
│   [2] End Phase                         │
└─────────────────────────────────────────┘
> 1                                        ← Input 3
✓ Played Market (+1 Card, +1 Action, +$1, +1 Buy)

┌─────────────────────────────────────────┐
│ Available Moves:                        │
│   [1] End Phase                         │
└─────────────────────────────────────────┘
> 1                                        ← Input 4
✓ Ended Action Phase
```

**User Inputs**: 4
**Time**: ~20 seconds

---

### AFTER (Chained Input) - 1 interaction

```
┌─────────────────────────────────────────┐
│ Available Moves:                        │
│   [1] Play Village                      │
│   [2] Play Smithy                       │
│   [3] Play Market                       │
│   [4] End Phase                         │
└─────────────────────────────────────────┘
> 1, 2, 3, 4                               ← One input!

✓ Played Village (+1 Card, +2 Actions)
✓ Played Smithy (+3 Cards)
✓ Played Market (+1 Card, +1 Action, +$1, +1 Buy)
✓ Ended Action Phase

┌─────────────────────────────────────────┐
│ === Buy Phase ===                       │
└─────────────────────────────────────────┘
```

**User Inputs**: 1 (chain of 4 moves)
**Time**: ~5 seconds

**Improvement**: 75% fewer inputs, 75% faster

---

## Feature 4: Reduced Supply Pile Sizes

### BEFORE (Standard Piles) - Long game

```
┌─────────────────────────────────────────┐
│ Supply:                                 │
│   Provinces:  12  ← Takes ~20 turns     │
│   Duchies:    12     to deplete         │
│   Estates:    12                        │
│                                         │
│   Villages:   10                        │
│   Smithies:   10                        │
│   Markets:    10                        │
│   (all kingdom cards: 10 each)          │
└─────────────────────────────────────────┘

Game ends at turn 20-25 (typical)
```

---

### AFTER (--quick-game flag) - Short game

```bash
$ npm run play -- --quick-game
```

```
┌─────────────────────────────────────────┐
│ Supply (Quick Game Mode):              │
│   Provinces:  8   ← Takes ~12 turns     │
│   Duchies:    8      to deplete         │
│   Estates:    8                         │
│                                         │
│   Villages:   8                         │
│   Smithies:   8                         │
│   Markets:    8                         │
│   (all kingdom cards: 8 each)           │
│                                         │
│   Treasures: UNCHANGED                  │
│   Copper:    60                         │
│   Silver:    40                         │
│   Gold:      30                         │
└─────────────────────────────────────────┘

Game ends at turn 10-15 (typical)
```

**Improvement**: 40% shorter games, perfect for testing

---

## Combined Example: All Features Together

### Maximum Speed Configuration

```bash
$ npm run play -- --quick-game --stable-numbers
```

### Turn Sequence

**Turn 1 - Action Phase**
```
┌─────────────────────────────────────────┐
│ === Turn 1 | Player 1 | Action Phase === │
│                                         │
│ Hand: Village, Smithy, Copper, Copper,  │
│       Estate                            │
│                                         │
│ Available Moves:                        │
│   [1] (S7) Play Village                 │
│   [2] (S6) Play Smithy                  │
│   [3] (S50) End Phase                   │
└─────────────────────────────────────────┘

> 1, 2, 50            ← Chained input: Village, Smithy, End

✓ Played Village (+1 Card, +2 Actions)
✓ Played Smithy (+3 Cards)
✓ Ended Action Phase

Auto-playing treasures: Copper (+$1), Copper (+$1),
                       Copper (+$1), Copper (+$1)
Total: $4

┌─────────────────────────────────────────┐
│ === Buy Phase ===                       │
│ Coins: $4                               │
│                                         │
│ Available Moves:                        │
│   [22] Buy Silver                       │
│   [24] Buy Estate                       │
│   [33] Buy Village                      │
│   [50] End Phase                        │
└─────────────────────────────────────────┘

> 22                  ← Stable number for Silver

✓ Bought Silver

> 50                  ← End turn

✓ Ended Buy Phase
✓ Cleanup: Drew 5 new cards
```

**Total Inputs for Turn**: 2 inputs (vs 8+ without features)
**Time Per Turn**: ~10 seconds (vs ~60 seconds)

**Full Game**:
- **Turns**: 10-12 (vs 20-25 standard)
- **Time**: 2-3 minutes (vs 15-20 minutes)
- **Inputs**: ~25 total (vs 200+ standard)

---

## Feature Comparison Table

| Metric | Current CLI | With Feature 1 | + Feature 2 | + Feature 3 | All Features |
|--------|-------------|----------------|-------------|-------------|--------------|
| **Inputs per turn** | 8-10 | 4-5 | 4-5 | 1-2 | 1-2 |
| **Time per turn** | 60s | 30s | 30s | 10s | 10s |
| **Game length** | 25 turns | 25 turns | 25 turns | 25 turns | 12 turns |
| **Total game time** | 25min | 12min | 12min | 4min | 2min |
| **AI-friendly** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Human-friendly** | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| **Testing speed** | ❌ | ⚠️ | ⚠️ | ✅ | ✅ |

---

## User Experience Flow Comparison

### Scenario: Play a full turn

**CURRENT (No Features)**
```
1. See action phase menu (5 options)
2. Type 1 to play Village
3. Wait for result
4. See updated menu (4 options)
5. Type 1 to play Smithy
6. Wait for result
7. See updated menu (1 option)
8. Type 1 to end phase
9. Wait for phase transition
10. See buy phase menu (5 options)
11. Type 1 to play Copper
12. Wait for result
13. See updated menu (5 options)
14. Type 1 to play Copper
15. Wait for result
16. See updated menu (4 options)
17. Type 1 to play Silver
18. Wait for result
19. See updated menu (3 options)
20. Type 1 to buy Silver
21. Wait for result
22. See updated menu (2 options)
23. Type 1 to end phase
```

**Total interactions**: 23 steps

---

**WITH ALL FEATURES**
```
1. See action phase menu with stable numbers
2. Type "7, 6, 50" (Village, Smithy, End)
3. Auto-treasures play, see buy menu
4. Type "22" (Buy Silver stable number)
5. Type "50" (End turn)
```

**Total interactions**: 5 steps (78% reduction!)

---

## AI Agent Learning Comparison

### Without Stable Numbers (Hard to Learn)

**AI must learn patterns like**:
```
Turn 1: "Option 1 = Village"
Turn 2: "Option 1 = Smithy"  ← DIFFERENT!
Turn 3: "Option 2 = Village"  ← DIFFERENT AGAIN!

Strategy: Must parse text every turn
Success rate: 60-70% (text parsing errors)
Training time: Weeks of games
```

---

### With Stable Numbers (Easy to Learn)

**AI learns simple mapping**:
```
7 = Village (always)
6 = Smithy (always)
50 = End Phase (always)

Strategy: Memorize 20 numbers
Success rate: 95%+ (number matching is reliable)
Training time: Hours of games
```

---

## Performance Benchmarks

### Current CLI Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Display menu | 5ms | Fast |
| Parse input | 2ms | Fast |
| Execute move | 3ms | Fast |
| **Total per move** | **10ms** | ✅ Good |
| **Moves per turn** | **8-10** | ❌ Many inputs needed |

---

### Projected CLI Phase 2 Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Display menu | 5ms | Same |
| Parse chain | 8ms | Slightly slower (parse multiple) |
| Execute moves | 30ms | 10 moves × 3ms each |
| Auto-play treasures | 15ms | 5 treasures × 3ms each |
| **Total per turn** | **58ms** | ✅ Still very fast |
| **Moves per turn** | **1-2** | ✅ Far fewer inputs |

**Improvement**: 80% fewer user interactions, <60ms overhead

---

## Accessibility Considerations

### For Human Players

**Benefits**:
- ✅ Less typing = less strain
- ✅ Faster turns = more engaging
- ✅ Hybrid mode = choose your style

**Potential Issues**:
- ⚠️ Stable numbers have gaps (might confuse beginners)
- ⚠️ Auto-play removes control (very rare edge case)

**Mitigation**:
- Hybrid mode shows both number systems
- Help text explains gaps
- Auto-play behavior is standard in most digital Dominion

---

### For AI Agents

**Benefits**:
- ✅ Stable numbers = easy pattern learning
- ✅ Chains = execute complex strategies in one command
- ✅ Auto-play = fewer states to consider

**Potential Issues**:
- (None identified)

---

### For Developers/Testers

**Benefits**:
- ✅ Quick games = rapid iteration
- ✅ Chains = script test scenarios
- ✅ Stable numbers = reproducible tests

**Potential Issues**:
- ⚠️ Quick games change balance (not representative)

**Mitigation**:
- Flag is optional
- Document that quick games are for testing only

---

## Implementation Complexity

### Feature Complexity Rating

| Feature | Complexity | Risk | Value |
|---------|-----------|------|-------|
| Auto-Play Treasures | ⭐⭐ Low | Low | ⭐⭐⭐⭐⭐ Very High |
| Stable Numbers | ⭐⭐⭐⭐ Medium-High | Medium | ⭐⭐⭐⭐ High |
| Chained Submission | ⭐⭐⭐ Medium | Medium | ⭐⭐⭐⭐ High |
| Reduced Piles | ⭐ Very Low | Very Low | ⭐⭐⭐ Medium |

**Recommended Order**: Low-complexity, high-value first
1. Auto-Play (easy win)
2. Reduced Piles (easy, useful for testing)
3. Chained Submission (moderate, high value)
4. Stable Numbers (complex, but critical for Phase 2)

---

## Questions?

See **CLI_PHASE2_SUMMARY.md** for clarifying questions and decision points.

See **CLI_PHASE2_REQUIREMENTS.md** for full technical specifications.
