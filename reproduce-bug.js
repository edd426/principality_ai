/**
 * Reproduction script for Issue #1: Multi-card chain duplicate purchases bug
 *
 * This script attempts to reproduce the bug where a player with 1 buy
 * can purchase the same card twice in a chain.
 */

const { GameEngine } = require('./packages/core/dist/game.js');
const { Parser } = require('./packages/cli/dist/parser.js');

console.log('=== Bug Reproduction: Issue #1 ===\n');

// Initialize engine and game
const engine = new GameEngine('bug-test-seed', { victoryPileSize: 4 });
let state = engine.initializeGame(1);

// Manually set up the game state for reproduction
// Player should be in buy phase with 1 buy and enough coins
console.log('Setting up game state...');
console.log('- Phase: buy');
console.log('- Buys: 1');
console.log('- Coins: $7 (enough to buy Market)\n');

// Manually construct the state to match the bug scenario
state = {
  ...state,
  phase: 'buy',
  players: [
    {
      ...state.players[0],
      buys: 1,
      coins: 7,  // Enough to buy Market ($5)
      actions: 0,
      hand: [],  // Clear hand for simplicity
      inPlay: []
    }
  ]
};

console.log(`Current phase: ${state.phase}`);
console.log(`Current buys: ${state.players[0].buys}`);
console.log(`Current coins: $${state.players[0].coins}\n`);

// Get valid moves
const validMoves = engine.getValidMoves(state);
console.log('Valid moves:');
validMoves.forEach((move, index) => {
  console.log(`  ${index + 1}. ${move.type === 'buy' ? `Buy ${move.card}` : move.type}`);
});
console.log('');

// Find Silver buy option (should be one of the moves, costs $3)
const silverBuyIndex = validMoves.findIndex(m => m.type === 'buy' && m.card === 'Silver');
if (silverBuyIndex === -1) {
  console.log('ERROR: Silver buy option not found in valid moves');
  process.exit(1);
}

console.log(`Silver buy is at index ${silverBuyIndex + 1}\n`);

// Simulate user entering the same move number twice (e.g., "6, 6")
const chainInput = `${silverBuyIndex + 1}, ${silverBuyIndex + 1}`;
console.log(`User input: "${chainInput}" (Buy Silver twice)`);
console.log('Expected: Chain fails at move 2 (no buys remaining), all moves rolled back');
console.log('Actual behavior:\n');

// Execute the chain manually (simulating CLI's executeChain)
const savedState = JSON.parse(JSON.stringify(state));
const chain = chainInput.split(',').map(s => parseInt(s.trim(), 10));

console.log(`Chain parsed as: [${chain.join(', ')}]`);
console.log(`Executing chain...`);

let currentState = state;
let moveCount = 0;
let error = null;

for (let i = 0; i < chain.length; i++) {
  const moveNum = chain[i];
  const move = validMoves[moveNum - 1];

  console.log(`\n  Move ${i + 1}: ${move.type} ${move.card || ''}`);
  console.log(`    Buys before: ${currentState.players[0].buys}`);
  console.log(`    Coins before: $${currentState.players[0].coins}`);

  const result = engine.executeMove(currentState, move);

  if (!result.success) {
    error = result.error;
    console.log(`    ✗ FAILED: ${result.error}`);
    break;
  } else {
    currentState = result.newState;
    moveCount++;
    console.log(`    ✓ SUCCESS`);
    console.log(`    Buys after: ${currentState.players[0].buys}`);
    console.log(`    Coins after: $${currentState.players[0].coins}`);
  }
}

console.log(`\n=== Results ===`);
console.log(`Moves executed: ${moveCount}/${chain.length}`);

if (error) {
  console.log(`Error at move ${moveCount + 1}: ${error}`);
  console.log('✓ BUG NOT REPRODUCED - Chain correctly failed');
  console.log('\nConclusion: The engine properly validates buys.');
  console.log('The bug may be in a different scenario or already fixed.');
} else {
  console.log('✗ BUG REPRODUCED - All moves executed despite insufficient buys!');
  console.log(`Final buys: ${currentState.players[0].buys}`);
  console.log(`Final coins: $${currentState.players[0].coins}`);
  console.log('\nConclusion: Multi-card chain allows duplicate purchases.');
}
