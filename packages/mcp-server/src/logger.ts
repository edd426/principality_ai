/**
 * Structured Logging Utility
 */

export class Logger {
  private logLevel: number;
  private levels = { debug: 0, info: 1, warn: 2, error: 3 };
  private format: 'json' | 'text';

  constructor(level: string = 'info', format: 'json' | 'text' = 'json') {
    this.logLevel = this.levels[level as keyof typeof this.levels] || 1;
    this.format = format;
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
      console.log(JSON.stringify(logEntry));
    } else {
      const dataStr = data ? ` ${JSON.stringify(data)}` : '';
      console.log(`[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}${dataStr}`);
    }
  }
}
