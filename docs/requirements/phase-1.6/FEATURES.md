# Phase 1.6 Features: Card Help Lookup System

**Status**: ✅ COMPLETE
**Created**: 2025-10-20
**Completed**: 2025-10-21
**Phase**: 1.6

---

## Feature Overview

Phase 1.6 implements three tightly-coupled features that together provide comprehensive card reference functionality:

1. **Feature 1**: `help <card>` command - Individual card lookup
2. **Feature 2**: `cards` catalog command - Browse all available cards
3. **Feature 3**: Card help text data model - Foundation for above features

**Total Effort**: 6-8 hours

---

## Feature 1: `help <card>` Command

**Estimated Effort**: 3-4 hours

### Description

Implement a CLI command that displays detailed information about a specific card. Users can type `help Village` or `h Village` to instantly see the cost, type, and effect of the Village card.

### User Stories

**Story 1: Look up action card**
```
As a player during my action phase
When I type "help Village"
Then I see: Village | 3 | Action | +1 Card, +2 Actions
```

**Story 2: Look up treasure card**
```
As a player considering a purchase
When I type "help Silver"
Then I see: Silver | 3 | Treasure | Worth 2 coins
```

**Story 3: Quick lookup with alias**
```
As a player who needs quick information
When I type "h Market"
Then I see the same output as "help Market"
```

**Story 4: Unknown card error**
```
As a player who made a typo
When I type "help Villag"
Then I see: "Unknown card: Villag. Type 'cards' to see all available cards."
```

### Functional Requirements

**FR1.1: Command Syntax**
- **Primary**: `help <card_name>`
- **Alias**: `h <card_name>`
- **Examples**: `help Village`, `h Silver`, `help Copper`

**FR1.2: Card Name Matching**
- Case-insensitive: `help village`, `help VILLAGE`, `help Village` all work
- Exact match required (no partial matching in Phase 1.6)
- Whitespace trimmed: `help  Village  ` works

**FR1.3: Output Format**
```
<CardName> | <Cost> | <Type> | <Effect Description>
```
**Example**:
```
Village | 3 | Action | +1 Card, +2 Actions
```

**FR1.4: Availability**
- Command works during action phase
- Command works during buy phase
- Command works during cleanup phase
- Command works between turns
- Command works at game start (before first turn)

**FR1.5: Card Coverage**
- All 8 kingdom cards: Village, Smithy, Laboratory, Festival, Market, Woodcutter, Council Room, Cellar
- All 7 base cards: Copper, Silver, Gold, Estate, Duchy, Province, Curse
- Total: 15 cards

### Acceptance Criteria

**AC1.1: Successful lookup**
```gherkin
Given the game is running
When I type "help Village"
Then the output shows "Village | 3 | Action | +1 Card, +2 Actions"
And the game state is unchanged
And I can continue playing normally
```

**AC1.2: Case-insensitive matching**
```gherkin
Given the game is running
When I type "help village"
Then the output is identical to "help Village"
```

**AC1.3: Alias works**
```gherkin
Given the game is running
When I type "h Smithy"
Then the output is identical to "help Smithy"
```

**AC1.4: Unknown card error**
```gherkin
Given the game is running
When I type "help FakeCard"
Then the output shows an error message
And the error suggests typing "cards" to see available cards
And the game state is unchanged
```

**AC1.5: Available anytime**
```gherkin
Given the game is in action phase
When I type "help Market"
Then I see Market's details

Given the game is in buy phase
When I type "help Province"
Then I see Province's details

Given the game is between turns
When I type "help Copper"
Then I see Copper's details
```

**AC1.6: Performance**
```gherkin
Given the game is running
When I type "help <any_card>"
Then the response time is < 5ms
```

### Technical Approach

**Implementation Location**: `packages/cli/src/index.ts` (CLI package)

**Data Source**: Import card definitions from `packages/core/src/cards.ts`

