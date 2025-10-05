import { Move } from '@principality/core';

/**
 * Result of parsing user input
 */
export interface ParseResult {
  type: 'move' | 'command' | 'invalid';
  move?: Move;
  command?: string;
  error?: string;
}

/**
 * Parses user input and converts it to moves or commands
 */
export class Parser {
  /**
   * Parse user input into a command or move selection
   */
  parseInput(input: string, availableMoves: Move[]): ParseResult {
    const trimmed = input.trim().toLowerCase();

    if (!trimmed) {
      return { type: 'invalid', error: 'Empty input' };
    }

    // Check for special commands
    if (this.isCommand(trimmed)) {
      return { type: 'command', command: trimmed };
    }

    // Check if input is a number (move selection)
    const moveIndex = this.parseNumber(trimmed);
    if (moveIndex !== null) {
      if (moveIndex >= 1 && moveIndex <= availableMoves.length) {
        return {
          type: 'move',
          move: availableMoves[moveIndex - 1]
        };
      } else {
        return {
          type: 'invalid',
          error: `Invalid move number. Please select 1-${availableMoves.length}`
        };
      }
    }

    return {
      type: 'invalid',
      error: 'Invalid input. Enter a number, "help", "hand", "supply", or "quit"'
    };
  }

  /**
   * Check if input is a command
   */
  private isCommand(input: string): boolean {
    const commands = ['help', 'quit', 'exit', 'hand', 'supply', 'h', 'q'];
    return commands.includes(input);
  }

  /**
   * Parse a string to a number, return null if invalid
   */
  private parseNumber(input: string): number | null {
    const num = parseInt(input, 10);
    return isNaN(num) ? null : num;
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
      default:
        return normalized;
    }
  }
}
