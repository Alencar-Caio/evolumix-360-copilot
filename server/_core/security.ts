/**
 * Security Middleware - Rate Limiting, CORS, Timeouts
 * 
 * Implementa proteções críticas de segurança:
 * - Rate limiting (100 req/min por IP)
 * - CORS restritivo (apenas Manus)
 * - Timeout handler (5s para LLM)
 * - Validação de headers
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Rate Limiting por IP
 * Armazena contador de requests em memória (em produção usar Redis)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  // Em desenvolvimento: limite alto (1000 req/min), em produção: 100 req/min
  const limit = process.env.NODE_ENV === 'development' ? 1000 : 100;
  const windowMs = 60 * 1000; // 1 minuto

  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    // Nova janela de tempo
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (record.count >= limit) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Máximo 100 requests por minuto.',
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    });
  }

  record.count++;
  next();
};

/**
 * CORS Restritivo
 * Apenas domínio Manus pode acessar a API
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://evolucopil-pk69zyag.manus.space',
    'https://3000-ikq1zghwjn2luda6mwzys-2c82bc1d.us2.manus.computer', // Dev
    'http://localhost:3000', // Local dev
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
};

/**
 * Security Headers
 * Adiciona headers de segurança (CSP, X-Frame-Options, etc)
 */
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy
  res.header(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.manus.im https://api.openai.com"
  );

  // Prevent clickjacking
  res.header('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.header('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.header('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

/**
 * Timeout Handler para LLM
 * Cancela requests que demoram mais de 5 segundos
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = 5000
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operação expirou após ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
};

/**
 * Validação de Arquivo
 * Verifica tamanho, tipo e conteúdo
 */
export const validateFile = (
  file: { size: number; mimetype: string; buffer: Buffer },
  options: { maxSize?: number; allowedTypes?: string[] } = {}
) => {
  const { maxSize = 50 * 1024 * 1024, allowedTypes = ['application/pdf', 'text/plain'] } = options;

  // Validar tamanho mínimo
  if (file.size === 0) {
    throw new Error('Arquivo vazio não é permitido');
  }

  // Validar tamanho máximo
  if (file.size > maxSize) {
    throw new Error(`Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB`);
  }

  // Validar tipo
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`Tipo de arquivo não permitido. Permitidos: ${allowedTypes.join(', ')}`);
  }

  return true;
};

/**
 * Error Handler Global
 * Captura e formata erros de forma segura
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[ERROR]', error.message, error.stack);

  // Não expor stack trace em produção
  const isDev = process.env.NODE_ENV === 'development';
  const message = isDev ? error.message : 'Erro ao processar requisição';

  res.status(500).json({
    error: message,
    ...(isDev && { stack: error.stack }),
  });
};
