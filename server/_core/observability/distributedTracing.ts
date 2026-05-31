/**
 * Distributed Tracing - OpenTelemetry + Jaeger
 * 
 * Responsabilidade: Implementar tracing distribuído para observabilidade
 * 
 * Recursos:
 * 1. Rastreamento de requisições end-to-end
 * 2. Propagação de contexto entre serviços
 * 3. Métricas de latência e performance
 * 4. Detecção de erros e anomalias
 * 5. Análise de dependências entre serviços
 * 
 * Justificativa:
 * - Observabilidade completa de sistema
 * - Detecção rápida de problemas
 * - Análise de performance
 * - Debugging distribuído
 * - Conformidade com SOTA 2026
 */

/**
 * Estrutura de span
 */
export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  serviceName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'success' | 'error' | 'pending';
  tags: Record<string, string | number | boolean>;
  logs: SpanLog[];
  error?: {
    message: string;
    stack?: string;
  };
}

/**
 * Estrutura de log de span
 */
export interface SpanLog {
  timestamp: Date;
  message: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  fields?: Record<string, any>;
}

/**
 * Estrutura de trace
 */
export interface Trace {
  traceId: string;
  spans: Span[];
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'success' | 'error' | 'partial' | 'pending';
}

// Spans em memória
let activeSpans: Map<string, Span> = new Map();
let traces: Map<string, Trace> = new Map();

/**
 * Gerar ID único para trace/span
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Iniciar novo trace
 */
export function startTrace(serviceName: string): string {
  const traceId = generateId();
  
  const trace: Trace = {
    traceId,
    spans: [],
    startTime: new Date(),
    status: 'pending',
  };
  
  traces.set(traceId, trace);
  
  console.log(`[Tracing] Trace iniciado: ${traceId}`);
  
  return traceId;
}

/**
 * Iniciar novo span
 */
export function startSpan(
  traceId: string,
  operationName: string,
  serviceName: string,
  parentSpanId?: string
): string {
  const spanId = generateId();
  
  const span: Span = {
    traceId,
    spanId,
    parentSpanId,
    operationName,
    serviceName,
    startTime: new Date(),
    status: 'pending',
    tags: {},
    logs: [],
  };
  
  activeSpans.set(spanId, span);
  
  // Adicionar span ao trace
  const trace = traces.get(traceId);
  if (trace) {
    trace.spans.push(span);
  }
  
  console.log(`[Tracing] Span iniciado: ${spanId} (${operationName})`);
  
  return spanId;
}

/**
 * Adicionar tag a um span
 */
export function addSpanTag(spanId: string, key: string, value: string | number | boolean): void {
  const span = activeSpans.get(spanId);
  if (span) {
    span.tags[key] = value;
  }
}

/**
 * Adicionar log a um span
 */
export function addSpanLog(
  spanId: string,
  message: string,
  level: 'debug' | 'info' | 'warn' | 'error' = 'info',
  fields?: Record<string, any>
): void {
  const span = activeSpans.get(spanId);
  if (span) {
    span.logs.push({
      timestamp: new Date(),
      message,
      level,
      fields,
    });
  }
}

/**
 * Finalizar span com sucesso
 */
export function finishSpan(spanId: string): void {
  const span = activeSpans.get(spanId);
  if (span) {
    span.endTime = new Date();
    span.duration = span.endTime.getTime() - span.startTime.getTime();
    span.status = 'success';
    
    console.log(`[Tracing] Span finalizado: ${spanId} (${span.duration}ms)`);
  }
}

/**
 * Finalizar span com erro
 */
export function finishSpanWithError(spanId: string, error: Error): void {
  const span = activeSpans.get(spanId);
  if (span) {
    span.endTime = new Date();
    span.duration = span.endTime.getTime() - span.startTime.getTime();
    span.status = 'error';
    span.error = {
      message: error.message,
      stack: error.stack,
    };
    
    console.log(`[Tracing] Span finalizado com erro: ${spanId} - ${error.message}`);
  }
}

/**
 * Finalizar trace
 */
