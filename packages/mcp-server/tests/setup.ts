/**
 * Test Setup and Configuration
 *
 * Status: DRAFT
 * Created: 2025-10-22
 * Phase: 2
 *
 * Setup file for Phase 2 MCP Server test suite:
 * - Global test configuration
 * - Mock utilities
 * - Test helpers
 * - Environment setup
 */

import { jest } from '@jest/globals';

/**
 * Global Jest Configuration
 */
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  // Optional: Configure logging for tests
  if (process.env.DEBUG_TESTS) {
    console.log('Test suite starting...');
  }
});

afterAll(() => {
  // Cleanup
  jest.clearAllMocks();
});

/**
 * Mock GameEngine for Unit Tests
 */
export function createMockGameEngine() {
  return {
    initializeGame: jest.fn().mockReturnValue({
      phase: 'action',
      turnNumber: 1,
      activePlayer: 0,
      players: [
        {
          id: 0,
          hand: [
            { name: 'Copper', type: 'treasure', cost: 0 },
            { name: 'Copper', type: 'treasure', cost: 0 },
            { name: 'Copper', type: 'treasure', cost: 0 },
            { name: 'Copper', type: 'treasure', cost: 0 },
            { name: 'Copper', type: 'treasure', cost: 0 },
            { name: 'Copper', type: 'treasure', cost: 0 },
            { name: 'Copper', type: 'treasure', cost: 0 },
            { name: 'Estate', type: 'victory', cost: 2, victoryPoints: 1 },
            { name: 'Estate', type: 'victory', cost: 2, victoryPoints: 1 },
            { name: 'Estate', type: 'victory', cost: 2, victoryPoints: 1 },
          ],
          deck: [],
          discard: [],
          victoryPoints: 3,
        },
      ],
      supply: new Map([
        ['Copper', { name: 'Copper', type: 'treasure', cost: 0, remaining: 46 }],
        ['Silver', { name: 'Silver', type: 'treasure', cost: 3, remaining: 40 }],
        ['Gold', { name: 'Gold', type: 'treasure', cost: 6, remaining: 30 }],
        ['Estate', { name: 'Estate', type: 'victory', cost: 2, remaining: 8, victoryPoints: 1 }],
        ['Duchy', { name: 'Duchy', type: 'victory', cost: 5, remaining: 8, victoryPoints: 3 }],
        ['Province', { name: 'Province', type: 'victory', cost: 8, remaining: 8, victoryPoints: 6 }],
        ['Curse', { name: 'Curse', type: 'curse', cost: 0, remaining: 10 }],
        ['Village', { name: 'Village', type: 'action', cost: 3, remaining: 10 }],
        ['Smithy', { name: 'Smithy', type: 'action', cost: 4, remaining: 10 }],
        ['Market', { name: 'Market', type: 'action', cost: 5, remaining: 10 }],
        ['Festival', { name: 'Festival', type: 'action', cost: 5, remaining: 10 }],
        ['Laboratory', { name: 'Laboratory', type: 'action', cost: 5, remaining: 10 }],
        ['Woodcutter', { name: 'Woodcutter', type: 'action', cost: 3, remaining: 10 }],
        ['Council Room', { name: 'Council Room', type: 'action', cost: 5, remaining: 10 }],
        ['Cellar', { name: 'Cellar', type: 'action', cost: 2, remaining: 10 }],
      ]),
      gameOver: false,
      winner: null,
      currentActions: 1,
      currentCoins: 0,
      currentBuys: 1,
    }),

    getCurrentState: jest.fn().mockReturnValue({
      phase: 'action',
      turnNumber: 1,
      activePlayer: 0,
      players: [
        {
          id: 0,
          hand: [
            { name: 'Copper', type: 'treasure', cost: 0 },
            { name: 'Estate', type: 'victory', cost: 2, victoryPoints: 1 },
          ],
          deck: [],
          discard: [],
        },
      ],
      supply: new Map(),
      gameOver: false,
      winner: null,
      currentActions: 1,
      currentCoins: 0,
      currentBuys: 1,
    }),

    executeMove: jest.fn().mockReturnValue({
      success: true,
      gameState: {
        phase: 'action',
        turnNumber: 1,
        activePlayer: 0,
        players: [{ hand: [] }],
        supply: new Map(),
        gameOver: false,
        winner: null,
      },
      message: 'Move executed successfully',
    }),

    validateMove: jest.fn().mockReturnValue({
      valid: true,
      error: null,
    }),

    getValidMoves: jest.fn().mockReturnValue([
      { type: 'end_phase', cardName: null },
    ]),
  };
}

