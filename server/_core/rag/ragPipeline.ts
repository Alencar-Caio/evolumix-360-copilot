/**
 * RAG Pipeline Completo - Integração de todos os componentes
 * 
 * Responsabilidade: Orquestrar o fluxo completo de RAG com:
 * - Cross-validation (detecção de alucinação)
 * - Conversation history (persistência)
 * - Audit trail (rastreabilidade)
 * - Document indexing (performance)
 * - Quality assurance (validação)
 * 
 * Fluxo:
 * 1. Receber pergunta do usuário
 * 2. Buscar documentos relevantes (com cache)
 * 3. Gerar resposta com LLM
 * 4. Validar qualidade da resposta
 * 5. Validar alucinações
 * 6. Salvar em histórico e audit trail
 * 7. Retornar resposta validada
 */

import { validateQuality, type ResponseToValidate } from './qualityAssurance';
import { validateResponseCrossValidation, type CrossValidationResult } from './crossValidation';
import {
  addMessage,
  getConversationHistory,
  type MessageRecord,
} from './conversationHistory';
import { logAuditEvent } from './auditTrail';
import {
  searchDocumentsByPatternIndexed,
  findDocumentById,
  type DocumentSearchResult,
} from './documentIndexing';

/**
 * Estrutura de resposta do RAG Pipeline
 */
export interface RAGResponse {
  content: string;
  sourceDocuments: string[];
  citations: string[];
  qualityScore: number;
  qualityPassed: boolean;
  hallucinations: string[];
  hallucinated: boolean;
  confidence: number;
  executionTime: number;
  auditId?: string | bigint;
  metadata: {
    documentCount: number;
    searchTime: number;
    validationTime: number;
    crossValidationTime: number;
  };
}

/**
 * Estrutura de contexto do RAG
 */
export interface RAGContext {
  conversationId: string;
  userId: string;
  query: string;
  documents: DocumentSearchResult;
  timestamp: Date;
}

/**
 * Processar pergunta através do RAG Pipeline
 */
export async function processRAGQuery(
  conversationId: string,
  userId: string,
  query: string,
  llmResponse: string,
  sourceDocumentIds: number[]
): Promise<RAGResponse> {
  const startTime = Date.now();

  try {
    console.log(`[RAG] Processando query: ${query}`);

    // 1. Buscar documentos relevantes
    const searchStart = Date.now();
    const documents = await searchDocumentsByPatternIndexed(query);
    const searchTime = Date.now() - searchStart;

    // 2. Preparar resposta para validação
    const sourceDocuments = documents.documents.map((d) => d.title);
    const citations = sourceDocuments.slice(0, 3); // Limitar a 3 citações

    const responseToValidate: ResponseToValidate = {
      content: llmResponse,
      sourceDocuments,
      citations,
      confidence: 0.85, // Placeholder
      metadata: { conversationId, userId },
    };

    // 3. Validar qualidade
    const validationStart = Date.now();
    const qualityResult = validateQuality(responseToValidate);
    const validationTime = Date.now() - validationStart;

    // 4. Validar alucinações
    const crossValidationStart = Date.now();
    const crossValidationResult = await validateResponseCrossValidation(
      query,
      llmResponse,
      sourceDocuments.map((doc, idx) => ({ id: `doc-${idx}`, content: doc })),
      citations.map((citation, idx) => ({ id: `cite-${idx}`, text: citation, source: 'RAG' }))
    );
    const crossValidationTime = Date.now() - crossValidationStart;

    // 5. Salvar em histórico
    await addMessage(
      conversationId,
      'user',
      query,
      { sourceDocumentCount: sourceDocuments.length }
    );

    await addMessage(
      conversationId,
      'assistant',
      llmResponse,
      {
        qualityScore: qualityResult.score,
        qualityPassed: qualityResult.passed,
        hallucinated: crossValidationResult.hasHallucinations,
        hallucinations: crossValidationResult.hallucinations.map((h) => h.text),
      }
    );

    // 6. Registrar no audit trail
    const auditEvent = await logAuditEvent({
      eventType: 'rag_response_generated',
      entityType: 'conversation',
      entityId: conversationId,
      userId,
      action: 'generate_response',
      details: {
        query,
        responseLength: llmResponse.length,
        qualityScore: qualityResult.score,
        qualityPassed: qualityResult.passed,
        hallucinated: crossValidationResult.hasHallucinations,
        documentCount: sourceDocuments.length,
      },
      ipAddress: '0.0.0.0',
    });

    const executionTime = Date.now() - startTime;

    // 7. Retornar resposta validada
    const response: RAGResponse = {
      content: llmResponse,
      sourceDocuments,
      citations,
      qualityScore: qualityResult.score,
      qualityPassed: qualityResult.passed,
      hallucinations: crossValidationResult.hallucinations.map((h) => h.text),
      hallucinated: crossValidationResult.hasHallucinations,
      confidence: 0.85,
      executionTime,
      auditId: auditEvent.id,
      metadata: {
        documentCount: sourceDocuments.length,
        searchTime,
        validationTime,
        crossValidationTime,
      },
    };

    console.log(`[RAG] Query processada em ${executionTime}ms`);
    return response;
  } catch (error) {
    console.error('[RAG] Erro ao processar query:', error);
    throw error;
  }
}

