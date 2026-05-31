# Implementation Kit - Gap 4: Circuit Breaker Pattern

**Status:** Pronto para Implementação  
**Tempo Estimado:** 6 horas  
**Dificuldade:** Média-Alta  
**Dependências:** npm install opossum

---

## 📋 Checklist

- [ ] `pnpm add opossum`
- [ ] Criar `server/_core/circuitBreaker.ts`
- [ ] Integrar com LLM calls
- [ ] Integrar com Database calls
- [ ] Integrar com S3 calls
- [ ] Criar testes
- [ ] Testar fallback behavior

---

## 📝 Implementação

**Arquivo:** `server/_core/circuitBreaker.ts`

```typescript
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
): CircuitBreaker<T> {
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
      stats: llmCircuitBreaker.stats,
    },
    database: {
      state: dbCircuitBreaker.opened ? 'open' : 'closed',
      stats: dbCircuitBreaker.stats,
    },
    s3: {
      state: s3CircuitBreaker.opened ? 'open' : 'closed',
      stats: s3CircuitBreaker.stats,
    },
  };
}
```

---

## 🔗 Integração com Procedures

**Arquivo:** `server/routers.ts`

```typescript
import { llmCircuitBreaker, getCircuitBreakerStatus } from './_core/circuitBreaker';

export const appRouter = router({
  // ... outros routers
  
  system: router({
    circuitBreakerStatus: publicProcedure.query(async () => {
      return getCircuitBreakerStatus();
    }),
  }),
  
  copilot: router({
    chat: protectedProcedure
      .input(z.object({ message: z.string() }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Usar circuit breaker para LLM call
          const response = await llmCircuitBreaker.fire(input.message, {
            userId: ctx.user.id,
          });
          return response;
        } catch (error) {
          if (error instanceof CircuitBreaker.CircuitBreakerOpenError) {
            throw new TRPCError({
              code: 'SERVICE_UNAVAILABLE',
              message: 'LLM service temporarily unavailable. Please try again later.',
            });
          }
          throw error;
        }
      }),
  }),
});
```

---

## 🧪 Testes

**Arquivo:** `server/_core/circuitBreaker.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createCircuitBreaker } from './circuitBreaker';

describe('Circuit Breaker', () => {
  it('should execute function successfully', async () => {
    const fn = vi.fn().mockResolvedValue({ success: true });
    const breaker = createCircuitBreaker(fn, { name: 'test' });
    
    const result = await breaker.fire();
    expect(result).toEqual({ success: true });
  });

  it('should open after threshold', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Failed'));
    const breaker = createCircuitBreaker(fn, { 
      name: 'test',
      errorThresholdPercentage: 50,
    });
    
    // Trigger failures
    for (let i = 0; i < 5; i++) {
      try {
        await breaker.fire();
      } catch (e) {
        // Expected
      }
    }
    
    // Should be open now
    expect(breaker.opened).toBe(true);
  });

  it('should reject when open', async () => {
    const fn = vi.fn().mockResolvedValue({ success: true });
    const breaker = createCircuitBreaker(fn, { name: 'test' });
    
    // Force open
    breaker.open();
    
    expect(() => breaker.fire()).rejects.toThrow();
  });
});
```

---

## 📊 Configurações Recomendadas

| Serviço | Timeout | Error % | Reset |
|---------|---------|---------|-------|
| LLM | 60s | 50% | 30s |
| Database | 10s | 50% | 15s |
| S3 | 15s | 50% | 20s |
| Redis | 5s | 50% | 10s |

---

## ✅ Validação

- [ ] Circuit breaker abre após falhas
- [ ] Circuit breaker fecha após sucesso
- [ ] Half-open state funciona
- [ ] Fallback behavior implementado
- [ ] Testes passando