**Pseudocode**:
```typescript
function handleHelpCommand(cardName: string): string {
  // 1. Normalize input (lowercase, trim)
  const normalized = cardName.toLowerCase().trim();

  // 2. Look up card in ALL_CARDS array
  const card = ALL_CARDS.find(c => c.name.toLowerCase() === normalized);

  // 3. If not found, return error
  if (!card) {
    return `Unknown card: ${cardName}. Type 'cards' to see all available cards.`;
  }

  // 4. Format and return card info
  return `${card.name} | ${card.cost} | ${card.type} | ${card.description}`;
}
```

**Integration Points**:
- Hook into existing CLI command parser
- Add `help` and `h` to command list
- No game state modifications
- Works in parallel with other commands

### Edge Cases

**EC1.1: Empty input**
```
Input: "help"
Output: "Usage: help <card_name> - Display information about a specific card"
```

**EC1.2: Multiple words (future-proofing)**
```
Input: "help Throne Room"  (if multi-word cards added later)
Output: Works correctly (parse all args after "help")
```

**EC1.3: Numbers or special characters**
```
Input: "help 123"
Output: "Unknown card: 123. Type 'cards' to see all available cards."
```

**EC1.4: Very long input**
```
Input: "help " + "a".repeat(1000)
Output: Error message (handle gracefully, don't crash)
```

### Error Handling

**Error Type 1: Unknown Card**
- **Condition**: Card name not found in definitions
- **Response**: "Unknown card: {input}. Type 'cards' to see all available cards."
- **Action**: No crash, return to prompt

**Error Type 2: Missing Argument**
- **Condition**: User types "help" with no card name
- **Response**: "Usage: help <card_name> - Display information about a specific card"
- **Action**: Show usage, return to prompt

**Error Type 3: Missing Description**
- **Condition**: Card exists but has no description field
- **Response**: "Error: No description available for {card_name}"
- **Action**: Log warning, show partial info

### Dependencies

- **Depends on**: Feature 3 (card descriptions in core package)
- **Depended on by**: None (standalone feature)

### Testing Requirements

See [TESTING.md](./TESTING.md) for detailed test specifications.

**Summary**:
- Unit tests: 8 test cases
- Integration tests: 5 test cases
- Performance tests: 1 test case
- Total: 14 tests for Feature 1

---

## Feature 2: `cards` Catalog Command

**Estimated Effort**: 2-3 hours

### Description

Implement a CLI command that displays a formatted table of all available cards with their cost, type, and effect. This provides a "catalog" view for browsing all cards.

### User Stories

**Story 1: Browse all cards**
```
As a player who wants to see what's available
When I type "cards"
Then I see a formatted table with all 15 cards
```

**Story 2: Quick reference during buy phase**
```
As a player deciding what to buy
When I type "cards"
Then I can quickly scan costs and effects
```

**Story 3: Learn the game**
```
As a new player learning the game
When I type "cards" at game start
Then I see all available cards and their effects
```

### Functional Requirements

**FR2.1: Command Syntax**
- **Primary**: `cards`
- **No aliases** (command is short enough)
- **No arguments** (shows all cards)

**FR2.2: Output Format**
```
=== AVAILABLE CARDS ===

Name          | Cost | Type     | Effect
--------------|------|----------|------------------------------------------
Village       |  3   | Action   | +1 Card, +2 Actions
Smithy        |  4   | Action   | +3 Cards
...
Copper        |  0   | Treasure | Worth 1 coin
...
Estate        |  2   | Victory  | Worth 1 VP
```

**FR2.3: Card Ordering**
- **Primary sort**: Type (Action → Treasure → Victory → Curse)
- **Secondary sort**: Cost (ascending within each type)
- **Tertiary sort**: Name (alphabetical)

**FR2.4: Column Widths**
- **Name**: 14 characters (longest is "Woodcutter" = 10)
- **Cost**: 4 characters (max is 2 digits + padding)
- **Type**: 9 characters (longest is "Treasure" = 8)
- **Effect**: Remaining space (wrapping if needed)

