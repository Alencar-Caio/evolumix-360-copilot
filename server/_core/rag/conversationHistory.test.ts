/**
 * Testes para Conversation History
 * 
 * Validar:
 * - Criar conversa
 * - Adicionar mensagens
 * - Recuperar histórico
 * - Listar conversas
 * - Arquivar/deletar
 * - Estatísticas
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createConversation,
  addMessage,
  getConversationHistory,
  listConversations,
  archiveConversation,
  deleteConversation,
  getConversationStats,
  searchMessages,
} from './conversationHistory';

// Mock do getDb
vi.mock('../../db', () => ({
  getDb: vi.fn(() => Promise.resolve(null)),
}));

describe('Conversation History', () => {
  const userId = 'user-123';
  const organizationId = 'org-456';
  let conversationId: string;

  describe('createConversation', () => {
    it('deve criar uma conversa com sucesso', async () => {
      const result = await createConversation(userId, organizationId, 'Test Conversation');
      
      expect(result).toBeDefined();
      expect(result.id).toMatch(/^conv-/);
      expect(result.userId).toBe(userId);
      expect(result.organizationId).toBe(organizationId);
      expect(result.title).toBe('Test Conversation');
      expect(result.status).toBe('active');
      expect(result.messageCount).toBe(0);
      
      conversationId = result.id;
    });

    it('deve gerar título automático se não fornecido', async () => {
      const result = await createConversation(userId, organizationId);
      
      expect(result.title).toMatch(/^Conversa/);
    });

    it('deve lançar erro se banco não estiver disponível', async () => {
      // getDb retorna null no mock
      await expect(createConversation(userId, organizationId)).rejects.toThrow('Database not available');
    });
  });

  describe('addMessage', () => {
    beforeEach(async () => {
      const conv = await createConversation(userId, organizationId);
      conversationId = conv.id;
    });

    it('deve adicionar mensagem de usuário', async () => {
      const result = await addMessage(conversationId, 'user', 'Olá, como vai?');
      
      expect(result).toBeDefined();
      expect(result.id).toMatch(/^msg-/);
      expect(result.conversationId).toBe(conversationId);
      expect(result.role).toBe('user');
      expect(result.content).toBe('Olá, como vai?');
    });

    it('deve adicionar mensagem de assistente com metadata', async () => {
      const metadata = {
        citations: [{ id: 'doc-1', source: 'FISPQ' }],
        qualityScore: 0.95,
        riskLevel: 'LOW',
      };
      
      const result = await addMessage(
        conversationId,
        'assistant',
        'Tudo bem!',
        metadata
      );
      
      expect(result.role).toBe('assistant');
      expect(result.content).toBe('Tudo bem!');
      expect(result.metadata).toEqual(metadata);
    });

    it('deve permitir metadata nula', async () => {
      const result = await addMessage(conversationId, 'user', 'Teste', null);
      
      expect(result.metadata).toBeUndefined();
    });

    it('deve lançar erro se banco não estiver disponível', async () => {
      await expect(addMessage(conversationId, 'user', 'Teste')).rejects.toThrow('Database not available');
    });
  });

  describe('getConversationHistory', () => {
    it('deve recuperar histórico de conversa', async () => {
      const result = await getConversationHistory(conversationId);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('deve respeitar limite de mensagens', async () => {
      const result = await getConversationHistory(conversationId, 10);
      
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('deve retornar mensagens em ordem cronológica', async () => {
      const result = await getConversationHistory(conversationId);
      
      for (let i = 1; i < result.length; i++) {
        expect(result[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          result[i - 1].createdAt.getTime()
        );
      }
    });

    it('deve lançar erro se banco não estiver disponível', async () => {
      await expect(getConversationHistory(conversationId)).rejects.toThrow('Database not available');
    });
  });

  describe('listConversations', () => {
    it('deve listar conversas do usuário', async () => {
      const result = await listConversations(userId, organizationId);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('deve respeitar limite de conversas', async () => {
      const result = await listConversations(userId, organizationId, 5);
      
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('deve retornar conversas ordenadas por atualização', async () => {
      const result = await listConversations(userId, organizationId);
      
      for (let i = 1; i < result.length; i++) {
        expect(result[i].updatedAt.getTime()).toBeLessThanOrEqual(
          result[i - 1].updatedAt.getTime()
        );
      }
    });

    it('deve lançar erro se banco não estiver disponível', async () => {
      await expect(listConversations(userId, organizationId)).rejects.toThrow('Database not available');
    });
  });

  describe('archiveConversation', () => {
    it('deve arquivar conversa', async () => {
      await archiveConversation(conversationId);
      // Sem erro = sucesso
    });

    it('deve lançar erro se banco não estiver disponível', async () => {
      await expect(archiveConversation(conversationId)).rejects.toThrow('Database not available');
    });
  });

  describe('deleteConversation', () => {
    it('deve deletar conversa (soft delete)', async () => {
      await deleteConversation(conversationId);
      // Sem erro = sucesso
    });

    it('deve lançar erro se banco não estiver disponível', async () => {
      await expect(deleteConversation(conversationId)).rejects.toThrow('Database not available');
    });
  });

  describe('searchMessages', () => {
    it('deve buscar mensagens por conteúdo', async () => {
      const result = await searchMessages(organizationId, 'teste');
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('deve respeitar limite de resultados', async () => {
      const result = await searchMessages(organizationId, 'teste', 5);
      
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('deve lançar erro se banco não estiver disponível', async () => {
      await expect(searchMessages(organizationId, 'teste')).rejects.toThrow('Database not available');
    });
  });

  describe('getConversationStats', () => {
    it('deve retornar estatísticas de conversa', async () => {
      const result = await getConversationStats(conversationId);
      
      expect(result).toBeDefined();
      expect(result.totalMessages).toBeGreaterThanOrEqual(0);
      expect(result.userMessages).toBeGreaterThanOrEqual(0);
      expect(result.assistantMessages).toBeGreaterThanOrEqual(0);
      expect(result.avgQualityScore).toBeGreaterThanOrEqual(0);
      expect(result.riskDistribution).toBeDefined();
    });

    it('deve contar mensagens corretamente', async () => {
      const result = await getConversationStats(conversationId);
      
      expect(result.userMessages + result.assistantMessages).toBe(result.totalMessages);
    });

    it('deve calcular qualidade média corretamente', async () => {
      const result = await getConversationStats(conversationId);
      
      expect(result.avgQualityScore).toBeGreaterThanOrEqual(0);
      expect(result.avgQualityScore).toBeLessThanOrEqual(100);
    });

    it('deve lançar erro se banco não estiver disponível', async () => {
      await expect(getConversationStats(conversationId)).rejects.toThrow('Database not available');
    });
  });

  describe('Interface Types', () => {
    it('ConversationRecord deve ter campos obrigatórios', async () => {
      const conv = await createConversation(userId, organizationId);
      
      expect(conv.id).toBeDefined();
      expect(conv.userId).toBeDefined();
      expect(conv.organizationId).toBeDefined();
      expect(conv.createdAt).toBeDefined();
      expect(conv.updatedAt).toBeDefined();
      expect(conv.status).toBeDefined();
    });

    it('MessageRecord deve ter campos obrigatórios', async () => {
      const msg = await addMessage(conversationId, 'user', 'Teste');
      
      expect(msg.id).toBeDefined();
      expect(msg.conversationId).toBeDefined();
      expect(msg.role).toBeDefined();
      expect(msg.content).toBeDefined();
      expect(msg.createdAt).toBeDefined();
    });
  });
});
