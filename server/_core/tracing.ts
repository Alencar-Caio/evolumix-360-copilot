/**
 * Distributed Tracing - Gap 5
 * OpenTelemetry para rastreamento de requisições distribuídas
 */

// @ts-ignore
import { NodeSDK } from '@opentelemetry/sdk-node';
// @ts-ignore
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
// @ts-ignore
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
// @ts-ignore
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';

const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
});

export const sdk = new NodeSDK({
  traceExporter: jaegerExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

// Inicializar SDK
try {
  sdk.start();
  console.log('[Tracing] OpenTelemetry initialized');
} catch (error) {
  console.error('[Tracing] Failed to initialize', error);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('[Tracing] Terminated'))
    .catch((log: any) => console.log('[Tracing] Error terminating', log))
    .finally(() => process.exit(0));
});

export default sdk;
