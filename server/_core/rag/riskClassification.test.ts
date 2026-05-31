/**
 * Testes Unitários - RAG Risk Classification
 */

import { describe, it, expect } from 'vitest';
import { validateRiskClassification, getRiskStats } from './riskClassification';

describe('RAG - Risk Classification', () => {
  describe('Validação de Classificação de Risco', () => {
    it('deve validar classificação LOW', () => {
      const result = {
        riskLevel: 'LOW' as const,
        riskScore: 20,
        riskFactors: [],
        mitigations: [],
        requiresApproval: false,
        sensitivTopics: [],
      };

      const isValid = validateRiskClassification(result);
      expect(isValid).toBe(true);
    });

    it('deve validar classificação MEDIUM', () => {
      const result = {
        riskLevel: 'MEDIUM' as const,
        riskScore: 50,
        riskFactors: ['Fidelidade baixa (55%)'],
        mitigations: ['Revisar fidelidade'],
        requiresApproval: false,
        sensitivTopics: [],
      };

      const isValid = validateRiskClassification(result);
      expect(isValid).toBe(true);
    });

    it('deve validar classificação HIGH', () => {
      const result = {
        riskLevel: 'HIGH' as const,
        riskScore: 65,
        riskFactors: ['Fidelidade baixa (50%)', 'Tópicos sensíveis: Segurança'],
        mitigations: ['Submeter para revisão humana'],
        requiresApproval: true,
        sensitivTopics: ['Segurança'],
      };

      const isValid = validateRiskClassification(result);
      expect(isValid).toBe(true);
    });

    it('deve validar classificação CRITICAL', () => {
      const result = {
        riskLevel: 'CRITICAL' as const,
        riskScore: 85,
        riskFactors: [
          'Fidelidade baixa (40%)',
          'Citações insuficientes (20%)',
          'Tópicos sensíveis: Saúde, Legal',
        ],
        mitigations: ['Requer aprovação de especialista'],
        requiresApproval: true,
        sensitivTopics: ['Saúde', 'Legal'],
      };

      const isValid = validateRiskClassification(result);
      expect(isValid).toBe(true);
    });

    it('deve rejeitar nível de risco inválido', () => {
      const result = {
        riskLevel: 'INVALID' as any,
        riskScore: 50,
        riskFactors: [],
        mitigations: [],
        requiresApproval: false,
        sensitivTopics: [],
      };

      const isValid = validateRiskClassification(result);
      expect(isValid).toBe(false);
    });

    it('deve rejeitar score de risco inválido', () => {
      const result = {
        riskLevel: 'MEDIUM' as const,
        riskScore: 150, // Deve estar entre 0-100
        riskFactors: [],
        mitigations: [],
        requiresApproval: false,
        sensitivTopics: [],
      };

      const isValid = validateRiskClassification(result);
      expect(isValid).toBe(false);
    });

    it('deve detectar inconsistência entre nível e score', () => {
      const result = {
        riskLevel: 'LOW' as const,
        riskScore: 85, // Score alto mas nível LOW
        riskFactors: [],
        mitigations: [],
        requiresApproval: false,
        sensitivTopics: [],
      };

      const isValid = validateRiskClassification(result);
      expect(isValid).toBe(false);
    });
  });

  describe('Estatísticas de Risco', () => {
    it('deve calcular estatísticas de resultados vazios', () => {
      const stats = getRiskStats([]);

      expect(stats.totalResults).toBe(0);
      expect(stats.lowRisk).toBe(0);
      expect(stats.mediumRisk).toBe(0);
      expect(stats.highRisk).toBe(0);
      expect(stats.criticalRisk).toBe(0);
      expect(stats.avgRiskScore).toBe(0);
      expect(stats.requiresApprovalCount).toBe(0);
    });

    it('deve calcular estatísticas de resultados', () => {
      const results = [
        {
          riskLevel: 'LOW' as const,
          riskScore: 20,
          riskFactors: [],
          mitigations: [],
          requiresApproval: false,
          sensitivTopics: [],
        },
        {
          riskLevel: 'MEDIUM' as const,
          riskScore: 50,
          riskFactors: ['Fidelidade baixa'],
          mitigations: ['Revisar'],
          requiresApproval: false,
          sensitivTopics: [],
        },
        {
          riskLevel: 'HIGH' as const,
          riskScore: 70,
          riskFactors: ['Tópicos sensíveis'],
          mitigations: ['Submeter para revisão'],
          requiresApproval: true,
          sensitivTopics: ['Segurança'],
        },
        {
          riskLevel: 'CRITICAL' as const,
          riskScore: 90,
          riskFactors: ['Múltiplos fatores'],
          mitigations: ['Requer aprovação'],
          requiresApproval: true,
          sensitivTopics: ['Saúde', 'Legal'],
        },
      ];

      const stats = getRiskStats(results);

      expect(stats.totalResults).toBe(4);
      expect(stats.lowRisk).toBe(1);
      expect(stats.mediumRisk).toBe(1);
      expect(stats.highRisk).toBe(1);
      expect(stats.criticalRisk).toBe(1);
      expect(stats.avgRiskScore).toBe(58); // (20+50+70+90)/4 = 57.5 arredonda para 58
      expect(stats.requiresApprovalCount).toBe(2);
    });

    it('deve contar corretamente requer aprovação', () => {
      const results = [
        {
          riskLevel: 'LOW' as const,
          riskScore: 20,
          riskFactors: [],
          mitigations: [],
          requiresApproval: false,
          sensitivTopics: [],
        },
        {
          riskLevel: 'HIGH' as const,
          riskScore: 65,
          riskFactors: [],
          mitigations: [],
          requiresApproval: true,
          sensitivTopics: [],
        },
        {
          riskLevel: 'CRITICAL' as const,
          riskScore: 85,
          riskFactors: [],
          mitigations: [],
          requiresApproval: true,
          sensitivTopics: [],
        },
      ];

      const stats = getRiskStats(results);

      expect(stats.requiresApprovalCount).toBe(2);
    });
  });
});
