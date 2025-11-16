# Contributing to Principality AI

**Status**: ACTIVE
**Created**: 2025-11-16
**Last-Updated**: 2025-11-16
**Owner**: dev-team
**Phase**: 4

Thank you for contributing to Principality AI! This document provides guidelines for contributing to the project.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Adding New Cards](#adding-new-cards)
4. [Code Style](#code-style)
5. [Testing](#testing)
6. [Pull Requests](#pull-requests)

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/principality_ai.git`
3. Install dependencies: `npm install`
4. Build packages: `npm run build`
5. Run tests: `npm run test`

See [DEVELOPMENT_GUIDE.md](./docs/reference/DEVELOPMENT_GUIDE.md) for detailed setup instructions.

## Development Workflow

This project follows **Test-Driven Development (TDD)**:

1. **Requirements** → Define what needs to be built
2. **Tests** → Write tests first (they should fail)
3. **Implementation** → Write code to pass tests
4. **Refactor** → Improve code while keeping tests green

See [CLAUDE.md](./CLAUDE.md) for full TDD workflow details.

## Adding New Cards

### Card Database Structure

All cards are defined in `packages/core/src/cards.ts` with metadata in `packages/core/src/types.ts`.

### Card Interface

```typescript
export interface Card {
  // Core gameplay properties
  name: CardName;
  type: CardType;
  cost: number;
  effect: CardEffect;
  description: string;
  victoryPoints?: number;  // Optional: For victory cards and Curse

  // Metadata for card database management
  expansion: Expansion;     // Required: Which expansion the card belongs to
  edition?: Edition;        // Optional: '1E' or '2E' if different from expansion default
  releaseYear: number;      // Required: Year the card was first released
  officialText: string;     // Required: Exact text from physical card
  rulings?: string[];       // Optional: Official clarifications from rulebook/FAQ
  errata?: string[];        // Optional: Corrections or updates to card text
}
```

### Adding a New Card: Step-by-Step

#### 1. Verify Card Details

Before adding a card, verify the official information from authoritative sources:

- **Physical Card**: If you have the physical card, use it as the primary source
- **Dominion Strategy Wiki**: https://wiki.dominionstrategy.com (Community gold standard)
- **Official Rulebook**: From Rio Grande Games or your expansion box

#### 2. Determine Card Properties

Gather the following information:

- **Name**: Exact card name (e.g., "Village", "Throne Room")
- **Type**: `treasure`, `victory`, `action`, `curse`, `action-attack`, `action-reaction`
- **Cost**: Coin cost to buy (0-8+ typically)
- **Effect**: Immediate benefits (cards, actions, buys, coins) and special effects
- **Description**: Player-friendly description (for CLI display)
- **Victory Points**: Only for victory cards and Curse (can be 0 for dynamic VP like Gardens)
- **Expansion**: Which Dominion set (Base, Intrigue, Seaside, etc.)
- **Edition**: Only specify if card has edition-specific changes ('1E' or '2E')
- **Release Year**: When the expansion was first published
- **Official Text**: Exact wording from the physical card
- **Rulings**: Any official clarifications (optional)
- **Errata**: Any corrections to the card (optional)

#### 3. Add Card to cards.ts

**Example: Adding a simple card (Village)**

```typescript
// In KINGDOM_CARDS object
'Village': {
  name: 'Village',
  type: 'action',
  cost: 3,
  effect: { cards: 1, actions: 2 },
  description: '+1 Card, +2 Actions',
  expansion: 'Base',
  releaseYear: 2008,
  officialText: '+1 Card, +2 Actions'
},
```

**Example: Adding a complex card with special effect**

```typescript
'Chapel': {
  name: 'Chapel',
  type: 'action',
  cost: 2,
  effect: { special: 'trash_up_to_4' },
  description: 'Trash up to 4 cards from your hand',
  expansion: 'Base',
  releaseYear: 2008,
  officialText: 'Trash up to 4 cards from your hand.'
},
```

**Example: Adding a 1st Edition only card**

```typescript
'Woodcutter': {
  name: 'Woodcutter',
  type: 'action',
  cost: 3,
  effect: { coins: 2, buys: 1 },
  description: '+1 Buy, +2 Coins',
  expansion: 'Base',
  edition: '1E',
  releaseYear: 2008,
  officialText: '+1 Buy, +$2',
  rulings: ['Removed in 2nd Edition (2016), replaced by Merchant']
},
```

**Example: Adding a card with rulings**

```typescript
'Throne Room': {
  name: 'Throne Room',
  type: 'action',
  cost: 4,
  effect: { special: 'play_action_twice' },
  description: 'You may play an Action card from your hand twice.',
  expansion: 'Base',
  releaseYear: 2008,
  officialText: 'You may play an Action card from your hand twice.',
  rulings: [
    'If the played card gives +Actions, you get them twice',
    'If the card trashes itself (like Feast), you cannot play it twice'
  ]
},
```

#### 4. Update CardName Type (if needed)

If adding a card from a new expansion, you may need to update the `CardName` type in `types.ts`:

```typescript
export type CardName = string;  // Currently flexible
```

For stricter type safety (future enhancement):

```typescript
export type CardName =
  | 'Copper' | 'Silver' | 'Gold'
  | 'Village' | 'Smithy' | 'Laboratory'
  // ... add new cards here
  ;
```

#### 5. Implement Special Effects (if needed)

If your card has a `special` effect, you need to implement the logic in `packages/core/src/game.ts`:

1. Add a handler in the `executeMove` function
2. Add any necessary pending effect handling
3. Add move types in `types.ts` if needed

See existing cards like Chapel, Cellar, or Throne Room for examples.

#### 6. Write Tests

Following TDD principles, write tests **before** implementing special card logic:

```typescript
// In packages/core/tests/cards/your-card.test.ts
describe('Your Card Name', () => {
  it('should provide immediate benefits', () => {
    // Test +Cards, +Actions, +Buys, +Coins
  });

  it('should handle special effect', () => {
    // Test card-specific logic
  });

  it('should handle edge cases', () => {
    // Test empty deck, no valid targets, etc.
  });
});
```

See `packages/core/tests/` for existing card tests.

#### 7. Verify Card in All Contexts

Test your card works in:

- **Solo gameplay**: `npm run play` (CLI)
- **Multiplayer**: 2-player games
- **MCP interface**: Through MCP server
- **Unit tests**: `npm run test`
- **E2E tests**: Full game scenarios

### Card Data Quality Checklist

Before submitting a card addition:

- [ ] All required fields populated (name, type, cost, effect, expansion, releaseYear, officialText)
- [ ] Official text matches physical card exactly (including punctuation)
- [ ] Edition specified if different from expansion default
- [ ] Rulings added if card has special interactions or clarifications
- [ ] Special effect implemented if card has `special` in effect
- [ ] Tests written and passing
- [ ] Card works in CLI gameplay
- [ ] Card documented in expansion's FEATURES.md (if applicable)

### Card Validation

The project uses a single source of truth for card data:

- **Primary Source**: `packages/core/src/cards.ts`
- **Validation** (future): Automated script checks against Dominion Strategy Wiki
- **Review**: All card additions reviewed by maintainers

### Common Mistakes to Avoid

1. **Inconsistent officialText**: Must match physical card exactly
   - ❌ `"+1 card, +2 actions"` (lowercase)
   - ✅ `"+1 Card, +2 Actions"` (matches official)

2. **Missing expansion**: All cards must specify expansion
   - ❌ No expansion field
   - ✅ `expansion: 'Base'`

3. **Wrong edition**: Only specify edition if it differs
   - ❌ `edition: '2E'` on a card that's in both editions unchanged
   - ✅ `edition: '1E'` on Woodcutter (removed in 2E)

4. **Incomplete special effects**: If effect has `special`, must implement logic
   - ❌ `effect: { special: 'my_new_effect' }` with no implementation
   - ✅ Implement handler in `game.ts` + tests

5. **Copy-paste errors**: Ensure name matches everywhere
   - ❌ File says 'Village' but object key is 'Vilage'
   - ✅ Consistent naming

## Code Style

- **Language**: TypeScript (strict mode)
- **Formatting**: Prettier (run `npm run format`)
- **Linting**: ESLint (run `npm run lint`)
- **Immutability**: Use readonly arrays and objects where possible
- **Functional**: Prefer pure functions, avoid mutations

## Testing

- **Philosophy**: Test-Driven Development (TDD)
- **Coverage**: Target 95%+ code coverage
- **Framework**: Jest for unit/integration, Playwright for E2E
- **Run tests**: `npm run test`
- **Coverage report**: `npm run test -- --coverage`

See [DEVELOPMENT_GUIDE.md](./docs/reference/DEVELOPMENT_GUIDE.md#testing) for testing guidelines.

## Pull Requests

1. **Create feature branch**: `git checkout -b feature/your-feature-name`
2. **Follow TDD**: Write tests first, then implementation
3. **Keep commits focused**: One logical change per commit
4. **Write clear commit messages**:
   ```
   Add Village card to Base set

   - Add card definition with metadata
   - Implement +1 Card, +2 Actions effect
   - Add unit tests for card behavior
   ```
5. **Pass all tests**: Ensure `npm run test` passes
6. **Update documentation**: Add/update relevant docs
7. **Create PR**: Against `main` branch with clear description

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Checklist
- [ ] Tests pass locally
- [ ] Code follows project style
- [ ] Documentation updated
- [ ] No breaking changes (or documented if unavoidable)

## Related Issues
Closes #123
```

## Questions?

- **Documentation**: See [docs/](./docs/) directory
- **Issues**: https://github.com/edd426/principality_ai/issues
- **Discussions**: GitHub Discussions (if enabled)

Thank you for contributing! 🎉
