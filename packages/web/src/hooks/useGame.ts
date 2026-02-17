import { useState, useCallback, useEffect, useRef } from 'react';
import type { GetGameResponse } from '../types';
import { getGame, executeMove as apiExecuteMove } from '../api/client';

interface UseGameResult {
  game: GetGameResponse | null;
  loading: boolean;
  error: string | null;
  executeMove: (move: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing game state and executing moves
 */
export function useGame(gameId: string): UseGameResult {
  const [game, setGame] = useState<GetGameResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track if the component is mounted to prevent state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Polling interval ref for AI turns
  const pollingRef = useRef<number | null>(null);

  /**
   * Fetch current game state
   */
  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getGame(gameId);
      if (mountedRef.current) {
        setGame(data);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Failed to load game');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [gameId]);

  /**
   * Execute a move and update state
   */
  const executeMove = useCallback(async (move: string) => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiExecuteMove(gameId, move);

      if (!mountedRef.current) return;

      if (result.success && result.gameState) {
        setGame((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            gameState: result.gameState!,
            validMoves: result.validMoves ?? [],
            isGameOver: result.isGameOver ?? false,
            winner: result.winner,
            scores: result.scores,
          };
        });
      } else if (result.error) {
        setError(result.error);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Failed to execute move');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [gameId]);

  /**
   * Poll for updates when it's AI's turn
   */
  useEffect(() => {
    if (!game) return;

    // If it's AI's turn (currentPlayer === 1) and game is not over, poll for updates
    if (game.gameState.currentPlayer === 1 && !game.isGameOver) {
      pollingRef.current = window.setInterval(() => {
        refresh();
      }, 1000);
    } else {
      // Clear polling when it's player's turn
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [game?.gameState.currentPlayer, game?.isGameOver, refresh]);

  /**
   * Initial fetch
   */
  useEffect(() => {
    refresh();
  }, [refresh]);

  return { game, loading, error, executeMove, refresh };
}
