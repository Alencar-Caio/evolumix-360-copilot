/**
 * Metrics - Gap 6
 * Prometheus para coleta de métricas
 */

// @ts-ignore
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Database metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
});

export const dbConnectionPoolSize = new Gauge({
  name: 'db_connection_pool_size',
  help: 'Current database connection pool size',
});

// LLM metrics
export const llmRequestDuration = new Histogram({
  name: 'llm_request_duration_seconds',
  help: 'Duration of LLM requests',
  labelNames: ['model', 'status'],
  buckets: [1, 5, 10, 30, 60],
});

export const llmTokensUsed = new Counter({
  name: 'llm_tokens_used_total',
  help: 'Total tokens used by LLM',
  labelNames: ['model', 'type'],
});

// Business metrics
export const diagnosticsCreated = new Counter({
  name: 'diagnostics_created_total',
  help: 'Total diagnostics created',
});

export const documentsProcessed = new Counter({
  name: 'documents_processed_total',
  help: 'Total documents processed',
  labelNames: ['document_type', 'status'],
});

// Expose metrics endpoint
export function getMetricsEndpoint() {
  return register.metrics();
}

// Health check para metrics
export function getMetricsHealth() {
  return {
    status: 'healthy',
    metrics: {
      httpRequests: 0,
      dbQueries: 0,
      llmRequests: 0,
    },
  };
}
