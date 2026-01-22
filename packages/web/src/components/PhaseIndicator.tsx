import type { Phase, ValidMove } from '../types';

interface PhaseIndicatorProps {
  phase: Phase;
  validMoves: ValidMove[];
  onPlayAllTreasures: () => void;
  onEndPhase: () => void;
  disabled?: boolean;
}

/**
 * Check if "play all treasures" is a valid move
 */
function canPlayAllTreasures(validMoves: ValidMove[]): boolean {
  return validMoves.some((vm) => {
    const move = vm.move as { type: string };
    return move.type === 'play_all_treasures';
  });
}

/**
 * Check if "end phase" is a valid move
 */
function canEndPhase(validMoves: ValidMove[]): boolean {
  return validMoves.some((vm) => {
    const move = vm.move as { type: string };
    return move.type === 'end_phase';
  });
}

export default function PhaseIndicator({
  phase,
  validMoves,
  onPlayAllTreasures,
  onEndPhase,
  disabled = false,
}: PhaseIndicatorProps) {
  const showPlayAllTreasures = canPlayAllTreasures(validMoves) && !disabled;
  const showEndPhase = canEndPhase(validMoves) && !disabled;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center gap-4">
        <div className="text-sm text-gray-400">
          {phase === 'action' && 'Play action cards or end your action phase'}
          {phase === 'buy' && 'Play treasures and buy cards'}
          {phase === 'cleanup' && 'Cleaning up...'}
        </div>

        <div className="flex gap-2">
          {showPlayAllTreasures && (
            <button
              onClick={onPlayAllTreasures}
              className="btn-secondary text-sm"
            >
              Play All Treasures
            </button>
          )}
          {showEndPhase && (
            <button
              onClick={onEndPhase}
              className="btn-primary text-sm"
            >
              End {phase === 'action' ? 'Actions' : 'Turn'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
