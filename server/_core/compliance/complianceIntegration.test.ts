/**
 * Testes de Integração de Conformidade
 * 
 * Validar:
 * - Integração de FIPS 140-2 com fluxos reais
 * - Integração de Distributed Tracing
 * - Integração de ISO 27001
 * - Fluxo end-to-end de conformidade
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  encryptAES256GCM,
  decryptAES256GCM,
  generateSecureKey,
  getCryptoStatistics,
  resetCryptoAuditLogs,
} from '../security/fips140Compliance';
import {
  startTrace,
  startSpan,
  finishSpan,
  finishTrace,
  getTracingStatistics,
  resetTracing,
} from '../observability/distributedTracing';
import {
  registerSecurityControl,
  calculateComplianceScore,
  reportSecurityIncident,
  getIncidentStatistics,
  resetComplianceData,
} from './iso27001SecurityControls';

describe('Compliance Integration', () => {
  beforeEach(() => {
    resetCryptoAuditLogs();
    resetTracing();
    resetComplianceData();
  });

  describe('FIPS 140-2 + Tracing Integration', () => {
    it('deve rastrear operações criptográficas', () => {
      const traceId = startTrace('crypto-service');
      const spanId = startSpan(traceId, 'encrypt', 'crypto-service');

      const key = generateSecureKey(32);
      const encrypted = encryptAES256GCM('sensitive data', key);

      finishSpan(spanId);
      finishTrace(traceId);

      const cryptoStats = getCryptoStatistics();
      const tracingStats = getTracingStatistics();

      expect(cryptoStats.totalOperations).toBeGreaterThan(0);
      expect(tracingStats.completedTraces).toBe(1);
    });

    it('deve registrar falhas de criptografia em traces', () => {
      const traceId = startTrace('crypto-service');
      const spanId = startSpan(traceId, 'decrypt', 'crypto-service');

      const key = generateSecureKey(32);
      const encrypted = encryptAES256GCM('data', key);
      const wrongKey = generateSecureKey(32);

      try {
        decryptAES256GCM(encrypted, wrongKey);
      } catch (error) {
        // Esperado falhar
      }

      finishSpan(spanId);
      finishTrace(traceId);

      const cryptoStats = getCryptoStatistics();

      expect(cryptoStats.failedOperations).toBeGreaterThan(0);
    });
  });

  describe('ISO 27001 + Tracing Integration', () => {
    it('deve rastrear eventos de conformidade', () => {
      const traceId = startTrace('compliance-service');
      const spanId = startSpan(traceId, 'register_control', 'compliance-service');

      registerSecurityControl({
        id: 'A.5.1.1',
        domain: 'A.5',
        name: 'Security Policy',
        description: 'Implementar política de segurança',
        status: 'implemented',
        maturityLevel: 5,
        evidence: [],
      });

      finishSpan(spanId);
      finishTrace(traceId);

      const complianceScore = calculateComplianceScore();
      const tracingStats = getTracingStatistics();

      expect(complianceScore.overallScore).toBe(100);
      expect(tracingStats.completedTraces).toBe(1);
    });

    it('deve rastrear incidentes de segurança', () => {
      const traceId = startTrace('incident-service');
      const spanId = startSpan(traceId, 'report_incident', 'incident-service');

      reportSecurityIncident({
        id: 'INC-001',
        title: 'Security Incident',
        description: 'Teste de incidente',
        severity: 'high',
        type: 'unauthorized_access',
        discoveredDate: new Date(),
        reportedDate: new Date(),
        status: 'open',
        affectedAssets: [],
        correctionActions: [],
      });

      finishSpan(spanId);
      finishTrace(traceId);

      const incidentStats = getIncidentStatistics();
      const tracingStats = getTracingStatistics();

      expect(incidentStats.totalIncidents).toBe(1);
      expect(tracingStats.completedTraces).toBe(1);
    });
  });

  describe('End-to-End Compliance Flow', () => {
    it('deve executar fluxo completo de conformidade', () => {
      // 1. Iniciar trace
      const traceId = startTrace('compliance-flow');

      // 2. Registrar controles
      const controlSpan = startSpan(traceId, 'register_controls', 'compliance-flow');
      registerSecurityControl({
        id: 'A.5.1.1',
        domain: 'A.5',
        name: 'Security Policy',
        description: 'Política de segurança',
        status: 'implemented',
        maturityLevel: 5,
        evidence: [],
      });
      finishSpan(controlSpan);

      // 3. Criptografar dados sensíveis
      const cryptoSpan = startSpan(traceId, 'encrypt_data', 'compliance-flow', controlSpan);
      const key = generateSecureKey(32);
      const encrypted = encryptAES256GCM('sensitive data', key);
      finishSpan(cryptoSpan);

      // 4. Reportar incidente
      const incidentSpan = startSpan(traceId, 'report_incident', 'compliance-flow', cryptoSpan);
      reportSecurityIncident({
        id: 'INC-001',
        title: 'Test Incident',
        description: 'Incidente de teste',
        severity: 'low',
        type: 'other',
        discoveredDate: new Date(),
        reportedDate: new Date(),
        status: 'closed',
        affectedAssets: [],
        correctionActions: [],
      });
      finishSpan(incidentSpan);

      // 5. Finalizar trace
      finishTrace(traceId);

      // 6. Validar resultados
      const complianceScore = calculateComplianceScore();
      const cryptoStats = getCryptoStatistics();
      const incidentStats = getIncidentStatistics();
      const tracingStats = getTracingStatistics();

      expect(complianceScore.overallScore).toBe(100);
      expect(cryptoStats.totalOperations).toBeGreaterThan(0);
      expect(incidentStats.totalIncidents).toBe(1);
      expect(tracingStats.completedTraces).toBe(1);
    });
  });

  describe('Compliance Metrics', () => {
    it('deve coletar métricas de conformidade completas', () => {
      // Registrar controles
      registerSecurityControl({
        id: 'A.5.1.1',
        domain: 'A.5',
        name: 'Security Policy',
        description: 'Política de segurança',
        status: 'implemented',
        maturityLevel: 5,
        evidence: [],
      });

      // Executar operações criptográficas
      const key = generateSecureKey(32);
      encryptAES256GCM('data', key);

      // Rastrear operações
      const traceId = startTrace('metrics-service');
      const spanId = startSpan(traceId, 'operation', 'metrics-service');
      finishSpan(spanId);
      finishTrace(traceId);

      // Coletar métricas
      const complianceScore = calculateComplianceScore();
      const cryptoStats = getCryptoStatistics();
      const tracingStats = getTracingStatistics();

      // Validar métricas
      expect(complianceScore.overallScore).toBe(100);
      expect(complianceScore.implementedControls).toBe(1);
      expect(cryptoStats.successfulOperations).toBeGreaterThan(0);
      expect(tracingStats.completedTraces).toBe(1);
    });
  });
});
