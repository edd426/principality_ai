import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame } from '../api/client';
import type { AIModel } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const [aiModel, setAiModel] = useState<AIModel>('haiku');
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartGame = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await createGame({
        aiModel,
        seed: seed || undefined,
      });
      navigate(`/game/${response.gameId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-400 mb-2">Principality</h1>
          <p className="text-gray-400">A Dominion-inspired deck-building game</p>
        </div>

        {/* Game creation form */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              AI Opponent
            </label>
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value as AIModel)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="haiku">Haiku (Fast)</option>
              <option value="sonnet">Sonnet (Balanced)</option>
              <option value="opus">Opus (Strategic)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose the AI difficulty and response speed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Seed (Optional)
            </label>
            <input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Enter a seed for reproducible games"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use the same seed to replay identical shuffles
            </p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleStartGame}
            disabled={loading}
            className="w-full btn-primary py-3 text-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Creating Game...
              </span>
            ) : (
              'Start Game'
            )}
          </button>
        </div>

        {/* Quick rules */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="font-medium text-gray-300 mb-3">Quick Rules</h2>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>
              <strong className="text-gray-300">Goal:</strong> Accumulate the most victory points
            </li>
            <li>
              <strong className="text-gray-300">Phases:</strong> Action → Buy → Cleanup
            </li>
            <li>
              <strong className="text-gray-300">Actions:</strong> Play action cards to get more actions, cards, or coins
            </li>
            <li>
              <strong className="text-gray-300">Buy:</strong> Use coins to buy cards from the supply
            </li>
            <li>
              <strong className="text-gray-300">Victory:</strong> Estate (1), Duchy (3), Province (6)
            </li>
            <li>
              <strong className="text-gray-300">Game End:</strong> When Province pile or 3 piles empty
            </li>
          </ul>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="font-medium text-gray-300 mb-3">Controls</h2>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Click highlighted cards to play them</li>
            <li>• Click supply piles to buy cards</li>
            <li>• Use "Play All Treasures" in buy phase</li>
            <li>• Click "End Turn" when done</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
