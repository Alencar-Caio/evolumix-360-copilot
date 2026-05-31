/**
 * ISO 27001 Security Controls
 * 
 * Responsabilidade: Implementar controles de segurança conforme ISO 27001
 * 
 * Domínios ISO 27001:
 * A.5 - Políticas de segurança
 * A.6 - Organização da segurança
 * A.7 - Segurança de recursos humanos
 * A.8 - Gestão de ativos
 * A.9 - Controle de acesso
 * A.10 - Criptografia
 * A.11 - Segurança física e ambiental
 * A.12 - Operações e comunicações
 * A.13 - Aquisição, desenvolvimento e manutenção
 * A.14 - Relações com fornecedores
 * A.15 - Gestão de incidentes
 * A.16 - Continuidade de negócios
 * A.17 - Conformidade
 * 
 * Justificativa:
 * - Conformidade regulatória internacional
 * - Proteção de dados e privacidade
 * - Gestão de riscos
 * - Confiança de clientes
 */

/**
 * Estrutura de controle de segurança
 */
export interface SecurityControl {
  id: string;
  domain: string; // A.5, A.6, etc
  name: string;
  description: string;
  status: 'implemented' | 'partial' | 'not_implemented' | 'planned';
  maturityLevel: number; // 1-5
  evidence: string[];
  lastAudit?: Date;
  nextAudit?: Date;
}

/**
 * Estrutura de política de segurança
 */
export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  version: string;
  effectiveDate: Date;
  reviewDate: Date;
  owner: string;
  approver: string;
  controls: string[]; // IDs dos controles
}

/**
 * Estrutura de incidente de segurança
 */
export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'breach' | 'vulnerability' | 'unauthorized_access' | 'data_loss' | 'other';
  discoveredDate: Date;
  reportedDate: Date;
  resolvedDate?: Date;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  affectedAssets: string[];
  rootCause?: string;
  correctionActions: string[];
}

/**
 * Estrutura de avaliação de risco
 */
export interface RiskAssessment {
  id: string;
  asset: string;
  threat: string;
  vulnerability: string;
  likelihood: number; // 1-5
  impact: number; // 1-5
  riskScore: number; // likelihood * impact
  mitigation: string;
  owner: string;
  reviewDate: Date;
}

// Controles de segurança
let securityControls: Map<string, SecurityControl> = new Map();
let securityPolicies: Map<string, SecurityPolicy> = new Map();
let securityIncidents: Map<string, SecurityIncident> = new Map();
let riskAssessments: Map<string, RiskAssessment> = new Map();

/**
 * Registrar controle de segurança
 */
export function registerSecurityControl(control: SecurityControl): void {
  securityControls.set(control.id, control);
  console.log(`[ISO27001] Controle registrado: ${control.id} - ${control.name}`);
}

/**
 * Atualizar status de controle
 */
export function updateControlStatus(
  controlId: string,
  status: SecurityControl['status'],
  maturityLevel: number
): void {
  const control = securityControls.get(controlId);
  if (control) {
    control.status = status;
    control.maturityLevel = Math.min(5, Math.max(1, maturityLevel));
    control.lastAudit = new Date();
    console.log(`[ISO27001] Controle atualizado: ${controlId} - ${status} (nível ${maturityLevel})`);
  }
}

/**
 * Adicionar evidência de controle
 */
export function addControlEvidence(controlId: string, evidence: string): void {
  const control = securityControls.get(controlId);
  if (control) {
    control.evidence.push(evidence);
    console.log(`[ISO27001] Evidência adicionada ao controle: ${controlId}`);
  }
}

/**
 * Registrar política de segurança
 */
export function registerSecurityPolicy(policy: SecurityPolicy): void {
  securityPolicies.set(policy.id, policy);
  console.log(`[ISO27001] Política registrada: ${policy.id} - ${policy.name}`);
}

/**
 * Registrar incidente de segurança
 */
export function reportSecurityIncident(incident: SecurityIncident): void {
  securityIncidents.set(incident.id, incident);
  console.log(
    `[ISO27001] Incidente reportado: ${incident.id} - ${incident.title} (${incident.severity})`
  );
}

/**
 * Atualizar status de incidente
 */
export function updateIncidentStatus(
  incidentId: string,
  status: SecurityIncident['status'],
  correctionActions?: string[]
): void {
  const incident = securityIncidents.get(incidentId);
  if (incident) {
    incident.status = status;
    if (correctionActions) {
      incident.correctionActions.push(...correctionActions);
    }
    if (status === 'resolved' || status === 'closed') {
      incident.resolvedDate = new Date();
    }
    console.log(`[ISO27001] Incidente atualizado: ${incidentId} - ${status}`);
  }
}

/**
 * Registrar avaliação de risco
 */
