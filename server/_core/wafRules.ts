/**
 * WAF Rules - Gap 12
 * Web Application Firewall com proteção OWASP Top 10
 */

import { logger } from './logger';

interface WAFRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  action: 'block' | 'log' | 'challenge';
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface WAFRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: string;
  ip: string;
}

interface WAFResult {
  allowed: boolean;
  blockedBy?: string;
  reason?: string;
  severity?: string;
}

// OWASP Top 10 Rules
const WAF_RULES: WAFRule[] = [
  // SQL Injection
  {
    id: 'sql-injection-1',
    name: 'SQL Injection - Basic',
    description: 'Detecta padrões básicos de SQL injection',
    pattern: /(\bunion\b.*\bselect\b|\bor\b.*=.*|\bdrop\b.*\btable\b)/i,
    action: 'block',
    severity: 'critical',
  },
  
  // XSS (Cross-Site Scripting)
  {
    id: 'xss-1',
    name: 'XSS - Script Tags',
    description: 'Bloqueia tags de script',
    pattern: /<script[^>]*>.*?<\/script>/i,
    action: 'block',
    severity: 'critical',
  },
  {
    id: 'xss-2',
    name: 'XSS - Event Handlers',
    description: 'Bloqueia event handlers',
    pattern: /on\w+\s*=\s*["'][^"']*["']/i,
    action: 'block',
    severity: 'high',
  },
  
  // Path Traversal
  {
    id: 'path-traversal-1',
    name: 'Path Traversal',
    description: 'Detecta tentativas de path traversal',
    pattern: /\.\.\//,
    action: 'block',
    severity: 'high',
  },
  
  // Command Injection
  {
    id: 'command-injection-1',
    name: 'Command Injection',
    description: 'Detecta tentativas de command injection',
    pattern: /[;&|`$()]/,
    action: 'log',
    severity: 'high',
  },
  
  // XXE (XML External Entity)
  {
    id: 'xxe-1',
    name: 'XXE Attack',
    description: 'Bloqueia XXE payloads',
    pattern: /<!ENTITY|SYSTEM|PUBLIC/i,
    action: 'block',
    severity: 'critical',
  },
];

/**
 * Avaliar requisição contra WAF rules
 */
export function evaluateRequest(req: WAFRequest): WAFResult {
  // Verificar cada regra
  for (const rule of WAF_RULES) {
    const content = `${req.method} ${req.path} ${JSON.stringify(req.headers)} ${req.body || ''}`;
    
    if (rule.pattern.test(content)) {
      logger.warn('WAF Rule Triggered', {
        rule: rule.id,
        ip: req.ip,
        path: req.path,
        severity: rule.severity,
      });
      
      if (rule.action === 'block') {
        return {
          allowed: false,
          blockedBy: rule.id,
          reason: rule.description,
          severity: rule.severity,
        };
      }
    }
  }
  
  return { allowed: true };
}

/**
 * Rate Limiting
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    logger.warn('Rate limit exceeded', { ip, count: record.count });
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * Geo-blocking
 */
const BLOCKED_COUNTRIES = ['KP', 'IR', 'SY']; // North Korea, Iran, Syria

export function checkGeoBlock(countryCode: string): boolean {
  if (BLOCKED_COUNTRIES.includes(countryCode)) {
    logger.warn('Geo-block triggered', { country: countryCode });
    return false;
  }
  return true;
}

/**
 * IP Whitelist/Blacklist
 */
const BLACKLISTED_IPS = new Set<string>();
const WHITELISTED_IPS = new Set<string>();

export function checkIPList(ip: string): boolean {
  if (BLACKLISTED_IPS.has(ip)) {
    logger.warn('IP blacklisted', { ip });
    return false;
  }
  
  if (WHITELISTED_IPS.size > 0 && !WHITELISTED_IPS.has(ip)) {
    logger.warn('IP not whitelisted', { ip });
    return false;
  }
  
  return true;
}

/**
 * Adicionar IP à blacklist
 */
export function blacklistIP(ip: string) {
  BLACKLISTED_IPS.add(ip);
  logger.info('IP blacklisted', { ip });
}

/**
 * Adicionar IP à whitelist
 */
export function whitelistIP(ip: string) {
  WHITELISTED_IPS.add(ip);
  logger.info('IP whitelisted', { ip });
}

/**
 * Obter estatísticas de WAF
 */
export function getWAFStats() {
  return {
    rules: WAF_RULES.length,
    blacklistedIPs: BLACKLISTED_IPS.size,
    whitelistedIPs: WHITELISTED_IPS.size,
    activeRequests: requestCounts.size,
  };
}
