import { describe, it, expect, beforeEach } from 'vitest';
import { addDependency, generateSBOM, getCriticalVulnerabilities, getLicenseComplianceReport, getScannerStatistics } from '../_core/security/dependencyScanner';

describe('Dependency Scanner Router', () => {
  beforeEach(() => {
    // Reset state before each test
  });

  it('should generate SBOM', () => {
    const sbom = generateSBOM('1.0.0');
    
    expect(sbom).toBeDefined();
    expect(sbom.appVersion).toBe('1.0.0');
    expect(sbom.dependencies).toBeDefined();
    expect(Array.isArray(sbom.dependencies)).toBe(true);
  });

  it('should get critical vulnerabilities', () => {
    const vulnerabilities = getCriticalVulnerabilities();
    
    expect(Array.isArray(vulnerabilities)).toBe(true);
  });

  it('should get license compliance report', () => {
    const report = getLicenseComplianceReport();
    
    expect(report).toBeDefined();
    expect(report.totalDependencies).toBeGreaterThanOrEqual(0);
    expect(report.licensedDependencies).toBeGreaterThanOrEqual(0);
    expect(report.unknownLicenses).toBeGreaterThanOrEqual(0);
  });

  it('should get scanner statistics', () => {
    const stats = getScannerStatistics();
    
    expect(stats).toBeDefined();
    expect(stats.totalDependencies).toBeGreaterThanOrEqual(0);
    expect(stats.vulnerableDependencies).toBeGreaterThanOrEqual(0);
    expect(stats.totalVulnerabilities).toBeGreaterThanOrEqual(0);
  });

  it('should add dependency', () => {
    const dep = {
      name: 'test-package',
      version: '1.0.0',
      license: 'MIT',
      vulnerabilities: [],
      lastUpdated: new Date(),
    };

    addDependency(dep);
    const sbom = generateSBOM('1.0.0');

    expect(sbom.dependencies).toContainEqual(expect.objectContaining({ name: 'test-package' }));
  });

  it('should track license compliance', () => {
    const dep = {
      name: 'test-package',
      version: '1.0.0',
      license: 'MIT',
      vulnerabilities: [],
      lastUpdated: new Date(),
    };

    addDependency(dep);
    const report = getLicenseComplianceReport();

    expect(report.totalDependencies).toBeGreaterThan(0);
  });

  it('should calculate vulnerability rate', () => {
    const stats = getScannerStatistics();
    
    if (stats.totalDependencies > 0) {
      const rate = (stats.vulnerableDependencies / stats.totalDependencies) * 100;
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(100);
    }
  });

  it('should track restrictive licenses', () => {
    const report = getLicenseComplianceReport();
    
    expect(Array.isArray(report.restrictiveLicenses)).toBe(true);
  });
});