/**
 * Obter histórico de conversa
 */
export async function getRAGConversationHistory(conversationId: string): Promise<MessageRecord[]> {
  try {
    const history = await getConversationHistory(conversationId);
    return history;
  } catch (error) {
    console.error('[RAG] Erro ao obter histórico:', error);
    throw error;
  }
}

/**
 * Validar resposta completa
 */
export function validateRAGResponse(response: RAGResponse): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validações críticas
  if (!response.qualityPassed) {
    errors.push('Resposta não passou na validação de qualidade');
  }

  if (response.hallucinated) {
    errors.push('Resposta contém alucinações detectadas');
  }

  if (response.sourceDocuments.length === 0) {
    errors.push('Nenhum documento de origem encontrado');
  }

  // Avisos
  if (response.qualityScore < 50) {
    warnings.push('Pontuação de qualidade baixa');
  }

  if (response.hallucinations.length > 0) {
    warnings.push(`${response.hallucinations.length} possíveis alucinações detectadas`);
  }

  if (response.confidence < 0.7) {
    warnings.push('Confiança baixa na resposta');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Estrutura de estatísticas do RAG
 */
export interface RAGStatistics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageExecutionTime: number;
  averageQualityScore: number;
  hallucinationRate: number;
  timestamp: Date;
}

// Estatísticas globais
let stats: RAGStatistics = {
  totalQueries: 0,
  successfulQueries: 0,
  failedQueries: 0,
  averageExecutionTime: 0,
  averageQualityScore: 0,
  hallucinationRate: 0,
  timestamp: new Date(),
};

/**
 * Atualizar estatísticas
 */
export function updateRAGStatistics(response: RAGResponse, valid: boolean): void {
  stats.totalQueries++;

  if (valid) {
    stats.successfulQueries++;
  } else {
    stats.failedQueries++;
  }

  // Calcular médias
  stats.averageExecutionTime =
    (stats.averageExecutionTime * (stats.totalQueries - 1) + response.executionTime) /
    stats.totalQueries;

  stats.averageQualityScore =
    (stats.averageQualityScore * (stats.totalQueries - 1) + response.qualityScore) /
    stats.totalQueries;

  const hallucinations = response.hallucinations.length;
  stats.hallucinationRate =
    (stats.hallucinationRate * (stats.totalQueries - 1) + (hallucinations > 0 ? 1 : 0)) /
    stats.totalQueries;

  stats.timestamp = new Date();
}

/**
 * Obter estatísticas do RAG
 */
export function getRAGStatistics(): RAGStatistics {
  return { ...stats };
}

/**
 * Resetar estatísticas
 */
export function resetRAGStatistics(): void {
  stats = {
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    averageExecutionTime: 0,
    averageQualityScore: 0,
    hallucinationRate: 0,
    timestamp: new Date(),
  };
}
