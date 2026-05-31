/**
 * Incident Response Playbook
 * 
 * Responsabilidade: Gerenciar resposta a incidentes de segurança
 * 
 * Implementa:
 * - Detecção de incidentes
 * - Classificação de severidade
 * - Plano de resposta
 * - Rastreamento de resolução
 */

/**
 * Tipo de incidente
 */
export type IncidentType = 
  | 'security_breach'
  | 'data_loss'
  | 'unauthorized_access'
  | 'malware_detected'
  | 'ddos_attack'
  | 'service_degradation'
  | 'configuration_error';

/**
 * Severidade do incidente
 */
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Status do incidente
 */
export type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';

/**
 * Incidente de segurança
 */
export interface SecurityIncident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  detectedAt: Date;
  reportedAt?: Date;
  containedAt?: Date;
  resolvedAt?: Date;
  affectedSystems: string[];
  affectedUsers: number;
  rootCause?: string;
  actions: IncidentAction[];
}

/**
 * Ação tomada em resposta ao incidente
 */
export interface IncidentAction {
  timestamp: Date;
  action: string;
  performer: string;
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
}

/**
 * Playbook de resposta
 */
export interface ResponsePlaybook {
  type: IncidentType;
  severity: IncidentSeverity;
  steps: PlaybookStep[];
  escalationPath: string[];
  estimatedResolutionTime: number; // minutos
}

/**
 * Passo do playbook
 */
export interface PlaybookStep {
  order: number;
  action: string;
  owner: string;
  timeLimit: number; // minutos
  successCriteria: string;
}

// Armazenamento de estado
let incidents: Map<string, SecurityIncident> = new Map();
let playbooks: Map<IncidentType, ResponsePlaybook> = new Map();
let stats = {
  totalIncidents: 0,
  openIncidents: 0,
  resolvedIncidents: 0,
  averageResolutionTime: 0,
};

/**
 * Criar novo incidente
 */
export function createIncident(
  type: IncidentType,
  severity: IncidentSeverity,
  title: string,
  description: string,
  affectedSystems: string[]
): SecurityIncident {
  const id = `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const incident: SecurityIncident = {
    id,
    type,
    severity,
    status: 'open',
    title,
    description,
    detectedAt: new Date(),
    affectedSystems,
    affectedUsers: 0,
    actions: [
      {
        timestamp: new Date(),
        action: 'Incident created',
        performer: 'system',
        status: 'completed',
      },
    ],
  };

  incidents.set(id, incident);
  stats.totalIncidents++;
  stats.openIncidents++;

  console.log(`[IncidentResponse] Incident created: ${id} (${severity})`);

  return incident;
}

/**
 * Atualizar status do incidente
 */
export function updateIncidentStatus(
  incidentId: string,
  newStatus: IncidentStatus,
  performer: string,
  notes?: string
): SecurityIncident | null {
  const incident = incidents.get(incidentId);
  if (!incident) return null;

  const oldStatus = incident.status;
  incident.status = newStatus;

  // Atualizar timestamps
  if (newStatus === 'contained' && !incident.containedAt) {
    incident.containedAt = new Date();
  }
  if (newStatus === 'resolved' && !incident.resolvedAt) {
    incident.resolvedAt = new Date();
    stats.resolvedIncidents++;
    stats.openIncidents--;

    // Calcular tempo de resolução
    const resolutionTime = incident.resolvedAt.getTime() - incident.detectedAt.getTime();
    const resolutionMinutes = resolutionTime / (1000 * 60);
    stats.averageResolutionTime =
      (stats.averageResolutionTime * (stats.resolvedIncidents - 1) + resolutionMinutes) /
      stats.resolvedIncidents;
  }

  incident.actions.push({
    timestamp: new Date(),
    action: `Status changed from ${oldStatus} to ${newStatus}`,
    performer,
    status: 'completed',
    notes,
  });

  console.log(`[IncidentResponse] Incident ${incidentId} status: ${oldStatus} → ${newStatus}`);

  return incident;
}

/**
 * Adicionar ação ao incidente
 */
export function addIncidentAction(
  incidentId: string,
  action: string,
  performer: string,
  notes?: string
): SecurityIncident | null {
  const incident = incidents.get(incidentId);
  if (!incident) return null;

  incident.actions.push({
    timestamp: new Date(),
    action,
    performer,
    status: 'completed',
    notes,
  });

  return incident;
}

/**
 * Registrar playbook
 */
export function registerPlaybook(playbook: ResponsePlaybook): void {
  playbooks.set(playbook.type, playbook);

  console.log(`[IncidentResponse] Playbook registered for ${playbook.type}`);
}

/**
 * Obter playbook para tipo de incidente
 */
export function getPlaybook(type: IncidentType): ResponsePlaybook | null {
  return playbooks.get(type) || null;
}

/**
 * Obter incidente
 */
export function getIncident(incidentId: string): SecurityIncident | null {
  return incidents.get(incidentId) || null;
}

/**
 * Listar incidentes abertos
 */
export function getOpenIncidents(): SecurityIncident[] {
  return Array.from(incidents.values()).filter((i) => i.status === 'open' || i.status === 'investigating');
}

/**
 * Obter estatísticas
 */
export function getIncidentStatistics() {
  return {
    ...stats,
    mttr: Math.round(stats.averageResolutionTime), // Mean Time To Resolve
    resolutionRate:
      stats.totalIncidents > 0 ? (stats.resolvedIncidents / stats.totalIncidents) * 100 : 0,
  };
}

/**
 * Resetar (para testes)
 */
export function resetIncidentResponse(): void {
  incidents.clear();
  playbooks.clear();
  stats = {
    totalIncidents: 0,
    openIncidents: 0,
    resolvedIncidents: 0,
    averageResolutionTime: 0,
  };
}
