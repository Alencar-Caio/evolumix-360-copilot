/**
 * Quality Assurance Pipeline - Validação de Qualidade
 * 
 * Responsabilidade: Validar qualidade de respostas e documentos
 * 
 * Fluxo:
 * 1. Validar completude de resposta
 * 2. Validar relevância com documentos
 * 3. Validar conformidade com padrões
 * 4. Rastrear métricas de qualidade
 * 5. Gerar relatórios de QA
 * 
 * Justificativa:
 * - Conformidade (ISO, GDPR, SOC 2)
 * - Confiabilidade (respostas precisas)
 * - Rastreabilidade (auditoria de qualidade)
 * - Melhoria contínua (métricas)
 */

/**
 * Estrutura de validação de qualidade
 */
export interface QualityCheckResult {
  passed: boolean;
  score: number; // 0-100
  checks: QualityCheck[];
  timestamp: Date;
  details: Record<string, any>;
}

/**
 * Estrutura de verificação individual
 */
export interface QualityCheck {
  name: string;
  passed: boolean;
  score: number;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

/**
 * Estrutura de resposta para validação
 */
export interface ResponseToValidate {
  content: string;
  sourceDocuments: string[];
  citations: string[];
  confidence?: number;
  metadata?: Record<string, any>;
}

/**
 * Estrutura de métricas de qualidade
 */
export interface QualityMetrics {
  totalResponses: number;
  passedResponses: number;
  failedResponses: number;
  averageScore: number;
  passRate: number;
  criticalFailures: number;
  warnings: number;
  timestamp: Date;
}

// Métricas globais
let metrics: QualityMetrics = {
  totalResponses: 0,
  passedResponses: 0,
  failedResponses: 0,
  averageScore: 0,
  passRate: 0,
  criticalFailures: 0,
  warnings: 0,
  timestamp: new Date(),
};

/**
 * Validar completude de resposta
 */
function validateCompleteness(response: ResponseToValidate): QualityCheck {
  const checks = [
    response.content.length > 0,
    response.content.length > 50, // Mínimo de caracteres
    response.sourceDocuments.length > 0,
    response.citations.length > 0,
  ];

  const passed = checks.every((c) => c);
  const score = (checks.filter((c) => c).length / checks.length) * 100;

  return {
    name: 'Completeness',
    passed,
    score,
    message: passed
      ? 'Resposta completa com documentos e citações'
      : 'Resposta incompleta ou sem citações',
    severity: passed ? 'info' : 'critical',
  };
}

/**
 * Validar relevância de resposta
 */
function validateRelevance(response: ResponseToValidate): QualityCheck {
  // Se não há documentos, considerar como não relevante
  if (response.sourceDocuments.length === 0) {
    return {
      name: 'Relevance',
      passed: false,
      score: 0,
      message: 'Sem documentos de origem',
      severity: 'warning',
    };
  }

  // Verificar se citações correspondem aos documentos
  const citationsInDocs =
    response.citations.length === 0 ||
    response.citations.every((citation) =>
      response.sourceDocuments.some((doc) => doc.includes(citation))
    );

  // Verificar se há overlap entre conteúdo e documentos
  const contentWords = response.content.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const docWords = response.sourceDocuments
    .join(' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const overlap = contentWords.filter((word) => docWords.includes(word)).length;
  const overlapRatio = contentWords.length > 0 ? overlap / contentWords.length : 0;

  const passed = citationsInDocs && overlapRatio > 0.1;
  const score = (citationsInDocs ? 50 : 0) + Math.min(overlapRatio * 100, 50);

  return {
    name: 'Relevance',
    passed,
    score: Math.min(score, 100),
    message: passed
      ? 'Resposta relevante com citações válidas'
      : 'Resposta pode conter informações não suportadas',
    severity: passed ? 'info' : 'warning',
  };
}

/**
 * Validar conformidade com padrões
 */
function validateCompliance(response: ResponseToValidate): QualityCheck {
  const checks = [
    !response.content.includes('<script'), // Sem scripts
    !response.content.includes('<?php'), // Sem PHP
    response.content.length < 10000, // Limite de tamanho
    response.sourceDocuments.length <= 10, // Limite de documentos
    (response.confidence ?? 0) >= 0.5, // Confiança mínima
  ];

  const passed = checks.every((c) => c);
  const score = (checks.filter((c) => c).length / checks.length) * 100;

  return {
    name: 'Compliance',
    passed,
    score,
    message: passed
      ? 'Resposta em conformidade com padrões'
      : 'Resposta viola padrões de conformidade',
    severity: passed ? 'info' : 'critical',
  };
}

/**
 * Validar segurança de resposta
 */
function validateSecurity(response: ResponseToValidate): QualityCheck {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /onclick/i,
    /onerror/i,
    /eval\(/i,
    /exec\(/i,
  ];

  const hasDangerousContent = dangerousPatterns.some((pattern) =>
    pattern.test(response.content)
  );

  const passed = !hasDangerousContent;
  const score = passed ? 100 : 0;

  return {
    name: 'Security',
    passed,
    score,
    message: passed
      ? 'Resposta segura sem conteúdo malicioso'
      : 'Resposta contém padrões potencialmente perigosos',
    severity: passed ? 'info' : 'critical',
  };
}

/**
 * Validar citações
 */
function validateCitations(response: ResponseToValidate): QualityCheck {
  const citationRatio = response.citations.length / (response.sourceDocuments.length || 1);
  const passed = citationRatio >= 0.5 && response.citations.length > 0;
  const score = Math.min(citationRatio * 100, 100);

  return {
    name: 'Citations',
    passed,
    score,
    message: passed
      ? `${response.citations.length} citações válidas`
      : 'Citações insuficientes ou inválidas',
    severity: passed ? 'info' : 'warning',
  };
}

/**
 * Executar validação completa de qualidade
 */
export function validateQuality(response: ResponseToValidate): QualityCheckResult {
  const checks: QualityCheck[] = [
    validateCompleteness(response),
    validateRelevance(response),
    validateCompliance(response),
    validateSecurity(response),
    validateCitations(response),
  ];

  // Calcular score geral
  const totalScore = checks.reduce((sum, check) => sum + check.score, 0) / checks.length;

  // Verificar se passou (sem falhas críticas)
  const passed = !checks.some((c) => c.severity === 'critical' && !c.passed);

  // Atualizar métricas
  metrics.totalResponses++;
  if (passed) {
    metrics.passedResponses++;
  } else {
    metrics.failedResponses++;
  }

  const criticalFailures = checks.filter((c) => c.severity === 'critical' && !c.passed).length;
  metrics.criticalFailures += criticalFailures;

  const warnings = checks.filter((c) => c.severity === 'warning' && !c.passed).length;
  metrics.warnings += warnings;

  // Calcular média
  metrics.averageScore =
    (metrics.averageScore * (metrics.totalResponses - 1) + totalScore) / metrics.totalResponses;
  metrics.passRate = (metrics.passedResponses / metrics.totalResponses) * 100;
  metrics.timestamp = new Date();

  return {
    passed,
    score: Math.round(totalScore),
    checks,
    timestamp: new Date(),
    details: {
      criticalFailures,
      warnings,
      documentCount: response.sourceDocuments.length,
      citationCount: response.citations.length,
      contentLength: response.content.length,
    },
  };
}

/**
 * Obter métricas de qualidade
 */
export function getQualityMetrics(): QualityMetrics {
  return { ...metrics };
}

/**
 * Resetar métricas
 */
export function resetQualityMetrics(): void {
  metrics = {
    totalResponses: 0,
    passedResponses: 0,
    failedResponses: 0,
    averageScore: 0,
    passRate: 0,
    criticalFailures: 0,
    warnings: 0,
    timestamp: new Date(),
  };
}

/**
 * Gerar relatório de qualidade
 */
export function generateQualityReport(): string {
  const m = metrics;

  return `
# Relatório de Qualidade

## Resumo
- Total de respostas: ${m.totalResponses}
- Respostas aprovadas: ${m.passedResponses} (${m.passRate.toFixed(1)}%)
- Respostas rejeitadas: ${m.failedResponses}

## Pontuação
- Pontuação média: ${m.averageScore.toFixed(1)}/100
- Falhas críticas: ${m.criticalFailures}
- Avisos: ${m.warnings}

## Data
- Última atualização: ${m.timestamp.toISOString()}
  `;
}

/**
 * Validar lote de respostas
 */
export function validateBatch(responses: ResponseToValidate[]): {
  results: QualityCheckResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    averageScore: number;
  };
} {
  const results = responses.map((response) => validateQuality(response));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

  return {
    results,
    summary: {
      total: results.length,
      passed,
      failed,
      averageScore: Math.round(averageScore),
    },
  };
}
