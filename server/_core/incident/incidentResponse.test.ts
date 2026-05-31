/**
 * Testes para Incident Response
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createIncident,
  updateIncidentStatus,
  addIncidentAction,
  registerPlaybook,
  getPlaybook,
  getIncident,
  getOpenIncidents,
  getIncidentStatistics,
  resetIncidentResponse,
  type ResponsePlaybook,
} from './incidentResponse';

const mockPlaybook: ResponsePlaybook = {
  type: 'security_breach',
  severity: 'critical',
  steps: [
    {
      order: 1,
      action: 'Isolate affected systems',
      owner: 'ops-team',
      timeLimit: 15,
      successCriteria: 'Systems isolated from network',
    },
    {
      order: 2,
      action: 'Collect forensic evidence',
      owner: 'security-team',
      timeLimit: 60,
      successCriteria: 'Evidence collected and preserved',
    },
    {
      order: 3,
      action: 'Notify stakeholders',
      owner: 'management',
      timeLimit: 30,
      successCriteria: 'All stakeholders notified',
    },
  ],
  escalationPath: ['ops-lead', 'security-lead', 'ciso'],
  estimatedResolutionTime: 240,
};

describe('Incident Response', () => {
  beforeEach(() => {
    resetIncidentResponse();
  });

  describe('Incident Creation', () => {
    it('deve criar novo incidente', () => {
      const incident = createIncident(
        'security_breach',
        'critical',
        'Unauthorized access detected',
        'Suspicious login from unknown IP',
        ['auth-service', 'user-db']
      );

      expect(incident).toBeDefined();
      expect(incident.id).toBeDefined();
      expect(incident.status).toBe('open');
      expect(incident.severity).toBe('critical');
    });

    it('deve rastrear incidente criado', () => {
      createIncident(
        'security_breach',
        'critical',
        'Unauthorized access detected',
        'Suspicious login from unknown IP',
        ['auth-service']
      );

      const stats = getIncidentStatistics();

      expect(stats.totalIncidents).toBe(1);
      expect(stats.openIncidents).toBe(1);
    });
  });

  describe('Incident Status Updates', () => {
    beforeEach(() => {
      createIncident(
        'security_breach',
        'critical',
        'Unauthorized access detected',
        'Suspicious login from unknown IP',
        ['auth-service']
      );
    });

    it('deve atualizar status do incidente', () => {
      const incidents = getOpenIncidents();
      const incidentId = incidents[0].id;

      updateIncidentStatus(incidentId, 'investigating', 'security-team', 'Analyzing logs');

      const incident = getIncident(incidentId);

      expect(incident?.status).toBe('investigating');
    });

    it('deve registrar timestamp de resolução', () => {
      const incidents = getOpenIncidents();
      const incidentId = incidents[0].id;

      updateIncidentStatus(incidentId, 'contained', 'ops-team');
      updateIncidentStatus(incidentId, 'resolved', 'security-team');

      const incident = getIncident(incidentId);

      expect(incident?.resolvedAt).toBeDefined();
    });

    it('deve atualizar estatísticas de resolução', () => {
      const incidents = getOpenIncidents();
      const incidentId = incidents[0].id;

      updateIncidentStatus(incidentId, 'resolved', 'security-team');

      const stats = getIncidentStatistics();

      expect(stats.resolvedIncidents).toBe(1);
      expect(stats.openIncidents).toBe(0);
    });
  });

  describe('Incident Actions', () => {
    beforeEach(() => {
      createIncident(
        'security_breach',
        'critical',
        'Unauthorized access detected',
        'Suspicious login from unknown IP',
        ['auth-service']
      );
    });

    it('deve adicionar ação ao incidente', () => {
      const incidents = getOpenIncidents();
      const incidentId = incidents[0].id;

      addIncidentAction(incidentId, 'Blocked suspicious IP', 'security-team', 'IP 10.0.0.1 blocked');

      const incident = getIncident(incidentId);

      expect(incident?.actions.length).toBeGreaterThan(1);
    });

    it('deve rastrear performer de ações', () => {
      const incidents = getOpenIncidents();
      const incidentId = incidents[0].id;

      addIncidentAction(incidentId, 'Blocked suspicious IP', 'security-team');

      const incident = getIncident(incidentId);
      const lastAction = incident?.actions[incident.actions.length - 1];

      expect(lastAction?.performer).toBe('security-team');
    });
  });

  describe('Playbook Management', () => {
    it('deve registrar playbook', () => {
      registerPlaybook(mockPlaybook);

      const playbook = getPlaybook('security_breach');

      expect(playbook).toBeDefined();
      expect(playbook?.steps.length).toBe(3);
    });

    it('deve obter playbook por tipo', () => {
      registerPlaybook(mockPlaybook);

      const playbook = getPlaybook('security_breach');

      expect(playbook?.type).toBe('security_breach');
      expect(playbook?.severity).toBe('critical');
    });

    it('deve retornar null para playbook não registrado', () => {
      const playbook = getPlaybook('malware_detected');

      expect(playbook).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('deve coletar estatísticas de incidentes', () => {
      createIncident('security_breach', 'critical', 'Test', 'Test', ['service']);

      const stats = getIncidentStatistics();

      expect(stats.totalIncidents).toBe(1);
      expect(stats.openIncidents).toBe(1);
      expect(stats.resolvedIncidents).toBe(0);
    });

    it('deve calcular taxa de resolução', () => {
      createIncident('security_breach', 'critical', 'Test 1', 'Test', ['service']);
      createIncident('data_loss', 'high', 'Test 2', 'Test', ['service']);

      const incidents = getOpenIncidents();
      updateIncidentStatus(incidents[0].id, 'resolved', 'team');

      const stats = getIncidentStatistics();

      expect(stats.resolutionRate).toBeGreaterThan(0);
      expect(stats.resolutionRate).toBeLessThanOrEqual(100);
    });

    it('deve calcular MTTR (Mean Time To Resolve)', () => {
      createIncident('security_breach', 'critical', 'Test', 'Test', ['service']);

      const incidents = getOpenIncidents();
      updateIncidentStatus(incidents[0].id, 'resolved', 'team');

      const stats = getIncidentStatistics();

      expect(stats.mttr).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Query Operations', () => {
    it('deve listar incidentes abertos', () => {
      createIncident('security_breach', 'critical', 'Test 1', 'Test', ['service']);
      createIncident('data_loss', 'high', 'Test 2', 'Test', ['service']);

      const openIncidents = getOpenIncidents();

      expect(openIncidents.length).toBe(2);
    });

    it('deve filtrar incidentes resolvidos', () => {
      createIncident('security_breach', 'critical', 'Test 1', 'Test', ['service']);
      createIncident('data_loss', 'high', 'Test 2', 'Test', ['service']);

      const incidents = getOpenIncidents();
      updateIncidentStatus(incidents[0].id, 'resolved', 'team');

      const openIncidents = getOpenIncidents();

      expect(openIncidents.length).toBe(1);
    });
  });

  describe('Reset', () => {
    it('deve resetar estado', () => {
      createIncident('security_breach', 'critical', 'Test', 'Test', ['service']);

      resetIncidentResponse();

      const stats = getIncidentStatistics();

      expect(stats.totalIncidents).toBe(0);
      expect(getOpenIncidents().length).toBe(0);
    });
  });
});