/**
 * Mock MCP Request/Response
 */
export function createMockMCPRequest(toolName: string, args: any = {}) {
  return {
    jsonrpc: '2.0',
    id: Math.floor(Math.random() * 10000),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args,
    },
  };
}

export function createMockMCPResponse(result: any = {}) {
  return {
    jsonrpc: '2.0',
    id: Math.floor(Math.random() * 10000),
    result: {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
        },
      ],
    },
  };
}

/**
 * Helper: Wait for async operations
 */
export function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper: Create game state
 */
export function createGameState(overrides: any = {}) {
  return {
    phase: 'action',
    turnNumber: 1,
    activePlayer: 0,
    players: [
      {
        id: 0,
        hand: [
          { name: 'Copper', type: 'treasure', cost: 0 },
          { name: 'Copper', type: 'treasure', cost: 0 },
        ],
        deck: [],
        discard: [],
        victoryPoints: 0,
      },
    ],
    supply: new Map([
      ['Copper', { name: 'Copper', type: 'treasure', cost: 0, remaining: 46 }],
      ['Silver', { name: 'Silver', type: 'treasure', cost: 3, remaining: 40 }],
      ['Gold', { name: 'Gold', type: 'treasure', cost: 6, remaining: 30 }],
      ['Province', { name: 'Province', type: 'victory', cost: 8, remaining: 8, victoryPoints: 6 }],
    ]),
    gameOver: false,
    winner: null,
    currentActions: 1,
    currentCoins: 0,
    currentBuys: 1,
    ...overrides,
  };
}

/**
 * Helper: Assert valid response structure
 */
export function assertValidToolResponse(response: any) {
  expect(response).toHaveProperty('success');
  expect(typeof response.success).toBe('boolean');

  if (!response.success) {
    expect(response).toHaveProperty('error');
    expect(typeof response.error).toBe('string');
  }
}

/**
 * Test Environment Variables
 */
export const TEST_ENV = {
  // API Keys (skipped if not set)
  hasClaudeAPI: !!process.env.CLAUDE_API_KEY,

  // Performance thresholds
  SLA: {
    gameObserveMinimal: 50,  // ms
    gameObserveStandard: 100, // ms
    gameObserveFull: 150,     // ms
    gameExecute: 50,          // ms
    gameSession: 100,         // ms
  },

  // Token limits
  TOKEN_LIMITS: {
    minimal: 100,
    standard: 300,
    full: 1200,
  },

  // Test timeouts
  TIMEOUT: {
    unit: 5000,
    integration: 10000,
    e2e: 30000,
    evaluation: 60000,
  },
};

/**
 * Console suppression for tests
 */
export function suppressConsole() {
  const origError = console.error;
  const origWarn = console.warn;

  beforeEach(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    console.error = origError;
    console.warn = origWarn;
  });
}

/**
 * Card definitions for mock state creation
 */
export const CARD_DEFINITIONS = {
  // Basic treasures
  Copper: { name: 'Copper', type: 'treasure', cost: 0 },
  Silver: { name: 'Silver', type: 'treasure', cost: 3 },
  Gold: { name: 'Gold', type: 'treasure', cost: 6 },

  // Basic victory
  Estate: { name: 'Estate', type: 'victory', cost: 2, victoryPoints: 1 },
  Duchy: { name: 'Duchy', type: 'victory', cost: 5, victoryPoints: 3 },
  Province: { name: 'Province', type: 'victory', cost: 8, victoryPoints: 6 },

  // Curse
  Curse: { name: 'Curse', type: 'curse', cost: 0 },

  // Kingdom cards
  Village: { name: 'Village', type: 'action', cost: 3 },
  Smithy: { name: 'Smithy', type: 'action', cost: 4 },
  Market: { name: 'Market', type: 'action', cost: 5 },
  Laboratory: { name: 'Laboratory', type: 'action', cost: 5 },
  Festival: { name: 'Festival', type: 'action', cost: 5 },
  Woodcutter: { name: 'Woodcutter', type: 'action', cost: 3 },
  'Council Room': { name: 'Council Room', type: 'action', cost: 5 },
  Cellar: { name: 'Cellar', type: 'action', cost: 2 },
};

/**
 * Export all test utilities
 */
export const testUtils = {
  createMockGameEngine,
  createMockMCPRequest,
  createMockMCPResponse,
  wait,
  createGameState,
  assertValidToolResponse,
  suppressConsole,
};
