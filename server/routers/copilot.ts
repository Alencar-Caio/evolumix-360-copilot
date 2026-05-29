import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { createQuery, logAudit, getApprovedDocuments } from "../db";
import { getDb } from "../db";
import { queries, documentVersions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Classificador de risco automático (RAI - Risk Assessment Index)
 * Analisa a resposta e classifica o nível de risco
 */
async function classifyRisk(responseText: string): Promise<'low' | 'medium' | 'high' | 'critical'> {
  // Palavras-chave que indicam risco crítico
  const criticalKeywords = ['proibido', 'tóxico', 'cancerígeno', 'fatal', 'morte', 'explosivo', 'inflamável extremo'];
  const highKeywords = ['perigoso', 'tóxico', 'corrosivo', 'irritante', 'alérgico'];
  const mediumKeywords = ['cuidado', 'atenção', 'risco', 'precaução'];
  
  const lowerText = responseText.toLowerCase();
  
  if (criticalKeywords.some(kw => lowerText.includes(kw))) return 'critical';
  if (highKeywords.some(kw => lowerText.includes(kw))) return 'high';
  if (mediumKeywords.some(kw => lowerText.includes(kw))) return 'medium';
  
  return 'low';
}

/**
 * Calcular score de fidelidade (faithfulness)
 * Mede se a resposta está baseada nos documentos fornecidos
 */
function calculateFaithfulnessScore(responseText: string, citationCount: number): number {
  // Score básico: se há citações, aumenta a fidelidade
  const baseFidelity = citationCount > 0 ? 0.8 : 0.5;
  
  // Ajustar por comprimento: respostas muito longas sem citações reduzem fidelidade
  const responseLength = responseText.split(' ').length;
  const citationRatio = citationCount > 0 ? Math.min(1, responseLength / (citationCount * 100)) : 0;
  
  return Math.min(1, baseFidelity + citationRatio * 0.2);
}

/**
 * Calcular cobertura de citação
 * Percentual da resposta que é citado/referenciado
 */
function calculateCitationCoverage(responseText: string, citationCount: number): number {
  if (citationCount === 0) return 0;
  
  // Estimativa: cada citação cobre ~150 caracteres em média
  const estimatedCitedChars = citationCount * 150;
  const totalChars = responseText.length;
  
  return Math.min(1, estimatedCitedChars / totalChars);
}

export const copilotRouter = router({
  /**
   * Consulta técnica com IA lastreada em documentos (RAG)
   */
  query: protectedProcedure
    .input(z.object({
      question: z.string().min(10),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Buscar documentos aprovados
      const approvedDocs = await getApprovedDocuments();
      
      // Construir contexto com documentos disponíveis
      let documentContext = '';
      const usedDocumentIds: number[] = [];
      
      if (approvedDocs.length > 0) {
        documentContext = 'Documentos técnicos disponíveis:\n\n';
        for (const doc of approvedDocs.slice(0, 5)) {
          documentContext += `- ${doc.title} (${doc.documentType}, Fornecedor: ${doc.supplierId || 'N/A'})\n`;
          usedDocumentIds.push(doc.id);
        }
        documentContext += '\n';
      }
      
      // Prompt mestre para copiloto técnico
      const systemPrompt = `Você é um especialista técnico em higiene profissional e produtos químicos de limpeza. 
Responda perguntas técnicas baseado nos documentos fornecidos (FISPQs, fichas técnicas, catálogos).
SEMPRE cite as fontes quando usar informações dos documentos.
Seja preciso, técnico e seguro em suas recomendações.
Se a informação não está nos documentos, indique claramente.`;
      
      const userPrompt = `${documentContext}Pergunta: ${input.question}`;
      
      // Chamar LLM
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });
      
      const content = response.choices[0]?.message.content;
      const responseText = typeof content === 'string' ? content : JSON.stringify(content) || '';
      
      // Extrair citações (simplificado: procura por padrões como [Doc: ...])
      const citationPattern = /\[(?:Doc|Fonte|Referência):\s*([^\]]+)\]/g;
      const citations: any[] = [];
      let match;
      
      if (responseText) {
        while ((match = citationPattern.exec(responseText)) !== null) {
          citations.push({
            documentId: usedDocumentIds[0], // Simplificado: usar primeiro doc
            excerpt: match[1],
          });
        }
      }
      
      // Calcular métricas de qualidade
      const faithfulnessScore = calculateFaithfulnessScore(responseText, citations.length);
      const citationCoverageScore = calculateCitationCoverage(responseText, citations.length);
      
      // Classificar risco
      const riskClassification = await classifyRisk(responseText);
      const requiresApproval = riskClassification === 'critical' || riskClassification === 'high';
      
      // Salvar consulta no banco de dados
      await createQuery({
        userId: ctx.user.id,
        queryText: input.question,
        responseText: responseText || '',
        usedDocumentIds,
        citations,
        faithfulnessScore,
        citationCoverageScore,
        riskClassification,
        requiresApproval,
      });
      
      // Log de auditoria
      await logAudit({
        userId: ctx.user.id,
        action: 'copilot_query',
        entityType: 'query',
        details: {
          question: input.question,
          riskClassification,
          citationCount: citations.length,
        },
        ipAddress: (ctx.req as any).ip,
        userAgent: (ctx.req as any).headers['user-agent'],
      });
      
      return {
        response: responseText || '',
        citations,
        metrics: {
          faithfulnessScore: Number(faithfulnessScore.toFixed(2)),
          citationCoverageScore: Number(citationCoverageScore.toFixed(2)),
        },
        riskClassification,
        requiresApproval,
        message: requiresApproval ? 'Esta resposta requer aprovação humana antes de ser compartilhada com clientes.' : undefined,
      };
    }),

  /**
   * Listar histórico de consultas do usuário
   */
  listHistory: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];
      
      return db.select()
        .from(queries)
        .where(eq(queries.userId, ctx.user.id))
        .limit(input.limit)
        .offset(input.offset);
    }),

  /**
   * Obter detalhes de uma consulta específica
   */
  getQuery: protectedProcedure
    .input(z.object({ queryId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;
      
      const result = await db.select()
        .from(queries)
        .where(eq(queries.id, input.queryId))
        .limit(1);
      
      if (result.length === 0) return null;
      
      const query = result[0];
      
      // Verificar permissão: apenas o autor ou admin podem ver
      if (query.userId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      return query;
    }),
});
