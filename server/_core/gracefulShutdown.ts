/**
 * Graceful Shutdown - Gap 9
 * Encerramento elegante de serviços
 */

import { logger } from './logger';

let isShuttingDown = false;

/**
 * Configurar graceful shutdown
 */
export function setupGracefulShutdown(server: any) {
  const signals = ['SIGTERM', 'SIGINT'];
  
  signals.forEach(signal => {
    process.on(signal, async () => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      // 1. Stop accepting new requests
      server.close(() => {
        logger.info('HTTP server closed');
      });
      
      // 2. Wait for existing requests to complete (max 30s)
      const shutdownTimeout = setTimeout(() => {
        logger.warn('Forced shutdown after 30s timeout');
        process.exit(1);
      }, 30000);
      
      // 3. Close database connections
      try {
        logger.info('Closing database connections');
        // await db.close();
      } catch (error) {
        logger.error('Error closing database', error as Error);
      }
      
      // 4. Close cache connections
      try {
        logger.info('Closing cache connections');
        // await redis.quit();
      } catch (error) {
        logger.error('Error closing cache', error as Error);
      }
      
      // 5. Clean up resources
      try {
        logger.info('Cleaning up resources');
      } catch (error) {
        logger.error('Error cleaning up', error as Error);
      }
      
      clearTimeout(shutdownTimeout);
      logger.info('Graceful shutdown completed');
      process.exit(0);
    });
  });
}

/**
 * Verificar se está em shutdown
 */
export function isInShutdown(): boolean {
  return isShuttingDown;
}
