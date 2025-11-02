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
      hand: ['Thief'],
      actions: 1
    },
    {
      ...state.players[1],
      drawPile: ['Silver', 'Copper', 'Estate']
    }
  ]
};

console.log('Playing Thief...');
const thiefResult = engine.executeMove(testState, {
  type: 'play_action',
  card: 'Thief'
});

console.log('Thief result:', thiefResult.success);
if (!thiefResult.success) {
  console.log('Error:', thiefResult.error);
}

console.log('\nAttempting to trash Silver...');
const trashResult = engine.executeMove(thiefResult.newState, {
  type: 'select_treasure_to_trash',
  card: 'Silver'
});

console.log('Trash result:', trashResult.success);
if (!trashResult.success) {
  console.log('Error:', trashResult.error);
} else {
  console.log('Trash contains:', trashResult.newState.trash);
  console.log('Opponent discard:', trashResult.newState.players[1].discardPile);
}
