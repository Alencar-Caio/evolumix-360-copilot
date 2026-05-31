/**
 * RAG Quality Validation - Validação de Qualidade
 * 
 * Responsabilidade: Validar qualidade de respostas RAG
 * 
 * Métricas:
 * 1. Faithfulness Score - Resposta é fiel aos chunks?
 * 2. Citation Coverage - % de texto citado?
 * 3. Relevance Score - Resposta é relevante à query?
 * 4. Completeness Score - Resposta é completa?
 * 5. Overall Score - Score geral (0-100)
 * 
 * Justificativa:
 * - Validação automática detecta respostas ruins
 * - Essencial para uso crítico (FISPQ, regulatório)
 * - Permite feedback loop para melhorias
 * - Conformidade com NIST, ISO 27001
 */

import { invokeLLM } from '../llm';

/**
 * Resultado de validação de qualidade
 */
export interface QualityValidationResult {
  /** Score de fidelidade (0-100) */
  faithfulnessScore: number;
  
  /** Cobertura de citações (0-100) */
  citationCoverage: number;
  
  /** Score de relevância (0-100) */
  relevanceScore: number;
  
  /** Score de completude (0-100) */
  completenessScore: number;
  
  /** Score geral (0-100) */
  overallScore: number;
  
  /** Classificação (excellent, good, fair, poor) */
  classification: 'excellent' | 'good' | 'fair' | 'poor';
  
  /** Problemas encontrados */
  issues: string[];
  
  /** Recomendações */
  recommendations: string[];
}

/**
 * Gerenciador de validação de qualidade
 */
export class QualityValidator {
  /**
   * Validar qualidade de uma resposta RAG
   */
  async validateQuality(
    query: string,
    response: string,
    chunks: Array<{
      id: string;
      text: string;
      documentId: string;
    }>,
    citations: Array<{
      id: string;
      chunkId: string;
      citedText: string;
      confidence: number;
    }>
  ): Promise<QualityValidationResult> {
    try {
      // 1. Calcular Faithfulness Score
      const faithfulnessScore = await this.calculateFaithfulnessScore(
        response,
        chunks,
        citations
      );

      // 2. Calcular Citation Coverage
      const citationCoverage = this.calculateCitationCoverage(response, citations);

      // 3. Calcular Relevance Score
      const relevanceScore = await this.calculateRelevanceScore(query, response);

      // 4. Calcular Completeness Score
      const completenessScore = await this.calculateCompletenessScore(
        query,
        response,
        chunks
      );

      // 5. Calcular Overall Score
      const overallScore = Math.round(
        (faithfulnessScore * 0.4 +
          citationCoverage * 0.2 +
          relevanceScore * 0.2 +
          completenessScore * 0.2) /
          1
      );

      // 6. Classificar
      const classification = this.classifyScore(overallScore);

      // 7. Identificar problemas e recomendações
      const { issues, recommendations } = this.identifyIssues(
        faithfulnessScore,
        citationCoverage,
        relevanceScore,
        completenessScore
      );

      return {
        faithfulnessScore,
        citationCoverage,
        relevanceScore,
        completenessScore,
        overallScore,
        classification,
        issues,
        recommendations,
      };
    } catch (error) {
      console.error('Erro ao validar qualidade:', error);
      throw error;
    }
  }

