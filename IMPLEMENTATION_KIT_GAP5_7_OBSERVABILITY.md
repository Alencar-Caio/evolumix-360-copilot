# Implementation Kit - Gaps 5-7: Observabilidade Enterprise

**Gaps Cobertos:**
- Gap 5: Distributed Tracing (OpenTelemetry)
- Gap 6: Metrics e Alertas (Prometheus)
- Gap 7: Logging Estruturado (ELK Stack)

**Status:** Pronto para Implementação  
**Tempo Estimado:** 24 horas  
**Dificuldade:** Alta  
**Dependências:** @opentelemetry/*, prometheus, winston

---

## 📋 Checklist

- [ ] `pnpm add @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto @opentelemetry/exporter-jaeger`
- [ ] `pnpm add prom-client`
- [ ] `pnpm add winston winston-elasticsearch`
- [ ] Criar `server/_core/tracing.ts`
- [ ] Criar `server/_core/metrics.ts`
- [ ] Criar `server/_core/structuredLogger.ts`
- [ ] Integrar em `server/_core/index.ts`
- [ ] Criar docker-compose para stack (Jaeger, Prometheus, Elasticsearch)
- [ ] Testes

---

## 📝 Gap 5: Distributed Tracing

**Arquivo:** `server/_core/tracing.ts`

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';

const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
});

export const sdk = new NodeSDK({
  traceExporter: jaegerExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

console.log('Tracing initialized');

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((log) => console.log('Error terminating tracing', log))
    .finally(() => process.exit(0));
});
```

**Arquivo:** `server/_core/index.ts` (adicionar no início)

```typescript
// Inicializar tracing ANTES de qualquer outro import
import './tracing';

// ... resto dos imports
```

---

## 📝 Gap 6: Metrics

**Arquivo:** `server/_core/metrics.ts`

```typescript
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
  labelNames: ['model', 'type'], // type: 'input' or 'output'
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
```

**Integrar em Express:**

```typescript
import { Router } from 'express';
import { getMetricsEndpoint } from './_core/metrics';

const metricsRouter = Router();

metricsRouter.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(getMetricsEndpoint());
});

app.use('/', metricsRouter);
```

---

## 📝 Gap 7: Logging Estruturado

**Arquivo:** `server/_core/structuredLogger.ts`

```typescript
import winston from 'winston';
import ElasticsearchTransport from 'winston-elasticsearch';

const esTransport = new ElasticsearchTransport({
  level: 'info',
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  },
  index: 'evolumix-logs',
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'evolumix-360-copilot',
    environment: process.env.NODE_ENV,
    version: '2.0.0',
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    esTransport,
  ],
});

// Log uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({ filename: 'exceptions.log' })
);

// Log unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});
```

---

## 🐳 Docker Compose Stack

**Arquivo:** `docker-compose.observability.yml`

```yaml
version: '3.8'

services:
  # Jaeger para distributed tracing
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # UI
      - "14268:14268"  # Collector
    environment:
      COLLECTOR_ZIPKIN_HOST_PORT: ":9411"

  # Prometheus para métricas
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'

  # Elasticsearch para logs
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data

  # Kibana para visualizar logs
  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200

volumes:
  elasticsearch-data:
```

**Arquivo:** `prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'evolumix-copilot'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

---

## 🚀 Iniciar Stack

```bash
# Iniciar observabilidade
docker-compose -f docker-compose.observability.yml up -d

# Acessar
# Jaeger UI: http://localhost:16686
# Prometheus: http://localhost:9090
# Kibana: http://localhost:5601
```

---

## 📊 Dashboards Recomendados

### Jaeger
- Trace latency distribution
- Error rate by service
- Service dependencies

### Prometheus
- Request rate (req/sec)
- Error rate (%)
- P95 latency (ms)
- Database query duration
- LLM token usage

### Kibana
- Error logs by service
- Request path distribution
- User activity timeline
- Performance bottlenecks

---

## ✅ Validação

- [ ] Jaeger recebendo traces
- [ ] Prometheus scrapeando métricas
- [ ] Elasticsearch recebendo logs
- [ ] Kibana visualizando logs
- [ ] Dashboards criados

