/**
 * Comprehensive test suite for Parser class
 * Validates input parsing, command recognition, and move validation
 */

import { Parser, ParseResult } from '../src/parser';
import { Move } from '@principality/core';
import { MockMoveGenerator, PerformanceHelper } from './utils/test-utils';
import { ChainedSubmissionTestUtils, AutoPlayTreasuresTestUtils } from './utils/phase1-5-utils';

describe('Parser', () => {
  let parser: Parser;
  let sampleMoves: Move[];

  beforeEach(() => {
    parser = new Parser();
    sampleMoves = MockMoveGenerator.mixedMoves();
  });

  describe('parseInput', () => {
    describe('valid inputs', () => {
      test('should parse valid move numbers', () => {
        const result = parser.parseInput('1', sampleMoves);

        expect(result.type).toBe('move');
        expect(result.move).toEqual(sampleMoves[0]);
        expect(result.error).toBeUndefined();
      });

      test('should parse move numbers at boundaries', () => {
        // Test first move
        const firstResult = parser.parseInput('1', sampleMoves);
        expect(firstResult.type).toBe('move');
        expect(firstResult.move).toEqual(sampleMoves[0]);

        // Test last move
        const lastResult = parser.parseInput(sampleMoves.length.toString(), sampleMoves);
        expect(lastResult.type).toBe('move');
        expect(lastResult.move).toEqual(sampleMoves[sampleMoves.length - 1]);
      });

      test('should handle leading/trailing whitespace', () => {
        const result = parser.parseInput('  2  ', sampleMoves);

        expect(result.type).toBe('move');
        expect(result.move).toEqual(sampleMoves[1]);
      });

      test('should parse all basic commands', () => {
        const commands = [
          { input: 'help', expected: 'help' },
          { input: 'quit', expected: 'quit' },
          { input: 'exit', expected: 'quit' }, // exit is normalized to quit
          { input: 'hand', expected: 'hand' },
          { input: 'supply', expected: 'supply' },
          { input: 'h', expected: 'help' },
          { input: 'q', expected: 'quit' }
        ];

        commands.forEach(({ input, expected }) => {
          const result = parser.parseInput(input, sampleMoves);
          expect(result.type).toBe('command');
          expect(result.command).toBe(expected);
          expect(result.error).toBeUndefined();
        });
      });

      test('should handle mixed case commands', () => {
        const mixedCaseCommands = ['HELP', 'Help', 'hElP', 'QUIT', 'Supply'];

        mixedCaseCommands.forEach(command => {
          const result = parser.parseInput(command, sampleMoves);
          expect(result.type).toBe('command');
          expect(result.command).toBe(command.toLowerCase());
        });
      });
    });

    describe('invalid inputs', () => {
      test('should reject empty input', () => {
        const result = parser.parseInput('', sampleMoves);

        expect(result.type).toBe('invalid');
        expect(result.error).toBe('Empty input');
        expect(result.move).toBeUndefined();
        expect(result.command).toBeUndefined();
      });

      test('should reject whitespace-only input', () => {
        const result = parser.parseInput('   ', sampleMoves);

        expect(result.type).toBe('invalid');
        expect(result.error).toBe('Empty input');
      });

      test('should reject move numbers out of range', () => {
        // Test zero
        const zeroResult = parser.parseInput('0', sampleMoves);
        expect(zeroResult.type).toBe('invalid');
        expect(zeroResult.error).toContain('Invalid move number');

        // Test too high
        const highResult = parser.parseInput((sampleMoves.length + 1).toString(), sampleMoves);
        expect(highResult.type).toBe('invalid');
        expect(highResult.error).toContain('Invalid move number');
        expect(highResult.error).toContain(`1-${sampleMoves.length}`);
      });

      test('should reject negative numbers', () => {
        const result = parser.parseInput('-1', sampleMoves);

        expect(result.type).toBe('invalid');
        expect(result.error).toContain('Invalid move number');
      });

      test('should reject non-numeric, non-command input', () => {
        const invalidInputs = ['abc', '1a', 'play', 'unknown'];

        invalidInputs.forEach(input => {
          const result = parser.parseInput(input, sampleMoves);
          expect(result.type).toBe('invalid');
          expect(result.error).toContain('Invalid input');
        });
      });

      test('should provide helpful error message for invalid input', () => {
        const result = parser.parseInput('invalid', sampleMoves);

        expect(result.type).toBe('invalid');
        expect(result.error).toContain('Invalid input');
        expect(result.error).toContain('Enter a number');
        expect(result.error).toContain('help');
        expect(result.error).toContain('quit');
      });
    });

    describe('edge cases', () => {
      test('should handle empty move list', () => {
        const result = parser.parseInput('1', []);

        expect(result.type).toBe('invalid');
        expect(result.error).toContain('Invalid move number');
        expect(result.error).toContain('1-0');
      });

      test('should handle very large numbers', () => {
        const result = parser.parseInput('999999', sampleMoves);

        expect(result.type).toBe('invalid');
        expect(result.error).toContain('Invalid move number');
      });

      test('should handle floating point numbers', () => {
        const result = parser.parseInput('1.5', sampleMoves);

        // Stricter validation: '1.5' is not a pure integer, so it's invalid
        expect(result.type).toBe('invalid');
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('normalizeCommand', () => {
    test('should normalize help aliases', () => {
      expect(parser.normalizeCommand('h')).toBe('help');
      expect(parser.normalizeCommand('H')).toBe('help');
      expect(parser.normalizeCommand('help')).toBe('help');
      expect(parser.normalizeCommand('HELP')).toBe('help');
    });

    test('should normalize quit aliases', () => {
      expect(parser.normalizeCommand('q')).toBe('quit');
      expect(parser.normalizeCommand('Q')).toBe('quit');
      expect(parser.normalizeCommand('quit')).toBe('quit');
      expect(parser.normalizeCommand('exit')).toBe('quit');
      expect(parser.normalizeCommand('EXIT')).toBe('quit');
    });

    test('should pass through unknown commands unchanged', () => {
      expect(parser.normalizeCommand('unknown')).toBe('unknown');
      expect(parser.normalizeCommand('UNKNOWN')).toBe('unknown');
    });

    test('should handle other known commands', () => {
      expect(parser.normalizeCommand('hand')).toBe('hand');
      expect(parser.normalizeCommand('supply')).toBe('supply');
      expect(parser.normalizeCommand('SUPPLY')).toBe('supply');
    });
  });

  describe('command recognition', () => {
    test('should identify all valid commands', () => {
      const validCommands = ['help', 'quit', 'exit', 'hand', 'supply', 'h', 'q'];

      validCommands.forEach(command => {
        const result = parser.parseInput(command, sampleMoves);
        expect(result.type).toBe('command');
      });
    });

    test('should not confuse commands with numbers', () => {
      // Commands that might look like numbers
      const result1 = parser.parseInput('h1', sampleMoves);
      expect(result1.type).toBe('invalid');

      const result2 = parser.parseInput('1h', sampleMoves);
      // Stricter validation: '1h' is not a pure integer, so it's invalid
      expect(result2.type).toBe('invalid');
      expect(result2.error).toBeDefined();
    });
  });

  describe('performance', () => {
    test('should parse input quickly', async () => {
      const largeMove = '1';
      const largeMoveList = Array(1000).fill(0).map((_, i) => ({
        type: 'play_action' as const,
        card: `Card${i}`
      }));

      await PerformanceHelper.assertWithinTime(
        () => parser.parseInput(largeMove, largeMoveList),
        10, // < 10ms
        'input parsing'
      );
    });

    test('should handle many commands quickly', async () => {
      const commands = ['help', 'quit', 'hand', 'supply'];

      await PerformanceHelper.assertWithinTime(
        () => {
          commands.forEach(cmd => parser.parseInput(cmd, sampleMoves));
        },
        5, // < 5ms for multiple commands
        'multiple command parsing'
      );
    });
  });

  describe('Phase 1.5 features (implemented)', () => {
    describe('Auto-play treasures commands', () => {
      test('should recognize treasure auto-play commands', () => {
        const treasureCommands = AutoPlayTreasuresTestUtils.getTreasureCommands();

        treasureCommands.forEach(command => {
          const result = parser.parseInput(command, sampleMoves);
          // Phase 1.5: Auto-play treasures is implemented
          // Should recognize as command, not invalid
          expect(result.type).toBe('command');
        });
      });
    });

    describe('Chained submission', () => {
      test('should handle chained input formats', () => {
        const chainInputs = ChainedSubmissionTestUtils.getValidChainFormats();

        chainInputs.forEach(chainInput => {
          const result = parser.parseInput(chainInput, sampleMoves);
          // Phase 1.5: Chained submission is implemented
          // Should recognize as chain, not invalid
          expect(result.type).toBe('chain');
        });
      });

      test('should identify invalid chain formats', () => {
        const invalidChains = ChainedSubmissionTestUtils.getInvalidChainFormats();

        invalidChains.forEach(chainInput => {
          const result = parser.parseInput(chainInput, sampleMoves);
          expect(result.type).toBe('invalid');
          expect(result.error).toBeDefined();
        });
      });
    });
  });

  describe('robustness', () => {
    test('should handle null/undefined gracefully', () => {
      // @ts-expect-error Testing robustness with invalid input
      expect(() => parser.parseInput(null, sampleMoves)).not.toThrow();
      // @ts-expect-error Testing robustness with invalid input
      expect(() => parser.parseInput(undefined, sampleMoves)).not.toThrow();
    });

    test('should handle special characters', () => {
      const specialInputs = ['!@#$', '1!', '🎮', '\n', '\t'];

      specialInputs.forEach(input => {
        const result = parser.parseInput(input, sampleMoves);
        expect(result.type).toBe('invalid');
        expect(result.error).toBeDefined();
      });
    });

    test('should handle very long input', () => {
      const longInput = 'a'.repeat(1000);

      const result = parser.parseInput(longInput, sampleMoves);
      expect(result.type).toBe('invalid');
      expect(result.error).toBeDefined();
    });
  });

  describe('type safety', () => {
    test('should return proper ParseResult types', () => {
      // Move result
      const moveResult = parser.parseInput('1', sampleMoves);
      if (moveResult.type === 'move') {
        expect(moveResult.move).toBeDefined();
        expect(moveResult.command).toBeUndefined();
        expect(moveResult.error).toBeUndefined();
      }

      // Command result
      const commandResult = parser.parseInput('help', sampleMoves);
      if (commandResult.type === 'command') {
        expect(commandResult.command).toBeDefined();
        expect(commandResult.move).toBeUndefined();
        expect(commandResult.error).toBeUndefined();
      }

      // Invalid result
      const invalidResult = parser.parseInput('invalid', sampleMoves);
      if (invalidResult.type === 'invalid') {
        expect(invalidResult.error).toBeDefined();
        expect(invalidResult.move).toBeUndefined();
        expect(invalidResult.command).toBeUndefined();
      }
    });
  });

  describe('integration with move types', () => {
    test('should handle all core move types', () => {
      const actionMoves = MockMoveGenerator.actionMoves();
      const treasureMoves = MockMoveGenerator.treasureMoves();
      const buyMoves = MockMoveGenerator.buyMoves();

      [actionMoves, treasureMoves, buyMoves].forEach(moves => {
        moves.forEach((_, index) => {
          const result = parser.parseInput((index + 1).toString(), moves);
          expect(result.type).toBe('move');
          expect(result.move).toEqual(moves[index]);
        });
      });
    });

    test('should work with empty move arrays', () => {
      const result = parser.parseInput('help', []);
      expect(result.type).toBe('command');
      expect(result.command).toBe('help');
    });
  });
});