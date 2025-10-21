import { Move } from '@principality/core';
import { getMoveFromNumber, isValidStableNumber } from './stable-numbers';

/**
 * Result of parsing user input
 */
export interface ParseResult {
  type: 'move' | 'command' | 'invalid' | 'chain';
  move?: Move;
  command?: string;
  parameter?: string;
  error?: string;
  chain?: number[];
}

/**
 * Parser options
 */
export interface ParserOptions {
  stableNumbers?: boolean;
}

/**
 * Parses user input and converts it to moves or commands
 */
export class Parser {
  /**
   * Parse user input into a command or move selection
   */
  parseInput(input: string, availableMoves: Move[], options?: ParserOptions): ParseResult {
    // Handle null/undefined input
    if (input === null || input === undefined || typeof input !== 'string') {
      return { type: 'invalid', error: 'Empty input' };
    }

    const trimmed = input.trim();
    const trimmedLower = trimmed.toLowerCase();

    if (!trimmed) {
      return { type: 'invalid', error: 'Empty input' };
    }

    // Check for commands with parameters first (e.g., "help village", "h copper")
    // Match against original case-preserved input to preserve parameter case
    const commandPattern = /^(help|h)\s+(.+)$/i;
    const match = trimmed.match(commandPattern);
    if (match) {
      return {
        type: 'command',
        command: this.normalizeCommand(match[1]),
        parameter: match[2].trim()
      };
    }

    // Check for special commands (exact matches without parameters)
    if (this.isCommand(trimmedLower)) {
      return { type: 'command', command: this.normalizeCommand(trimmedLower) };
    }

    // Check for chained input (comma or space separated)
    if (this.isChainedInput(trimmedLower)) {
      const chain = this.parseChain(trimmedLower);
      if (chain.success) {
        return { type: 'chain', chain: chain.numbers };
      } else {
        return { type: 'invalid', error: chain.error };
      }
    }

    // Check if input is a number (move selection)
    const parsedNumber = this.parseNumber(trimmedLower);
    if (parsedNumber !== null) {
      // Handle stable numbering if enabled
      if (options?.stableNumbers) {
        const moveIndex = this.findMoveByStableNumber(parsedNumber, availableMoves);
        if (moveIndex !== -1) {
          return {
            type: 'move',
            move: availableMoves[moveIndex]
          };
        } else {
          return {
            type: 'invalid',
            error: `Invalid stable number: ${trimmedLower} not available in current moves`
          };
        }
      }

      // Standard sequential numbering
      if (parsedNumber >= 1 && parsedNumber <= availableMoves.length) {
        return {
          type: 'move',
          move: availableMoves[parsedNumber - 1]
        };
      } else {
        return {
          type: 'invalid',
          error: `Invalid move number. Please select 1-${availableMoves.length}`
        };
      }
    }

    // Check if input looks like a number but is invalid (negative, decimal, etc.)
    if (/^-?\d+\.?\d*$/.test(trimmedLower) || /^\d+\.?\d*$/.test(trimmedLower)) {
      return {
        type: 'invalid',
        error: `Invalid move number. Please select 1-${availableMoves.length}`
      };
    }

    return {
      type: 'invalid',
      error: 'Invalid input. Enter a number, "help", "hand", "supply", or "quit"'
    };
  }

  /**
   * Check if input contains chain separators
   */
  private isChainedInput(input: string): boolean {
    return input.includes(',') || /\d\s+\d/.test(input);
  }

  /**
   * Parse chained input into array of numbers
   */
  private parseChain(input: string): { success: boolean; numbers?: number[]; error?: string } {
    // Split by comma or space
    const parts = input.split(/[,\s]+/).filter(p => p.length > 0);

    const numbers: number[] = [];
    for (const part of parts) {
      const num = this.parseNumber(part);
      if (num === null) {
        return {
          success: false,
          error: `Invalid chain: '${part}' is not a valid move number`
        };
      }
      numbers.push(num);
    }

    if (numbers.length === 0) {
      return { success: false, error: 'Empty chain' };
    }

    return { success: true, numbers };
  }

  /**
   * Find move index by stable number
   */
  private findMoveByStableNumber(stableNum: number, availableMoves: Move[]): number {
    if (!isValidStableNumber(stableNum)) {
      return -1;
    }

    const moveDescription = getMoveFromNumber(stableNum);
    if (!moveDescription) {
      return -1;
    }

    // Match move description to available moves
    for (let i = 0; i < availableMoves.length; i++) {
      const move = availableMoves[i];
      const desc = this.describeMoveForMatching(move);
      if (desc === moveDescription) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Create move description for matching against stable numbers
   */
  private describeMoveForMatching(move: Move): string {
    switch (move.type) {
      case 'play_action':
        return move.card || '';
      case 'play_treasure':
        return move.card || '';
      case 'buy':
        return `Buy ${move.card}`;
      case 'end_phase':
        return 'End Phase';
      default:
        return '';
    }
  }

  /**
   * Check if input is a command
   */
  private isCommand(input: string): boolean {
    const commands = ['help', 'quit', 'exit', 'hand', 'supply', 'h', 'q', 'treasures', 't', 'play all', 'all', 'status'];
    return commands.includes(input);
  }

  /**
   * Parse a string to a number, return null if invalid
   * Only accepts pure numeric strings (no trailing characters)
   * Rejects negative numbers
   */
  private parseNumber(input: string): number | null {
    // Check if string is purely numeric (no negatives, no decimals, no trailing chars)
    if (!/^\d+$/.test(input)) {
      return null;
    }
    const num = parseInt(input, 10);
    if (isNaN(num) || num < 0) {
      return null;
    }
    return num;
  }

  /**
   * Normalize command aliases
   */
  normalizeCommand(command: string): string {
    const normalized = command.toLowerCase();
    switch (normalized) {
      case 'h':
        return 'help';
      case 'q':
      case 'exit':
        return 'quit';
      case 't':
      case 'play all':
      case 'all':
        return 'treasures';
      default:
        return normalized;
    }
  }
}
