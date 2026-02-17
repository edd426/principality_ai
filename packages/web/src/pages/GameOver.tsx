import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getGame } from '../api/client';
import type { GetGameResponse, PlayerScore } from '../types';

export default function GameOver() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Try to get game from navigation state first
  const stateGame = (location.state as { game?: GetGameResponse })?.game;
  const [game, setGame] = useState<GetGameResponse | null>(stateGame ?? null);
  const [loading, setLoading] = useState(!stateGame);
  const [error, setError] = useState<string | null>(null);

  // Fetch game if not passed through navigation state
  useEffect(() => {
    if (game || !gameId) return;

    setLoading(true);
    getGame(gameId)
      .then((data) => {
        setGame(data);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load game');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [game, gameId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-gray-400 mb-6">{error ?? 'Game not found'}</p>
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

  const { winner, scores } = game;
  const playerWon = winner === 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        {/* Winner announcement */}
        <div className="text-center">
          <div className={`text-6xl mb-4 ${playerWon ? '🎉' : '🤖'}`}>
            {playerWon ? '🎉' : '🤖'}
          </div>
          <h1 className={`text-4xl font-bold mb-2 ${playerWon ? 'text-green-400' : 'text-yellow-400'}`}>
            {playerWon ? 'You Win!' : 'AI Wins!'}
          </h1>
          <p className="text-gray-400">
            {playerWon
              ? 'Congratulations on your victory!'
              : 'Better luck next time!'}
          </p>
        </div>

        {/* Score breakdown */}
        {scores && scores.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-300 mb-4 text-center">Final Scores</h2>
            <div className="space-y-4">
              {scores
                .sort((a, b) => b.score - a.score)
                .map((score: PlayerScore) => (
                  <ScoreCard
                    key={score.playerIndex}
                    score={score}
                    isWinner={score.playerIndex === winner}
                    isPlayer={score.playerIndex === 0}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 btn-primary py-3"
          >
            Play Again
          </button>
        </div>

        {/* Game stats */}
        <div className="bg-gray-800 rounded-lg p-4 text-center text-sm text-gray-400">
          <p>Game completed in {game.gameState.turnNumber} turns</p>
        </div>
      </div>
    </div>
  );
}

interface ScoreCardProps {
  score: PlayerScore;
  isWinner: boolean;
  isPlayer: boolean;
}

function ScoreCard({ score, isWinner, isPlayer }: ScoreCardProps) {
  const { breakdown } = score;

  return (
    <div className={`rounded-lg p-4 ${isWinner ? 'bg-green-900/30 border border-green-500' : 'bg-gray-700'}`}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-200">
            {isPlayer ? 'You' : 'AI Opponent'}
          </span>
          {isWinner && (
            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">Winner</span>
          )}
        </div>
        <span className={`text-2xl font-bold ${isWinner ? 'text-green-400' : 'text-gray-300'}`}>
          {score.score} VP
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2 text-xs text-gray-400">
        <div className="text-center">
          <div className="font-medium text-gray-300">{breakdown.estates}</div>
          <div>Estates</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-gray-300">{breakdown.duchies}</div>
          <div>Duchies</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-gray-300">{breakdown.provinces}</div>
          <div>Provinces</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-gray-300">{breakdown.gardens}</div>
          <div>Gardens</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-red-400">{breakdown.curses}</div>
          <div>Curses</div>
        </div>
      </div>
    </div>
  );
}
