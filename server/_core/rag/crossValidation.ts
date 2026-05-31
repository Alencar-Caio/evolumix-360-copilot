/**
 * Cross-Validation - Detectar Alucinações em Respostas RAG
 * 
 * Responsabilidade: Validar se a resposta é consistente com os documentos
 * 
 * Fluxo:
 * 1. LLM questiona a resposta (meta-análise)
 * 2. Verifica consistência com documentos
 * 3. Detecta contradições
 * 4. Calcula confidence score
 * 5. Marca alucinações
 * 
 * Justificativa:
 * - Detecta erros que passariam despercebidos
 * - Aumenta confiabilidade para uso crítico
 * - Conformidade regulatória (GDPR, HIPAA, SOC2)
 * - Reduz risco de respostas falsas
 */

import { invokeLLM } from '../llm';

/**
 * Resultado de validação cruzada
 */
export interface CrossValidationResult {
  id: string;
  responseId: string;
  isConsistent: boolean;
  hasHallucinations: boolean;
  confidenceScore: number; // 0-100
  consistencyScore: number; // 0-100
  hallucinations: Array<{
    text: string;
    reason: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  contradictions: Array<{
    claim: string;
    document: string;
    issue: string;
  }>;
  validationPrompt: string;
  validationResponse: string;
  timestamp: Date;
}

/**
 * Validar resposta com análise cruzada
 */
export async function validateResponseCrossValidation(
  query: string,
  response: string,
  documents: Array<{
    id: string;
    content: string;
  }>,
  citations: Array<{
    id: string;
    text: string;
    source: string;
  }>
): Promise<CrossValidationResult> {
  const validationId = `val-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // 1. Preparar contexto para validação
    const documentContext = documents
      .map((doc, idx) => `[Doc ${idx + 1}]\n${doc.content}`)
      .join('\n\n');

    const citationContext = citations
      .map(c => `- ${c.text} (Fonte: ${c.source})`)
      .join('\n');

    // 2. Criar prompt de validação
    const validationPrompt = `Você é um validador de qualidade especializado em detectar alucinações e inconsistências.

TAREFA: Validar se a resposta abaixo é consistente com os documentos fornecidos.

QUERY DO USUÁRIO:
"${query}"

RESPOSTA A VALIDAR:
"${response}"

DOCUMENTOS DE REFERÊNCIA:
${documentContext}

CITAÇÕES USADAS:
${citationContext}

ANÁLISE REQUERIDA:
1. A resposta é consistente com os documentos?
2. Há alucinações (informações não nos documentos)?
3. Há contradições com os documentos?
4. Qual é o nível de confiança (0-100)?
5. Qual é o nível de consistência (0-100)?

RESPONDA EM JSON:
{
  "isConsistent": boolean,
  "hasHallucinations": boolean,
  "confidenceScore": number,
  "consistencyScore": number,
  "hallucinations": [
    {
      "text": "texto alucinado",
      "reason": "por que é alucinação",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL"
    }
  ],
  "contradictions": [
    {
      "claim": "afirmação na resposta",
      "document": "documento que contradiz",
      "issue": "qual é a contradição"
    }
  ],
  "summary": "resumo da validação"
}`;

    // 3. Invocar LLM para validação
    const llmResponse = await invokeLLM({
      messages: [
        {
          role: 'system' as const,
          content: 'Você é um validador de qualidade. Sempre responda em JSON válido.',
        },
        {
          role: 'user' as const,
          content: validationPrompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'validation_result',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              isConsistent: { type: 'boolean' },
              hasHallucinations: { type: 'boolean' },
              confidenceScore: { type: 'number', minimum: 0, maximum: 100 },
              consistencyScore: { type: 'number', minimum: 0, maximum: 100 },
              hallucinations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    reason: { type: 'string' },
                    severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                  },
                  required: ['text', 'reason', 'severity'],
                },
              },
              contradictions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    claim: { type: 'string' },
                    document: { type: 'string' },
                    issue: { type: 'string' },
                  },
                  required: ['claim', 'document', 'issue'],
                },
              },
              summary: { type: 'string' },
            },
            required: [
              'isConsistent',
              'hasHallucinations',
              'confidenceScore',
              'consistencyScore',
              'hallucinations',
              'contradictions',
              'summary',
            ],
            additionalProperties: false,
          },
        },
      } as any,
    });

    const validationContent =
      typeof llmResponse.choices[0].message.content === 'string'
        ? llmResponse.choices[0].message.content
        : JSON.stringify(llmResponse.choices[0].message.content);

    const validationData = JSON.parse(validationContent);

    const result: CrossValidationResult = {
      id: validationId,
      responseId: `resp-${Date.now()}`,
      isConsistent: validationData.isConsistent,
      hasHallucinations: validationData.hasHallucinations,
      confidenceScore: validationData.confidenceScore,
      consistencyScore: validationData.consistencyScore,
      hallucinations: validationData.hallucinations || [],
      contradictions: validationData.contradictions || [],
      validationPrompt,
      validationResponse: validationContent,
      timestamp: new Date(),
    };

    return result;
  } catch (error) {
    console.error('Erro ao fazer validação cruzada:', error);
    throw error;
  }
}

/**
 * Calcular risco baseado em validação
 */
export function calculateValidationRisk(validation: CrossValidationResult): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  // Se tem alucinações críticas → CRITICAL
  if (validation.hallucinations.some(h => h.severity === 'CRITICAL')) {
    return 'CRITICAL';
  }

  // Se tem alucinações altas → HIGH
  if (validation.hallucinations.some(h => h.severity === 'HIGH')) {
    return 'HIGH';
  }

  // Se tem contradições → MEDIUM
  if (validation.contradictions.length > 0) {
    return 'MEDIUM';
  }

  // Se confidence baixa → MEDIUM
  if (validation.confidenceScore < 60) {
    return 'MEDIUM';
  }

  // Se consistency baixa → LOW
  if (validation.consistencyScore < 70) {
    return 'LOW';
  }

  return 'LOW';
}

/**
 * Validar resultado de validação
 */
export function validateCrossValidationResult(result: CrossValidationResult): boolean {
  if (!result.id || !result.responseId) {
    console.error('Resultado de validação incompleto');
    return false;
  }

  if (result.confidenceScore < 0 || result.confidenceScore > 100) {
    console.error(`Confidence score inválido: ${result.confidenceScore}`);
    return false;
  }

  if (result.consistencyScore < 0 || result.consistencyScore > 100) {
    console.error(`Consistency score inválido: ${result.consistencyScore}`);
    return false;
  }

  return true;
}

/**
 * Calcular estatísticas de validação
 */
export function getValidationStats(validations: CrossValidationResult[]): {
  totalValidations: number;
  avgConfidenceScore: number;
  avgConsistencyScore: number;
  hallucinations: number;
  contradictions: number;
  criticalHallucinations: number;
  consistentResponses: number;
} {
  if (validations.length === 0) {
    return {
      totalValidations: 0,
      avgConfidenceScore: 0,
      avgConsistencyScore: 0,
      hallucinations: 0,
      contradictions: 0,
      criticalHallucinations: 0,
      consistentResponses: 0,
    };
  }

  const totalHallucinations = validations.reduce((sum, v) => sum + v.hallucinations.length, 0);
  const totalContradictions = validations.reduce((sum, v) => sum + v.contradictions.length, 0);
  const criticalHallucinations = validations.reduce(
    (sum, v) => sum + v.hallucinations.filter(h => h.severity === 'CRITICAL').length,
    0
  );

  return {
    totalValidations: validations.length,
    avgConfidenceScore: Math.round(
      validations.reduce((sum, v) => sum + v.confidenceScore, 0) / validations.length
    ),
    avgConsistencyScore: Math.round(
      validations.reduce((sum, v) => sum + v.consistencyScore, 0) / validations.length
    ),
    hallucinations: totalHallucinations,
    contradictions: totalContradictions,
    criticalHallucinations,
    consistentResponses: validations.filter(v => v.isConsistent).length,
  };
}
