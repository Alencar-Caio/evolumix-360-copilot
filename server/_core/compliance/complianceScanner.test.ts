/**
 * Testes para Compliance Scanner
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  runComplianceScan,
  getCheckResult,
  updateCheckStatus,
  getScanReport,
  getAllScanReports,
  getScannerStatistics,
  resetScannerData,
} from './complianceScanner';

describe('Compliance Scanner', () => {
  beforeEach(() => {
    resetScannerData();
  });

  describe('Compliance Scanning', () => {
    it('deve executar scan de conformidade', () => {
      const report = runComplianceScan();

      expect(report).toBeDefined();
      expect(report.totalChecks).toBeGreaterThan(0);
      expect(report.passed).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
    });

    it('deve incluir OWASP Top 10 checks', () => {
      const report = runComplianceScan();

      const owaspChecks = report.results.filter((r) => r.category === 'owasp');

      expect(owaspChecks.length).toBe(10);
    });

    it('deve incluir CIS Benchmarks checks', () => {
      const report = runComplianceScan();

      const cisChecks = report.results.filter((r) => r.category === 'cis');

      expect(cisChecks.length).toBeGreaterThan(0);
    });
  });

  describe('Check Management', () => {
    it('deve obter resultado de verificação', () => {
      runComplianceScan();

      const check = getCheckResult('owasp-a01-2024');

      expect(check).toBeDefined();
      expect(check?.name).toBe('Broken Access Control');
    });

    it('deve atualizar status de verificação', () => {
      runComplianceScan();

      updateCheckStatus('owasp-a01-2024', 'pass', ['Evidence 1', 'Evidence 2']);

      const updated = getCheckResult('owasp-a01-2024');

      expect(updated?.status).toBe('pass');
      expect(updated?.evidence?.length).toBe(2);
    });
  });

  describe('Report Management', () => {
    it('deve obter relatório de scan', () => {
      const report = runComplianceScan();

      const retrieved = getScanReport(report.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(report.id);
    });

    it('deve obter todos os relatórios', () => {
      resetScannerData();
      runComplianceScan();
      runComplianceScan();

      const allReports = getAllScanReports();

      expect(allReports.length).toBeGreaterThanOrEqual(2);
    });

    it('deve ordenar relatórios por timestamp', () => {
      resetScannerData();
      runComplianceScan();

      // Aguardar um pouco
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Aguardar
      }

      runComplianceScan();

      const allReports = getAllScanReports();

      if (allReports.length >= 2) {
        expect(allReports[0].timestamp.getTime()).toBeGreaterThanOrEqual(
          allReports[1].timestamp.getTime()
        );
      }
    });
  });

  describe('Statistics', () => {
    it('deve coletar estatísticas do scanner', () => {
      runComplianceScan();

      const stats = getScannerStatistics();

      expect(stats.totalScans).toBe(1);
      expect(stats.totalChecks).toBeGreaterThan(0);
      expect(stats.averageScore).toBeGreaterThanOrEqual(0);
      expect(stats.checksByCategory).toBeDefined();
      expect(stats.checksBySeverity).toBeDefined();
    });

    it('deve rastrear checks por categoria', () => {
      runComplianceScan();

      const stats = getScannerStatistics();

      expect(stats.checksByCategory['owasp']).toBe(10);
      expect(stats.checksByCategory['cis']).toBeGreaterThan(0);
    });

    it('deve rastrear checks por severidade', () => {
      runComplianceScan();

      const stats = getScannerStatistics();

      expect(stats.checksBySeverity['critical']).toBeGreaterThan(0);
      expect(stats.checksBySeverity['high']).toBeGreaterThan(0);
    });
  });
});
