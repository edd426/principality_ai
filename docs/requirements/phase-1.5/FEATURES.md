# CLI Phase 2 Requirements - UX Improvements

**Status**: APPROVED
**Created**: 2025-10-05
**Last Updated**: 2025-10-17 (moved during documentation reorganization)
**Phase**: 1.5
**Version**: 2.0.0

---

## Table of Contents

- [Overview](#overview)
- [Feature 1: Auto-Play All Treasures](#feature-1-auto-play-all-treasures)
- [Feature 2: Stable Card Numbers](#feature-2-stable-card-numbers)
- [Feature 3: Multi-Card Chained Submission](#feature-3-multi-card-chained-submission)
- [Feature 4: Reduced Supply Pile Sizes](#feature-4-reduced-supply-pile-sizes)
- [Feature 5: Victory Points Display](#feature-5-victory-points-display)
- [Feature 6: Auto-Skip Cleanup Phase](#feature-6-auto-skip-cleanup-phase)
- [Feature Interactions](#feature-interactions)
- [Implementation Priority](#implementation-priority)
- [Acceptance Criteria Summary](#acceptance-criteria-summary)

---

## Overview

### Purpose

This document specifies six user experience improvements for the Principality AI CLI interface designed to:
1. Reduce tedious repeated actions (auto-play treasures, auto-skip cleanup)
2. Improve AI agent playability (stable card numbering)
3. Increase gameplay speed (chained move submission)
4. Shorten game duration for testing (reduced supply sizes)
5. Display critical game information (victory points)

### Target Users

- **Human Players**: Casual testing and gameplay
- **AI Agents**: LLM-based players via MCP integration (Phase 2)
- **Developers**: Testing and iteration during development

### Design Philosophy

These features prioritize:
- **Speed**: Minimize turn time for both humans and AI
- **Clarity**: Maintain transparency about what's happening
- **Simplicity**: Streamlined UX without unnecessary complexity
- **AI-Friendliness**: Make the game easier for agents to parse and play

### User Clarifications Received

All open questions have been resolved:

1. **"Principalities" Clarification**: User confirmed this means **Provinces** (6 VP victory card)
2. **Auto-Play Behavior**: Command-based, NOT automatic. User must type command to play treasures
3. **Stable Numbering Display**: Simple stable-only display (e.g., `[7] Play Village`), no hybrid
4. **Chain Error Handling**: Full rollback - if ANY move fails, revert ALL moves in chain
5. **NEW Feature Discovered**: Victory Points display was missing from Phase 1 CLI
6. **NEW Feature Discovered**: Auto-skip cleanup phase to eliminate manual input for no-choice phases

---

## Feature 1: Auto-Play All Treasures

### User Story

**As a** player
**I want** to play all treasure cards in my hand with a single action
**So that** I don't have to manually play each Copper, Silver, and Gold one at a time

### Current Behavior

During the buy phase, players must:
1. Select treasure card from numbered list
2. Confirm play
3. Repeat for each treasure card
4. End phase to proceed to buying

**Example**:
```
Available Moves:
  [1] Play Copper
  [2] Play Copper
  [3] Play Copper
  [4] Play Silver
  [5] End Phase

> 1
✓ Played Copper (+$1)

Available Moves:
  [1] Play Copper
  [2] Play Copper
  [3] Play Silver
  [4] End Phase

> 1
✓ Played Copper (+$1)

... (repeated 4 more times)
```

### Proposed Behavior

#### Selected Approach: Command-Based (User Approved)

**New Command**: `treasures`, `t`, `play all`, or `all` to play all treasures at once

**Display**:
```
Available Moves:
  [1] Play Copper
  [2] Play Copper
  [3] Play Silver
  [4] End Phase

> treasures
✓ Played all treasures: Copper (+$1), Copper (+$1), Silver (+$2)
Total coins: $4

Available Moves:
  [1] Buy Silver
  [2] Buy Estate
  [3] End Phase

>
```

**Advantages**:
- Maintains full player control
- Explicit about what's happening
- Faster than individual treasure playing
- User can still play treasures individually if desired

### Functional Requirements

**FR-1.1**: The CLI SHALL recognize the commands `treasures`, `t`, `play all`, or `all` to play all treasure cards in hand.

**FR-1.2**: When the play-all-treasures command is executed, the CLI SHALL execute `play_treasure` moves for all treasure cards in hand in the order they appear.

**FR-1.3**: The CLI SHALL display a summary message showing which treasures were played and the total coins gained.

**FR-1.4**: After playing all treasures, the CLI SHALL display the updated available moves (buy options).

**FR-1.5**: The play-all-treasures command SHALL only apply to treasure cards (Copper, Silver, Gold), not action cards.

**FR-1.6**: Players MAY still play treasures individually using numbered moves if they choose.

### Non-Functional Requirements

**NFR-1.1**: Auto-playing treasures SHALL complete in < 100ms total regardless of number of treasures.

**NFR-1.2**: The display SHALL clearly show how many coins were gained from auto-played treasures.

### Edge Cases

**EC-1.1**: If hand contains zero treasures when entering buy phase:
- **Behavior**: Skip auto-play, show "No treasures to play. $0 available." message
- **Display**: Proceed directly to buy options

**EC-1.2**: If hand contains only victory cards (no treasures):
- **Behavior**: Same as EC-1.1
- **Display**: "No treasures in hand. $0 available."

**EC-1.3**: If player has already manually played some treasures:
- **Behavior**: Command plays only unplayed treasures remaining in hand

### Acceptance Criteria

**AC-1.1**: Given I am in buy phase with 3 Copper in hand
When I type "treasures" or "t" or "play all"
Then all 3 Copper are played in sequence
And I see "Played all treasures: Copper (+$1), Copper (+$1), Copper (+$1)"
And my coins display shows "Total coins: $3"

**AC-1.2**: Given I am in buy phase with no treasures
When the phase begins
Then I see "No treasures to play"
And I see buy options immediately

**AC-1.3**: Given I am in buy phase with 2 Copper and 1 Estate
When treasures are auto-played
Then only the 2 Copper are played
And Estate remains in hand
And I see "$2 available"

### Priority

**Must-Have** - This significantly improves usability for the most common game action.

---

## Feature 2: Stable Card Numbers

### User Story

**As an** AI agent playing the game
**I want** card numbers in the move list to remain stable across turns
**So that** I can develop consistent strategies and learn optimal play patterns

### Current Behavior

Move numbers are assigned sequentially based on the current available moves:

**Turn 1 - Action Phase**:
```
Available Moves:
  [1] Play Village
  [2] Play Smithy
  [3] End Phase
```

**Turn 1 - Buy Phase** (after playing Village):
```
Available Moves:
  [1] Play Copper
  [2] Play Copper
  [3] Play Silver
  [4] Buy Silver
  [5] Buy Estate
  [6] End Phase
```

**Turn 2 - Action Phase** (different hand):
```
Available Moves:
  [1] Play Smithy
  [2] Play Market
  [3] End Phase
```

**Problem**: "Play Smithy" changes from [2] to [1] between turns, making it harder for AI agents to learn consistent patterns.

### Proposed Behavior

#### Selected Approach: Stable Numbers Only (User Approved)

**System**: Assign stable number ranges to card types (simple display, no hybrid):

**Number Ranges**:
- **1-10**: Action cards (alphabetically sorted)
  - [1] Cellar (if in hand)
  - [2] Council Room (if in hand)
  - [3] Festival (if in hand)
  - [4] Laboratory (if in hand)
  - [5] Market (if in hand)
  - [6] Smithy (if in hand)
  - [7] Village (if in hand)
  - [8] Woodcutter (if in hand)

- **11-20**: Treasure cards (by value)
  - [11] Copper (if in hand)
  - [12] Silver (if in hand)
  - [13] Gold (if in hand)

- **21-40**: Buy moves (alphabetically sorted)
  - [21] Buy Cellar
  - [22] Buy Copper
  - [23] Buy Council Room
  - [24] Buy Duchy
  - [25] Buy Estate
  - [26] Buy Festival
  - [27] Buy Gold
  - [28] Buy Laboratory
  - [29] Buy Market
  - [30] Buy Province
  - [31] Buy Silver
  - [32] Buy Smithy
  - [33] Buy Village
  - [34] Buy Woodcutter

- **50**: End Phase

**Display**:
```
Available Moves:
  [6] Play Smithy
  [7] Play Village
  [50] End Phase

> 7
✓ Played Village (+1 Card, +2 Actions)

Available Moves:
  [6] Play Smithy
  [50] End Phase
```

**Advantages**:
- Completely stable: Village is always [7], regardless of what else is in hand
- AI agents can hardcode number associations
- Clear semantic grouping by card type
- Predictable across all game states
- Simple, clean UI (no hybrid complexity)

**Disadvantages**:
- Sparse numbering (gaps in list)
- Slightly less intuitive for first-time human players
- Requires learning number mappings (documented in help)

### Functional Requirements

**FR-2.1**: The CLI SHALL support a "stable numbering mode" that can be enabled via command-line flag `--stable-numbers`.

**FR-2.2**: In stable numbering mode, each card type SHALL be assigned a fixed number based on a deterministic mapping.

**FR-2.3**: The stable number mapping SHALL be documented in the help text and/or a reference file.

**FR-2.4**: The stable number for a card SHALL NOT change between turns, phases, or game states.

**FR-2.5**: If a card is not currently playable/buyable, its stable number SHALL NOT appear in the available moves list.

**FR-2.6**: The "End Phase" move SHALL have stable number **50** in all phases.

**FR-2.7**: In stable numbering mode, ONLY stable numbers are displayed and accepted (no hybrid/sequential numbers).

### Non-Functional Requirements

**NFR-2.1**: Enabling stable numbering SHALL NOT impact move execution performance (< 10ms).

**NFR-2.2**: The stable number mapping SHALL be deterministic and identical across all game instances.

### Edge Cases

**EC-2.1**: If player has multiple copies of the same card:
- **Behavior**: All copies share the same stable number
- **Input**: Typing that number plays the first occurrence in hand
- **Display**: Show count: `[7] Play Village (x2 in hand)`

**EC-2.2**: If phase transition makes new moves available:
- **Behavior**: New moves appear with their stable numbers
- **Display**: Numbers may not be consecutive (gaps appear)

**EC-2.3**: If card is in hand but not playable (e.g., action in buy phase):
- **Behavior**: That stable number does not appear in list
- **Display**: Only currently valid moves shown

### Acceptance Criteria

**AC-2.1**: Given stable numbering is enabled
When I start a game
Then Village always has stable number [7]
And Smithy always has stable number [6]
And these numbers do not change across turns

**AC-2.2**: Given I am in action phase with Village and Smithy
When I see the move list
Then I see `[6] Play Smithy` and `[7] Play Village`
And the numbers are not consecutive (gap accepted)

**AC-2.3**: Given I have 3 Copper in hand
When I see the move list in buy phase
Then I see `[11] Play Copper (x3 in hand)` OR separate entries with same number
And typing `11` plays one Copper

**AC-2.4**: Given I type `help` with stable numbering enabled
Then I see a reference table of all stable numbers
And their corresponding cards

### Priority

**Should-Have** - Important for AI agent usability, but not critical for human play.

---

## Feature 3: Multi-Card Chained Submission

### User Story

**As a** player (human or AI)
**I want** to submit multiple move selections in a single input
**So that** I can execute common action sequences faster

### Current Behavior

Each move requires separate input and confirmation:

```
Available Moves:
  [1] Play Village
  [2] Play Smithy
  [3] End Phase

> 1
✓ Played Village

Available Moves:
  [1] Play Smithy
  [2] End Phase

> 1
✓ Played Smithy

Available Moves:
  [1] End Phase

> 1
✓ Ended Action Phase
```

### Proposed Behavior

**Input Format**: Accept multiple move numbers separated by commas or spaces:

```
Available Moves:
  [1] Play Village
  [2] Play Smithy
  [3] End Phase

> 1, 2, 3

✓ Played Village (+1 Card, +2 Actions)
✓ Played Smithy (+3 Cards)
✓ Ended Action Phase

=== Buy Phase ===
```

**Alternative Syntax**:
- Comma-separated: `1, 2, 3` or `1,2,3`
- Space-separated: `1 2 3`
- Both accepted: `1, 2 3` (mixed separators)

### Functional Requirements

**FR-3.1**: The Parser SHALL accept input containing multiple numbers separated by commas, spaces, or both.

**FR-3.2**: When processing chained input, the CLI SHALL execute moves sequentially in left-to-right order.

**FR-3.3**: After each move in a chain, the CLI SHALL recalculate available moves before executing the next move.

**FR-3.4**: The CLI SHALL display the result of each move in the chain as it executes.

**FR-3.5**: If any move in the chain fails validation, the CLI SHALL immediately stop execution and rollback ALL moves.

**FR-3.6**: The rollback SHALL restore the game state to exactly what it was before the chain started (full transaction behavior).

**FR-3.7**: Chained input SHALL support mixing move types (e.g., play action, then play treasure, then buy).

**FR-3.8**: The special command `end` or number `50` (if stable numbering) SHALL be valid in chains.

### Non-Functional Requirements

**NFR-3.1**: Processing a chain of 5 moves SHALL complete in < 100ms total.

**NFR-3.2**: Error messages for invalid chains SHALL clearly indicate:
- Which move in the chain failed (position and number)
- Why it failed (specific error reason)
- That all moves were rolled back
- The current game state is unchanged

### Edge Cases

**EC-3.1**: If a move number becomes invalid mid-chain:
- **Cause**: Previous move changed available options
- **Example**: Chain `1, 2, 5` but move 1 transitions to buy phase, making old number 2 invalid
- **Behavior**: Stop execution, rollback ALL moves (including successful move 1)
- **Display Error**: "Chain failed at move 2: Invalid move number (5). All moves rolled back. Game state unchanged."
- **Recovery**: Show original available moves (before chain started)

**EC-3.2**: If chain contains duplicate numbers:
- **Example**: `1, 1, 1` (play same card 3 times)
- **Behavior**: May fail on 2nd/3rd if card no longer in hand, rollback ALL moves
- **Display**: "Chain failed at move 2: Card not in hand (already played). All moves rolled back."

**EC-3.3**: If chain is too long (>20 moves):
- **Behavior**: Accept input but warn "Long chain detected, processing..."
- **Safety**: No limit enforced, but warn user

**EC-3.4**: If chain contains non-numeric values:
- **Example**: `1, play, 3`
- **Behavior**: Parse error, reject entire chain
- **Display**: "Invalid chain: 'play' is not a valid move number"

**EC-3.5**: If chain includes commands mixed with moves:
- **Example**: `1, 2, help, 3`
- **Behavior**: Parse error or execute up to command, then stop
- **Recommendation**: Reject mixed chains with error "Cannot mix moves and commands in a chain"

### Validation Rules

**V-3.1**: Each number in chain MUST be a valid move number at the time of execution (not at time of input).

**V-3.2**: Chain MUST contain only numbers and separators (commas, spaces).

**V-3.3**: Numbers MUST be within range of available moves (recalculated after each move).

**V-3.4**: Empty chain (e.g., `,,`) SHALL be rejected.

### Acceptance Criteria

**AC-3.1**: Given I am in action phase with Village and Smithy
When I type `1, 2` (Village then Smithy)
Then Village is played first
And Smithy is played second
And I see results for both moves

**AC-3.2**: Given I am in action phase with Village and Smithy
When I type `1 2 3` (Village, Smithy, End Phase)
Then all three moves execute
And I end in buy phase

**AC-3.3**: Given I am in action phase
When I type `1, 99` (valid then invalid)
Then move 1 does NOT execute (rolled back)
And I see error "Chain failed at move 2: Invalid move number (99). All moves rolled back."
And game state is exactly as it was before the chain

**AC-3.4**: Given I type `1, 2, help`
Then the chain is rejected
And I see error "Cannot mix moves and commands"
And no moves are executed

**AC-3.5**: Given I am in buy phase
When I type `1 2 3` to buy 3 cards
Then each buy executes if I have sufficient buys and coins
Or stops at first failure with clear error

### Priority

**Should-Have** - Significantly improves speed but not essential for basic functionality.

---

## Feature 4: Reduced Supply Pile Sizes

### User Story

**As a** developer or tester
**I want** shorter games with smaller supply piles
**So that** I can iterate faster on AI training and testing

### Current Behavior

**Current Supply Quantities**:
```
Victory Cards:
  Estate:   12
  Duchy:    12
  Province: 12

Kingdom Cards (each):
  Village:      10
  Smithy:       10
  Laboratory:   10
  Market:       10
  Woodcutter:   10
  Festival:     10
  Council Room: 10
  Cellar:       10
```

**Game Length**: Typically 15-25 turns per player to empty Province pile.

### Proposed Behavior

#### Option A: Command-Line Flag (Recommended)

**Flag**: `--quick-game` or `--reduced-piles`

**Reduced Quantities**:
```
Victory Cards:
  Estate:   8
  Duchy:    8
  Province: 8

Kingdom Cards (each):
  Village:      8
  Smithy:       8
  Laboratory:   8
  Market:       8
  Woodcutter:   8
  Festival:     8
  Council Room: 8
  Cellar:       8
```

**Usage**:
```bash
npm run play -- --seed=12345 --quick-game
```

**Expected Game Length**: 10-15 turns per player (33-40% reduction).

#### Option B: Configurable Sizes

**Flag**: `--pile-size=N` where N is the number of cards per pile

**Usage**:
```bash
npm run play -- --pile-size=5   # Very quick games
npm run play -- --pile-size=8   # Quick games
npm run play -- --pile-size=12  # Standard (default)
```

**Advantages**:
- Maximum flexibility
- Can test extreme scenarios (pile-size=1 for ultra-fast)

**Disadvantages**:
- More complex implementation
- Need to validate reasonable ranges

#### Option C: Always-On Reduction

**Behavior**: Permanently reduce all piles to 8 cards (no flag needed).

**Advantages**:
- Simplest implementation
- Fastest games always

**Disadvantages**:
- No way to play standard-length games
- Deviates from Dominion standard rules

### User Clarification (RESOLVED)

**User confirmed**: "Yes, I meant Provinces" (not "principalities")

**Piles to Reduce**:
- **Estates**: Victory card (1 VP) - reduce to 8
- **Duchies**: Victory card (3 VP) - reduce to 8
- **Provinces**: Victory card (6 VP) - reduce to 8

**Piles Unchanged**:
- **Villages**: Kingdom card (action card) - stays at 10
- **All other kingdom cards**: Stay at 10
- **All treasures**: Unchanged (60 Copper, 40 Silver, 30 Gold)

**Confirmed Scope**: `--quick-game` reduces ONLY victory card piles (Estate, Duchy, Province) from 12 to 8.

### Functional Requirements

**FR-4.1**: The CLI SHALL support a `--quick-game` command-line flag.

**FR-4.2**: When `--quick-game` is enabled, victory card piles (Estate, Duchy, Province) SHALL start with 8 cards instead of 12.

**FR-4.3**: Kingdom card piles SHALL remain at 10 cards (not reduced by `--quick-game`).

**FR-4.4**: Treasure piles (Copper, Silver, Gold) SHALL NOT be reduced (remain at 60, 40, 30).

**FR-4.5**: The game end condition SHALL remain unchanged (Province empty OR any 3 piles empty).

**FR-4.6**: The CLI SHALL display the pile sizes in the welcome message if `--quick-game` is active.

**FR-4.7**: If Option B (configurable) is selected, the CLI SHALL validate that pile-size is between 1 and 20.

### Non-Functional Requirements

**NFR-4.1**: Enabling `--quick-game` SHALL NOT affect game logic or move validation.

**NFR-4.2**: The flag SHALL be documented in `--help` output.

### Edge Cases

**EC-4.1**: If pile size is set to 0:
- **Behavior**: Reject with error "Pile size must be at least 1"
- **Default**: Use standard sizes

**EC-4.2**: If pile size is set very high (e.g., 100):
- **Behavior**: Accept but warn "Large pile sizes may result in very long games"
- **Limit**: Cap at 100 to prevent memory issues

**EC-4.3**: If multiplayer game with reduced piles:
- **Behavior**: Same reduced sizes apply to all players
- **Warning**: May end game very quickly with 4 players and 8-card piles

### Game Balance Implications

**Reduced Piles Impact**:

1. **Faster Province Depletion**: 8 Provinces = ~2 per player in 4-player game
   - Increases importance of early Province purchases
   - Reduces viability of engine strategies (takes too long to build)

2. **3-Pile Rule More Likely**: With 8-card kingdom piles, buying out 3 piles is easier
   - May lead to different ending conditions
   - Strategies that empty specific piles become stronger

3. **Victory Card Scarcity**: 8 Estates/Duchies total
   - May lead to tie-breaker scenarios more often
   - Greening strategy (buying victory cards early) less viable

**Recommendation**: Document that `--quick-game` significantly changes game balance and is intended for testing, not competitive play.

### Acceptance Criteria

**AC-4.1**: Given I start the CLI with `--quick-game` flag
When I check the supply
Then I see 8 Provinces, 8 Duchies, 8 Estates
And I see 8 of each kingdom card

**AC-4.2**: Given I start the CLI with `--quick-game` flag
When I check the supply
Then I see 60 Copper, 40 Silver, 30 Gold (unchanged)

**AC-4.3**: Given I run a quick game to completion
When the game ends
Then the game end condition still triggers on Province empty OR 3 piles empty
And the logic is identical to standard games

**AC-4.4**: Given I type `npm run play -- --help`
Then I see documentation for `--quick-game` flag
And the description explains it reduces pile sizes for faster games

**AC-4.5**: Given I run `--pile-size=0` (if Option B)
Then I see error "Pile size must be at least 1"
And the game does not start

### Priority

**Could-Have** - Useful for testing but not essential for core gameplay.

---

## Feature 5: Victory Points Display

### User Story

**As a** player
**I want** to see my current victory points during the game
**So that** I can make informed strategic decisions about when to buy victory cards

### Current Behavior (Phase 1 Gap)

**Missing Feature**: The Phase 1 CLI does not display victory points anywhere in the UI.

**Problem**:
- Players must manually calculate VP from their deck composition
- Tedious mental math: count Estates (1 VP), Duchies (3 VP), Provinces (6 VP)
- No way to quickly assess current score
- Critical information for strategic decision-making is hidden

**Example of current limitation**:
```
Player knows they have:
- 2 Estates
- 1 Duchy
- 0 Provinces

Must manually calculate: (2 × 1) + (1 × 3) + (0 × 6) = 5 VP
```

### Proposed Behavior

**Display Location**: Show VP in the game status header (visible at all times)

**Display Format**:
```
=== Turn 5 | Player 1 | Action Phase ===
Victory Points: 5 VP (2 Estates, 1 Duchy)

Hand: Village, Smithy, Copper, Copper, Estate

Available Moves:
  [1] Play Village
  [2] Play Smithy
  [3] End Phase
```

**Alternative Compact Format**:
```
=== Turn 5 | Player 1 | VP: 5 | Action Phase ===
```

### Functional Requirements

**FR-5.1**: The CLI SHALL display the current player's victory points in the game status header.

**FR-5.2**: Victory points SHALL be calculated from the player's entire deck (draw pile + discard pile + hand).

**FR-5.3**: The VP display SHALL update automatically after each buy or gain of a victory card.

**FR-5.4**: The VP display SHALL show a breakdown of victory card counts (e.g., "5 VP (2E, 1D)" for 2 Estates, 1 Duchy).

**FR-5.5**: The VP display SHALL be visible during all game phases (action, buy, cleanup).

**FR-5.6**: In multiplayer games, each player's VP SHALL be displayed when it's their turn.

### Non-Functional Requirements

**NFR-5.1**: VP calculation SHALL complete in < 5ms per turn.

**NFR-5.2**: VP display SHALL not clutter the UI or reduce readability of move options.

### Edge Cases

**EC-5.1**: If player has zero victory points:
- **Behavior**: Display "0 VP" (no breakdown needed)
- **Reason**: Shouldn't happen in normal play (start with 3 Estates), but handle gracefully

**EC-5.2**: If player has many victory cards:
- **Example**: 10 Estates, 5 Duchies, 3 Provinces
- **Display**: "59 VP (10E, 5D, 3P)" or "59 Victory Points"
- **Compact format**: Use abbreviations for space

**EC-5.3**: During game end screen:
- **Behavior**: Display final VP total prominently
- **Format**: "Game Over! Final Score: 45 VP"

### Acceptance Criteria

**AC-5.1**: Given I am playing a game
When I view the game screen at any time
Then I see my current victory points displayed in the header

**AC-5.2**: Given I have 3 Estates in my deck
When I check the VP display
Then I see "3 VP (3 Estates)" or "3 VP (3E)"

**AC-5.3**: Given I buy a Duchy
When the buy completes
Then VP display updates to show new total (e.g., "3 VP" → "6 VP")

**AC-5.4**: Given the game ends
When the final screen displays
Then I see my final VP total prominently shown

**AC-5.5**: Given I type `hand` or `status` command
Then I see my VP as part of the player status information

### Priority

**Must-Have** - This is a basic game feature that was missing from Phase 1. Essential for informed gameplay.

### Implementation Notes

**VP Calculation Logic**:
```typescript
function calculateVictoryPoints(player: PlayerState): number {
  const allCards = [
    ...player.hand,
    ...player.drawPile,
    ...player.discardPile,
    ...player.inPlay
  ];

  let vp = 0;
  allCards.forEach(card => {
    if (card === 'Estate') vp += 1;
    if (card === 'Duchy') vp += 3;
    if (card === 'Province') vp += 6;
  });

  return vp;
}
```

**Display Integration**:
- Add VP to existing game state header
- Update after every buy/gain action
- Include in `hand` and `status` command output
- Show in game-over screen

**Testing Considerations**:
- Test VP calculation with various deck compositions
- Verify updates after buying victory cards
- Test display formatting with different VP values (0, 1, 100+)
- Ensure performance target (< 5ms) is met

---

## Feature 6: Auto-Skip Cleanup Phase

### User Story

**As a** player
**I want** cleanup to execute automatically when no decisions are required
**So that** I don't have to manually press a key every single turn for a phase with no choices

### Current Behavior

**Manual Cleanup Required**: Every turn, players must manually trigger cleanup by pressing a key to execute the `end_phase` move.

**Current Implementation** (from `packages/core/src/game.ts`):
```typescript
case 'cleanup':
  // Only option is to end cleanup (which triggers cleanup logic)
  moves.push({ type: 'end_phase' });
  break;
```

**Problem**:
- Cleanup offers exactly ONE move option: `end_phase`
- No player decisions to make during cleanup with MVP card set
- User must still press a key/enter command every turn
- This adds unnecessary friction to gameplay
- Slows down turn cycle for no benefit

**Example of current tedium**:
```
=== Cleanup Phase ===
Available Moves:
  [1] End Phase

> 1                          ← Required manual input every turn
✓ Cleanup complete
```

### Proposed Behavior

**Automatic Execution**: When cleanup phase has no interactive choices, execute cleanup immediately and advance to next turn.

**Display Cleanup Summary**:
```
✓ Cleanup: Discarded 3 cards (Village, Copper, Copper), drew 5 new cards

=== Turn 2 | Player 1 | Action Phase ===
```

**Future-Proofing**: If a card requires cleanup decisions (e.g., Cellar in future phases), system pauses for user input.

**Opt-Out Option**: `--manual-cleanup` flag disables auto-skip for players who prefer manual control.

### Functional Requirements

**FR-6.1**: The cleanup phase SHALL execute automatically when no interactive choices are required.

**FR-6.2**: The system SHALL display a cleanup summary showing:
- Cards discarded from in-play area
- Number of cards drawn for new hand
- **Format**: "✓ Cleanup: Discarded N cards, drew 5 new cards"
- **Detailed format** (optional): "✓ Cleanup: Discarded 3 cards (Village, Copper, Copper), drew 5 new cards"

**FR-6.3**: If a card requires cleanup decisions (future cards), the system SHALL pause for user input.

**FR-6.4**: The `--manual-cleanup` flag SHALL disable auto-skip when specified.

**FR-6.5**: Auto-skip SHALL only apply to single-player games initially (multiplayer may require different handling).

**FR-6.6**: After cleanup, the game SHALL immediately advance to the next turn without requiring user input.

### Non-Functional Requirements

**NFR-6.1**: The cleanup summary SHALL be clearly visible before the next turn starts.

**NFR-6.2**: Auto-advance SHALL feel instantaneous (< 100ms from cleanup start to next turn display).

**NFR-6.3**: The summary format SHALL match existing game output style and visual consistency.

**NFR-6.4**: Auto-skip behavior SHALL be obvious and not confuse users about what happened.

### Edge Cases

**EC-6.1**: Multiplayer games with auto-skip:
- **Behavior**: Each player's cleanup auto-executes in sequence
- **Display**: Show cleanup summary for each player as their turn ends
- **Consideration**: May need brief pause between players for readability

**EC-6.2**: Future cards with cleanup choices (e.g., Cellar discard):
- **Behavior**: System detects interactive cleanup choices and pauses
- **Detection**: Check if `getValidMoves()` during cleanup returns > 1 option
- **Display**: Show available moves and wait for user input
- **Example**: "Cellar: Choose cards to discard" → pause for input

**EC-6.3**: Verbose/debug mode:
- **Behavior**: Show detailed cleanup steps even when auto-skipping
- **Display**: Include step-by-step breakdown: "Discarded: Village, Copper | Drew: Estate, Copper, Copper, Silver, Estate"
- **Use Case**: Useful for debugging or learning game mechanics

**EC-6.4**: `--manual-cleanup` flag specified:
- **Behavior**: Cleanup behaves like current implementation (manual trigger required)
- **Display**: Show standard "Available Moves: [1] End Phase" prompt
- **Use Case**: Players who want full control or want to review board state before cleanup

**EC-6.5**: No cards in play during cleanup:
- **Behavior**: Still auto-execute cleanup (discard hand, draw 5)
- **Display**: "✓ Cleanup: Discarded 5 cards, drew 5 new cards"

### Acceptance Criteria

**AC-6.1**: Given I complete the buy phase with no cleanup choices required
When cleanup phase begins
Then cleanup executes automatically without user input
And I see a cleanup summary message
And the game advances to the next turn

**AC-6.2**: Given cleanup executes automatically
When the summary is displayed
Then I see the number of cards discarded
And I see the number of cards drawn
And the format matches "✓ Cleanup: Discarded N cards, drew 5 new cards"

**AC-6.3**: Given I complete a turn in a standard game
When cleanup auto-executes
Then the next turn begins immediately (< 100ms)
And I see the next turn's action phase without additional input

**AC-6.4**: Given I start a game with `--manual-cleanup` flag
When cleanup phase begins
Then the game pauses and shows available moves
And I must manually enter a command to proceed
And cleanup does NOT auto-execute

**AC-6.5**: Given a future card requires cleanup decisions (placeholder test)
When cleanup phase begins with interactive choices
Then the game pauses and shows available moves
And auto-skip does NOT activate
And I can make cleanup decisions manually

### Priority

**Should-Have** - Significantly improves UX by eliminating tedious manual input, but not critical for MVP functionality.

### Implementation Notes

**Detection Logic**:
```typescript
function shouldAutoSkipCleanup(gameState: GameState): boolean {
  // Don't auto-skip if manual mode enabled
  if (cliOptions.manualCleanup) {
    return false;
  }

  // Check if cleanup has any interactive choices
  const validMoves = engine.getValidMoves(gameState);

  // If only move is 'end_phase', auto-skip
  return validMoves.length === 1 && validMoves[0].type === 'end_phase';
}
```

**Summary Generation**:
```typescript
function generateCleanupSummary(gameState: GameState): string {
  const player = gameState.players[gameState.currentPlayer];
  const cardsDiscarded = player.inPlay.length + player.hand.length;
  const cardsDrawn = 5;

  // Basic format
  return `✓ Cleanup: Discarded ${cardsDiscarded} cards, drew ${cardsDrawn} new cards`;

  // Detailed format (optional)
  const discardedCards = [...player.inPlay, ...player.hand].join(', ');
  return `✓ Cleanup: Discarded ${cardsDiscarded} cards (${discardedCards}), drew ${cardsDrawn} new cards`;
}
```

**CLI Integration**:
- Modify CLI game loop to detect cleanup phase
- Check `shouldAutoSkipCleanup()` when entering cleanup
- If true, execute cleanup automatically and display summary
- If false, show available moves as current behavior

**Testing Considerations**:
- Test auto-skip in single-player games
- Test manual cleanup flag disables auto-skip
- Test summary message displays correctly
- Test performance (< 100ms auto-advance)
- Future-proof test for cards with cleanup choices (can be placeholder)

### Estimated Effort

**Implementation**: 2 hours
- Modify CLI game loop: 1 hour
- Add cleanup summary generation: 0.5 hour
- Add `--manual-cleanup` flag handling: 0.5 hour

**Testing**: 1 hour
- Write unit tests for auto-skip detection: 0.5 hour
- Write integration tests for cleanup flow: 0.5 hour

**Total**: 3 hours

---

## Feature Interactions

### Auto-Play Treasures + Chained Submission

**Scenario**: User chains moves that transition to buy phase

**Example**:
```
> 1, 2, end
✓ Played Village
✓ Played Smithy
✓ Ended Action Phase

Auto-playing treasures: Copper (+$1), Copper (+$1), Silver (+$2)
Total: $4

=== Buy Phase ===
Available Moves:
  [1] Buy Silver
  [2] Buy Estate
  [3] End Phase
```

**Behavior**: Auto-play treasures happens automatically between chained moves if phase transition occurs.

**Requirement**: Auto-play MUST execute before displaying next available moves.

---

### Auto-Play Treasures + Stable Numbering

**Scenario**: Treasures auto-play in buy phase with stable numbers enabled

**Behavior**: Since treasures auto-play, stable numbers 11-13 (Copper/Silver/Gold) rarely appear in move lists during buy phase.

**Impact**: Minimal interaction. If auto-play is disabled or partial, stable numbers still work correctly.

---

### Stable Numbering + Chained Submission

**Scenario**: User chains moves using stable numbers

**Example** (with stable numbers enabled):
```
> S7, S6, S50
✓ Played Village (stable #7)
✓ Played Smithy (stable #6)
✓ Ended Phase (stable #50)
```

**Behavior**: Chain parser MUST accept stable number format (e.g., `S7` or just `7` if in stable mode).

**Requirement**: If Option C (Hybrid) is selected, chain parser accepts both sequential and stable numbers in same chain.

---

### All Features Combined

**Scenario**: Quick game with stable numbers, auto-play treasures, and chained moves

**Example**:
```bash
npm run play -- --quick-game --stable-numbers
```

**Turn 1**:
```
=== Action Phase ===
Available Moves:
  [7] Play Village
  [50] End Phase

> 7, 50
✓ Played Village
✓ Ended Action Phase

Auto-playing treasures: Copper (+$1), Copper (+$1), Copper (+$1)
Total: $3

Available Moves:
  [31] Buy Silver
  [25] Buy Estate
  [50] End Phase

> 31
✓ Bought Silver
```

**Expected Behavior**:
- Quick game: 8-card piles
- Stable numbers: Village always [7], Buy Silver always [31]
- Auto-play: All treasures played automatically on phase transition
- Chained: `7, 50` executes both moves sequentially

**Integration Requirements**:
- All features work independently
- No conflicts when all enabled
- Performance remains acceptable (< 100ms per turn)

---

## Implementation Priority

### Phase 1.5a - Immediate Value (Week 1)

**Priority**: Must-Have

1. **Feature 1: Auto-Play All Treasures** (Command-based)
   - Highest usability impact
   - Simplest to implement
   - Benefits all users immediately
   - **Estimated Effort**: 4 hours

2. **Feature 5: Victory Points Display**
   - Missing from Phase 1, essential game feature
   - Clear strategic information
   - **Estimated Effort**: 5 hours

### Phase 1.5b - AI Readiness (Week 2)

**Priority**: Should-Have

3. **Feature 2: Stable Card Numbers** (Simple stable-only display)
   - Critical for Phase 2 MCP integration
   - Provides AI usability
   - Requires stable mapping documentation
   - **Estimated Effort**: 6 hours

4. **Feature 3: Multi-Card Chained Submission**
   - Significant speed improvement
   - More complex parsing logic
   - Requires robust error handling with rollback
   - **Estimated Effort**: 8 hours

5. **Feature 6: Auto-Skip Cleanup Phase**
   - Eliminates tedious manual input
   - Improves turn flow
   - Simple implementation
   - **Estimated Effort**: 3 hours

### Phase 1.5c - Testing Enhancement (Week 3)

**Priority**: Could-Have

6. **Feature 4: Reduced Supply Piles** (Flag-based)
   - Useful for testing
   - Simple implementation (config change)
   - Low risk
   - **Estimated Effort**: 2 hours

### Total Estimated Effort

**28 hours total** (2 sprints)

---

## Design Decisions (All Resolved)

All open questions have been resolved with user input:

### Decision 1: Auto-Play Treasures (RESOLVED)
**Decision**: Command-based approach
- User must type `treasures`, `t`, `play all`, or `all` to play all treasures
- NOT automatic - maintains player control
- Players can still play treasures individually if desired

### Decision 2: Stable Numbering Display (RESOLVED)
**Decision**: Simple stable-only display
- Show only stable numbers: `[7] Play Village`, `[6] Play Smithy`
- No hybrid display with sequential numbers
- Cleaner, simpler UI
- Enabled via `--stable-numbers` flag (opt-in)

### Decision 3: "Principalities" Clarification (RESOLVED)
**Decision**: User confirmed "Provinces" (not "principalities")
- Reduce Estates, Duchies, and Provinces to 8 cards
- Villages are kingdom cards and stay at 10 cards
- All other kingdom cards stay at 10
- Treasures unchanged (60 Copper, 40 Silver, 30 Gold)

### Decision 4: Chain Error Handling (RESOLVED)
**Decision**: Full rollback (transaction behavior)
- If ANY move in chain fails, rollback ALL moves
- Return to exact state before chain started
- Display detailed error message explaining:
  - Which move failed
  - Why it failed
  - That all moves were rolled back
  - Game state is unchanged

### Decision 5: Victory Points Display (NEW FEATURE)
**Decision**: Add VP display to CLI (was missing from Phase 1)
- Show VP in game status header at all times
- Display format: "Victory Points: 5 VP (2 Estates, 1 Duchy)"
- Or compact: "VP: 5"
- Must-have priority (basic game feature)

---

## Acceptance Criteria Summary

### Feature 1: Auto-Play Treasures

- [ ] AC-1.1: Auto-plays all treasures in buy phase with summary
- [ ] AC-1.2: Handles zero treasures gracefully
- [ ] AC-1.3: Only plays treasures, not victory cards

### Feature 2: Stable Card Numbers

- [ ] AC-2.1: Village always has stable number [7] across all turns
- [ ] AC-2.2: Non-consecutive numbers displayed correctly
- [ ] AC-2.3: Multiple copies of same card handled correctly
- [ ] AC-2.4: Help command shows stable number reference

### Feature 3: Chained Submission

- [ ] AC-3.1: Comma-separated chain executes in order
- [ ] AC-3.2: Space-separated chain executes in order
- [ ] AC-3.3: Failed move stops chain with clear error
- [ ] AC-3.4: Mixed move/command chains rejected
- [ ] AC-3.5: Buy chains work with sufficient resources

### Feature 4: Reduced Piles

- [ ] AC-4.1: `--quick-game` reduces victory piles to 8
- [ ] AC-4.2: Treasure piles remain unchanged
- [ ] AC-4.3: Game end conditions work identically
- [ ] AC-4.4: Flag documented in help
- [ ] AC-4.5: Invalid pile sizes rejected with error

### Feature 5: Victory Points Display

- [ ] AC-5.1: VP displayed in game header at all times
- [ ] AC-5.2: VP calculated correctly from entire deck
- [ ] AC-5.3: VP updates after buying/gaining victory cards
- [ ] AC-5.4: VP breakdown shows card counts (e.g., "5 VP (3E, 1D)")
- [ ] AC-5.5: VP shown in `hand` and `status` commands

### Feature 6: Auto-Skip Cleanup Phase

- [ ] AC-6.1: Cleanup executes automatically when no choices available
- [ ] AC-6.2: Cleanup summary displays cards discarded and drawn
- [ ] AC-6.3: Game advances to next turn immediately (< 100ms)
- [ ] AC-6.4: `--manual-cleanup` flag disables auto-skip
- [ ] AC-6.5: Future cards with cleanup choices pause correctly (placeholder)

### Integration Testing

- [ ] All features work independently
- [ ] All features work together without conflicts
- [ ] Performance remains < 100ms per turn with all features enabled
- [ ] Error messages remain clear with all features enabled
- [ ] VP display updates correctly when chaining buy moves
- [ ] Cleanup auto-skip works seamlessly with chained moves

---

## Configuration Options Summary

### Command-Line Flags

```bash
npm run play -- [options]

Options:
  --seed=<string>         Game seed for deterministic randomness
  --players=<number>      Number of players (default: 1)
  --quick-game            Reduce pile sizes to 8 for faster games
  --stable-numbers        Enable stable card numbering for AI agents
  --manual-cleanup        Disable auto-skip of cleanup phase
  --help                  Show help message
```

### In-Game Commands

```
Commands:
  <number>           Execute numbered move
  <n1>, <n2>, ...    Execute chain of moves
  treasures / t      Play all treasures at once
  play all / all     Alternative to 'treasures'
  help               Show help
  help stable        Show stable number reference (if enabled)
  hand               Show current hand (includes VP)
  status             Show player status (includes VP)
  supply             Show supply piles
  quit / exit        Exit game
```

---

## Next Steps

### For User Review

1. **Confirm Feature Priorities**: Are these the right features for Phase 1.5?
2. **Clarify "Principalities"**: Confirm Provinces are intended
3. **Choose Implementation Options**: Prefer Option A/B/C for each feature?
4. **Review Acceptance Criteria**: Are these testable and complete?

### For Dev-Agent

1. Implement Feature 1 (Auto-Play Treasures) first
2. Update `Parser` class to handle chains
3. Update `Display` class for stable numbering
4. Add command-line argument parsing
5. Write integration tests

### For Test-Architect

1. Create test suite for each feature
2. Write integration tests for feature interactions
3. Add performance tests for chained moves
4. Create regression tests for existing CLI functionality

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-10-05 | Requirements Architect | Initial draft with 4 features and open questions |
| 2.0.0 | 2025-10-05 | Requirements Architect | All questions resolved, Feature 5 (VP display) added, ready for implementation |
| 2.1.0 | 2025-10-19 | Requirements Architect | Feature 6 (Auto-skip cleanup) added, total effort now 28 hours |

---

## References

- [CLAUDE.md](/Users/eddelord/Documents/Projects/principality_ai/CLAUDE.md) - Project conventions
- [API_REFERENCE.md](/Users/eddelord/Documents/Projects/principality_ai/API_REFERENCE.md) - Game engine API
- [principality-ai-technical-specs.md](/Users/eddelord/Documents/Projects/principality_ai/principality-ai-technical-specs.md) - Architecture
- Current CLI Implementation: `/packages/cli/src/`
