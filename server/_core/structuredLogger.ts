/**
 * Structured Logging - Gap 7
 * Winston para logging estruturado
 */

// @ts-ignore
import winston from 'winston';

// Criar logger com múltiplos transportes
export const structuredLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'evolumix-360-copilot',
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
  },
  transports: [
    // Console transport para desenvolvimento
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info: any) => {
          const metaStr = Object.keys(info).length ? JSON.stringify(info) : '';
          return `${info.timestamp} [${info.level}] ${info.message} ${metaStr}`;
        })
      ),
    }),
    // File transport para erros
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
    }),
    // File transport para todos os logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json(),
    }),
  ],
});

// Log uncaught exceptions
structuredLogger.exceptions.handle(
  new winston.transports.File({ filename: 'logs/exceptions.log' })
);

// Log unhandled rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  structuredLogger.error('Unhandled Rejection', { reason, promise });
});

// Métodos auxiliares
export const logInfo = (message: string, meta?: any) => {
  structuredLogger.info(message, meta);
};

export const logError = (message: string, error?: Error, meta?: any) => {
  structuredLogger.error(message, {
    error: error?.message,
    stack: error?.stack,
    ...meta,
  });
};

export const logWarn = (message: string, meta?: any) => {
  structuredLogger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  structuredLogger.debug(message, meta);
};

export default structuredLogger;
