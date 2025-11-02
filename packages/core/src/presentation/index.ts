/**
 * Presentation Layer
 *
 * Centralized display/formatting logic for game state, moves, and errors.
 * Used by both CLI and MCP interfaces to ensure consistent presentation.
 *
 * @module presentation
 */

// State Formatters
export {
  groupHand,
  formatHand,
  formatSupply,
  formatValidMoves,
  calculateVictoryPoints,
  isGameOver,
  countEmptyPiles,
  getGameOverReason,
  groupSupplyByType,
  type FormattedCard,
  type GroupedHand,
  type SupplyPile,
  type FormattedMove,
  type DetailLevel
} from './formatters';

// Move Parser
export {
  parseMove,
  isMoveValid,
  getCardCost,
  type ParseMoveResult
} from './move-parser';

// Move Descriptions
export {
  getMoveDescription,
  getMoveDescriptionCompact,
  getMoveCommand,
  getMoveExamples,
  getNextPhaseName
} from './move-descriptions';

// Error Messages
export {
  analyzeRejectionReason,
  generateSuggestion,
  type RejectionReason
} from './error-messages';
