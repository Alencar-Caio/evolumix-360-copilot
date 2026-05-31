/**
 * Conversation History - Persistência de Conversas
 * 
 * Responsabilidade: Salvar e recuperar histórico de conversas
 * 
 * Fluxo:
 * 1. Salvar cada mensagem (user + assistant)
 * 2. Salvar contexto (documentos, validação)
 * 3. Recuperar histórico para contexto
 * 4. Permitir busca e filtro
 * 5. Manter conformidade (GDPR - direito ao esquecimento)
 * 
 * Justificativa:
 * - Contexto conversacional (memória)
 * - Auditoria (rastreabilidade)
 * - Conformidade GDPR (direito ao esquecimento)
 * - Análise de padrões
 */

import { getDb } from '../../db';
import { conversationMessages, conversations } from '../../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Estrutura de conversa
 */
export interface ConversationRecord {
  id: string;
  userId: string;
  organizationId: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  status: 'active' | 'archived' | 'deleted';
}

/**
 * Estrutura de mensagem
 */
export interface MessageRecord {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    citations?: Array<{ id: string; source: string }>;
    qualityScore?: number;
    riskLevel?: string;
    validationId?: string;
  };
  createdAt: Date;
}

/**
 * Criar nova conversa
 */
export async function createConversation(
  userId: string,
  organizationId: string,
  title?: string
): Promise<ConversationRecord> {
  const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();

  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    await db.insert(conversations).values({
      id: conversationId,
      userId,
      organizationId,
      title: title || `Conversa ${new Date().toLocaleDateString('pt-BR')}`,
      createdAt: now,
      updatedAt: now,
      status: 'active',
    });

    return {
      id: conversationId,
      userId,
      organizationId,
      title,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      status: 'active',
    };
  } catch (error) {
    console.error('Erro ao criar conversa:', error);
    throw error;
  }
}

/**
 * Adicionar mensagem ao histórico
 */
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: Record<string, any> | null
): Promise<MessageRecord> {
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();

  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    await db.insert(conversationMessages).values({
      id: messageId,
      conversationId,
      role,
      content,
      metadata: metadata || undefined,
      createdAt: now,
    });

    // Atualizar timestamp da conversa
    await db
      .update(conversations)
      .set({ updatedAt: now })
      .where(eq(conversations.id, conversationId));


    return {
      id: messageId,
      conversationId,
      role,
      content,
      metadata: metadata || undefined,
      createdAt: now,
    };
  } catch (error) {
    console.error('Erro ao adicionar mensagem:', error);
    throw error;
  }
}

/**
 * Recuperar histórico de conversa
 */
export async function getConversationHistory(
  conversationId: string,
  limit: number = 50
): Promise<MessageRecord[]> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const messages = await db
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, conversationId))
      .orderBy(desc(conversationMessages.createdAt))
      .limit(limit);

    return messages
      .reverse()
      .map((msg: any) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        metadata: msg.metadata as Record<string, any> | undefined,
        createdAt: msg.createdAt,
      }));
  } catch (error) {
    console.error('Erro ao recuperar histórico:', error);
    throw error;
  }
}

/**
 * Listar conversas do usuário
 */
export async function listConversations(
  userId: string,
  organizationId: string,
  limit: number = 20
): Promise<ConversationRecord[]> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const convs = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.userId, userId), eq(conversations.organizationId, organizationId)))
      .orderBy(desc(conversations.updatedAt))
      .limit(limit);

    return convs.map((conv: any) => ({
      id: conv.id,
      userId: conv.userId,
      organizationId: conv.organizationId,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messageCount: 0, // TODO: contar mensagens
      status: conv.status as 'active' | 'archived' | 'deleted',
    }));
  } catch (error) {
    console.error('Erro ao listar conversas:', error);
    throw error;
  }
}

/**
 * Arquivar conversa
 */
export async function archiveConversation(conversationId: string): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    await db
      .update(conversations)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
  } catch (error) {
    console.error('Erro ao arquivar conversa:', error);
    throw error;
  }
}

/**
 * Deletar conversa (GDPR - direito ao esquecimento)
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  try {
    // Soft delete - marca como deletada, não remove dados
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    await db
      .update(conversations)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    // TODO: Implementar hard delete após período de retenção (GDPR)
  } catch (error) {
    console.error('Erro ao deletar conversa:', error);
    throw error;
  }
}

/**
 * Buscar mensagens por conteúdo
 */
export async function searchMessages(
  organizationId: string,
  query: string,
  limit: number = 20
): Promise<MessageRecord[]> {
  try {
    // TODO: Implementar busca full-text com PostgreSQL
    // Por enquanto, busca simples em memória
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const messages = await db
      .select()
      .from(conversationMessages)
      .limit(limit);

    return messages
      .filter((msg: any) => msg.content.toLowerCase().includes(query.toLowerCase()))
      .map((msg: any) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        metadata: msg.metadata as Record<string, any> | undefined,
        createdAt: msg.createdAt,
      }));
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    throw error;
  }
}

/**
 * Obter estatísticas de conversa
 */
export async function getConversationStats(conversationId: string): Promise<{
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  avgQualityScore: number;
  riskDistribution: Record<string, number>;
}> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const messages = await db
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, conversationId));

    const userMessages = messages.filter((m: any) => m.role === 'user').length;
    const assistantMessages = messages.filter((m: any) => m.role === 'assistant').length;

    const qualityScores: number[] = [];
    const riskDistribution: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    messages.forEach((msg: any) => {
      if (msg.metadata && typeof msg.metadata === 'object') {
        const meta = msg.metadata as Record<string, any>;
        if (meta.qualityScore) {
          qualityScores.push(meta.qualityScore);
        }
        if (meta.riskLevel) {
          riskDistribution[meta.riskLevel] = (riskDistribution[meta.riskLevel] || 0) + 1;
        }
      }
    });

    const avgQualityScore =
      qualityScores.length > 0 ? Math.round(qualityScores.reduce((a, b) => a + b) / qualityScores.length) : 0;

    return {
      totalMessages: messages.length,
      userMessages,
      assistantMessages,
      avgQualityScore,
      riskDistribution,
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    throw error;
  }
}
