/**
 * RAG Chat Híbrido - Chat com Contexto RAG + LLM Puro
 * 
 * Arquitetura Híbrida:
 * 1. Se documentos com score >= 0.5: Usa RAG (contexto + LLM)
 * 2. Se score < 0.5 ou sem documentos: Usa LLM puro
 * 3. Sempre salva histórico
 * 4. Sempre extrai citações (quando disponível)
 * 5. Memória de conversa anterior
 */

import { invokeLLM } from '../llm';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ChatContext {
  conversationId: string;
  userId: string;
  organizationId: string;
  messages: ChatMessage[];
  documentIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RAGResponse {
  id: string;
  conversationId: string;
  query: string;
  response: string;
  citations: Array<{
    id: string;
    text: string;
    source: string;
  }>;
  qualityScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresApproval: boolean;
  retrievedDocuments: Array<{
    id: string;
    score: number;
    content: string;
  }>;
  generatedAt: Date;
  metadata?: {
    mode: 'RAG' | 'LLM_PURE';
    hasDocuments: boolean;
  };
}

/**
 * Processar query com RAG Híbrido
 */
export async function processRAGQuery(
  query: string,
  conversationId: string,
  userId: string,
  organizationId: string,
  retrievedDocuments: Array<{
    id: string;
    score: number;
    content: string;
  }> = [],
  conversationHistory: ChatMessage[] = []
): Promise<RAGResponse> {
  const responseId = `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // 1. Determinar modo: RAG ou LLM Puro
    const hasRelevantDocuments = retrievedDocuments.length > 0 && retrievedDocuments[0].score >= 0.5;
    const mode = hasRelevantDocuments ? 'RAG' : 'LLM_PURE';

    // 2. Preparar system prompt baseado no modo
    let systemPrompt = `Você é um assistente técnico especializado em higiene profissional e segurança ocupacional.`;

    if (mode === 'RAG') {
      const context = retrievedDocuments
        .map((doc, idx) => `[Doc ${idx + 1}] (Score: ${(doc.score * 100).toFixed(1)}%)\n${doc.content}`)
        .join('\n\n');

      systemPrompt += `\n\nVocê tem acesso aos seguintes documentos para responder perguntas:\n\n${context}\n\nInstruções:\n1. Responda baseado nos documentos fornecidos\n2. Cite as fontes usando [Doc N]\n3. Se a informação não estiver nos documentos, diga claramente\n4. Seja preciso e conciso`;
    } else {
      systemPrompt += `\n\nVocê não tem acesso a documentos específicos.\nResponda com base em seu conhecimento geral sobre higiene profissional e segurança ocupacional.\nSeja preciso, conciso e use linguagem técnica apropriada.`;
    }

    // 3. Preparar histórico de conversa
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: query },
    ];

    // 4. Gerar resposta com LLM
    const llmResponse = await invokeLLM({
      messages: messages as any,
    });

    const responseText =
      typeof llmResponse.choices[0].message.content === 'string'
        ? llmResponse.choices[0].message.content
        : JSON.stringify(llmResponse.choices[0].message.content);

    // 5. Extrair citações (apenas em modo RAG)
    const citations = mode === 'RAG' ? extractCitations(responseText, retrievedDocuments) : [];

    // 6. Calcular qualidade
    const qualityScore = calculateQualityScore(responseText, citations, retrievedDocuments, mode);

    // 7. Classificar risco
    const riskLevel = classifyRisk(responseText, query);

    const ragResponse: RAGResponse = {
      id: responseId,
      conversationId,
      query,
      response: responseText,
      citations,
      qualityScore,
      riskLevel,
      requiresApproval: riskLevel === 'HIGH' || riskLevel === 'CRITICAL',
      retrievedDocuments: mode === 'RAG' ? retrievedDocuments : [],
      generatedAt: new Date(),
      metadata: {
        mode,
        hasDocuments: hasRelevantDocuments,
      },
    };

    return ragResponse;
  } catch (error) {
    console.error('Erro ao processar query RAG híbrido:', error);
    throw error;
  }
}

/**
 * Extrair citações da resposta
 */
function extractCitations(
  response: string,
  documents: Array<{
    id: string;
    score: number;
    content: string;
  }>
): Array<{
  id: string;
  text: string;
  source: string;
}> {
  const citations: Array<{
    id: string;
    text: string;
    source: string;
  }> = [];

  const docPattern = /\[Doc (\d+)\]/g;
  let match;

  while ((match = docPattern.exec(response)) !== null) {
    const docIndex = parseInt(match[1]) - 1;
    if (docIndex >= 0 && docIndex < documents.length) {
      const doc = documents[docIndex];
      citations.push({
        id: `cite-${doc.id}`,
        text: doc.content.substring(0, 200),
        source: doc.id,
      });
    }
  }

  return citations;
}

/**
 * Calcular score de qualidade
 */
function calculateQualityScore(
  response: string,
  citations: Array<{ id: string; text: string; source: string }>,
  documents: Array<{ id: string; score: number; content: string }>,
  mode: 'RAG' | 'LLM_PURE'
): number {
  let score = 50;

  if (mode === 'RAG') {
    // Em modo RAG, valorizar citações e documentos
    if (citations.length > 0) {
      score += Math.min(citations.length * 10, 30);
    }

    const avgDocScore = documents.length > 0 ? documents.reduce((sum, d) => sum + d.score, 0) / documents.length : 0;
    score += avgDocScore * 20;
  } else {
    // Em modo LLM puro, valorizar comprimento e estrutura
    if (response.length > 300) {
      score += 20;
    } else if (response.length > 150) {
      score += 10;
    }
  }

  if (response.length > 200) {
    score += 10;
  }

  return Math.min(Math.round(score), 100);
}

/**
 * Classificar risco
 */
function classifyRisk(response: string, query: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const text = (response + ' ' + query).toLowerCase();

  const criticalKeywords = ['morte', 'letal', 'fatal', 'veneno', 'explosivo'];
  if (criticalKeywords.some(kw => text.includes(kw))) {
    return 'CRITICAL';
  }

  const highKeywords = ['perigo', 'risco', 'tóxico', 'queimadura', 'lesão'];
  if (highKeywords.some(kw => text.includes(kw))) {
    return 'HIGH';
  }

  const mediumKeywords = ['cuidado', 'precaução', 'proteção', 'segurança'];
  if (mediumKeywords.some(kw => text.includes(kw))) {
    return 'MEDIUM';
  }

  return 'LOW';
}

/**
 * Validar resposta RAG
 */
export function validateRAGResponse(response: RAGResponse): boolean {
  if (!response.id || !response.conversationId || !response.query || !response.response) {
    console.error('Resposta RAG incompleta');
    return false;
  }

  if (response.qualityScore < 0 || response.qualityScore > 100) {
    console.error(`Score de qualidade inválido: ${response.qualityScore}`);
    return false;
  }

  if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(response.riskLevel)) {
    console.error(`Nível de risco inválido: ${response.riskLevel}`);
    return false;
  }

  return true;
}

/**
 * Calcular estatísticas de chat
 */
export function getChatStats(responses: RAGResponse[]): {
  totalResponses: number;
  avgQualityScore: number;
  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
  criticalRiskCount: number;
  avgCitations: number;
  ragModeCount: number;
  llmPureModeCount: number;
} {
  if (responses.length === 0) {
    return {
      totalResponses: 0,
      avgQualityScore: 0,
      lowRiskCount: 0,
      mediumRiskCount: 0,
      highRiskCount: 0,
      criticalRiskCount: 0,
      avgCitations: 0,
      ragModeCount: 0,
      llmPureModeCount: 0,
    };
  }

  return {
    totalResponses: responses.length,
    avgQualityScore: Math.round(responses.reduce((sum, r) => sum + r.qualityScore, 0) / responses.length),
    lowRiskCount: responses.filter(r => r.riskLevel === 'LOW').length,
    mediumRiskCount: responses.filter(r => r.riskLevel === 'MEDIUM').length,
    highRiskCount: responses.filter(r => r.riskLevel === 'HIGH').length,
    criticalRiskCount: responses.filter(r => r.riskLevel === 'CRITICAL').length,
    avgCitations: Math.round(responses.reduce((sum, r) => sum + r.citations.length, 0) / responses.length),
    ragModeCount: responses.filter(r => r.metadata?.mode === 'RAG').length,
    llmPureModeCount: responses.filter(r => r.metadata?.mode === 'LLM_PURE').length,
  };
}
