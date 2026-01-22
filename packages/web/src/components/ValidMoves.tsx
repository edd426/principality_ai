import type { ValidMove, ClientPendingEffect } from '../types';

interface ValidMovesProps {
  validMoves: ValidMove[];
  pendingEffect?: ClientPendingEffect;
  onSelectMove: (move: string) => void;
  disabled?: boolean;
}

/**
 * Format a move object to a string command
 */
function formatMoveCommand(move: object): string {
  const m = move as { type: string; card?: string; cards?: string[]; choice?: boolean };

  switch (m.type) {
    case 'play_action':
    case 'play_treasure':
      return `play ${m.card}`;
    case 'play_all_treasures':
      return 'play_treasure all';
    case 'buy':
      return `buy ${m.card}`;
    case 'end_phase':
      return 'end';
    case 'trash_cards':
      return m.cards?.length ? `trash ${m.cards.join(' ')}` : 'trash none';
    case 'gain_card':
      return `gain ${m.card}`;
    case 'discard_for_cellar':
      return m.cards?.length ? `discard ${m.cards.join(' ')}` : 'discard none';
    case 'discard_to_hand_size':
      return m.cards?.length ? `discard ${m.cards.join(' ')}` : 'discard none';
    case 'reveal_reaction':
      return m.card ? `reveal ${m.card}` : 'no reveal';
    case 'chancellor_decision':
      return m.choice ? 'yes' : 'no';
    default:
      return JSON.stringify(move);
  }
}

export default function ValidMoves({
  validMoves,
  pendingEffect,
  onSelectMove,
  disabled = false,
}: ValidMovesProps) {
  // Show pending effect options if any
  if (pendingEffect && pendingEffect.respondingPlayer === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-400 mb-3">
          {pendingEffect.card}: {pendingEffect.effect}
        </h3>
        <div className="flex flex-wrap gap-2">
          {validMoves.map((vm, index) => (
            <button
              key={index}
              onClick={() => onSelectMove(formatMoveCommand(vm.move))}
              disabled={disabled}
              className="btn-secondary text-sm"
            >
              {vm.description}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Don't show if no valid moves or minimal moves
  if (validMoves.length <= 1) {
    return null;
  }

  // Filter to show only non-obvious moves (skip individual treasures, show grouped options)
  const interestingMoves = validMoves.filter((vm) => {
    const m = vm.move as { type: string };
    // Skip individual treasure plays (we have "play all treasures" button)
    if (m.type === 'play_treasure') return false;
    // Skip play_all_treasures and end_phase (shown in PhaseIndicator)
    if (m.type === 'play_all_treasures' || m.type === 'end_phase') return false;
    return true;
  });

  if (interestingMoves.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-3">Available Moves</h3>
      <div className="flex flex-wrap gap-2">
        {interestingMoves.slice(0, 10).map((vm, index) => (
          <button
            key={index}
            onClick={() => onSelectMove(formatMoveCommand(vm.move))}
            disabled={disabled}
            className="btn-secondary text-sm"
          >
            {vm.description}
          </button>
        ))}
        {interestingMoves.length > 10 && (
          <span className="text-gray-500 text-sm self-center">
            +{interestingMoves.length - 10} more
          </span>
        )}
      </div>
    </div>
  );
}
