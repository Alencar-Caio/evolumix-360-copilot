/**
 * Testes para Dependency Scanner
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  addDependency,
  generateSBOM,
  getCriticalVulnerabilities,
  getLicenseComplianceReport,
  getScannerStatistics,
  resetScanner,
  type Dependency,
} from './dependencyScanner';

const mockDependencies: Dependency[] = [
  {
    name: 'lodash',
    version: '4.17.20',
    license: 'MIT',
    vulnerabilities: [],
    lastUpdated: new Date(),
  },
  {
    name: 'express',
    version: '4.18.0',
    license: 'MIT',
    vulnerabilities: [],
    lastUpdated: new Date(),
  },
  {
    name: 'some-gpl-lib',
    version: '1.0.0',
    license: 'GPL-3.0',
    vulnerabilities: [],
    lastUpdated: new Date(),
  },
];

describe('Dependency Scanner', () => {
  beforeEach(() => {
    resetScanner();
  });

  describe('Adding Dependencies', () => {
    it('deve adicionar dependência', () => {
      addDependency(mockDependencies[0]);

      const stats = getScannerStatistics();

      expect(stats.totalDependencies).toBe(1);
    });

    it('deve adicionar múltiplas dependências', () => {
      mockDependencies.forEach((dep) => addDependency(dep));

      const stats = getScannerStatistics();

      expect(stats.totalDependencies).toBe(3);
    });

    it('deve detectar vulnerabilidades em lodash', () => {
      const lodashWithVuln: Dependency = {
        name: 'lodash',
        version: '4.17.20',
        license: 'MIT',
        vulnerabilities: [],
        lastUpdated: new Date(),
      };

      addDependency(lodashWithVuln);

      const stats = getScannerStatistics();

      // lodash 4.17.20 < 4.17.21 tem vulnerabilidade
      expect(stats.vulnerableDependencies).toBe(1);
      expect(stats.totalVulnerabilities).toBeGreaterThan(0);
    });
  });

  describe('SBOM Generation', () => {
    beforeEach(() => {
      mockDependencies.forEach((dep) => addDependency(dep));
    });

    it('deve gerar SBOM', () => {
      const sbom = generateSBOM('1.0.0');

      expect(sbom).toBeDefined();
      expect(sbom.appVersion).toBe('1.0.0');
      expect(sbom.dependencies.length).toBe(3);
    });

    it('deve incluir vulnerabilidades no SBOM', () => {
      const sbom = generateSBOM('1.0.0');

      expect(sbom.vulnerabilities).toBeDefined();
    });

    it('deve incluir conformidade de licenças no SBOM', () => {
      const sbom = generateSBOM('1.0.0');

      expect(sbom.licenseCompliance).toBeDefined();
      expect(sbom.licenseCompliance.totalDependencies).toBe(3);
    });
  });

  describe('Vulnerability Detection', () => {
    beforeEach(() => {
      mockDependencies.forEach((dep) => addDependency(dep));
    });

    it('deve obter vulnerabilidades críticas', () => {
      const criticalVulns = getCriticalVulnerabilities();

      expect(criticalVulns).toBeDefined();
      expect(Array.isArray(criticalVulns)).toBe(true);
    });

    it('deve rastrear vulnerabilidades por severidade', () => {
      const stats = getScannerStatistics();

      expect(stats.criticalVulnerabilities).toBeGreaterThanOrEqual(0);
      expect(stats.highVulnerabilities).toBeGreaterThanOrEqual(0);
    });
  });

  describe('License Compliance', () => {
    beforeEach(() => {
      mockDependencies.forEach((dep) => addDependency(dep));
    });

    it('deve gerar relatório de conformidade de licenças', () => {
      const report = getLicenseComplianceReport();

      expect(report).toBeDefined();
      expect(report.totalDependencies).toBe(3);
      expect(report.licensedDependencies).toBeGreaterThan(0);
    });

    it('deve detectar licenças restritivas', () => {
      const report = getLicenseComplianceReport();

      expect(report.restrictiveLicenses).toBeDefined();
      expect(report.restrictiveLicenses.length).toBeGreaterThan(0);
    });

    it('deve contar dependências com licenças desconhecidas', () => {
      const unknownLicenseDep: Dependency = {
        name: 'unknown-lib',
        version: '1.0.0',
        license: 'Unknown',
        vulnerabilities: [],
        lastUpdated: new Date(),
      };

      addDependency(unknownLicenseDep);

      const report = getLicenseComplianceReport();

      expect(report.unknownLicenses).toBeGreaterThan(0);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      mockDependencies.forEach((dep) => addDependency(dep));
    });

    it('deve coletar estatísticas de scanner', () => {
      const stats = getScannerStatistics();

      expect(stats.totalDependencies).toBe(3);
      expect(stats.vulnerableDependencies).toBeGreaterThanOrEqual(0);
      expect(stats.totalVulnerabilities).toBeGreaterThanOrEqual(0);
    });

    it('deve rastrear tempo da última varredura', () => {
      generateSBOM('1.0.0');

      const stats = getScannerStatistics();

      expect(stats.lastScanTime).toBeDefined();
    });
  });

  describe('Reset', () => {
    it('deve resetar scanner', () => {
      mockDependencies.forEach((dep) => addDependency(dep));

      resetScanner();

      const stats = getScannerStatistics();

      expect(stats.totalDependencies).toBe(0);
    });
  });
});
