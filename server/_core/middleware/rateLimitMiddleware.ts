/**
 * Rate Limit Middleware
 * 
 * Middleware Express para aplicar rate limiting em requisições reais
 * Integra com o Token Bucket algorithm
 */

import { Request, Response, NextFunction } from 'express';
import { checkRateLimit, getRateLimiterStatistics } from '../resilience/rateLimiter';

/**
 * Obter IP real do cliente (considerando proxies)
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Middleware de rate limiting para Express
 */
export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const ip = getClientIp(req);
    const userId = (req as any).user?.id; // Extraído do contexto de autenticação

    // Verificar rate limit
    const result = checkRateLimit(ip, userId);

    // Adicionar headers de rate limiting
    res.setHeader('X-RateLimit-Limit', '1000');
    res.setHeader('X-RateLimit-Remaining', Math.max(0, result.remaining));
    res.setHeader('X-RateLimit-Reset', result.resetAt);

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter || 1);
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: result.retryAfter,
        resetAt: result.resetAt,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('[RateLimitMiddleware] Error:', error);
    next(); // Falhar aberto - permitir requisição em caso de erro
  }
}

/**
 * Middleware de rate limiting específico para endpoints críticos
 */
export function strictRateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const ip = getClientIp(req);
    const userId = (req as any).user?.id;

    // Usar limite mais restritivo (10 req/s por IP)
    const result = checkRateLimit(ip, userId);

    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', Math.max(0, result.remaining));
    res.setHeader('X-RateLimit-Reset', result.resetAt);

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter || 1);
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded for this endpoint',
        retryAfter: result.retryAfter,
        resetAt: result.resetAt,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('[StrictRateLimitMiddleware] Error:', error);
    next();
  }
}

/**
 * Middleware para endpoints de admin (sem rate limiting)
 */
export function adminRateLimitBypass(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = (req as any).user;
    
    // Admins não têm rate limiting
    if (user?.role === 'admin') {
      next();
      return;
    }

    rateLimitMiddleware(req, res, next);
  } catch (error) {
    console.error('[AdminRateLimitBypass] Error:', error);
    next();
  }
}

/**
 * Middleware para logging de rate limit stats
 */
export function rateLimitStatsMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // Log a cada 100 requisições
    const stats = getRateLimiterStatistics();
    if (stats.totalRequests % 100 === 0) {
      console.log('[RateLimitStats]', {
        totalRequests: stats.totalRequests,
        allowedRequests: stats.allowedRequests,
        deniedRequests: stats.deniedRequests,
        allowRate: stats.allowRate.toFixed(2),
      });
    }

    next();
  } catch (error) {
    console.error('[RateLimitStatsMiddleware] Error:', error);
    next();
  }
}
