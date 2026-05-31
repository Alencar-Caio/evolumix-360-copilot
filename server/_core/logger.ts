/**
 * Logger Estruturado
 * Centraliza logging com suporte a múltiplos níveis e transports
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  stack?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  /**
   * Formatar entrada de log
   */
  private formatLog(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  /**
   * Enviar log para console e/ou serviço externo
   */
  private output(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';

    if (this.isDevelopment) {
      // Em desenvolvimento, usar console colorido
      const colors: Record<LogLevel, string> = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m', // Green
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
      };
      const reset = '\x1b[0m';

      console.log(`${colors[entry.level]}${prefix}${reset} ${entry.message}${contextStr}`);
    } else {
      // Em produção, usar JSON estruturado
      console.log(JSON.stringify(entry));
    }

    // TODO: Enviar para serviço de logging centralizado (ELK, CloudWatch, etc.)
  }

  /**
   * Log de debug
   */
  debug(message: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.output(this.formatLog('debug', message, context));
    }
  }

  /**
   * Log de informação
   */
  info(message: string, context?: Record<string, any>): void {
    this.output(this.formatLog('info', message, context));
  }

  /**
   * Log de aviso
   */
  warn(message: string, context?: Record<string, any>): void {
    this.output(this.formatLog('warn', message, context));
  }

  /**
   * Log de erro
   */
  error(message: string, context?: Record<string, any>): void {
    const entry = this.formatLog('error', message, context);
    if (context?.error instanceof Error) {
      entry.stack = context.error.stack;
    }
    this.output(entry);
  }
}

export const logger = new Logger();
