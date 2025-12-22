# Big Money Strategy Specification

**Status**: ACTIVE
**Created**: 2025-10-30
**Phase**: 3
**Owner**: requirements-architect

---

## Executive Summary

This document provides a **precise, quantifiable definition** of the "Big Money" strategy referenced throughout Phases 2-3 requirements. Big Money is the foundational AI strategy that prioritizes treasure acquisition for economic growth while timing victory card purchases to maximize points without sacrificing tempo.

**Key Principle**: Build economy first (Copper → Silver → Gold progression), then pivot to victory cards (Province → Duchy) once economic engine is established.

---

## Strategy Definition

### Core Philosophy

**Big Money** is a Dominion strategy characterized by:
1. **Economic Focus**: Prioritize high-value treasures (Gold, Silver) to maximize buying power
2. **Minimal Kingdom Cards**: Avoid action cards that don't directly generate coins
3. **Timed Victory Purchases**: Begin buying Provinces once economy reaches critical mass
4. **Endgame Transition**: Switch to victory-point acquisition when game end is imminent

### Historical Context

Big Money serves as the **baseline strategy** in Dominion for measuring other strategies' effectiveness. A well-implemented Big Money strategy:
- Wins 65-75% of games against random play
- Serves as the "

control group" for evaluating kingdom card strategies
- Completes games in 18-25 turns on average
- Demonstrates consistent economic progression

---

## Complete Decision Tree

The AI evaluates purchase decisions in **strict priority order** during the Buy Phase. Each priority is checked sequentially; the first matching condition executes.

### Priority 1: Province Purchase (Victory Path - Mid/Late Game)

**Condition**:
```
IF coins >= 8
AND Province available in supply
AND mid-game-or-later (see Mid-Game Threshold below)
THEN buy Province
```

**Mid-Game Threshold** (any one triggers):
- Turn number >= 10 (time-based)
- OR Provinces remaining <= 6 (scarcity-based)
- OR Any supply pile empty (endgame approaching)

**Rationale**: Province (6 VP, cost 8) is the highest-value victory card. Once economy reaches 8+ coins consistently (turn 10+), prioritize Province over all other cards to maximize VP accumulation.

**Critical Rule**: **Province ALWAYS beats Gold** once mid-game threshold is met, even though Gold is "cheaper" and better for economy. Victory points win games, not treasure count.

### Priority 2: Gold Purchase (Economy Maximization - All Game)

**Condition**:
```
IF coins >= 6
AND Gold available in supply
THEN buy Gold
```

**Rationale**: Gold (+3 coins, cost 6) is the most efficient treasure for economic growth. A hand with 2 Golds generates 6 coins, enough to buy more Golds or a Province.

**Economic Value**: Gold provides 50% coin-to-cost ratio (3 coins for 6 cost), superior to Silver (33% ratio: 2 coins for 3 cost).

### Priority 3: Duchy Purchase (Endgame VP - Late Game Only)

**Condition**:
```
IF coins >= 5
AND Duchy available in supply
AND endgame-imminent (see Endgame Threshold below)
THEN buy Duchy
```

**Endgame Threshold** (any one triggers):
- Provinces remaining <= 3 (Province pile nearly exhausted)
- OR Supply piles empty >= 3 (alternative end condition imminent)

