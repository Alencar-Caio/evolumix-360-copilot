/**
 * RAG Risk Classification - Classificação de Risco
 * 
 * Responsabilidade: Classificar risco de uma resposta RAG
 * 
 * Níveis de Risco:
 * - LOW: Resposta segura, sem preocupações
 * - MEDIUM: Resposta com algumas preocupações menores
 * - HIGH: Resposta com preocupações significativas
 * - CRITICAL: Resposta muito arriscada, requer aprovação humana
 * 
 * Fatores de Risco:
 * 1. Fidelidade baixa (< 60%)
 * 2. Citações insuficientes (< 40%)
 * 3. Confiança baixa em chunks (< 0.7)
 * 4. Tópicos sensíveis (segurança, saúde, legal)
 * 5. Instruções de ação (recomendações diretas)
 * 
 * Justificativa:
 * - Uso crítico requer aprovação humana para riscos altos
 * - Conformidade com NIST, ISO 27001, GDPR
 * - Essencial para FISPQ e documentos regulatórios
 */

import { invokeLLM } from '../llm';

/**
 * Classificação de risco
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Resultado de classificação de risco
 */
export interface RiskClassificationResult {
  /** Nível de risco */
  riskLevel: RiskLevel;
  
  /** Score de risco (0-100) */
  riskScore: number;
  
  /** Fatores de risco identificados */
  riskFactors: string[];
  
  /** Recomendações de mitigação */
  mitigations: string[];
  
  /** Requer aprovação humana? */
  requiresApproval: boolean;
  
  /** Tópicos sensíveis detectados */
  sensitivTopics: string[];
}

/**
 * Gerenciador de classificação de risco
 */
export class RiskClassifier {
  /**
   * Classificar risco de uma resposta
   */
  async classifyRisk(
    query: string,
    response: string,
    chunks: Array<{
      id: string;
      text: string;
      documentId: string;
    }>,
    qualityMetrics: {
      faithfulnessScore: number;
      citationCoverage: number;
      relevanceScore: number;
      completenessScore: number;
    }
  ): Promise<RiskClassificationResult> {
    try {
      // 1. Detectar tópicos sensíveis
      const sensitivTopics = await this.detectSensitiveTopics(query, response);

      // 2. Analisar fatores de risco
      const riskFactors = this.analyzeRiskFactors(
        qualityMetrics,
        sensitivTopics,
        response
      );

      // 3. Calcular score de risco
      const riskScore = this.calculateRiskScore(
        qualityMetrics,
        sensitivTopics,
        riskFactors
      );

      // 4. Classificar nível
      const riskLevel = this.classifyRiskLevel(riskScore);

      // 5. Gerar recomendações
      const mitigations = this.generateMitigations(riskFactors, riskLevel);

      // 6. Determinar se requer aprovação
      const requiresApproval = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';

      return {
        riskLevel,
        riskScore,
        riskFactors,
        mitigations,
        requiresApproval,
        sensitivTopics,
      };
    } catch (error) {
      console.error('Erro ao classificar risco:', error);
      throw error;
    }
  }