**FR2.5: Availability**
- Same as Feature 1: available anytime during game
- Non-intrusive (doesn't pause or interrupt game)

### Acceptance Criteria

**AC2.1: Display all cards**
```gherkin
Given the game is running
When I type "cards"
Then the output includes all 15 cards (8 kingdom + 7 base)
And each card shows: name, cost, type, effect
And the table is properly formatted with aligned columns
```

**AC2.2: Correct sorting**
```gherkin
Given the game is running
When I type "cards"
Then action cards appear first (sorted by cost)
And treasure cards appear second (sorted by cost)
And victory cards appear third (sorted by cost)
And curse cards appear last
```

**AC2.3: Readable formatting**
```gherkin
Given the game is running
When I type "cards"
Then column headers are clear
And columns are aligned
And there's a separator line between header and data
And long effects don't break the table layout
```

**AC2.4: Available anytime**
```gherkin
Given the game is in any phase
When I type "cards"
Then the catalog is displayed
And the game state is unchanged
```

**AC2.5: Performance**
```gherkin
Given the game is running
When I type "cards"
Then the response time is < 10ms
```

### Technical Approach

**Implementation Location**: `packages/cli/src/index.ts` (CLI package)

**Data Source**: Import card definitions from `packages/core/src/cards.ts`

**Pseudocode**:
```typescript
function handleCardsCommand(): string {
  // 1. Get all cards from core package
  const allCards = [...ALL_CARDS];

  // 2. Sort by type, then cost, then name
  allCards.sort((a, b) => {
    const typeOrder = { Action: 0, Treasure: 1, Victory: 2, Curse: 3 };
    if (typeOrder[a.type] !== typeOrder[b.type]) {
      return typeOrder[a.type] - typeOrder[b.type];
    }
    if (a.cost !== b.cost) {
      return a.cost - b.cost;
    }
    return a.name.localeCompare(b.name);
  });

  // 3. Format as table
  const rows = allCards.map(card => {
    return formatRow(card.name, card.cost, card.type, card.description);
  });

  // 4. Assemble with header
  return [
    "=== AVAILABLE CARDS ===",
    "",
    formatHeader(),
    formatSeparator(),
    ...rows
  ].join("\n");
}

function formatRow(name: string, cost: number, type: string, effect: string): string {
  return `${padRight(name, 14)} | ${padLeft(cost.toString(), 4)} | ${padRight(type, 9)} | ${effect}`;
}
```

**Table Formatting Library**: Consider using a library like `cli-table3` or implement custom padding

### Edge Cases

**EC2.1: Long effect descriptions**
```
Card: Laboratory (effect: "+2 Cards, +1 Action")
Solution: Ensure effect column is wide enough (no wrapping needed for current cards)
```

**EC2.2: Terminal width constraints**
```
Scenario: Terminal width < 80 characters
Solution: Phase 1.6 assumes standard terminal (80+ chars). Document minimum width.
```

**EC2.3: Empty card list (future-proofing)**
```
Scenario: No cards defined (shouldn't happen)
Solution: Show "No cards available" message
```

### Error Handling

**Error Type 1: No Cards Available**
- **Condition**: ALL_CARDS array is empty (shouldn't happen)
- **Response**: "Error: No cards available. This is a bug."
- **Action**: Log error, suggest reporting issue

**Error Type 2: Missing Description**
- **Condition**: One or more cards have no description
- **Response**: Show card with "(No description available)"
- **Action**: Log warning

### Dependencies

- **Depends on**: Feature 3 (card descriptions in core package)
- **Depended on by**: None (standalone feature)

### Testing Requirements

See [TESTING.md](./TESTING.md) for detailed test specifications.

**Summary**:
- Unit tests: 5 test cases
- Integration tests: 3 test cases
- Visual tests: 2 test cases (manual)
- Total: 10 tests for Feature 2

---

## Feature 3: Card Help Text Data Model

**Estimated Effort**: 1 hour

### Description

Ensure all card definitions in the core package have a `description` field with help text. This is the foundation for Features 1 and 2.

### User Stories

**Story 1: Developer adds new card**
```
As a developer adding a new card
When I create a CardDefinition
Then I must include a description field
And the TypeScript compiler enforces this
```

**Story 2: Maintain consistency**
```
As a developer
When I look at card definitions
Then all descriptions follow the same format
And effects are described clearly
```

### Functional Requirements

**FR3.1: Description Field**
- Add `description: string` to `CardDefinition` interface
- Required field (not optional)
- Contains human-readable effect description

**FR3.2: Description Format**
- **Actions**: "+X Cards, +Y Actions" (e.g., "Village: +1 Card, +2 Actions")
- **Treasures**: "Worth X coins" (e.g., "Silver: Worth 2 coins")
- **Victory**: "Worth X VP" (e.g., "Estate: Worth 1 VP")
- **Special effects**: Clear, concise description (e.g., "Remodel: Trash a card, gain card costing up to $2 more")

**FR3.3: All Cards Covered**
- Every card in `ALL_CARDS` array has description
- No null, undefined, or empty string descriptions
- Descriptions are accurate to actual card effects

### Acceptance Criteria

**AC3.1: Interface updated**
```gherkin
Given the CardDefinition interface
Then it includes a required description field
And TypeScript enforces this at compile time
```

**AC3.2: All cards have descriptions**
```gherkin
Given the ALL_CARDS array
When I iterate through all cards
Then every card has a non-empty description
And the description matches the card's actual effect
```

**AC3.3: Consistent formatting**
```gherkin
Given all card descriptions
Then action cards follow "+X Card, +Y Actions" format where applicable
And treasure cards follow "Worth X coins" format
And victory cards follow "Worth X VP" format
And special effects are clearly described
```

### Technical Approach

**Implementation Location**: `packages/core/src/cards.ts` (Core package)

**Interface Update**:
```typescript
export interface CardDefinition {
  name: string;
  cost: number;
  type: CardType;
  description: string;  // ADD THIS FIELD
  effect?: (state: GameState) => GameState;  // Existing field
}
```

**Example Card Definition**:
```typescript
{
  name: "Village",
  cost: 3,
  type: CardType.Action,
  description: "+1 Card, +2 Actions",
  effect: (state) => {
    // ... existing effect implementation
  }
}
```

**Validation**: Add runtime check to ensure no missing descriptions:
```typescript
export const ALL_CARDS = [
  // ... card definitions
];

// Validation (run at module load)
ALL_CARDS.forEach(card => {
  if (!card.description || card.description.trim() === '') {
    throw new Error(`Card ${card.name} is missing description`);
  }
});
```

### Card Descriptions Reference

**Action Cards:**
```typescript
Village:       "+1 Card, +2 Actions"
Smithy:        "+3 Cards"
Laboratory:    "+2 Cards, +1 Action"
Festival:      "+2 Actions, +1 Buy, +2 Coins"
Market:        "+1 Card, +1 Action, +1 Buy, +1 Coin"
Woodcutter:    "+1 Buy, +2 Coins"
Council Room:  "+4 Cards, +1 Buy. Each other player draws 1 card."
Cellar:        "+1 Action. Discard any number of cards, then draw that many."
```

**Treasure Cards:**
```typescript
Copper:  "Worth 1 coin"
Silver:  "Worth 2 coins"
Gold:    "Worth 3 coins"
```

**Victory Cards:**
```typescript
Estate:   "Worth 1 VP"
Duchy:    "Worth 3 VP"
Province: "Worth 6 VP"
```

**Curse Cards:**
```typescript
Curse: "Worth -1 VP"
```

### Edge Cases

**EC3.1: Multi-line descriptions**
```
Decision: Phase 1.6 uses single-line descriptions only
Reason: Simplifies table formatting
Future: Multi-line can be added if needed
```

**EC3.2: Description vs Effect mismatch**
```
Risk: Description says "+3 Cards" but effect gives +2
Solution: Manual review + integration tests that verify effects match descriptions
```

### Error Handling

**Error Type 1: Missing Description**
- **Condition**: Card added without description field
- **Response**: TypeScript compile error
- **Action**: Developer must add description

**Error Type 2: Empty Description**
- **Condition**: Description is "" or whitespace
- **Response**: Runtime error at module load
- **Action**: Throw error with clear message

### Dependencies

- **Depends on**: None (foundation feature)
- **Depended on by**: Feature 1, Feature 2

### Testing Requirements

See [TESTING.md](./TESTING.md) for detailed test specifications.

**Summary**:
- Unit tests: 3 test cases
- Validation tests: 2 test cases
- Total: 5 tests for Feature 3

---

## Inter-Feature Dependencies

```
Feature 3 (Data Model)
    ├─> Feature 1 (help command)
    └─> Feature 2 (cards command)
```

**Implementation Order**:
1. Feature 3 (data model) - MUST be first
2. Feature 1 or 2 (can be done in parallel)

---

## Time Estimates Summary

| Feature | Implementation | Testing | Documentation | Total |
|---------|---------------|---------|---------------|-------|
| Feature 1: `help` | 1.5h | 1.5h | 1h | 3-4h |
| Feature 2: `cards` | 1h | 1h | 0.5h | 2-3h |
| Feature 3: Data model | 0.5h | 0.5h | 0h | 1h |
| **TOTAL** | **3h** | **3h** | **1.5h** | **6-8h** |

**Confidence**: HIGH - These are straightforward features with clear scope

---

## Acceptance Testing Checklist

After implementation, manually verify:

- [ ] `help Village` displays correct information
- [ ] `help village` works (case-insensitive)
- [ ] `h Smithy` works (alias)
- [ ] `help FakeCard` shows helpful error
- [ ] `cards` displays all 15 cards in a table
- [ ] Table is properly formatted and aligned
- [ ] Cards are sorted correctly (Action → Treasure → Victory → Curse)
- [ ] Commands work during action phase
- [ ] Commands work during buy phase
- [ ] Commands work between turns
- [ ] Commands work at game start
- [ ] Commands don't modify game state
- [ ] All tests pass (unit + integration)
- [ ] No performance regressions

---

## Future Enhancements (Out of Scope for Phase 1.6)

These are explicitly NOT included in Phase 1.6 but could be considered for later phases:

**Phase 2 (MCP Integration):**
- JSON output format: `cards --json`
- Structured data for LLM consumption
- Query by properties: "cards with cost <= 3"

**Phase 3+ (Advanced Features):**
- Partial name matching: `help vil` → suggests Village
- Search by effect: "cards that give +Actions"
- Strategic hints: "Village is good for chaining actions"
- Interactive catalog: Arrow keys to browse
- Color coding by card type

---

## Conclusion

Phase 1.6 features are tightly scoped, clearly defined, and have been successfully implemented within the estimated timeframe.

**COMPLETION STATUS**: ✅ ALL FEATURES FULLY IMPLEMENTED

**Implementation Summary**:
- Feature 1 (`help` command): ✅ Complete - fully functional with all test cases passing
- Feature 2 (`cards` command): ✅ Complete - displays formatted table with all 15 cards
- Feature 3 (Card descriptions): ✅ Complete - all cards have descriptions in core package

**Quality Metrics**:
- ✅ 648 total tests passing (42 new tests added)
- ✅ 95%+ code coverage maintained
- ✅ Zero regressions in existing functionality
- ✅ Performance targets met (< 5ms help, < 10ms cards)
- ✅ Full TDD workflow executed (requirements → tests → implementation)

**See Also**: [COMPLETION_REPORT.md](./COMPLETION_REPORT.md) for detailed implementation report.