**Rationale**: Duchy (3 VP, cost 5) is only purchased when:
1. Provinces are scarce (better to get some VP than none)
2. Game ending is guaranteed within 2-3 turns (Duchy won't harm tempo)

**Anti-Pattern**: NEVER buy Duchy in early/mid game. Duchy clogs hand (no coin generation) and delays economic growth.

### Priority 4: Silver Purchase (Economy Building - Early/Mid Game)

**Condition**:
```
IF coins >= 3
AND Silver available in supply
THEN buy Silver
```

**Rationale**: Silver (+2 coins, cost 3) is the primary early-game economy upgrade. Replacing starting Coppers (+1 coin) with Silvers doubles coin generation per card.

**Economic Progression**: Copper (0 cost, +1 coin) → Silver (3 cost, +2 coins) → Gold (6 cost, +3 coins)

### Priority 5: End Phase (No Profitable Purchase)

**Condition**:
```
IF no higher priority condition met
THEN end phase (don't buy anything)
```

**Rationale**: With < 3 coins, no profitable purchases are available. Ending phase without buying preserves deck efficiency (no dead weight cards).

**Valid Scenarios**:
- Opening hand with 2 coins (1 Copper + 1 Copper, rest Estates)
- Late game with only victory cards in hand (0 coins)
- All affordable cards out of stock

---

## Game Phase Definitions

### Early Game (Turns 1-9)

**Objective**: Build economic engine through treasure upgrades

**Characteristics**:
- Deck contains mostly starting cards (7 Copper, 3 Estate)
- Average coins per turn: 2-5
- Focus: Replace Coppers with Silvers, acquire first Golds
- **Victory Card Purchases**: ZERO (Provinces harm tempo)

**Expected Purchases by Turn 9**:
- Silvers: 3-5 acquired
- Golds: 1-2 acquired (if lucky draws)
- Provinces: 0 (too early, harms economy)

**Turn-by-Turn Milestones**:
- **Turn 1-2**: First Silver purchase (upgrade from Copper)
- **Turn 3-5**: 2-3 Silvers acquired (economic foundation)
- **Turn 6-8**: First Gold purchase (economic acceleration)
- **Turn 9**: Approaching 8-coin hands (Province threshold)

### Mid Game (Turns 10-17)

**Objective**: Balance economic growth with Province acquisition

**Characteristics**:
- Deck contains mix of treasures and starting cards
- Average coins per turn: 5-8
- Focus: Buy Provinces when >= 8 coins, continue Gold acquisition otherwise
- **Victory Card Purchases**: Provinces (primary goal)

**Expected Purchases by Turn 17**:
- Silvers: 5-7 total
- Golds: 3-4 total
- Provinces: 2-4 acquired

**Decision Pattern**:
- 8+ coins → Province (always, Priority 1)
- 6-7 coins → Gold (economy building, Priority 2)
- 3-5 coins → Silver (continued economy growth, Priority 4)

**Critical Transition**: First Province purchase typically occurs turn 10-12. This marks the shift from pure economy to victory point accumulation.

### Late Game / Endgame (Turns 18-25)

**Objective**: Maximize victory points before game ends

**Characteristics**:
- Deck contains multiple Golds and Silvers
- Average coins per turn: 7-11
- Focus: Provinces first, Duchies if Provinces scarce, continue Golds if both unavailable
- **Victory Card Purchases**: Provinces (preferred), Duchies (fallback)

**Expected Final Deck**:
- Coppers: 3-6 (some remain, not all upgraded)
- Silvers: 5-8 (core economy)
- Golds: 3-5 (high-value economy)
- Estates: 3 (unchanged from start)
- Duchies: 0-2 (endgame only, if needed)
- Provinces: 4-6 (winning VP total)

**Game End Triggers**:
- Province pile exhausted (most common)
- 3+ supply piles empty (alternative condition)

**Final Victory Points Target**: 28-38 VP (winning range)

---

## Turn-Based Milestone Requirements

### Milestone 1: First Silver Purchase

**Target**: Turns 2-4
**Validation**: Integration test verifies Silver in deck by turn 5

**Scenario**:
- Turn 1: Draw 3 Copper + 2 Estate → 3 coins → Buy Silver
- OR Turn 2: Draw 4 Copper + 1 Estate → 4 coins → Buy Silver

**Success Criteria**: 90% of games acquire first Silver by turn 4

### Milestone 2: First Gold Purchase

**Target**: Turns 6-9
**Validation**: Integration test verifies Gold in deck by turn 10

**Scenario**:
- Turn 6: Draw 2 Silver + 3 Copper → 7 coins → Buy Gold
- OR Turn 7: Draw 3 Silver + 2 Copper → 8 coins → Buy Gold

**Success Criteria**: 85% of games acquire first Gold by turn 9

### Milestone 3: First Province Purchase

**Target**: Turns 9-13
**Validation**: Integration test verifies Province in deck by turn 14

**Scenario**:
- Turn 10: Draw 1 Gold + 2 Silver + 2 Copper → 9 coins → Buy Province (Priority 1 triggers)

**Success Criteria**: 80% of games acquire first Province by turn 13

**Critical Test**: Verify AI buys Province INSTEAD OF Gold when both affordable at turn 10+

### Milestone 4: Economic Peak (Multiple Golds)

**Target**: Turns 12-15
**Validation**: Integration test verifies 3+ Golds in deck by turn 16

**Scenario**:
- Turn 12: Deck contains 2-3 Golds, 4-6 Silvers, 3-5 Coppers
- Average hand value: 7-9 coins
- Can afford Province or Gold on most turns

**Success Criteria**: 75% of games have 3+ Golds by turn 16

### Milestone 5: Province Accumulation

**Target**: Turns 15-20
**Validation**: Integration test verifies 3+ Provinces in deck by turn 21

**Scenario**:
- Turn 15: Own 2-3 Provinces
- Turn 18: Own 3-4 Provinces
- Turn 20: Own 4-5 Provinces

**Success Criteria**: 70% of games have 3+ Provinces by turn 21

### Milestone 6: Game Completion

**Target**: Turns 18-25
**Validation**: E2E test verifies game ends within 30 turns

**Scenario**:
- Province pile exhausted: Turns 20-23 (most common)
- OR 3 piles empty: Turns 22-25 (alternative)

**Success Criteria**: 85% of games complete by turn 25

---

## Deck Composition Requirements

### Turn 5 Snapshot (Early Game Foundation)

**Expected Deck** (12-13 cards total):
- Coppers: 6-7 (starting 7, minus 0-1 trashed/upgraded indirectly)
- Silvers: 2-3 (first economy purchases)
- Golds: 0-1 (rare early acquisition)
- Estates: 3 (unchanged)
- Provinces: 0 (too early)
- Duchies: 0 (never buy early)

**Validation**: Integration test captures deck at turn 5, asserts counts within ranges

### Turn 10 Snapshot (Mid-Game Transition)

**Expected Deck** (15-17 cards total):
- Coppers: 5-7 (some remain)
- Silvers: 3-5 (core economy)
- Golds: 1-2 (economic acceleration)
- Estates: 3 (unchanged)
- Provinces: 0-1 (transition point)
- Duchies: 0 (avoid mid-game)

**Critical Validation**: If Province was affordable (8+ coins) on turn 10+, it MUST have been purchased over Gold

### Turn 15 Snapshot (Mid-Game Peak)

**Expected Deck** (18-20 cards total):
- Coppers: 4-6 (diminishing)
- Silvers: 5-7 (established economy)
- Golds: 2-4 (high-value economy)
- Estates: 3 (unchanged)
- Provinces: 2-3 (VP accumulation phase)
- Duchies: 0 (still avoid)

**Validation**: Provinces >= 2 in 80% of games by turn 15

### Turn 20 Snapshot (Late Game VP Push)

**Expected Deck** (21-24 cards total):
- Coppers: 3-6 (some remain)
- Silvers: 5-8 (core economy maintained)
- Golds: 3-5 (peak economy)
- Estates: 3 (unchanged)
- Provinces: 3-5 (primary VP source)
- Duchies: 0-1 (endgame fallback)

**Validation**: Provinces >= 3 in 75% of games by turn 20

### Game End Snapshot (Final Deck)

**Expected Deck** (22-27 cards total):
- Coppers: 3-6 (not all upgraded)
- Silvers: 5-8 (core economy)
- Golds: 3-5 (peak economy)
- Estates: 3 (unchanged, -1 VP each = -3 VP total)
- Provinces: 4-6 (6 VP each = 24-36 VP)
- Duchies: 0-2 (3 VP each = 0-6 VP if present)

**Total VP Target**: 28-38 VP (winning range)
- Calculation: (4-6 Provinces × 6) + (0-2 Duchies × 3) + (3 Estates × 1)
- Minimum winning: (4 × 6) + (0 × 3) + (3 × 1) = 27 VP
- Average winning: (5 × 6) + (1 × 3) + (3 × 1) = 36 VP
- Maximum: (6 × 6) + (2 × 3) + (3 × 1) = 45 VP

**Validation**: E2E test verifies final deck composition in 75% of games meets these ranges

---

## Quantified Success Metrics

### Win Rate Targets

**Against Random Player** (baseline):
- Target: 65-75% win rate
- Validation: Run 100 games AI vs random, measure win percentage
- Threshold: >= 65% to pass

**Against Self** (mirror match, deterministic):
- Target: 45-55% win rate (fair, both using same strategy)
- Validation: Run 100 games AI vs AI (different seeds), measure win percentage
- Threshold: 45-55% range to pass (outside range indicates unfair advantage/bug)

**Against Optimal Big Money Baseline** (aspirational):
- Target: 40-60% win rate (competitive with optimal play)
- Validation: Compare against known-optimal Big Money implementation
- Threshold: >= 40% to pass (within 10% of optimal)

### Economic Efficiency Targets

**Coin Generation Per Turn**:
- **Turn 5**: 3-4 coins average (early economy)
- **Turn 10**: 5-7 coins average (mid-game economy)
- **Turn 15**: 7-9 coins average (peak economy)
- **Turn 20**: 8-10 coins average (late-game consistency)

**Validation**: Performance test tracks coin generation per turn over 50 games, verifies averages meet targets

**Treasure Upgrade Efficiency**:
- **By Turn 5**: 2-4 Coppers replaced with Silvers (20-40% upgrade rate)
- **By Turn 10**: 4-6 Coppers replaced (40-60% upgrade rate)
- **By Turn 15**: 5-7 Coppers replaced (50-70% upgrade rate)

**Validation**: Integration test measures Copper count decline over time

### Decision Quality Metrics

**Province Purchase Timing**:
- Target: 90% of Province purchases occur after turn 9 (not before economy ready)
- Target: 80% of Province purchases occur when coins >= 8 (affordability)
- Validation: Log all purchase decisions, analyze timing distribution

**Gold vs Province Priority** (Critical):
- Target: 95% of games with "8 coins + Province available + Gold available + turn >= 10" → Buy Province (NOT Gold)
- Validation: Track multi-option scenarios, measure correct priority adherence
- **This is the bug scenario**: Must be tested explicitly

**Early Victory Card Avoidance**:
- Target: 98% of games have ZERO Provinces before turn 9 (no premature VP)
- Target: 99% of games have ZERO Duchies before turn 15 (no mid-game VP)
- Validation: Track all victory card purchases, flag premature buys

**Endgame Duchy Usage**:
- Target: 70% of games with "Provinces <= 3 remaining" → Buy Duchy when affordable
- Validation: Track endgame decisions, measure Duchy purchase rate when Provinces scarce

### Performance Benchmarks

**Game Duration**:
- Target: 18-25 turns average (efficient gameplay)
- Validation: E2E test measures turn count for 50 games
- Threshold: 80% of games complete in 18-25 turn range

**Cards Purchased Per Game**:
- Target: 10-15 cards purchased total (beyond starting 10)
- Breakdown: 5-8 treasures + 4-6 victory cards
- Validation: E2E test counts total purchases

**Province Acquisition Rate**:
- Target: 4-6 Provinces per game (winning amount)
- Validation: E2E test counts Provinces in final deck
- Threshold: >= 4 Provinces in 80% of games

---

## Scenario Walkthroughs

### Scenario 1: Typical Opening (Turns 1-5)

**Turn 1**:
- **Hand**: Copper, Copper, Copper, Estate, Estate
- **Coins**: 3 (3 × Copper = 3)
- **Decision**: Buy Silver (cost 3, Priority 4)
- **Reasoning**: First economy upgrade, Silver > Copper
- **End State**: Deck = 7 Copper, 3 Estate, 1 Silver (11 cards)

**Turn 2**:
- **Hand**: Copper, Copper, Copper, Copper, Estate
- **Coins**: 4 (4 × Copper = 4)
- **Decision**: Buy Silver (cost 3, Priority 4)
- **Reasoning**: Continue economy building
- **End State**: Deck = 7 Copper, 3 Estate, 2 Silver (12 cards)

**Turn 3**:
- **Hand**: Silver, Silver, Copper, Copper, Estate
- **Coins**: 6 (2 Silver + 2 Copper = 4 + 2 = 6)
- **Decision**: Buy Gold (cost 6, Priority 2) ✓ Lucky draw!
- **Reasoning**: First Gold, major economic boost
- **End State**: Deck = 7 Copper, 3 Estate, 2 Silver, 1 Gold (13 cards)

**Turn 4**:
- **Hand**: Copper, Copper, Copper, Estate, Estate
- **Coins**: 3 (3 × Copper = 3)
- **Decision**: Buy Silver (cost 3, Priority 4)
- **Reasoning**: Continue treasure upgrades
- **End State**: Deck = 7 Copper, 3 Estate, 3 Silver, 1 Gold (14 cards)

**Turn 5**:
- **Hand**: Silver, Copper, Copper, Copper, Estate
- **Coins**: 5 (1 Silver + 3 Copper = 2 + 3 = 5)
- **Decision**: Buy Silver (cost 3, Priority 4)
- **Reasoning**: Almost at Gold threshold, one more Silver helps
- **End State**: Deck = 7 Copper, 3 Estate, 4 Silver, 1 Gold (15 cards)

**Milestone Check**: ✓ First Silver by turn 4, First Gold by turn 9 (ahead of schedule!)

### Scenario 2: Mid-Game Transition (Turns 9-13) - THE CRITICAL SCENARIO

**Turn 9**:
- **Hand**: Gold, Silver, Silver, Copper, Estate
- **Coins**: 7 (1 Gold + 2 Silver + 1 Copper = 3 + 4 + 1 = 8... wait, let me recalculate: 3 + 2 + 2 + 1 = 8!)
- **Supply**: Province available (12), Gold available (20)
- **Mid-Game Check**: Turn 9 < 10, mid-game threshold NOT met yet
- **Decision**: Buy Gold (cost 6, Priority 2) ✓ Correct!
- **Reasoning**: Turn < 10, Priority 1 condition fails (mid-game not triggered), Priority 2 succeeds
- **End State**: Added 1 Gold

**Turn 10** (THE BUG SCENARIO):
- **Hand**: Gold, Gold, Silver, Copper, Estate
- **Coins**: 8 (2 Gold + 1 Silver + 1 Copper = 6 + 2 + 1 = 9... wait: 3 + 3 + 2 + 1 = 9)
- **Recalculating**: 3 + 3 + 2 = 8 coins (if only 2 Golds + 1 Silver, no Copper)
- **Supply**: Province available (12), Gold available (19)
- **Mid-Game Check**: Turn 10 >= 10 ✓ MID-GAME THRESHOLD MET
- **Priority 1 Check**: coins (8) >= 8 ✓, Province available ✓, mid-game ✓ → **BUY PROVINCE**
- **Decision**: Buy Province (cost 8, Priority 1) ✓✓✓ CRITICAL!
- **Reasoning**: "Turn 10, mid-game begins, Province priority over Gold"
- **End State**: Added 1 Province (first VP!)

**🚨 BUG TEST**: If AI bought Gold here instead of Province, Priority 1 is broken!

**Turn 11**:
- **Hand**: Gold, Silver, Silver, Copper, Estate
- **Coins**: 7 (1 Gold + 2 Silver + 1 Copper = 3 + 4 + 1 = 8)
- **Supply**: Province available (11), Gold available (19)
- **Priority 1 Check**: coins (7) < 8 ✗, Priority 1 fails
- **Priority 2 Check**: coins (7) >= 6 ✓, Gold available ✓ → **BUY GOLD**
- **Decision**: Buy Gold (cost 6, Priority 2)
- **Reasoning**: "Only 7 coins, not enough for Province, buy Gold"
- **End State**: Added 1 Gold

**Turn 12**:
- **Hand**: Gold, Gold, Silver, Copper, Estate
- **Coins**: 8 (2 Gold + 1 Silver = 6 + 2 = 8)
- **Supply**: Province available (11), Gold available (18)
- **Priority 1 Check**: coins (8) >= 8 ✓, Province available ✓, turn >= 10 ✓ → **BUY PROVINCE**
- **Decision**: Buy Province (cost 8, Priority 1)
- **Reasoning**: "8 coins, turn 12, buy Province for VP"
- **End State**: Added 1 Province (2nd VP)

**Turn 13**:
- **Hand**: Silver, Silver, Silver, Copper, Estate
- **Coins**: 7 (3 Silver + 1 Copper = 6 + 1 = 7)
- **Priority 1 Check**: coins (7) < 8 ✗
- **Priority 2 Check**: coins (7) >= 6 ✓ → **BUY GOLD**
- **Decision**: Buy Gold (cost 6, Priority 2)
- **End State**: Added 1 Gold

**Milestone Check**: ✓ First Province by turn 13 (target: 9-13), Province prioritized over Gold at turn 10+

### Scenario 3: Endgame Sprint (Turns 20-24)

**Turn 20**:
- **Deck**: 5 Copper, 6 Silver, 4 Gold, 3 Estate, 4 Province (22 cards)
- **Hand**: Gold, Gold, Silver, Silver, Province (dead card)
- **Coins**: 10 (2 Gold + 2 Silver = 6 + 4 = 10)
- **Supply**: Province (4 remaining), Gold (15)
- **Priority 1 Check**: coins (10) >= 8 ✓, Province available ✓, turn >= 10 ✓ → **BUY PROVINCE**
- **Decision**: Buy Province (cost 8, Priority 1)
- **Reasoning**: "10 coins, buy Province, now have 5 Provinces (30 VP from Provinces alone)"
- **End State**: 5 Provinces owned

**Turn 21**:
- **Hand**: Gold, Silver, Silver, Copper, Estate (dead card)
- **Coins**: 7 (1 Gold + 2 Silver + 1 Copper = 3 + 4 + 1 = 8)
- **Supply**: Province (3 remaining), Gold (14), Duchy (8)
- **Endgame Check**: Provinces <= 3 ✓ Endgame threshold met
- **Priority 1 Check**: coins (7) < 8 ✗
- **Priority 2 Check**: coins (7) >= 6 ✓ → **BUY GOLD**
- **Decision**: Buy Gold (cost 6, Priority 2)
- **Reasoning**: "Only 7 coins, not enough for Province, continue building economy"

**Turn 22**:
- **Hand**: Gold, Gold, Gold, Silver, Estate (dead card)
- **Coins**: 11 (3 Gold + 1 Silver = 9 + 2 = 11)
- **Supply**: Province (3 remaining), Duchy (8)
- **Priority 1 Check**: coins (11) >= 8 ✓, Province available ✓ → **BUY PROVINCE**
- **Decision**: Buy Province (cost 8, Priority 1)
- **Reasoning**: "11 coins, buy Province, now have 6 Provinces (36 VP from Provinces)"
- **End State**: 6 Provinces owned

**Turn 23**:
- **Hand**: Gold, Gold, Silver, Copper, Province (dead card)
- **Coins**: 8 (2 Gold + 1 Silver + 1 Copper = 6 + 2 + 1 = 9)
- **Supply**: Province (2 remaining), Duchy (8)
- **Priority 1 Check**: coins (9) >= 8 ✓, Province available ✓ → **BUY PROVINCE**
- **Decision**: Buy Province (cost 8, Priority 1)
- **Reasoning**: "9 coins, buy 7th Province would be ideal but need 8..."
- **Actual**: Buy Province (cost 8), now 7 Provinces
- **End State**: 7 Provinces owned

**Turn 24**:
- **Supply Check**: Province pile has 1 remaining
- **Hand**: Gold, Silver, Silver, Silver, Estate
- **Coins**: 9 (1 Gold + 3 Silver = 3 + 6 = 9)
- **Priority 1 Check**: coins (9) >= 8 ✓, Province available ✓ → **BUY PROVINCE**
- **Decision**: Buy Province (cost 8, Priority 1)
- **Result**: **GAME ENDS** (Province pile exhausted)

**Final Deck** (24 cards):
- Coppers: 5
- Silvers: 6
- Golds: 5
- Estates: 3 (3 VP)
- Provinces: 8 (48 VP)
- **Total VP**: 48 + 3 = 51 VP ✓ Well above winning threshold (28-38 target)

**Milestone Check**: ✓ Game completed by turn 25, final VP > 28, Province pile exhausted

---

## Test Specifications for Big Money Strategy

### Unit Tests (Direct Decision Validation)

**UT-BM-1: Gold Priority in Early Game (Turn < 10)**
```typescript
// @req: Priority 2 - Buy Gold when turn < 10, even if 8 coins
// @input: turn 8, 8 coins, Province available, Gold available
// @output: Buy Gold (NOT Province, turn < 10)
// @assert: decision.move.card === 'Gold'
```

**UT-BM-2: Province Priority in Mid-Game (Turn >= 10)** 🚨 CRITICAL BUG TEST
```typescript
// @req: Priority 1 - Buy Province over Gold when turn >= 10
// @input: turn 10, 8 coins, Province available, Gold available
// @output: Buy Province (NOT Gold, mid-game threshold met)
// @assert: decision.move.card === 'Province'
// @assert: decision.reasoning includes "Province" and NOT "Gold"
```

**UT-BM-3: Province Priority with Empty Pile Trigger**
```typescript
// @req: Priority 1 - Mid-game triggered by empty pile
// @input: turn 8, 8 coins, Province available, Gold available, 1 pile empty
// @output: Buy Province (mid-game triggered by empty pile)
// @assert: decision.move.card === 'Province'
```

**UT-BM-4: Gold When Province Unaffordable**
```typescript
// @req: Priority 2 - Buy Gold when Province unaffordable
// @input: turn 12, 7 coins, Province available, Gold available
// @output: Buy Gold (can't afford Province)
// @assert: decision.move.card === 'Gold'
```

**UT-BM-5: Duchy in Endgame**
```typescript
// @req: Priority 3 - Buy Duchy when Provinces scarce
// @input: turn 20, 5 coins, Duchy available, Provinces remaining = 2
// @output: Buy Duchy (endgame, Provinces scarce)
// @assert: decision.move.card === 'Duchy'
```

**UT-BM-6: Never Buy Duchy Early**
```typescript
// @req: Priority 3 condition - Avoid Duchy before endgame
// @input: turn 10, 5 coins, Duchy available, Provinces remaining = 10
// @output: Buy Silver (NOT Duchy, not endgame yet)
// @assert: decision.move.card === 'Silver'
```

### Integration Tests (Multi-Turn Progression)

**IT-BM-1: First Silver by Turn 5**
```typescript
// @req: Milestone 1 - Silver acquisition timing
// @test: Run AI through 5 turns, verify Silver in deck
// @assert: deck contains >= 1 Silver by turn 5
```

**IT-BM-2: First Gold by Turn 10**
```typescript
// @req: Milestone 2 - Gold acquisition timing
// @test: Run AI through 10 turns, verify Gold in deck
// @assert: deck contains >= 1 Gold by turn 10
```

**IT-BM-3: First Province by Turn 13**
```typescript
// @req: Milestone 3 - Province acquisition timing
// @test: Run AI through 13 turns, verify Province in deck
// @assert: deck contains >= 1 Province by turn 13
```

**IT-BM-4: Turn 10 Priority Transition** 🚨 CRITICAL BUG TEST
```typescript
// @req: Priority 1 triggers at turn 10
// @test: Run AI through turn 10, give 8-coin hand with Province+Gold available
// @assert: AI buys Province (NOT Gold) at turn 10+
// @assert: Purchase log shows "Province" for turn 10 decision
```

**IT-BM-5: Deck Composition at Turn 15**
```typescript
// @req: Turn 15 Snapshot - Expected deck state
// @test: Run AI through 15 turns, capture deck composition
// @assert: Silvers: 5-7, Golds: 2-4, Provinces: 2-3
// @assert: No Duchies present (mid-game, avoid Duchy)
```

**IT-BM-6: Economic Progression Tracking**
```typescript
// @req: Economic Efficiency - Coin generation per turn
// @test: Run AI through 20 turns, log coins per turn
// @assert: Turn 5 avg: 3-4, Turn 10 avg: 5-7, Turn 15 avg: 7-9, Turn 20 avg: 8-10
```

### E2E Tests (Full Game Validation)

**E2E-BM-1: Complete Game with Expected Outcomes**
```typescript
// @req: Full Big Money game progression
// @test: Run full AI vs AI game to completion
// @assert: Game ends in 18-25 turns
// @assert: Final deck: 4-6 Provinces, 3-5 Golds, 5-8 Silvers
// @assert: Total VP: 28-38
```

**E2E-BM-2: Win Rate vs Random Player**
```typescript
// @req: Strategy effectiveness baseline
// @test: Run 100 games AI vs random player
// @assert: AI win rate >= 65%
```

**E2E-BM-3: Province Purchase Pattern Validation**
```typescript
// @req: Decision quality - Province timing
// @test: Run 50 games, log all Province purchases
// @assert: 90% of Province purchases occur turn 9+
// @assert: 95% of "8 coins + turn 10+ + Province+Gold available" → Province purchased
```

**E2E-BM-4: No Premature Victory Cards**
```typescript
// @req: Anti-pattern avoidance
// @test: Run 50 games, log all victory card purchases
// @assert: 98% of games have ZERO Provinces before turn 9
// @assert: 99% of games have ZERO Duchies before turn 15
```

**E2E-BM-5: Endgame Duchy Usage**
```typescript
// @req: Priority 3 - Endgame Duchy purchases
// @test: Run 50 games, filter games where Provinces <= 3
// @assert: 70% of such games purchase Duchy when affordable
```

---

## Acceptance Criteria Summary

### Strategy Implementation (Code-Level)

- **AC-BM-1**: AI evaluates purchase decisions in strict priority order (1 → 2 → 3 → 4 → 5)
- **AC-BM-2**: Province priority triggers at turn >= 10 OR Provinces_remaining <= 6 OR empty_piles >= 1
- **AC-BM-3**: Province ALWAYS chosen over Gold when both affordable and mid-game threshold met
- **AC-BM-4**: Duchy only purchased when Provinces_remaining <= 3 OR empty_piles >= 3
- **AC-BM-5**: Silver purchased when 3+ coins and no higher-priority option available

### Game Progression (Outcome-Level)

- **AC-BM-6**: First Silver acquired by turn 4 in 90% of games
- **AC-BM-7**: First Gold acquired by turn 9 in 85% of games
- **AC-BM-8**: First Province acquired by turn 13 in 80% of games
- **AC-BM-9**: 3+ Golds in deck by turn 16 in 75% of games
- **AC-BM-10**: 3+ Provinces in deck by turn 21 in 70% of games
- **AC-BM-11**: Game completes by turn 25 in 85% of games

### Decision Quality (Behavioral-Level)

- **AC-BM-12**: 95% of multi-option scenarios (Province+Gold both affordable, turn 10+) result in Province purchase
- **AC-BM-13**: 98% of games have ZERO Provinces before turn 9
- **AC-BM-14**: 99% of games have ZERO Duchies before turn 15
- **AC-BM-15**: Coin generation averages meet targets (turn 5: 3-4, turn 10: 5-7, turn 15: 7-9)

### Strategy Effectiveness (Performance-Level)

- **AC-BM-16**: Win rate vs random player: 65-75%
- **AC-BM-17**: Win rate vs self (mirror): 45-55%
- **AC-BM-18**: Final deck composition matches targets in 75% of games
- **AC-BM-19**: Final VP total: 28-38 in 70% of winning games

---

## Implementation Notes

### Current Bug (Identified 2025-10-30)

**Issue**: `ai.ts` lines 109-142 check Gold condition (line 109) BEFORE Province endgame condition (line 116), causing AI to buy Gold instead of Province when both are affordable with 8+ coins.

**Root Cause**: Requirements never specified Province > Gold priority when both affordable. Implementation chose Gold-first ordering, which technically satisfies vague requirements but produces wrong gameplay.

**Fix Required**:
1. Reorder conditions: Check Province (Priority 1) before Gold (Priority 2)
2. Add mid-game check to Province condition (turn >= 10 OR Provinces <= 6 OR empty_piles >= 1)
3. Update tests to validate Priority 1 > Priority 2 ordering

**Code Change**:
```typescript
// NEW ORDER (Priority 1 first):
if (player_state.coins >= 8 && Province available && mid_game_triggered) {
  return { move: { type: 'buy', card: 'Province' }, reasoning: 'Priority 1: Province for VP' };
}

// THEN Priority 2:
if (player_state.coins >= 6 && Gold available) {
  return { move: { type: 'buy', card: 'Gold' }, reasoning: 'Priority 2: Gold for economy' };
}
```

### Testing Strategy

1. **Unit Tests First**: Write UT-BM-1 through UT-BM-6 BEFORE implementation
2. **RED Phase**: All tests fail (current code buys Gold instead of Province at turn 10+)
3. **Implementation**: Reorder ai.ts conditions to match priority tree
4. **GREEN Phase**: All tests pass
5. **Integration Tests**: Validate multi-turn progression matches milestones
6. **E2E Tests**: Validate full games produce expected outcomes

### Validation Process

After implementation:
1. Run full test suite (unit + integration + E2E)
2. Verify 95%+ coverage of decision logic
3. Run 100-game sample, measure all success metrics
4. Compare results to acceptance criteria thresholds
5. Document any deviations and adjust strategy if needed

---

## References

### External Resources

- **Dominion Strategy Wiki**: https://wiki.dominionstrategy.com/index.php/Big_Money
- **Big Money Analysis**: https://dominionstrategy.com/2011/03/28/building-the-first-game-engine/
- **Optimal Play Studies**: Multiple academic papers on Dominion AI strategies

### Internal Documents

- **Phase 3 FEATURES.md**: Original (vague) Big Money requirements
- **Phase 3 TESTING.md**: Test specifications for AI behavior
- **AI_TREASURE_STRATEGY.md**: Treasure accumulation bug fix requirements
- **Comprehensive Requirements Audit (2025-10-30)**: Full gap analysis

### Related Requirements

- **FR 2.2 (Phase 3)**: "AI follows Big Money strategy" - NOW PRECISELY DEFINED HERE
- **FR 3.1-3.4 (Phase 3 Treasure Fix)**: Treasure accumulation before purchases
- **Milestone Requirements (Phase 3)**: Turn-based progression expectations

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-30 | 1.0 | Initial creation - Complete Big Money specification | requirements-architect |

---

## Appendix: Decision Tree Pseudocode

```python
def decide_purchase(coins, supply, turn, game_state):
    """
    Big Money strategy purchase decision tree.
    Evaluates in strict priority order.
    """

    # Helper: Check mid-game threshold
    def is_mid_game_or_later():
        return (
            turn >= 10
            or supply['Province'] <= 6
            or count_empty_piles(supply) >= 1
        )

    # Helper: Check endgame threshold
    def is_endgame():
        return (
            supply['Province'] <= 3
            or count_empty_piles(supply) >= 3
        )

    # PRIORITY 1: Province (Mid/Late Game Victory Path)
    if (coins >= 8
        and supply['Province'] > 0
        and is_mid_game_or_later()):
        return ('buy', 'Province', 'Priority 1: Province for VP')

    # PRIORITY 2: Gold (Economy Maximization)
    if coins >= 6 and supply['Gold'] > 0:
        return ('buy', 'Gold', 'Priority 2: Gold for economy')

    # PRIORITY 3: Duchy (Endgame VP Fallback)
    if (coins >= 5
        and supply['Duchy'] > 0
        and is_endgame()):
        return ('buy', 'Duchy', 'Priority 3: Duchy for endgame VP')

    # PRIORITY 4: Silver (Economy Building)
    if coins >= 3 and supply['Silver'] > 0:
        return ('buy', 'Silver', 'Priority 4: Silver for economy')

    # PRIORITY 5: End Phase (No Profitable Purchase)
    return ('end_phase', None, 'Priority 5: No profitable purchase')
```

---

**END OF BIG MONEY STRATEGY SPECIFICATION**
