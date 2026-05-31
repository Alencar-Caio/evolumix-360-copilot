/**
 * Testes do Compliance Router
 * 
 * Validar:
 * - Endpoints de conformidade
 * - Integração com tRPC
 * - Tracing de requisições
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { complianceRouter } from './compliance';
import { resetTracing } from '../_core/observability/distributedTracing';
import { resetComplianceData } from '../_core/compliance/iso27001SecurityControls';
import { resetCryptoAuditLogs } from '../_core/security/fips140Compliance';

// Mock context
const mockContext = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    role: 'admin' as const,
  },
  req: {} as any,
  res: {} as any,
};

const mockPublicContext = {
  user: null,
  req: {} as any,
  res: {} as any,
};

describe('Compliance Router', () => {
  beforeEach(() => {
    resetTracing();
    resetComplianceData();
    resetCryptoAuditLogs();
  });

  describe('getComplianceScore', () => {
    it('deve retornar pontuação de conformidade', async () => {
      const caller = complianceRouter.createCaller(mockPublicContext);

      const result = await caller.getComplianceScore();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.data?.overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe('getIncidentStats', () => {
    it('deve retornar estatísticas de incidentes', async () => {
      const caller = complianceRouter.createCaller(mockPublicContext);

      const result = await caller.getIncidentStats();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.totalIncidents).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getTracingStats', () => {
    it('deve retornar estatísticas de tracing', async () => {
      const caller = complianceRouter.createCaller(mockPublicContext);

      const result = await caller.getTracingStats();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.completedTraces).toBeGreaterThanOrEqual(0);
    });
  });

  describe('registerControl', () => {
    it('deve registrar controle de segurança (admin)', async () => {
      const caller = complianceRouter.createCaller(mockContext);

      const result = await caller.registerControl({
        id: 'A.5.1.1',
        domain: 'A.5',
        name: 'Security Policy',
        description: 'Implementar política de segurança',
        status: 'implemented',
        maturityLevel: 5,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('A.5.1.1');
    });

    it('deve rejeitar registro de controle (não admin)', async () => {
      const userContext = {
        ...mockContext,
        user: { ...mockContext.user, role: 'user' as const },
      };

      const caller = complianceRouter.createCaller(userContext);

      const result = await caller.registerControl({
        id: 'A.5.1.1',
        domain: 'A.5',
        name: 'Security Policy',
        description: 'Implementar política de segurança',
        status: 'implemented',
        maturityLevel: 5,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('admin');
    });
  });

  describe('reportIncident', () => {
    it('deve reportar incidente de segurança', async () => {
      const caller = complianceRouter.createCaller(mockContext);

      const result = await caller.reportIncident({
        title: 'Test Incident',
        description: 'Incidente de teste',
        severity: 'high',
        type: 'unauthorized_access',
        affectedAssets: ['server-01'],
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe('Test Incident');
      expect(result.data?.status).toBe('open');
    });

    it('deve gerar ID único para cada incidente', async () => {
      const caller = complianceRouter.createCaller(mockContext);

      const result1 = await caller.reportIncident({
        title: 'Incident 1',
        description: 'Primeiro incidente',
        severity: 'low',
        type: 'other',
        affectedAssets: [],
      });

      const result2 = await caller.reportIncident({
        title: 'Incident 2',
        description: 'Segundo incidente',
        severity: 'low',
        type: 'other',
        affectedAssets: [],
      });

      expect(result1.data?.id).not.toBe(result2.data?.id);
    });
  });

  describe('Integration', () => {
    it('deve executar fluxo completo de conformidade via router', async () => {
      const adminCaller = complianceRouter.createCaller(mockContext);
      const publicCaller = complianceRouter.createCaller(mockPublicContext);

      // 1. Registrar controle
      const controlResult = await adminCaller.registerControl({
        id: 'A.5.1.1',
        domain: 'A.5',
        name: 'Security Policy',
        description: 'Política de segurança',
        status: 'implemented',
        maturityLevel: 5,
      });

      expect(controlResult.success).toBe(true);

      // 2. Reportar incidente
      const incidentResult = await adminCaller.reportIncident({
        title: 'Test Incident',
        description: 'Incidente de teste',
        severity: 'high',
        type: 'unauthorized_access',
        affectedAssets: ['server-01'],
      });

      expect(incidentResult.success).toBe(true);

      // 3. Obter estatísticas
      const scoreResult = await publicCaller.getComplianceScore();
      const incidentStatsResult = await publicCaller.getIncidentStats();
      const tracingStatsResult = await publicCaller.getTracingStats();

      expect(scoreResult.success).toBe(true);
      expect(scoreResult.data?.overallScore).toBe(100);
      expect(incidentStatsResult.success).toBe(true);
      expect(incidentStatsResult.data?.totalIncidents).toBe(1);
      expect(tracingStatsResult.success).toBe(true);
      expect(tracingStatsResult.data?.completedTraces).toBeGreaterThan(0);
    });
  });
});
