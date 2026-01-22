import { getCardInfo, getCardTypeColor } from '../utils/card-data';

interface CardProps {
  name: string;
  onClick?: () => void;
  disabled?: boolean;
  highlight?: boolean;
  showCost?: boolean;
  count?: number;
}

export default function Card({
  name,
  onClick,
  disabled = false,
  highlight = false,
  showCost = true,
  count,
}: CardProps) {
  const cardInfo = getCardInfo(name);
  const colorClass = getCardTypeColor(cardInfo.type);

  const isClickable = onClick && !disabled;

  return (
    <button
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`
        card-base ${colorClass}
        ${isClickable ? 'card-clickable' : ''}
        ${disabled ? 'card-disabled' : ''}
        ${highlight ? 'card-highlight' : ''}
        ${!onClick ? 'cursor-default' : ''}
      `}
    >
      <div className="font-bold text-sm truncate">{name}</div>
      {showCost && (
        <div className="text-xs mt-1">
          <span className="font-medium">${cardInfo.cost}</span>
        </div>
      )}
      {count !== undefined && (
        <div className="text-xs mt-1 font-medium">
          x{count}
        </div>
      )}
    </button>
  );
}
