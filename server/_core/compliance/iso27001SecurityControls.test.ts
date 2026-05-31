/**
 * Testes para ISO 27001 Security Controls
 * 
 * Validar:
 * - Security control management
 * - Compliance scoring
 * - Incident management
 * - Risk assessment
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerSecurityControl,
  updateControlStatus,
  addControlEvidence,
  registerSecurityPolicy,
  reportSecurityIncident,
  updateIncidentStatus,
  registerRiskAssessment,
  getSecurityControl,
  getAllSecurityControls,
  getControlsByDomain,
  getControlsByStatus,
  calculateComplianceScore,
  getOpenIncidents,
  getCriticalIncidents,
  getIncidentStatistics,
  getHighRisks,
  getRiskStatistics,
  resetComplianceData,
  type SecurityControl,
  type SecurityPolicy,
  type SecurityIncident,
  type RiskAssessment,
} from './iso27001SecurityControls';

describe('ISO 27001 Security Controls', () => {
  beforeEach(() => {
    resetComplianceData();
  });

  describe('Security Control Management', () => {
    let control: SecurityControl;

    beforeEach(() => {
      control = {
        id: 'A.9.1.1',
        domain: 'A.9',
        name: 'Access Control Policy',
        description: 'Implementar política de controle de acesso',
        status: 'partial',
        maturityLevel: 2,
        evidence: [],
      };
    });

    it('deve registrar controle de segurança', () => {
      registerSecurityControl(control);

      const retrieved = getSecurityControl('A.9.1.1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Access Control Policy');
    });

    it('deve atualizar status de controle', () => {
      registerSecurityControl(control);

      updateControlStatus('A.9.1.1', 'implemented', 4);

      const updated = getSecurityControl('A.9.1.1');

      expect(updated?.status).toBe('implemented');
      expect(updated?.maturityLevel).toBe(4);
    });

    it('deve adicionar evidência de controle', () => {
      registerSecurityControl(control);

      addControlEvidence('A.9.1.1', 'Documento de política assinado');
      addControlEvidence('A.9.1.1', 'Logs de auditoria');

      const updated = getSecurityControl('A.9.1.1');

      expect(updated?.evidence.length).toBe(2);
    });

    it('deve obter controles por domínio', () => {
      registerSecurityControl(control);
      registerSecurityControl({
        ...control,
        id: 'A.9.2.1',
        name: 'User Registration',
      });

      const domainControls = getControlsByDomain('A.9');

      expect(domainControls.length).toBe(2);
    });

    it('deve obter controles por status', () => {
      registerSecurityControl(control);
      registerSecurityControl({
        ...control,
        id: 'A.9.2.1',
        status: 'implemented',
      });

      const partialControls = getControlsByStatus('partial');
      const implementedControls = getControlsByStatus('implemented');

      expect(partialControls.length).toBe(1);
      expect(implementedControls.length).toBe(1);
    });
  });

  describe('Compliance Scoring', () => {
    beforeEach(() => {
      registerSecurityControl({
        id: 'A.5.1.1',
        domain: 'A.5',
        name: 'Information Security Policy',
        description: 'Política de segurança',
        status: 'implemented',
        maturityLevel: 5,
        evidence: [],
      });

      registerSecurityControl({
        id: 'A.9.1.1',
        domain: 'A.9',
        name: 'Access Control',
        description: 'Controle de acesso',
        status: 'partial',
        maturityLevel: 2,
        evidence: [],
      });
    });

    it('deve calcular pontuação de conformidade', () => {
      const score = calculateComplianceScore();

      expect(score.overallScore).toBeGreaterThan(0);
      expect(score.overallScore).toBeLessThanOrEqual(100);
      expect(score.implementedControls).toBe(1);
      expect(score.totalControls).toBe(2);
    });

    it('deve calcular conformidade por domínio', () => {
      const score = calculateComplianceScore();

      expect(score.byDomain['A.5']).toBe(100);
      expect(score.byDomain['A.9']).toBe(50);
    });
  });

  describe('Security Incident Management', () => {
    let incident: SecurityIncident;

    beforeEach(() => {
      incident = {
        id: 'INC-001',
        title: 'Unauthorized Access Attempt',
        description: 'Tentativa de acesso não autorizado detectada',
        severity: 'high',
        type: 'unauthorized_access',
        discoveredDate: new Date(),
        reportedDate: new Date(),
        status: 'open',
        affectedAssets: ['server-01', 'database-01'],
        correctionActions: [],
      };
    });

    it('deve reportar incidente de segurança', () => {
      reportSecurityIncident(incident);

      const open = getOpenIncidents();

      expect(open.length).toBe(1);
      expect(open[0].title).toBe('Unauthorized Access Attempt');
    });

    it('deve atualizar status de incidente', () => {
      reportSecurityIncident(incident);

      updateIncidentStatus('INC-001', 'resolved', ['Patch aplicado', 'Acesso revogado']);

      const incidents = getOpenIncidents();

      expect(incidents.length).toBe(0);
    });

    it('deve obter incidentes críticos', () => {
      reportSecurityIncident(incident);
      reportSecurityIncident({
        ...incident,
        id: 'INC-002',
        severity: 'critical',
      });

      const critical = getCriticalIncidents();

      expect(critical.length).toBe(1);
    });

    it('deve calcular estatísticas de incidentes', () => {
      reportSecurityIncident(incident);
      reportSecurityIncident({
        ...incident,
        id: 'INC-002',
        severity: 'critical',
      });

      const stats = getIncidentStatistics();

      expect(stats.totalIncidents).toBeGreaterThanOrEqual(2);
      expect(stats.openIncidents).toBeGreaterThanOrEqual(2);
      expect(stats.criticalIncidents).toBeGreaterThanOrEqual(1);
      expect(stats.incidentsBySeverity['high']).toBeGreaterThanOrEqual(1);
      expect(stats.incidentsBySeverity['critical']).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Risk Assessment', () => {
    let assessment: RiskAssessment;

    beforeEach(() => {
      assessment = {
        id: 'RISK-001',
        asset: 'Database Server',
        threat: 'SQL Injection',
        vulnerability: 'Input validation not implemented',
        likelihood: 4,
        impact: 5,
        riskScore: 0,
        mitigation: 'Implementar validação de entrada',
        owner: 'Security Team',
        reviewDate: new Date(),
      };
    });

    it('deve registrar avaliação de risco', () => {
      registerRiskAssessment(assessment);

      const risks = getHighRisks();

      expect(risks.length).toBe(1);
      expect(risks[0].riskScore).toBe(20);
    });

    it('deve obter riscos altos', () => {
      registerRiskAssessment(assessment);
      registerRiskAssessment({
        ...assessment,
        id: 'RISK-002',
        likelihood: 2,
        impact: 2,
      });

      const highRisks = getHighRisks();

      expect(highRisks.length).toBe(1);
    });

    it('deve calcular estatísticas de risco', () => {
      registerRiskAssessment(assessment);
      registerRiskAssessment({
        ...assessment,
        id: 'RISK-002',
        likelihood: 2,
        impact: 2,
      });

      const stats = getRiskStatistics();

      expect(stats.totalRisks).toBe(2);
      expect(stats.highRisks).toBe(1);
      expect(stats.averageRiskScore).toBeGreaterThan(0);
    });
  });

  describe('Compliance Reporting', () => {
    it('deve gerar relatório de conformidade completo', () => {
      registerSecurityControl({
        id: 'A.5.1.1',
        domain: 'A.5',
        name: 'Information Security Policy',
        description: 'Política de segurança',
        status: 'implemented',
        maturityLevel: 5,
        evidence: ['Policy document'],
      });

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

      const compliance = calculateComplianceScore();
      const incidents = getIncidentStatistics();

      expect(compliance.overallScore).toBe(100);
      expect(incidents.totalIncidents).toBe(1);
    });
  });
});
