/**
 * Structured Logging Utility
 */

import * as fs from 'fs';
import * as path from 'path';

export class Logger {
  private logLevel: number;
  private levels = { debug: 0, info: 1, warn: 2, error: 3 };
  private format: 'json' | 'text';
  private logFile: string | null;

  constructor(level: string = 'info', format: 'json' | 'text' = 'json', logFile?: string) {
    this.logLevel = this.levels[level as keyof typeof this.levels] || 1;
    this.format = format;
    this.logFile = logFile || null;

    // Ensure log directory exists if logFile is specified
    if (this.logFile) {
      const dir = path.dirname(this.logFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Initialize log file with header
      this.writeToFile(`[${'═'.repeat(60)}]\n[Game Session Log Started: ${new Date().toISOString()}]\n[${'═'.repeat(60)}]\n`);
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
    if (!this.logFile) {
      return;
    }

    try {
      fs.appendFileSync(this.logFile, message + '\n');
    } catch (error) {
      // Fail silently if file write fails - don't interrupt game
      console.error(`Failed to write to log file ${this.logFile}:`, error);
    }
  }
}
