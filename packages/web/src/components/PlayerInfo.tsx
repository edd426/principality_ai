import type { ClientPlayerState, Phase } from '../types';
import Card from './Card';

interface PlayerInfoProps {
  player: ClientPlayerState;
  phase: Phase;
  turnNumber: number;
  isYourTurn: boolean;
}

function PhaseLabel({ phase }: { phase: Phase }) {
  const labels: Record<Phase, { text: string; color: string }> = {
    action: { text: 'Action Phase', color: 'text-green-400' },
    buy: { text: 'Buy Phase', color: 'text-yellow-400' },
    cleanup: { text: 'Cleanup Phase', color: 'text-gray-400' },
  };

  const { text, color } = labels[phase];
  return <span className={color}>{text}</span>;
}

export default function PlayerInfo({
  player,
  phase,
  turnNumber,
  isYourTurn,
}: PlayerInfoProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <h3 className="font-medium">Turn {turnNumber}</h3>
          <PhaseLabel phase={phase} />
        </div>
        {isYourTurn ? (
          <span className="text-green-400 text-sm font-medium">Your Turn</span>
        ) : (
          <span className="text-yellow-400 text-sm font-medium">AI's Turn...</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{player.actions}</div>
          <div className="text-xs text-gray-400">Actions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{player.buys}</div>
          <div className="text-xs text-gray-400">Buys</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">${player.coins}</div>
          <div className="text-xs text-gray-400">Coins</div>
        </div>
      </div>

      <div className="flex gap-4 text-sm text-gray-400">
        <div>Draw: {player.drawPileCount}</div>
        <div>Discard: {player.discardPile.length}</div>
      </div>

      {/* Cards in play */}
      {player.inPlay.length > 0 && (
        <div className="mt-4">
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
