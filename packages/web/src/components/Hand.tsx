import Card from './Card';
import type { ValidMove, Phase } from '../types';

interface HandProps {
  cards: string[];
  validMoves: ValidMove[];
  phase: Phase;
  onPlayCard: (index: number, card: string) => void;
  disabled?: boolean;
}

/**
 * Check if a card at given index can be played
 */
function canPlayCard(
  index: number,
  card: string,
  validMoves: ValidMove[],
  phase: Phase
): boolean {
  return validMoves.some((vm) => {
    const move = vm.move as { type: string; card?: string; playerIndex?: number };
    if (phase === 'action') {
      return move.type === 'play_action' && move.card === card;
    } else if (phase === 'buy') {
      return move.type === 'play_treasure' && move.playerIndex === index;
    }
    return false;
  });
}

export default function Hand({
  cards,
  validMoves,
  phase,
  onPlayCard,
  disabled = false,
}: HandProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-3">Your Hand ({cards.length} cards)</h3>
      <div className="flex flex-wrap gap-2 justify-center">
        {cards.length === 0 ? (
          <div className="text-gray-500 italic">No cards in hand</div>
        ) : (
          cards.map((card, index) => {
            const canPlay = canPlayCard(index, card, validMoves, phase);
            return (
              <Card
                key={`${card}-${index}`}
                name={card}
                onClick={canPlay && !disabled ? () => onPlayCard(index, card) : undefined}
                disabled={disabled || !canPlay}
                highlight={canPlay && !disabled}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