  /**
   * Detectar tópicos sensíveis
   * 
   * Categorias:
   * - Segurança (safety hazards, risks)
   * - Saúde (health, medical)
   * - Legal (legal, compliance)
   * - Financeiro (financial, payment)
   * - Pessoal (personal, privacy)
   */
  private async detectSensitiveTopics(query: string, response: string): Promise<string[]> {
    try {
      const prompt = `
Identifique tópicos sensíveis no seguinte conteúdo:

Query: "${query}"
Resposta: "${response}"

Categorias de tópicos sensíveis:
- Segurança (hazards, riscos, perigos)
- Saúde (health, medical, medicamentos)
- Legal (legal, compliance, regulatório)
- Financeiro (financial, payment, preços)
- Pessoal (personal, privacy, dados)

Retorne um JSON com:
{
  "sensitiveTopics": ["lista de tópicos sensíveis detectados"]
}
`;

      const llmResponse = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em detecção de tópicos sensíveis.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'sensitive_topics_detection',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                sensitiveTopics: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
              required: ['sensitiveTopics'],
            },
          },
        },
      });

      const content = llmResponse.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const parsed = JSON.parse(contentStr);
      return parsed.sensitiveTopics || [];
    } catch (error) {
      console.error('Erro ao detectar tópicos sensíveis:', error);
      return [];
    }
  }

  /**
   * Analisar fatores de risco
   */
  private analyzeRiskFactors(
    qualityMetrics: {
      faithfulnessScore: number;
      citationCoverage: number;
      relevanceScore: number;
      completenessScore: number;
    },
    sensitivTopics: string[],
    response: string
  ): string[] {
    const factors: string[] = [];

    // Fidelidade baixa
    if (qualityMetrics.faithfulnessScore < 60) {
      factors.push(`Fidelidade baixa (${qualityMetrics.faithfulnessScore}%)`);
    }

    // Citações insuficientes
    if (qualityMetrics.citationCoverage < 40) {
      factors.push(`Citações insuficientes (${qualityMetrics.citationCoverage}%)`);
    }

    // Tópicos sensíveis
    if (sensitivTopics.length > 0) {
      factors.push(`Tópicos sensíveis detectados: ${sensitivTopics.join(', ')}`);
    }

    // Instruções de ação
    if (this.hasActionInstructions(response)) {
      factors.push('Contém instruções de ação diretas');
    }

    // Recomendações médicas/legais
    if (this.hasMedicalOrLegalAdvice(response)) {
      factors.push('Contém recomendações médicas ou legais');
    }

    return factors;
  }

  /**
   * Calcular score de risco (0-100)
   */
  private calculateRiskScore(
    qualityMetrics: {
      faithfulnessScore: number;
      citationCoverage: number;
      relevanceScore: number;
      completenessScore: number;
    },
    sensitivTopics: string[],
    riskFactors: string[]
  ): number {
    let score = 0;

    // Qualidade ruim aumenta risco
    score += (100 - qualityMetrics.faithfulnessScore) * 0.3;
    score += (100 - qualityMetrics.citationCoverage) * 0.2;

    // Tópicos sensíveis aumentam risco
    score += Math.min(sensitivTopics.length * 15, 30);

    // Fatores de risco aumentam score
    score += Math.min(riskFactors.length * 10, 40);

    return Math.round(Math.min(score, 100));
  }

  /**
   * Classificar nível de risco
   */
  private classifyRiskLevel(score: number): RiskLevel {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Gerar recomendações de mitigação
   */
  private generateMitigations(riskFactors: string[], riskLevel: RiskLevel): string[] {
    const mitigations: string[] = [];

    if (riskFactors.some(f => f.includes('Fidelidade'))) {
      mitigations.push('Revisar e melhorar fidelidade das citações');
    }

    if (riskFactors.some(f => f.includes('Citações'))) {
      mitigations.push('Adicionar mais citações explícitas');
    }

    if (riskFactors.some(f => f.includes('Tópicos sensíveis'))) {
      mitigations.push('Submeter para revisão humana antes de publicar');
    }

    if (riskFactors.some(f => f.includes('instruções de ação'))) {
      mitigations.push('Adicionar disclaimer de responsabilidade');
    }

    if (riskLevel === 'CRITICAL') {
      mitigations.push('Requer aprovação de especialista antes de usar');
    }

    return mitigations;
  }

  /**
   * Detectar instruções de ação
   */
  private hasActionInstructions(response: string): boolean {
    const actionKeywords = [
      'faça',
      'execute',
      'aplique',
      'use',
      'coloque',
      'retire',
      'remova',
      'instale',
      'configure',
      'abra',
      'feche',
    ];

    const lowerResponse = response.toLowerCase();
    return actionKeywords.some(keyword => lowerResponse.includes(keyword));
  }

  /**
   * Detectar recomendações médicas ou legais
   */
  private hasMedicalOrLegalAdvice(response: string): boolean {
    const medicalKeywords = [
      'medicamento',
      'droga',
      'tratamento',
      'cura',
      'diagnóstico',
      'médico',
      'cirurgia',
    ];
    const legalKeywords = [
      'lei',
      'legal',
      'advogado',
      'contrato',
      'processo',
      'tribunal',
    ];

    const lowerResponse = response.toLowerCase();
    const hasMedical = medicalKeywords.some(keyword => lowerResponse.includes(keyword));
    const hasLegal = legalKeywords.some(keyword => lowerResponse.includes(keyword));

    return hasMedical || hasLegal;
  }
}

/**
 * Validar resultado de classificação de risco
 */
export function validateRiskClassification(result: RiskClassificationResult): boolean {
  // Validar nível
  if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(result.riskLevel)) {
    console.error(`Nível de risco inválido: ${result.riskLevel}`);
    return false;
  }

  // Validar score
  if (result.riskScore < 0 || result.riskScore > 100) {
    console.error(`Score de risco inválido: ${result.riskScore}`);
    return false;
  }

  // Validar consistência
  const expectedLevel =
    result.riskScore >= 80
      ? 'CRITICAL'
      : result.riskScore >= 60
        ? 'HIGH'
        : result.riskScore >= 40
          ? 'MEDIUM'
          : 'LOW';

  if (result.riskLevel !== expectedLevel) {
    console.error(
      `Nível de risco inconsistente: ${result.riskLevel} vs ${expectedLevel}`
    );
    return false;
  }

  return true;
}

/**
 * Calcular estatísticas de risco
 */
export function getRiskStats(results: RiskClassificationResult[]): {
  totalResults: number;
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  criticalRisk: number;
  avgRiskScore: number;
  requiresApprovalCount: number;
} {
  if (results.length === 0) {
    return {
      totalResults: 0,
      lowRisk: 0,
      mediumRisk: 0,
      highRisk: 0,
      criticalRisk: 0,
      avgRiskScore: 0,
      requiresApprovalCount: 0,
    };
  }

  return {
    totalResults: results.length,
    lowRisk: results.filter(r => r.riskLevel === 'LOW').length,
    mediumRisk: results.filter(r => r.riskLevel === 'MEDIUM').length,
    highRisk: results.filter(r => r.riskLevel === 'HIGH').length,
    criticalRisk: results.filter(r => r.riskLevel === 'CRITICAL').length,
    avgRiskScore: Math.round(results.reduce((sum, r) => sum + r.riskScore, 0) / results.length),
    requiresApprovalCount: results.filter(r => r.requiresApproval).length,
  };
}
