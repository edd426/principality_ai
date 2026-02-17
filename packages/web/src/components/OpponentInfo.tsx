import type { OpponentPlayerState } from '../types';
import Card from './Card';

interface OpponentInfoProps {
  player: OpponentPlayerState;
  isTheirTurn: boolean;
}

export default function OpponentInfo({ player, isTheirTurn }: OpponentInfoProps) {
  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${isTheirTurn ? 'ring-2 ring-yellow-400' : ''}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-300">AI Opponent</h3>
        {isTheirTurn && (
          <span className="text-yellow-400 text-sm animate-pulse">Thinking...</span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-3 text-sm">
        <div className="text-center">
          <div className="font-bold text-gray-300">{player.handCount}</div>
          <div className="text-xs text-gray-500">Hand</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-gray-300">{player.drawPileCount}</div>
          <div className="text-xs text-gray-500">Draw</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-gray-300">{player.discardPile.length}</div>
          <div className="text-xs text-gray-500">Discard</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-yellow-400">${player.coins}</div>
          <div className="text-xs text-gray-500">Coins</div>
        </div>
      </div>

      {/* Cards in play */}
      {player.inPlay.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 mb-2">In Play</h4>
          <div className="flex flex-wrap gap-1">
            {player.inPlay.map((card, index) => (
              <Card
                key={`${card}-${index}`}
                name={card}
                showCost={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
