/**
 * Circuit Breaker Pattern - Gap 4
 * Proteção contra falhas em cascata
 */

// @ts-ignore
import CircuitBreaker from 'opossum';
import { logger } from './logger';

interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  name: string;
}

/**
 * Factory para criar circuit breakers com configuração padrão
 */
export function createCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CircuitBreakerOptions
): any {
  const breaker = new CircuitBreaker(fn, {
    timeout: options.timeout || 30000,
    errorThresholdPercentage: options.errorThresholdPercentage || 50,
    resetTimeout: options.resetTimeout || 30000,
    name: options.name,
  });

  breaker.on('open', () => {
    logger.warn(`Circuit breaker opened: ${options.name}`);
  });

  breaker.on('halfOpen', () => {
    logger.info(`Circuit breaker half-open: ${options.name}`);
  });

  breaker.on('close', () => {
    logger.info(`Circuit breaker closed: ${options.name}`);
  });

  return breaker;
}

/**
 * Circuit breaker para chamadas LLM
 */
export const llmCircuitBreaker = createCircuitBreaker(
  async (prompt: string, context?: any) => {
    // Implementar chamada LLM real aqui
    return { response: 'LLM response' };
  },
  {
    name: 'LLM',
    timeout: 60000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
  }
);

/**
 * Circuit breaker para chamadas de banco de dados
 */
export const dbCircuitBreaker = createCircuitBreaker(
  async (query: string) => {
    // Implementar query real aqui
    return { rows: [] };
  },
  {
    name: 'Database',
    timeout: 10000,
    errorThresholdPercentage: 50,
    resetTimeout: 15000,
  }
);

/**
 * Circuit breaker para S3
 */
export const s3CircuitBreaker = createCircuitBreaker(
  async (key: string) => {
    // Implementar S3 call real aqui
    return { url: 'https://s3.example.com/...' };
  },
  {
    name: 'S3',
    timeout: 15000,
    errorThresholdPercentage: 50,
    resetTimeout: 20000,
  }
);

/**
 * Obter status de todos os circuit breakers
 */
export function getCircuitBreakerStatus() {
  return {
    llm: {
      state: llmCircuitBreaker.opened ? 'open' : 'closed',
      stats: {
        fires: llmCircuitBreaker.stats?.fires || 0,
        failures: llmCircuitBreaker.stats?.failures || 0,
        successes: llmCircuitBreaker.stats?.successes || 0,
        timeouts: llmCircuitBreaker.stats?.timeouts || 0,
      },
    },
    database: {
      state: dbCircuitBreaker.opened ? 'open' : 'closed',
      stats: {
        fires: dbCircuitBreaker.stats?.fires || 0,
        failures: dbCircuitBreaker.stats?.failures || 0,
        successes: dbCircuitBreaker.stats?.successes || 0,
        timeouts: dbCircuitBreaker.stats?.timeouts || 0,
      },
    },
    s3: {
      state: s3CircuitBreaker.opened ? 'open' : 'closed',
      stats: {
        fires: s3CircuitBreaker.stats?.fires || 0,
        failures: s3CircuitBreaker.stats?.failures || 0,
        successes: s3CircuitBreaker.stats?.successes || 0,
        timeouts: s3CircuitBreaker.stats?.timeouts || 0,
      },
    },
  };
}

/**
 * Reset circuit breaker (útil para testes)
 */
export function resetCircuitBreaker(name: 'llm' | 'database' | 's3') {
  const breakers = {
    llm: llmCircuitBreaker,
    database: dbCircuitBreaker,
    s3: s3CircuitBreaker,
  };
  
  const breaker = breakers[name];
  if (breaker) {
    breaker.close();
    logger.info(`Circuit breaker ${name} reset`);
  }
}