  /**
   * Calcular Faithfulness Score
   * 
   * Métrica: Resposta é fiel aos chunks?
   * - 100: Totalmente fiel
   * - 75: Principalmente fiel
   * - 50: Parcialmente fiel
   * - 25: Pouco fiel
   * - 0: Infiel
   */
  private async calculateFaithfulnessScore(
    response: string,
    chunks: Array<{ id: string; text: string }>,
    citations: Array<{ chunkId: string; confidence: number }>
  ): Promise<number> {
    try {
      const prompt = `
Avalie se a seguinte resposta é fiel aos chunks fornecidos.

Resposta: "${response}"

Chunks:
${chunks.map((c, i) => `[${i}] ${c.text.substring(0, 200)}...`).join('\n\n')}

Retorne um JSON com:
{
  "faithfulnessScore": 0-100,
  "issues": ["lista de problemas de fidelidade"]
}
`;

      const llmResponse = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em validação de qualidade RAG.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'faithfulness_validation',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                faithfulnessScore: { type: 'number' },
                issues: { type: 'array', items: { type: 'string' } },
              },
              required: ['faithfulnessScore', 'issues'],
            },
          },
        },
      });

      const content = llmResponse.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const parsed = JSON.parse(contentStr);
      return parsed.faithfulnessScore;
    } catch (error) {
      console.error('Erro ao calcular faithfulness:', error);
      return 50; // Default
    }
  }

  /**
   * Calcular Citation Coverage
   * 
   * Métrica: % de texto da resposta que é citado
   */
  private calculateCitationCoverage(
    response: string,
    citations: Array<{ citedText: string; confidence: number }>
  ): number {
    if (citations.length === 0) return 0;

    let citedLength = 0;

    for (const citation of citations) {
      if (response.includes(citation.citedText)) {
        citedLength += citation.citedText.length;
      }
    }

    return Math.min(100, Math.round((citedLength / response.length) * 100));
  }

  /**
   * Calcular Relevance Score
   * 
   * Métrica: Resposta é relevante à query?
   */
  private async calculateRelevanceScore(query: string, response: string): Promise<number> {
    try {
      const prompt = `
Avalie se a resposta é relevante à query.

Query: "${query}"
Resposta: "${response}"

Retorne um JSON com:
{
  "relevanceScore": 0-100,
  "explanation": "explicação breve"
}
`;

      const llmResponse = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em avaliação de relevância.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'relevance_validation',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                relevanceScore: { type: 'number' },
                explanation: { type: 'string' },
              },
              required: ['relevanceScore', 'explanation'],
            },
          },
        },
      });

      const content = llmResponse.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const parsed = JSON.parse(contentStr);
      return parsed.relevanceScore;
    } catch (error) {
      console.error('Erro ao calcular relevance:', error);
      return 50; // Default
    }
  }

  /**
   * Calcular Completeness Score
   * 
   * Métrica: Resposta é completa?
   */
  private async calculateCompletenessScore(
    query: string,
    response: string,
    chunks: Array<{ text: string }>
  ): Promise<number> {
    try {
      const prompt = `
Avalie se a resposta é completa para a query.

Query: "${query}"
Resposta: "${response}"
Contexto disponível: ${chunks.map(c => c.text.substring(0, 100)).join(' ')}

Retorne um JSON com:
{
  "completenessScore": 0-100,
  "missingInfo": ["informações que faltam"]
}
`;

      const llmResponse = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em avaliação de completude.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'completeness_validation',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                completenessScore: { type: 'number' },
                missingInfo: { type: 'array', items: { type: 'string' } },
              },
              required: ['completenessScore', 'missingInfo'],
            },
          },
        },
      });

      const content = llmResponse.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const parsed = JSON.parse(contentStr);
      return parsed.completenessScore;
    } catch (error) {
      console.error('Erro ao calcular completeness:', error);
      return 50; // Default
    }
  }

  /**
   * Classificar score
   */
  private classifyScore(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  /**
   * Identificar problemas e recomendações
   */
  private identifyIssues(
    faithfulness: number,
    coverage: number,
    relevance: number,
    completeness: number
  ): { issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (faithfulness < 60) {
      issues.push('Resposta pode não ser fiel aos chunks');
      recommendations.push('Revisar fidelidade das citações');
    }

    if (coverage < 40) {
      issues.push('Baixa cobertura de citações');
      recommendations.push('Adicionar mais citações explícitas');
    }

    if (relevance < 60) {
      issues.push('Resposta pode não ser relevante à query');
      recommendations.push('Reformular resposta para ser mais relevante');
    }

    if (completeness < 60) {
      issues.push('Resposta pode estar incompleta');
      recommendations.push('Adicionar mais informações ou contexto');
    }

    return { issues, recommendations };
  }
}

/**
 * Validar resultado de qualidade
 */
export function validateQualityResult(result: QualityValidationResult): boolean {
  // Validar scores
  for (const key of [
    'faithfulnessScore',
    'citationCoverage',
    'relevanceScore',
    'completenessScore',
    'overallScore',
  ]) {
    const score = result[key as keyof QualityValidationResult] as number;
    if (score < 0 || score > 100) {
      console.error(`Score inválido: ${key} = ${score}`);
      return false;
    }
  }

  // Validar classificação
  if (!['excellent', 'good', 'fair', 'poor'].includes(result.classification)) {
    console.error(`Classificação inválida: ${result.classification}`);
    return false;
  }

  return true;
}
