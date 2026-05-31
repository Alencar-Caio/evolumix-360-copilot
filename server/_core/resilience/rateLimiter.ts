/**
 * Rate Limiter
 * 
 * Responsabilidade: Implementar rate limiting com Token Bucket algorithm
 * 
 * Implementa:
 * - Token Bucket para rate limiting
 * - Limite por IP
 * - Limite por usuário
 * - Limite global
 */

/**
 * Bucket de tokens
 */
export interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number; // tokens por segundo
}

/**
 * Configuração de rate limiting
 */
export interface RateLimitConfig {
  globalLimit: number; // requisições por segundo
  perIpLimit: number; // requisições por segundo por IP
  perUserLimit: number; // requisições por segundo por usuário
  refillInterval: number; // ms
}

/**
 * Resultado de verificação de rate limit
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // timestamp
  retryAfter?: number; // segundos
}

// Armazenamento de buckets
let globalBucket: TokenBucket | null = null;
let ipBuckets: Map<string, TokenBucket> = new Map();
let userBuckets: Map<string, TokenBucket> = new Map();
let config: RateLimitConfig | null = null;
let stats = {
  totalRequests: 0,
  allowedRequests: 0,
  deniedRequests: 0,
};

/**
 * Configuração padrão
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  globalLimit: 1000,
  perIpLimit: 100,
  perUserLimit: 50,
  refillInterval: 1000,
};

/**
 * Inicializar rate limiter
 */
export function initializeRateLimiter(rateLimitConfig?: RateLimitConfig): void {
  config = rateLimitConfig || DEFAULT_CONFIG;

  globalBucket = {
    tokens: config.globalLimit,
    lastRefill: Date.now(),
    capacity: config.globalLimit,
    refillRate: config.globalLimit,
  };

  console.log(`[RateLimiter] Initialized with global limit: ${config.globalLimit} req/s`);
}

/**
 * Refill tokens no bucket
 */
function refillBucket(bucket: TokenBucket): void {
  const now = Date.now();
  const timePassed = (now - bucket.lastRefill) / 1000; // segundos
  const tokensToAdd = timePassed * bucket.refillRate;

  bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;
}

/**
 * Obter ou criar bucket
 */
function getOrCreateBucket(
  key: string,
  bucketMap: Map<string, TokenBucket>,
  limit: number
): TokenBucket {
  let bucket = bucketMap.get(key);

  if (!bucket) {
    bucket = {
      tokens: limit,
      lastRefill: Date.now(),
      capacity: limit,
      refillRate: limit,
    };
    bucketMap.set(key, bucket);
  }

  return bucket;
}

/**
 * Verificar rate limit global
 */
function checkGlobalLimit(): boolean {
  if (!globalBucket || !config) return true;

  refillBucket(globalBucket);

  if (globalBucket.tokens >= 1) {
    globalBucket.tokens--;
    return true;
  }

  return false;
}

/**
 * Verificar rate limit por IP
 */
function checkIpLimit(ip: string): boolean {
  if (!config) return true;

  const bucket = getOrCreateBucket(ip, ipBuckets, config.perIpLimit);
  refillBucket(bucket);

  if (bucket.tokens >= 1) {
    bucket.tokens--;
    return true;
  }

  return false;
}

/**
 * Verificar rate limit por usuário
 */
function checkUserLimit(userId: string): boolean {
  if (!config) return true;

  const bucket = getOrCreateBucket(userId, userBuckets, config.perUserLimit);
  refillBucket(bucket);

  if (bucket.tokens >= 1) {
    bucket.tokens--;
    return true;
  }

  return false;
}

/**
 * Verificar rate limit
 */
export function checkRateLimit(
  ip: string,
  userId?: string
): RateLimitResult {
  if (!config) {
    return {
      allowed: true,
      remaining: 0,
      resetAt: Date.now(),
    };
  }

  stats.totalRequests++;

  // Verificar limite global
  const globalAllowed = checkGlobalLimit();
  if (!globalAllowed) {
    stats.deniedRequests++;
    return {
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 1000,
      retryAfter: 1,
    };
  }

  // Verificar limite por IP
  const ipAllowed = checkIpLimit(ip);
  if (!ipAllowed) {
    stats.deniedRequests++;
    return {
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 1000,
      retryAfter: 1,
    };
  }

  // Verificar limite por usuário
  if (userId) {
    const userAllowed = checkUserLimit(userId);
    if (!userAllowed) {
      stats.deniedRequests++;
      return {
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 1000,
        retryAfter: 1,
      };
    }
  }

  stats.allowedRequests++;

  // Calcular tokens restantes
  const ipBucket = ipBuckets.get(ip);
  const remaining = ipBucket ? Math.floor(ipBucket.tokens) : 0;

  return {
    allowed: true,
    remaining,
    resetAt: Date.now() + 1000,
  };
}

/**
 * Obter estatísticas de rate limiting
 */
export function getRateLimiterStatistics() {
  return {
    ...stats,
    totalBuckets: ipBuckets.size + userBuckets.size,
    ipBuckets: ipBuckets.size,
    userBuckets: userBuckets.size,
    allowRate: stats.totalRequests > 0 ? (stats.allowedRequests / stats.totalRequests) * 100 : 0,
  };
}

/**
 * Resetar rate limiter (para testes)
 */
export function resetRateLimiter(): void {
  globalBucket = null;
  ipBuckets.clear();
  userBuckets.clear();
  config = null;
  stats = {
    totalRequests: 0,
    allowedRequests: 0,
    deniedRequests: 0,
  };
}

/**
 * Obter tokens restantes para um cliente específico
 */
export function getRemainingTokens(ip: string, userId?: string): number {
  let remaining = 0;

  const ipBucket = ipBuckets.get(ip);
  if (ipBucket) {
    refillBucket(ipBucket);
    remaining = Math.floor(ipBucket.tokens);
  }

  if (userId) {
    const userBucket = userBuckets.get(userId);
    if (userBucket) {
      refillBucket(userBucket);
      remaining = Math.min(remaining, Math.floor(userBucket.tokens));
    }
  }

  return remaining;
}

/**
 * Obter tempo de reset para um cliente específico
 */
export function getResetTime(ip: string, userId?: string): number {
  let resetTime = Date.now() + 1000;

  const ipBucket = ipBuckets.get(ip);
  if (ipBucket) {
    resetTime = Math.max(resetTime, ipBucket.lastRefill + 1000);
  }

  if (userId) {
    const userBucket = userBuckets.get(userId);
    if (userBucket) {
      resetTime = Math.max(resetTime, userBucket.lastRefill + 1000);
    }
  }

  return resetTime;
}

/**
 * Obter taxa de permissão (allow rate)
 */
export function getAllowRate(): number {
  if (stats.totalRequests === 0) return 1.0;
  return (stats.allowedRequests / stats.totalRequests);
}
