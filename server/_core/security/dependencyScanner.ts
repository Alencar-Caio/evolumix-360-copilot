/**
 * Dependency Scanner
 * 
 * Responsabilidade: Escanear dependências e gerar SBOM
 * 
 * Implementa:
 * - SBOM (Software Bill of Materials) generation
 * - Detecção de vulnerabilidades conhecidas
 * - Rastreamento de licenças
 * - Auditoria de dependências
 */

/**
 * Informação de dependência
 */
export interface Dependency {
  name: string;
  version: string;
  license: string;
  vulnerabilities: Vulnerability[];
  lastUpdated: Date;
}

/**
 * Vulnerabilidade conhecida
 */
export interface Vulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedVersions: string[];
  fixedVersion?: string;
}

/**
 * SBOM (Software Bill of Materials)
 */
export interface SBOM {
  generatedAt: Date;
  appVersion: string;
  dependencies: Dependency[];
  vulnerabilities: Vulnerability[];
  licenseCompliance: LicenseCompliance;
}

/**
 * Conformidade de licenças
 */
export interface LicenseCompliance {
  totalDependencies: number;
  licensedDependencies: number;
  unknownLicenses: number;
  restrictiveLicenses: string[];
}

// Banco de dados simulado de vulnerabilidades conhecidas
const KNOWN_VULNERABILITIES: Map<string, Vulnerability[]> = new Map([
  [
    'lodash',
    [
      {
        id: 'CVE-2021-23337',
        severity: 'high',
        description: 'Prototype pollution in lodash',
        affectedVersions: ['<4.17.21'],
        fixedVersion: '4.17.21',
      },
    ],
  ],
  [
    'express',
    [
      {
        id: 'CVE-2022-24999',
        severity: 'medium',
        description: 'Regular expression DoS in express',
        affectedVersions: ['<4.18.1'],
        fixedVersion: '4.18.1',
      },
    ],
  ],
]);

// Banco de dados de licenças restritivas
const RESTRICTIVE_LICENSES = ['GPL', 'AGPL', 'SSPL'];

// Armazenamento de estado
let scannedDependencies: Map<string, Dependency> = new Map();
let lastScanTime: Date | null = null;

/**
 * Adicionar dependência ao scanner
 */
export function addDependency(dep: Dependency): void {
  // Verificar vulnerabilidades conhecidas
  const knownVulns = KNOWN_VULNERABILITIES.get(dep.name) || [];
  dep.vulnerabilities = knownVulns.filter((vuln) => {
    return vuln.affectedVersions.some((affectedVersion) => {
      // Comparacao de versao: se afetada eh < 4.17.21 e versao eh 4.17.20, eh vulneravel
      if (affectedVersion.startsWith('<')) {
        const threshold = affectedVersion.substring(1);
        return compareVersions(dep.version, threshold) < 0;
      }
      return false;
    });
  });

  scannedDependencies.set(dep.name, dep);
}

/**
 * Comparar versoes (simples)
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }

  return 0;
}

/**
 * Gerar SBOM
 */
export function generateSBOM(appVersion: string): SBOM {
  const dependencies = Array.from(scannedDependencies.values());
  const allVulnerabilities = dependencies.flatMap((d) => d.vulnerabilities);

  const licensedDeps = dependencies.filter((d) => d.license && d.license !== 'Unknown').length;
  const unknownLicenses = dependencies.length - licensedDeps;
  const restrictiveLicenses = Array.from(
    new Set(
      dependencies
        .filter((d) => RESTRICTIVE_LICENSES.some((rl) => d.license.includes(rl)))
        .map((d) => d.license)
    )
  );

  lastScanTime = new Date();

  return {
    generatedAt: lastScanTime,
    appVersion,
    dependencies,
    vulnerabilities: allVulnerabilities,
    licenseCompliance: {
      totalDependencies: dependencies.length,
      licensedDependencies: licensedDeps,
      unknownLicenses,
      restrictiveLicenses,
    },
  };
}

/**
 * Obter vulnerabilidades críticas
 */
export function getCriticalVulnerabilities(): Vulnerability[] {
  const allVulns = Array.from(scannedDependencies.values()).flatMap((d) => d.vulnerabilities);
  return allVulns.filter((v) => v.severity === 'critical');
}

/**
 * Obter relatório de conformidade de licenças
 */
export function getLicenseComplianceReport(): LicenseCompliance {
  const dependencies = Array.from(scannedDependencies.values());
  const licensedDeps = dependencies.filter((d) => d.license && d.license !== 'Unknown').length;
  const unknownLicenses = dependencies.length - licensedDeps;
  const restrictiveLicenses = Array.from(
    new Set(
      dependencies
        .filter((d) => RESTRICTIVE_LICENSES.some((rl) => d.license.includes(rl)))
        .map((d) => d.license)
    )
  );

  return {
    totalDependencies: dependencies.length,
    licensedDependencies: licensedDeps,
    unknownLicenses,
    restrictiveLicenses,
  };
}

/**
 * Obter estatísticas de scanner
 */
export function getScannerStatistics() {
  const dependencies = Array.from(scannedDependencies.values());
  const vulnerableDeps = dependencies.filter((d) => d.vulnerabilities.length > 0);
  const allVulns = dependencies.flatMap((d) => d.vulnerabilities);
  const criticalVulns = allVulns.filter((v) => v.severity === 'critical');
  const highVulns = allVulns.filter((v) => v.severity === 'high');

  return {
    totalDependencies: dependencies.length,
    vulnerableDependencies: vulnerableDeps.length,
    totalVulnerabilities: allVulns.length,
    criticalVulnerabilities: criticalVulns.length,
    highVulnerabilities: highVulns.length,
    lastScanTime,
  };
}

/**
 * Resetar scanner (para testes)
 */
export function resetScanner(): void {
  scannedDependencies.clear();
  lastScanTime = null;
}
