/**
 * Dependency Scanner Router
 * 
 * Endpoints tRPC para gerenciamento de scanning de dependências
 * Integração real com análise de package.json e node_modules
 */

import { z } from 'zod';
import { protectedProcedure, router, adminProcedure } from '../_core/trpc';
import { 
  generateSBOMReal, 
  getCriticalVulnerabilitiesReal, 
  getLicenseComplianceReportReal, 
  getScannerStatisticsReal 
} from '../_core/security/dependencyScannerReal';

export const dependencyScannerRouter = router({
  /**
   * Gerar SBOM (Software Bill of Materials) real
   */
  generateSBOM: protectedProcedure
    .input(
      z.object({
        appVersion: z.string().optional(),
      })
    )
    .query(({ input }) => {
      try {
        const sbom = generateSBOMReal(input.appVersion);

        return {
          success: true,
          sbom: {
            generatedAt: sbom.generatedAt,
            appVersion: sbom.appVersion,
            projectName: sbom.projectName,
            totalDependencies: sbom.dependencies.length,
            totalVulnerabilities: sbom.vulnerabilities.length,
            licenseCompliance: sbom.licenseCompliance,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'SBOM generation failed',
        };
      }
    }),

  /**
   * Obter vulnerabilidades críticas
   */
  getCriticalVulnerabilities: protectedProcedure.query(() => {
    try {
      const vulnerabilities = getCriticalVulnerabilitiesReal();

      return {
        success: true,
        vulnerabilities: {
          total: vulnerabilities.length,
          items: vulnerabilities.map((v) => ({
            id: v.id,
            severity: v.severity,
            description: v.description,
            affectedVersions: v.affectedVersions,
            fixedVersion: v.fixedVersion,
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get critical vulnerabilities',
      };
    }
  }),

  /**
   * Obter relatório de conformidade de licenças
   */
  getLicenseCompliance: protectedProcedure.query(() => {
    try {
      const report = getLicenseComplianceReportReal();

      return {
        success: true,
        compliance: {
          totalDependencies: report.totalDependencies,
          licensedDependencies: report.licensedDependencies,
          unknownLicenses: report.unknownLicenses,
          restrictiveLicenses: report.restrictiveLicenses,
          complianceRate: Number(report.complianceRate.toFixed(2)),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get license compliance',
      };
    }
  }),

  /**
   * Obter estatísticas de scanning
   */
  getStatistics: protectedProcedure.query(() => {
    try {
      const stats = getScannerStatisticsReal();

      return {
        success: true,
        statistics: {
          totalDependencies: stats.totalDependencies,
          vulnerableDependencies: stats.vulnerableDependencies,
          totalVulnerabilities: stats.totalVulnerabilities,
          criticalVulnerabilities: stats.criticalVulnerabilities,
          highVulnerabilities: stats.highVulnerabilities,
          mediumVulnerabilities: stats.mediumVulnerabilities,
          lowVulnerabilities: stats.lowVulnerabilities,
          lastScanTime: stats.lastScanTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get statistics',
      };
    }
  }),

  /**
   * Exportar SBOM em formato JSON/XML/CSV
   */
  exportSBOM: adminProcedure
    .input(
      z.object({
        appVersion: z.string().optional(),
        format: z.enum(['json', 'xml', 'csv']).default('json'),
      })
    )
    .query(({ input }) => {
      try {
        const sbom = generateSBOMReal(input.appVersion);

        let exportedData: string;

        switch (input.format) {
          case 'json':
            exportedData = JSON.stringify(sbom, null, 2);
            break;
          case 'xml':
            exportedData = `<?xml version="1.0"?>\n<sbom><generatedAt>${sbom.generatedAt}</generatedAt><projectName>${sbom.projectName}</projectName><appVersion>${sbom.appVersion}</appVersion><totalDependencies>${sbom.dependencies.length}</totalDependencies></sbom>`;
            break;
          case 'csv':
            exportedData = 'name,version,license,type\n' + sbom.dependencies
              .map((d) => `${d.name},${d.version},${d.license},${d.type}`)
              .join('\n');
            break;
        }

        return {
          success: true,
          format: input.format,
          data: exportedData,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Export failed',
        };
      }
    }),
});
