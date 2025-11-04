/**
 * Structured Logging Utility
 *
 * Reliable logging that always works:
 * 1. Always creates a log file in predictable location
 * 2. Logs to both console AND file
 * 3. Falls back gracefully if file write fails
 * 4. Auto-detects best log location
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class Logger {
  private logLevel: number;
  private levels = { debug: 0, info: 1, warn: 2, error: 3 };
  private format: 'json' | 'text';
  private logFile: string | null;
  private fileWriteable: boolean = true;
  private static readonly DEFAULT_LOG_FILENAME = 'dominion-game-session.log';

  constructor(level: string = 'info', format: 'json' | 'text' = 'text', logFile?: string) {
    this.logLevel = this.levels[level as keyof typeof this.levels] || 1;
    this.format = format;

    // Determine log file location with priority:
    // 1. Explicitly provided
    // 2. Environment variable LOG_FILE
    // 3. Current working directory
    // 4. Temp directory
    if (logFile) {
      this.logFile = logFile;
    } else if (process.env.LOG_FILE) {
      this.logFile = process.env.LOG_FILE;
    } else {
      // Default: try current directory first, fallback to temp
      const cwdLog = path.join(process.cwd(), Logger.DEFAULT_LOG_FILENAME);
      const tempLog = path.join(os.tmpdir(), Logger.DEFAULT_LOG_FILENAME);

      // Try to write to cwd first
      try {
        fs.writeFileSync(cwdLog, '', { flag: 'a' });
        this.logFile = cwdLog;
      } catch {
        // Fallback to temp directory
        try {
          fs.writeFileSync(tempLog, '', { flag: 'a' });
          this.logFile = tempLog;
        } catch {
          // If both fail, don't use file logging
          this.logFile = null;
          this.fileWriteable = false;
        }
      }
    }

    // Ensure log directory exists if we have a log file
    if (this.logFile && this.fileWriteable) {
      try {
        const dir = path.dirname(this.logFile);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Initialize log file with header
        const header = `[${'═'.repeat(60)}]\n[Game Session Log Started: ${new Date().toISOString()}]\n[Log File: ${this.logFile}]\n[${'═'.repeat(60)}]\n`;
        fs.appendFileSync(this.logFile, header);

        // Print to console where logs are going
        console.log(`\n✓ Logging initialized to: ${this.logFile}\n`);
      } catch (error) {
        console.error(`✗ Failed to initialize log file: ${error}`);
        this.fileWriteable = false;
      }
    }
  }

  debug(message: string, data?: any): void {
    if (this.logLevel <= 0) {
      this.log('debug', message, data);
    }
  }

  info(message: string, data?: any): void {
    if (this.logLevel <= 1) {
      this.log('info', message, data);
    }
  }

  warn(message: string, data?: any): void {
    if (this.logLevel <= 2) {
      this.log('warn', message, data);
    }
  }

  error(message: string, error?: any): void {
    if (this.logLevel <= 3) {
      this.log('error', message, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  private log(level: string, message: string, data?: any): void {
    if (this.format === 'json') {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...(data && { data })
      };
      const logString = JSON.stringify(logEntry);
      console.log(logString);
      this.writeToFile(logString);
    } else {
      const dataStr = data ? ` ${JSON.stringify(data)}` : '';
      const logString = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}${dataStr}`;
      console.log(logString);
      this.writeToFile(logString);
    }
  }

  private writeToFile(message: string): void {
    if (!this.logFile || !this.fileWriteable) {
      return;
    }

    try {
      fs.appendFileSync(this.logFile, message + '\n');
    } catch (error) {
      // Only log error once to avoid spam
      if (this.fileWriteable) {
        console.error(`✗ Warning: Could not write to log file. Continuing without file logging.`);
        this.fileWriteable = false;
      }
    }
  }

  /**
   * Get the path where logs are being written
   * Useful for debugging
   */
  public getLogFilePath(): string | null {
    return this.logFile;
  }

  /**
   * Get status of file logging
   */
  public isFileWriting(): boolean {
    return this.fileWriteable && !!this.logFile;
  }
}
