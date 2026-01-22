import type { GetGameResponse } from '../types';
import PlayerInfo from './PlayerInfo';
import OpponentInfo from './OpponentInfo';
import Hand from './Hand';
import Supply from './Supply';
import PhaseIndicator from './PhaseIndicator';
import GameLog from './GameLog';
import ValidMoves from './ValidMoves';

interface GameBoardProps {
  game: GetGameResponse;
  onExecuteMove: (move: string) => void;
  loading?: boolean;
}

export default function GameBoard({ game, onExecuteMove, loading = false }: GameBoardProps) {
  const { gameState, validMoves } = game;
  const isYourTurn = gameState.currentPlayer === 0;
  const isDisabled = loading || !isYourTurn;

  // Move handlers
  const handlePlayCard = (index: number, card: string) => {
    if (gameState.phase === 'action') {
      // For actions, we use the card name
      onExecuteMove(`play ${card}`);
    } else if (gameState.phase === 'buy') {
      // For treasures, we use the index
      onExecuteMove(`play ${index}`);
    }
  };

  const handleBuyCard = (cardName: string) => {
    onExecuteMove(`buy ${cardName}`);
  };

  const handlePlayAllTreasures = () => {
    onExecuteMove('play_treasure all');
  };

  const handleEndPhase = () => {
    onExecuteMove('end');
  };

  const handleSelectMove = (move: string) => {
    onExecuteMove(move);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Top row: Turn info and opponent */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlayerInfo
          player={gameState.humanPlayer}
          phase={gameState.phase}
          turnNumber={gameState.turnNumber}
          isYourTurn={isYourTurn}
        />
        <OpponentInfo
          player={gameState.aiPlayer}
          isTheirTurn={!isYourTurn}
        />
      </div>

      {/* Supply */}
      <Supply
        supply={gameState.supply}
        kingdomCards={gameState.kingdomCards}
        validMoves={validMoves}
        onBuyCard={handleBuyCard}
        coins={gameState.humanPlayer.coins}
        buys={gameState.humanPlayer.buys}
        disabled={isDisabled || gameState.phase !== 'buy'}
      />

      {/* Player's hand */}
      <Hand
        cards={gameState.humanPlayer.hand}
        validMoves={validMoves}
        phase={gameState.phase}
        onPlayCard={handlePlayCard}
        disabled={isDisabled}
      />

      {/* Phase controls */}
      <PhaseIndicator
        phase={gameState.phase}
        validMoves={validMoves}
        onPlayAllTreasures={handlePlayAllTreasures}
        onEndPhase={handleEndPhase}
        disabled={isDisabled}
      />

      {/* Pending effects / valid moves */}
      <ValidMoves
        validMoves={validMoves}
        pendingEffect={gameState.pendingEffect}
        onSelectMove={handleSelectMove}
        disabled={isDisabled}
      />

      {/* Game log */}
      <GameLog logs={gameState.gameLog} />

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <div className="text-gray-300">Processing...</div>
          </div>
        </div>
      )}
    </div>
  );
}
