import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useGame } from '../hooks/useGame';
import GameBoard from '../components/GameBoard';

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { game, loading, error, executeMove } = useGame(gameId!);

  // Navigate to game over screen when game ends
  useEffect(() => {
    if (game?.isGameOver) {
      navigate(`/game-over/${gameId}`, { state: { game } });
    }
  }, [game?.isGameOver, gameId, navigate, game]);

  // Handle missing gameId
  if (!gameId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Invalid Game</h1>
          <p className="text-gray-400 mb-6">No game ID provided</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Game not found
  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Game Not Found</h1>
          <p className="text-gray-400 mb-6">The game may have ended or doesn't exist</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 mb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-400">Principality</h1>
        <button
          onClick={() => navigate('/')}
          className="btn-secondary text-sm"
        >
          Quit Game
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 mb-4">
          <div className="bg-red-900/50 border border-red-500 rounded p-3 text-red-300 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Game board */}
      <GameBoard
        game={game}
        onExecuteMove={executeMove}
        loading={loading}
      />
    </div>
  );
}
