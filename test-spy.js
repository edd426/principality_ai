const { GameEngine } = require('./packages/core/src/game');

const engine = new GameEngine('test-seed');
const state = engine.initializeGame(2);

const testState = {
  ...state,
  phase: 'action',
  currentPlayer: 0,
  players: [
    {
      ...state.players[0],
      hand: ['Spy'],
      drawPile: ['Copper', 'Estate'],
      actions: 1
    },
    {
      ...state.players[1],
      drawPile: ['Gold', 'Silver']
    }
  ]
};

console.log('Playing Spy...');
const spyResult = engine.executeMove(testState, {
  type: 'play_action',
  card: 'Spy'
});

console.log('Spy result:', spyResult.success);
if (!spyResult.success) {
  console.log('Error:', spyResult.error);
  process.exit(1);
}

console.log('\nPlayer 0 deck top card:', spyResult.newState.players[0].drawPile[0]);
console.log('Player 1 deck top card:', spyResult.newState.players[1].drawPile[0]);

console.log('\nMaking spy_decision for player 0 (discard Copper)...');
const decision1 = engine.executeMove(spyResult.newState, {
  type: 'spy_decision',
  playerIndex: 0,
  card: 'Copper',
  choice: false
});

console.log('Decision1 result:', decision1.success);
if (!decision1.success) {
  console.log('Error:', decision1.error);
}
