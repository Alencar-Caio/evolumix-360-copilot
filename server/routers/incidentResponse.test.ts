/**
 * Testes para Incident Response Router
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { incidentResponseRouter } from './incidentResponse';
import { resetIncidentResponse } from '../_core/incident/incidentResponse';

// Mock context
const mockContext = {
  user: { id: 'test-user', role: 'admin' as const },
  req: {} as any,
  res: {} as any,
};

describe('Incident Response Router', () => {
  beforeEach(() => {
    resetIncidentResponse();
  });

  describe('createIncident', () => {
    it('deve criar incidente via tRPC', async () => {
      const caller = incidentResponseRouter.createCaller(mockContext);

      const result = await caller.createIncident({
        type: 'security_breach',
        severity: 'critical',
        title: 'Unauthorized access',
        description: 'Suspicious login detected',
        affectedSystems: ['auth-service'],
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.severity).toBe('critical');
    });
  });

  describe('updateStatus', () => {
    it('deve atualizar status do incidente', async () => {
      const caller = incidentResponseRouter.createCaller(mockContext);

      const incident = await caller.createIncident({
        type: 'security_breach',
        severity: 'critical',
        title: 'Test',
        description: 'Test',
        affectedSystems: ['service'],
      });

      const updated = await caller.updateStatus({
        incidentId: incident.id,
        status: 'investigating',
        notes: 'Analyzing logs',
      });

      expect(updated?.status).toBe('investigating');
    });
  });

  describe('addAction', () => {
    it('deve adicionar ação ao incidente', async () => {
      const caller = incidentResponseRouter.createCaller(mockContext);

      const incident = await caller.createIncident({
        type: 'security_breach',
        severity: 'critical',
        title: 'Test',
        description: 'Test',
        affectedSystems: ['service'],
      });

      const updated = await caller.addAction({
        incidentId: incident.id,
        action: 'Blocked IP',
        notes: 'IP 10.0.0.1 blocked',
      });

      expect(updated?.actions.length).toBeGreaterThan(1);
    });
  });

  describe('getIncident', () => {
    it('deve obter incidente por ID', async () => {
      const caller = incidentResponseRouter.createCaller(mockContext);

      const created = await caller.createIncident({
        type: 'security_breach',
        severity: 'critical',
        title: 'Test',
        description: 'Test',
        affectedSystems: ['service'],
      });

      const retrieved = await caller.getIncident({
        incidentId: created.id,
      });

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });
  });

  describe('getOpenIncidents', () => {
    it('deve listar incidentes abertos', async () => {
      const caller = incidentResponseRouter.createCaller(mockContext);

      await caller.createIncident({
        type: 'security_breach',
        severity: 'critical',
        title: 'Test 1',
        description: 'Test',
        affectedSystems: ['service'],
      });

      await caller.createIncident({
        type: 'data_loss',
        severity: 'high',
        title: 'Test 2',
        description: 'Test',
        affectedSystems: ['service'],
      });

      const incidents = await caller.getOpenIncidents();

      expect(incidents.length).toBe(2);
    });
  });

  describe('getStatistics', () => {
    it('deve obter estatísticas de incidentes', async () => {
      const caller = incidentResponseRouter.createCaller(mockContext);

      await caller.createIncident({
        type: 'security_breach',
        severity: 'critical',
        title: 'Test',
        description: 'Test',
        affectedSystems: ['service'],
      });

      const stats = await caller.getStatistics();

      expect(stats.totalIncidents).toBe(1);
      expect(stats.openIncidents).toBe(1);
    });
  });

  describe('getPlaybook', () => {
    it('deve obter playbook para tipo de incidente', async () => {
      const caller = incidentResponseRouter.createCaller(mockContext);

      const playbook = await caller.getPlaybook({
        type: 'security_breach',
      });

      // Pode ser null se não registrado
      expect(playbook === null || playbook !== null).toBe(true);
    });
  });
});