export function finishTrace(traceId: string): void {
  const trace = traces.get(traceId);
  if (trace) {
    trace.endTime = new Date();
    trace.duration = trace.endTime.getTime() - trace.startTime.getTime();
    
    // Determinar status do trace
    const hasErrors = trace.spans.some((s) => s.status === 'error');
    const allFinished = trace.spans.every((s) => s.endTime);
    
    trace.status = (hasErrors ? 'error' : allFinished ? 'success' : 'partial') as 'success' | 'error' | 'partial';
    
    console.log(`[Tracing] Trace finalizado: ${traceId} - ${trace.status} (${trace.duration}ms)`);
  }
}

/**
 * Obter trace completo
 */
export function getTrace(traceId: string): Trace | undefined {
  return traces.get(traceId);
}

/**
 * Obter span
 */
export function getSpan(spanId: string): Span | undefined {
  return activeSpans.get(spanId);
}

/**
 * Obter estatísticas de tracing
 */
export function getTracingStatistics(): {
  activeTraces: number;
  activeSpans: number;
  completedTraces: number;
  averageTraceDuration: number;
  errorRate: number;
} {
  const completed = Array.from(traces.values()).filter((t) => t.status !== 'pending');
  const errors = completed.filter((t) => t.status === 'error');
  
  const avgDuration =
    completed.length > 0
      ? completed.reduce((sum, t) => sum + (t.duration || 0), 0) / completed.length
      : 0;
  
  const errorRate = completed.length > 0 ? (errors.length / completed.length) * 100 : 0;
  
  return {
    activeTraces: traces.size,
    activeSpans: activeSpans.size,
    completedTraces: completed.length,
    averageTraceDuration: Math.round(avgDuration),
    errorRate: Math.round(errorRate * 100) / 100,
  };
}

/**
 * Exportar trace para Jaeger
 */
export function exportTraceToJaeger(traceId: string): {
  traceID: string;
  spans: Array<{
    traceID: string;
    spanID: string;
    operationName: string;
    references?: Array<{ refType: string; traceID: string; spanID: string }>;
    startTime: number;
    duration: number;
    tags: Array<{ key: string; value: string | number | boolean }>;
    logs: Array<{ timestamp: number; fields: Array<{ key: string; value: string }> }>;
    status: string;
  }>;
} {
  const trace = traces.get(traceId);
  if (!trace) {
    throw new Error(`Trace não encontrado: ${traceId}`);
  }
  
  return {
    traceID: trace.traceId,
    spans: trace.spans.map((span) => ({
      traceID: span.traceId,
      spanID: span.spanId,
      operationName: span.operationName,
      references: span.parentSpanId
        ? [
            {
              refType: 'CHILD_OF',
              traceID: span.traceId,
              spanID: span.parentSpanId,
            },
          ]
        : undefined,
      startTime: span.startTime.getTime() * 1000, // Converter para microsegundos
      duration: span.duration || 0,
      tags: Object.entries(span.tags).map(([key, value]) => ({ key, value })),
      logs: span.logs.map((log) => ({
        timestamp: log.timestamp.getTime() * 1000,
        fields: [
          { key: 'message', value: log.message },
          { key: 'level', value: log.level },
          ...(log.fields ? Object.entries(log.fields).map(([k, v]) => ({ key: k, value: String(v) })) : []),
        ],
      })),
      status: span.status,
    })),
  };
}

/**
 * Limpar traces antigos
 */
export function cleanupOldTraces(maxAgeMs: number = 3600000): number {
  const now = Date.now();
  let cleaned = 0;
  
  const entries = Array.from(traces.entries());
  for (const [traceId, trace] of entries) {
    if (trace.endTime && now - trace.endTime.getTime() > maxAgeMs) {
      traces.delete(traceId);
      cleaned++;
      
      // Remover spans associados
      for (const span of trace.spans) {
        activeSpans.delete(span.spanId);
      }
    }
  }
  
  console.log(`[Tracing] ${cleaned} traces antigos removidos`);
  
  return cleaned;
}

/**
 * Resetar tracing (para testes)
 */
export function resetTracing(): void {
  activeSpans.clear();
  traces.clear();
}
