/**
 * Session Logger Module for Turn-Based CLI Mode (Phase 4.x)
 *
 * Provides automatic logging of CLI invocations for audit trails.
 * Log files are derived from state file paths and require no agent configuration.
 *
 * @req: SL-1 - Automatic logging without additional flags
 * @req: SL-2 - Derive log filename from state file
 * @req: SL-3 - Capture both command input and CLI output
 * @req: SL-4 - Human-readable format for debugging
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Log entry types
 */
export type LogEntryType = 'SESSION_START' | 'MOVE_EXECUTION' | 'OUTPUT' | 'ERROR';

/**
 * Session log entry structure
 */
export interface SessionLogEntry {
  timestamp: string;
  type: LogEntryType;
  command?: string;
  move?: string;
  options?: Record<string, unknown>;
  output?: string;
  exitCode?: number;
  success?: boolean;
  error?: string;
}

/**
 * Invocation details for logging a complete CLI call
 */
export interface InvocationDetails {
  type: 'init' | 'move';
  command: string;
  seed?: string;
  move?: string;
  options?: Record<string, unknown>;
  output: string;
  exitCode: number;
  success?: boolean;
  error?: string;
}

/**
 * Derive session log path from state file path
 *
 * @req: SL-2 - Log filename derived from state file
 * @param stateFilePath - Path to the game state file
 * @returns Path to the session log file
 *
 * Examples:
 *   /tmp/game.json -> /tmp/game.session.log
 *   /tmp/test-001.json -> /tmp/test-001.session.log
 */
export function deriveLogPath(stateFilePath: string): string {
  const dir = path.dirname(stateFilePath);
  const base = path.basename(stateFilePath, '.json');
  return path.join(dir, `${base}.session.log`);
}

/**
 * Format a log entry as a string
 *
 * @req: SL-4 - Human-readable format
 */
export function formatLogEntry(entry: SessionLogEntry): string {
  const lines: string[] = [];
  const separator = '='.repeat(80);

  lines.push(separator);
  lines.push(`[${entry.timestamp}] ${entry.type}`);

  if (entry.command) {
    lines.push(`Command: ${entry.command}`);
  }

  if (entry.move) {
    lines.push(`Move: ${entry.move}`);
  }

  if (entry.options) {
    lines.push(`Options: ${JSON.stringify(entry.options)}`);
  }

  lines.push(separator);

  if (entry.output) {
    lines.push('');
    lines.push('---');
    lines.push(entry.output);
    lines.push('---');
    lines.push('');
  }

  if (entry.exitCode !== undefined) {
    lines.push(`Exit Code: ${entry.exitCode}`);
  }

  if (entry.success !== undefined) {
    lines.push(`Success: ${entry.success}`);
  }

  if (entry.error) {
    lines.push(`Error: ${entry.error}`);
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Append an entry to the session log file
 *
 * @req: SL-1 - Automatic logging (creates file if needed)
 * @req: SL-3 - Capture command and output
 * @param logPath - Path to the session log file
 * @param entry - Log entry to append
 */
export async function appendToSessionLog(
  logPath: string,
  entry: SessionLogEntry
): Promise<void> {
  const formattedEntry = formatLogEntry(entry);
  await fs.appendFile(logPath, formattedEntry, 'utf-8');
}

/**
 * Create a session start log entry
 */
export function createSessionStartEntry(
  command: string,
  seed: string,
  options: Record<string, unknown>
): SessionLogEntry {
  return {
    timestamp: new Date().toISOString(),
    type: 'SESSION_START',
    command,
    options: { seed, ...options }
  };
}

/**
 * Create a move execution log entry
 */
export function createMoveEntry(
  command: string,
  move: string
): SessionLogEntry {
  return {
    timestamp: new Date().toISOString(),
    type: 'MOVE_EXECUTION',
    command,
    move
  };
}

/**
 * Create an output log entry
 */
export function createOutputEntry(
  output: string,
  exitCode: number,
  success?: boolean
): SessionLogEntry {
  return {
    timestamp: new Date().toISOString(),
    type: 'OUTPUT',
    output,
    exitCode,
    success
  };
}

/**
 * Create an error log entry
 */
export function createErrorEntry(
  error: string,
  exitCode: number
): SessionLogEntry {
  return {
    timestamp: new Date().toISOString(),
    type: 'ERROR',
    error,
    exitCode
  };
}

/**
 * Log a complete CLI invocation (command + output)
 * This is a convenience function for the main integration points.
 *
 * @req: SL-1 - Automatic logging without additional flags
 * @param stateFilePath - Path to state file (used to derive log path)
 * @param invocation - Details of the CLI invocation
 */
export async function logInvocation(
  stateFilePath: string,
  invocation: InvocationDetails
): Promise<void> {
  const logPath = deriveLogPath(stateFilePath);

  try {
    // Log the command
    if (invocation.type === 'init') {
      const startEntry = createSessionStartEntry(
        invocation.command,
        invocation.seed || '',
        invocation.options || {}
      );
      await appendToSessionLog(logPath, startEntry);
    } else {
      const moveEntry = createMoveEntry(
        invocation.command,
        invocation.move || ''
      );
      await appendToSessionLog(logPath, moveEntry);
    }

    // Log the output or error
    if (invocation.error) {
      const errorEntry = createErrorEntry(invocation.error, invocation.exitCode);
      await appendToSessionLog(logPath, errorEntry);
    } else {
      const outputEntry = createOutputEntry(
        invocation.output,
        invocation.exitCode,
        invocation.success
      );
      await appendToSessionLog(logPath, outputEntry);
    }
  } catch (logError) {
    // Silent failure - don't break CLI operation due to logging issues
    console.error(`Warning: Failed to write session log: ${logError instanceof Error ? logError.message : logError}`);
  }
}