export function registerRiskAssessment(assessment: RiskAssessment): void {
  assessment.riskScore = assessment.likelihood * assessment.impact;
  riskAssessments.set(assessment.id, assessment);
  console.log(
    `[ISO27001] Avaliação de risco registrada: ${assessment.id} - Score: ${assessment.riskScore}`
  );
}

/**
 * Obter controle de segurança
 */
export function getSecurityControl(controlId: string): SecurityControl | undefined {
  return securityControls.get(controlId);
}

/**
 * Obter todos os controles
 */
export function getAllSecurityControls(): SecurityControl[] {
  return Array.from(securityControls.values());
}

/**
 * Obter controles por domínio
 */
export function getControlsByDomain(domain: string): SecurityControl[] {
  return Array.from(securityControls.values()).filter((c) => c.domain === domain);
}

/**
 * Obter controles por status
 */
export function getControlsByStatus(status: SecurityControl['status']): SecurityControl[] {
  return Array.from(securityControls.values()).filter((c) => c.status === status);
}

/**
 * Calcular conformidade geral
 */
export function calculateComplianceScore(): {
  overallScore: number;
  byDomain: Record<string, number>;
  implementedControls: number;
  totalControls: number;
} {
  const controls = Array.from(securityControls.values());
  const implemented = controls.filter((c) => c.status === 'implemented').length;
  const partial = controls.filter((c) => c.status === 'partial').length;

  const score = controls.length > 0 ? ((implemented + partial * 0.5) / controls.length) * 100 : 0;

  const byDomain: Record<string, number> = {};
  const domains = Array.from(new Set(controls.map((c) => c.domain)));

  for (const domain of domains) {
    const domainControls = controls.filter((c) => c.domain === domain);
    const domainImplemented = domainControls.filter((c) => c.status === 'implemented').length;
    const domainPartial = domainControls.filter((c) => c.status === 'partial').length;
    byDomain[domain] =
      domainControls.length > 0
        ? ((domainImplemented + domainPartial * 0.5) / domainControls.length) * 100
        : 0;
  }

  return {
    overallScore: Math.round(score * 100) / 100,
    byDomain,
    implementedControls: implemented,
    totalControls: controls.length,
  };
}

/**
 * Obter incidentes abertos
 */
export function getOpenIncidents(): SecurityIncident[] {
  return Array.from(securityIncidents.values()).filter((i) => i.status === 'open' || i.status === 'investigating');
}

/**
 * Obter incidentes críticos
 */
export function getCriticalIncidents(): SecurityIncident[] {
  return Array.from(securityIncidents.values()).filter((i) => i.severity === 'critical');
}

/**
 * Calcular estatísticas de incidentes
 */
export function getIncidentStatistics(): {
  totalIncidents: number;
  openIncidents: number;
  criticalIncidents: number;
  averageResolutionTime: number;
  incidentsBySeverity: Record<string, number>;
} {
  const incidents = Array.from(securityIncidents.values());
  const open = incidents.filter((i) => i.status === 'open' || i.status === 'investigating');
  const critical = incidents.filter((i) => i.severity === 'critical');
  const resolved = incidents.filter((i) => i.resolvedDate);

  const avgResolutionTime =
    resolved.length > 0
      ? resolved.reduce(
          (sum, i) =>
            sum +
            ((i.resolvedDate?.getTime() || 0) - i.discoveredDate.getTime()) /
              (1000 * 60 * 60 * 24),
          0
        ) / resolved.length
      : 0;

  const bySeverity: Record<string, number> = {};
  for (const incident of incidents) {
    bySeverity[incident.severity] = (bySeverity[incident.severity] || 0) + 1;
  }

  return {
    totalIncidents: incidents.length,
    openIncidents: open.length,
    criticalIncidents: critical.length,
    averageResolutionTime: Math.round(avgResolutionTime * 100) / 100,
    incidentsBySeverity: bySeverity,
  };
}

/**
 * Obter riscos altos
 */
export function getHighRisks(): RiskAssessment[] {
  return Array.from(riskAssessments.values()).filter((r) => r.riskScore >= 15);
}

/**
 * Calcular estatísticas de risco
 */
export function getRiskStatistics(): {
  totalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  averageRiskScore: number;
} {
  const risks = Array.from(riskAssessments.values());
  const high = risks.filter((r) => r.riskScore >= 15);
  const medium = risks.filter((r) => r.riskScore >= 9 && r.riskScore < 15);
  const low = risks.filter((r) => r.riskScore < 9);

  const avgScore = risks.length > 0 ? risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length : 0;

  return {
    totalRisks: risks.length,
    highRisks: high.length,
    mediumRisks: medium.length,
    lowRisks: low.length,
    averageRiskScore: Math.round(avgScore * 100) / 100,
  };
}

/**
 * Resetar dados de conformidade (para testes)
 */
export function resetComplianceData(): void {
  securityControls.clear();
  securityPolicies.clear();
  securityIncidents.clear();
  riskAssessments.clear();
}
