import Card from './Card';
import type { ValidMove } from '../types';

interface SupplyProps {
  supply: Record<string, number>;
  kingdomCards: string[];
  validMoves: ValidMove[];
  onBuyCard: (cardName: string) => void;
  coins: number;
  buys: number;
  disabled?: boolean;
}

const BASIC_TREASURES = ['Copper', 'Silver', 'Gold'];
const BASIC_VICTORY = ['Estate', 'Duchy', 'Province'];
const BASIC_OTHER = ['Curse'];

/**
 * Check if a card can be bought
 */
function canBuyCard(cardName: string, validMoves: ValidMove[]): boolean {
  return validMoves.some((vm) => {
    const move = vm.move as { type: string; card?: string };
    return move.type === 'buy' && move.card === cardName;
  });
}

interface SupplySectionProps {
  title: string;
  cards: string[];
  supply: Record<string, number>;
  validMoves: ValidMove[];
  onBuyCard: (cardName: string) => void;
  disabled: boolean;
}

function SupplySection({
  title,
  cards,
  supply,
  validMoves,
  onBuyCard,
  disabled,
}: SupplySectionProps) {
  return (
    <div>
      <h4 className="text-xs font-medium text-gray-500 mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {cards.map((card) => {
          const count = supply[card] ?? 0;
          const canBuy = canBuyCard(card, validMoves) && !disabled;
          return (
            <Card
              key={card}
              name={card}
              count={count}
              onClick={canBuy ? () => onBuyCard(card) : undefined}
              disabled={disabled || count === 0 || !canBuy}
              highlight={canBuy}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function Supply({
  supply,
  kingdomCards,
  validMoves,
  onBuyCard,
  coins,
  buys,
  disabled = false,
}: SupplyProps) {
  const isDisabled = disabled || buys === 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-400">Supply</h3>
        <div className="text-sm text-gray-400">
          <span className="text-yellow-400">${coins}</span>
          {' | '}
          <span className="text-blue-400">{buys} buys</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Treasures */}
        <SupplySection
          title="Treasures"
          cards={BASIC_TREASURES}
          supply={supply}
          validMoves={validMoves}
          onBuyCard={onBuyCard}
          disabled={isDisabled}
        />

        {/* Victory Cards */}
        <SupplySection
          title="Victory"
          cards={BASIC_VICTORY}
          supply={supply}
          validMoves={validMoves}
          onBuyCard={onBuyCard}
          disabled={isDisabled}
        />

        {/* Curse */}
        <SupplySection
          title="Other"
          cards={BASIC_OTHER.filter(c => supply[c] !== undefined)}
          supply={supply}
          validMoves={validMoves}
          onBuyCard={onBuyCard}
          disabled={isDisabled}
        />

        {/* Kingdom Cards */}
        <SupplySection
          title="Kingdom Cards"
          cards={kingdomCards}
          supply={supply}
          validMoves={validMoves}
          onBuyCard={onBuyCard}
          disabled={isDisabled}
        />
      </div>
    </div>
  );
}
