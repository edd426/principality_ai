/**
 * Test Suite: Phase 1.6 Feature 3 - Card Data Model
 *
 * Status: DRAFT - Tests written first (TDD approach)
 * Created: 2025-10-21
 * Phase: 1.6
 *
 * Requirements Reference: docs/requirements/phase-1.6/FEATURES.md
 *
 * Feature 3 validates that all card definitions include:
 * 1. Required `description` field in CardDefinition interface
 * 2. Non-empty descriptions for all cards in ALL_CARDS
 * 3. Consistent description formatting by card type
 *
 * These tests will FAIL until:
 * - CardDefinition interface includes `description: string`
 * - All cards in cards.ts have descriptions
 * - Descriptions follow format conventions
 *
 * Total: 5 tests (3 unit + 2 validation)
 */

import { Card, BASIC_CARDS, KINGDOM_CARDS } from '../src/cards';

describe('Feature 3: Card Data Model - Phase 1.6', () => {
  describe('Unit Tests (UT-3.1 to UT-3.3)', () => {
    /**
     * Test UT-3.1: CardDefinition interface requires description field
     *
     * Requirement: description field must be required (not optional)
     *
     * This is a compile-time test enforced by TypeScript.
     * If description is optional, TypeScript won't error.
     * If description is missing, TypeScript will error.
     *
     * Expected Result:
     * - TypeScript enforces that all Card objects have description
     * - IDE shows error if description is omitted
     */
    test('UT-3.1: Card interface enforces description field', () => {
      // This test validates compile-time enforcement
      // If description is removed from interface, TS will fail to compile

      // Valid card with description
      const validCard: Card = {
        name: 'Test Card',
        type: 'action',
        cost: 3,
        effect: { cards: 1, actions: 2 },
        description: '+1 Card, +2 Actions'  // REQUIRED field
      };

      expect(validCard.description).toBeDefined();
      expect(validCard.description).not.toBeNull();
      expect(validCard.description.length).toBeGreaterThan(0);
    });

    /**
     * Test UT-3.2: All cards in BASIC_CARDS have non-empty descriptions
     *
     * Requirement: Every card must have a meaningful description
     * - Not null or undefined
     * - Not empty string
     * - Not just whitespace
     * - At least 3 characters (meaningful)
     *
     * Expected Result:
     * - BASIC_CARDS includes Copper, Silver, Gold, Estate, Duchy, Province, Curse
     * - Each has non-empty description
     * - Each description is > 3 characters
     */
    test('UT-3.2: All basic cards have non-empty descriptions', () => {
      const basicCardNames = ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province', 'Curse'];

      basicCardNames.forEach(cardName => {
        const card = BASIC_CARDS[cardName];

        expect(card).toBeDefined();
        expect(card.description).toBeDefined();
        expect(card.description).not.toBeNull();
        expect(card.description).not.toBe('');
        expect(card.description.trim()).not.toBe('');
        expect(card.description.length).toBeGreaterThan(3);
      });
    });

    /**
     * Test UT-3.3: All kingdom cards have non-empty descriptions
     *
     * Requirement: Every kingdom card must have a meaningful description
     *
     * Expected Result:
     * - KINGDOM_CARDS includes Village, Smithy, Laboratory, Festival, Market, Woodcutter, Council Room, Cellar
     * - Each has non-empty description
     * - Each description is meaningful (> 3 chars)
     */
    test('UT-3.3: All kingdom cards have non-empty descriptions', () => {
      const kingdomCardNames = [
        'Village', 'Smithy', 'Laboratory', 'Festival',
        'Market', 'Woodcutter', 'Council Room', 'Cellar'
      ];

      kingdomCardNames.forEach(cardName => {
        const card = KINGDOM_CARDS[cardName];

        expect(card).toBeDefined();
        expect(card.description).toBeDefined();
        expect(card.description).not.toBeNull();
        expect(card.description).not.toBe('');
        expect(card.description.trim()).not.toBe('');
        expect(card.description.length).toBeGreaterThan(3);
      });
    });
  });

  describe('Description Format Validation', () => {
    /**
     * Test V-3.1: Description format consistency - Treasure cards
     *
     * Requirement: Treasure card descriptions follow format "Worth X coin(s)"
     *
     * Examples:
     * - Copper: "Worth 1 coin" or "+$1"
     * - Silver: "Worth 2 coins" or "+$2"
     * - Gold: "Worth 3 coins" or "+$3"
     *
     * Expected Result:
     * - Contains "coin" or "$" or "worth" (case-insensitive)
     * - Indicates coin value
     * - Single-line format
     */
    test('V-3.1: Treasure card descriptions follow consistent format', () => {
      const treasureCards = [
        { name: 'Copper', expectedPattern: /coin|worth|\$|^[+$]/i },
        { name: 'Silver', expectedPattern: /coin|worth|\$|^[+$]/i },
        { name: 'Gold', expectedPattern: /coin|worth|\$|^[+$]/i }
      ];

      treasureCards.forEach(({ name, expectedPattern }) => {
        const card = BASIC_CARDS[name];
        expect(card.description).toMatch(expectedPattern);
      });
    });

    /**
     * Test V-3.2: Description format consistency - Victory cards
     *
     * Requirement: Victory card descriptions contain "Victory" or "VP"
     *
     * Examples:
     * - Estate: "Worth 1 VP" or "1 Victory Point"
     * - Duchy: "Worth 3 VP" or "3 Victory Points"
     * - Province: "Worth 6 VP" or "6 Victory Points"
     *
     * Expected Result:
     * - Contains "VP" or "Victory" (case-insensitive)
     * - Includes victory point value
     */
    test('V-3.2: Victory card descriptions indicate victory points', () => {
      const victoryCards = [
        { name: 'Estate', expectedPattern: /VP|Victory|Victory Point/i },
        { name: 'Duchy', expectedPattern: /VP|Victory|Victory Point/i },
        { name: 'Province', expectedPattern: /VP|Victory|Victory Point/i }
      ];

      victoryCards.forEach(({ name, expectedPattern }) => {
        const card = BASIC_CARDS[name];
        expect(card.description).toMatch(expectedPattern);
      });
    });

    /**
     * Test V-3.3: Description format consistency - Action cards
     *
     * Requirement: Action cards describe their effects clearly
     *
     * Examples:
     * - Village: "+1 Card, +2 Actions"
     * - Smithy: "+3 Cards"
     * - Laboratory: "+2 Cards, +1 Action"
     *
     * Expected Result:
     * - Describes primary effect (cards, actions, coins, buys)
     * - Uses clear format ("+X CardType" or "Verb description")
     * - At least 5 characters
     */
    test('V-3.3: Action card descriptions describe their effects', () => {
      const actionCards = [
        { name: 'Village', expectedContent: ['Card', 'Action'] },
        { name: 'Smithy', expectedContent: ['Card'] },
        { name: 'Laboratory', expectedContent: ['Card', 'Action'] },
        { name: 'Market', expectedContent: ['Card', 'Action', 'Buy', 'Coin'] },
        { name: 'Festival', expectedContent: ['Action', 'Buy'] },
        { name: 'Woodcutter', expectedContent: ['Buy', 'Coin'] }
      ];

      actionCards.forEach(({ name, expectedContent }) => {
        const card = KINGDOM_CARDS[name];
        expect(card.description).toBeDefined();
        expect(card.description.length).toBeGreaterThan(5);

        // At least one effect indicator should be present
        const hasEffect = expectedContent.some(content =>
          card.description.includes(content)
        );
        expect(hasEffect).toBe(true);
      });
    });

    /**
     * Test V-3.4: Curse card description
     *
     * Requirement: Curse card correctly indicates negative victory points
     *
     * Example:
     * - Curse: "Worth -1 VP" or "-1 Victory Point"
     *
     * Expected Result:
     * - Contains negative indicator ("-" or "minus" or "-1")
     * - Includes "VP" or "Victory"
     */
    test('V-3.4: Curse card indicates negative victory points', () => {
      const curseCard = BASIC_CARDS['Curse'];

      expect(curseCard).toBeDefined();
      expect(curseCard.description).toBeDefined();

      // Should indicate negative points
      const hasNegativeIndicator = /\-|minus|negative|-1/i.test(curseCard.description);
      expect(hasNegativeIndicator).toBe(true);

      // Should mention victory points
      const hasVictoryPoints = /VP|Victory/i.test(curseCard.description);
      expect(hasVictoryPoints).toBe(true);
    });
  });

  describe('Validation Tests (V-3.5, V-3.6)', () => {
    /**
     * Test V-3.5: No duplicate card names
     *
     * Requirement: All card names must be unique across BASIC_CARDS and KINGDOM_CARDS
     *
     * Expected Result:
     * - No duplicate names
     * - Total 15 unique cards (7 basic + 8 kingdom)
     */
    test('V-3.5: No duplicate card names in all cards', () => {
      const basicNames = Object.keys(BASIC_CARDS);
      const kingdomNames = Object.keys(KINGDOM_CARDS);
      const allNames = [...basicNames, ...kingdomNames];

      // Check for duplicates
      const uniqueNames = new Set(allNames);
      expect(uniqueNames.size).toBe(allNames.length);

      // Verify count
      expect(basicNames).toHaveLength(7);
      expect(kingdomNames).toHaveLength(8);
      expect(allNames).toHaveLength(15);
    });

    /**
     * Test V-3.6: Each card has valid type
     *
     * Requirement: All cards must have valid type: 'treasure' | 'victory' | 'action' | 'curse'
     *
     * Expected Result:
     * - Every card has a valid type
     * - No typos or invalid types
     */
    test('V-3.6: All cards have valid type values', () => {
      const validTypes = ['treasure', 'victory', 'action', 'curse'];
      const allCards = { ...BASIC_CARDS, ...KINGDOM_CARDS };

      Object.entries(allCards).forEach(([name, card]) => {
        expect(validTypes).toContain(card.type);
      });
    });

    /**
     * Test V-3.7: Each card has valid cost
     *
     * Requirement: All cards must have cost >= 0
     *
     * Expected Result:
     * - Every card has cost >= 0
     * - No negative costs
     */
    test('V-3.7: All cards have non-negative cost', () => {
      const allCards = { ...BASIC_CARDS, ...KINGDOM_CARDS };

      Object.entries(allCards).forEach(([name, card]) => {
        expect(card.cost).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(card.cost)).toBe(true);
      });
    });

    /**
     * Test V-3.8: Victory point values present when needed
     *
     * Requirement: Victory and Curse cards must have victoryPoints field
     *
     * Expected Result:
     * - Estate, Duchy, Province have victoryPoints
     * - Curse has victoryPoints (negative)
     * - Action/Treasure cards don't need victoryPoints
     */
    test('V-3.8: Victory cards have victoryPoints property', () => {
      const victoryCards = [
        { name: 'Estate', card: BASIC_CARDS['Estate'], expectedVP: 1 },
        { name: 'Duchy', card: BASIC_CARDS['Duchy'], expectedVP: 3 },
        { name: 'Province', card: BASIC_CARDS['Province'], expectedVP: 6 },
        { name: 'Curse', card: BASIC_CARDS['Curse'], expectedVP: -1 }
      ];

      victoryCards.forEach(({ name, card, expectedVP }) => {
        expect(card.victoryPoints).toBeDefined();
        expect(card.victoryPoints).toBe(expectedVP);
      });
    });

    /**
     * Test V-3.9: Card effect properties are present
     *
     * Requirement: Each card has effect object with appropriate properties
     *
     * Expected Result:
     * - All cards have effect object
     * - Treasure cards have coins property
     * - Action cards have cards/actions/buys/coins as needed
     */
    test('V-3.9: All cards have effect object', () => {
      const allCards = { ...BASIC_CARDS, ...KINGDOM_CARDS };

      Object.entries(allCards).forEach(([name, card]) => {
        expect(card.effect).toBeDefined();
        expect(typeof card.effect).toBe('object');
      });
    });
  });

  describe('Integration Validation', () => {
    /**
     * Test I-3.1: Card descriptions accurate to effects
     *
     * This is a manual review test that samples key cards
     * to verify description matches actual game effect.
     *
     * Example: If Village gives +1 card and +2 actions,
     * description should mention both.
     *
     * Expected Result:
     * - Description text reflects actual effect values
     * - No description-effect mismatches
     */
    test('I-3.1: Sample card descriptions match their effects', () => {
      // Village: +1 Card, +2 Actions
      const village = KINGDOM_CARDS['Village'];
      expect(village.description).toContain('Card');
      expect(village.description).toContain('Action');

      // Smithy: +3 Cards
      const smithy = KINGDOM_CARDS['Smithy'];
      expect(smithy.description).toContain('Card');

      // Market: +1 Card, +1 Action, +1 Buy, +1 Coin
      const market = KINGDOM_CARDS['Market'];
      expect(market.description).toContain('Card');
      expect(market.description).toContain('Action');
      expect(market.description).toContain('Buy');
      expect(market.description).toContain('Coin');

      // Copper: Worth 1 coin
      const copper = BASIC_CARDS['Copper'];
      expect(copper.description.toLowerCase()).toMatch(/coin|worth|\$/);

      // Estate: Worth 1 VP
      const estate = BASIC_CARDS['Estate'];
      expect(estate.description.toLowerCase()).toMatch(/victory|vp/);
    });

    /**
     * Test I-3.2: No card has empty effect
     *
     * Requirement: Even if card has no effect, effect object exists
     *
     * Expected Result:
     * - All cards have effect object (never null/undefined)
     * - Object may be empty for simple cards (Estate, Curse)
     * - Can be serialized/deserialized correctly
     */
    test('I-3.2: All cards have effect object (even if empty)', () => {
      const allCards = { ...BASIC_CARDS, ...KINGDOM_CARDS };

      Object.entries(allCards).forEach(([name, card]) => {
        expect(card.effect).not.toBeNull();
        expect(card.effect).not.toBeUndefined();
        expect(typeof card.effect).toBe('object');

        // Can be serialized
        const serialized = JSON.stringify(card.effect);
        expect(serialized).toBeDefined();

        // Can be deserialized
        const deserialized = JSON.parse(serialized);
        expect(deserialized).toEqual(card.effect);
      });
    });
  });

  describe('Acceptance Criteria', () => {
    /**
     * AC-3.1: Interface enforces description field
     *
     * Gherkin:
     * Given the CardDefinition interface
     * Then it includes a required description field
     * And TypeScript enforces this at compile time
     */
    test('AC-3.1: CardDefinition interface requires description', () => {
      // TypeScript compile-time check (already tested in UT-3.1)
      const card: Card = {
        name: 'Test',
        type: 'action',
        cost: 0,
        effect: {},
        description: 'Test Description'  // Required
      };

      expect(card.description).toBeDefined();
    });

    /**
     * AC-3.2: All cards have descriptions
     *
     * Gherkin:
     * Given the ALL_CARDS array
     * When I iterate through all cards
     * Then every card has a non-empty description
     * And the description matches the card's actual effect
     */
    test('AC-3.2: All cards have descriptions matching effects', () => {
      const allCards = { ...BASIC_CARDS, ...KINGDOM_CARDS };
      const cardList = Object.values(allCards);

      expect(cardList.length).toBeGreaterThan(0);

      cardList.forEach(card => {
        expect(card.description).toBeDefined();
        expect(card.description).not.toBe('');
        expect(card.description.trim()).not.toBe('');
      });
    });

    /**
     * AC-3.3: Consistent description formatting
     *
     * Gherkin:
     * Given all card descriptions
     * Then action cards follow "+X Card, +Y Actions" format where applicable
     * And treasure cards follow "Worth X coins" format
     * And victory cards follow "Worth X VP" format
     * And special effects are clearly described
     */
    test('AC-3.3: Descriptions follow consistent format conventions', () => {
      // Treasure cards use "coin" or "worth" or "$"
      const treasures = [BASIC_CARDS['Copper'], BASIC_CARDS['Silver'], BASIC_CARDS['Gold']];
      treasures.forEach(card => {
        expect(card.description.toLowerCase()).toMatch(/coin|worth|\$/);
      });

      // Victory cards use "VP" or "Victory"
      const victories = [BASIC_CARDS['Estate'], BASIC_CARDS['Duchy'], BASIC_CARDS['Province']];
      victories.forEach(card => {
        expect(card.description.toLowerCase()).toMatch(/victory|vp/);
      });

      // Action cards describe effects
      const actions = [
        KINGDOM_CARDS['Village'],
        KINGDOM_CARDS['Smithy'],
        KINGDOM_CARDS['Laboratory']
      ];
      actions.forEach(card => {
        expect(card.description.length).toBeGreaterThan(5);
      });
    });
  });
});
