import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { logAudit, getDb } from "../db";
import { diagnostics, roiCalculations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Gerar script de fechamento comercial baseado em ROI e cenário
 */
async function generateClosingScript(
  clientName: string,
  area: number,
  savings: number,
  payback: number,
  savingsPercentage: number
): Promise<string> {
  const prompt = `Gere um script de fechamento comercial impactante para um consultor de higiene profissional.
  
Cliente: ${clientName}
Área: ${area}m²
Economia mensal: R$ ${savings.toFixed(2)}
Payback: ${payback.toFixed(1)} meses
Economia percentual: ${savingsPercentage.toFixed(1)}%

O script deve ser:
- Conciso e impactante (máximo 3 parágrafos)
- Focado no ROI e benefícios
- Profissional e persuasivo
- Pronto para ser usado em uma apresentação

Retorne apenas o script, sem explicações adicionais.`;

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: 'Você é um especialista em vendas de soluções de higiene profissional.' },
      { role: 'user', content: prompt },
    ],
  });

  const content = response.choices[0]?.message.content;
  return typeof content === 'string' ? content : JSON.stringify(content) || '';
}

/**
 * Gerar análise estruturada nos três pilares
 */
async function generateStructuredAnalysis(
  area: number,
  footTraffic: string,
  currentProducts: string[],
  currentConsumption: number,
  currentCost: number
): Promise<{ chemical: string; hygiene: string; roi: string }> {
  const prompt = `Analise um cenário de higiene profissional e estruture a resposta em três pilares:

CENÁRIO:
- Área: ${area}m²
- Fluxo de pessoas: ${footTraffic}
- Produtos atuais: ${currentProducts.join(', ')}
- Consumo atual: ${currentConsumption}L/mês
- Custo atual: R$ ${currentCost}/mês

Forneça análise estruturada em JSON com três campos:
{
  "chemical": "Análise do pilar Químico (produtos, composição, eficácia)",
  "hygiene": "Análise do pilar Higiene (padrões, protocolos, segurança)",
  "roi": "Análise do pilar ROI (custos, economia, viabilidade)"
}

Cada análise deve ter 2-3 parágrafos técnicos e específicos.`;

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: 'Você é um especialista em higiene profissional com profundo conhecimento técnico.' },
      { role: 'user', content: prompt },
    ],
  });

  const content = response.choices[0]?.message.content;
  const text = typeof content === 'string' ? content : JSON.stringify(content) || '{}';
  
  try {
    const parsed = JSON.parse(text);
    return {
      chemical: parsed.chemical || '',
      hygiene: parsed.hygiene || '',
      roi: parsed.roi || '',
    };
  } catch {
    return {
      chemical: 'Análise química em processamento...',
      hygiene: 'Análise de higiene em processamento...',
      roi: 'Análise de ROI em processamento...',
    };
  }
}

export const diagnosticsRouter = router({
  /**
   * Criar novo diagnóstico 360º
   */
  create: protectedProcedure
    .input(z.object({
      clientName: z.string(),
      area: z.number().positive(),
      footTraffic: z.string(),
      currentProducts: z.array(z.string()),
      currentConsumption: z.number().positive(),
      currentCost: z.number().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Gerar análise estruturada
      const analysis = await generateStructuredAnalysis(
        input.area,
        input.footTraffic,
        input.currentProducts,
        input.currentConsumption,
        input.currentCost
      );

      // Criar diagnóstico
      const result = await db.insert(diagnostics).values({
        userId: ctx.user.id,
        clientName: input.clientName,
        area: String(input.area) as any,
        footTraffic: input.footTraffic,
        currentProducts: JSON.stringify(input.currentProducts),
        currentConsumption: String(input.currentConsumption) as any,
        currentCost: String(input.currentCost) as any,
        analysisChemical: analysis.chemical,
        analysisHygiene: analysis.hygiene,
        analysisROI: analysis.roi,
        status: 'completed',
      });

      const diagnosticId = (result as any).insertId;

      // Log de auditoria
      await logAudit({
        userId: ctx.user.id,
        action: 'diagnostic_created',
        entityType: 'diagnostic',
        entityId: diagnosticId,
        details: { clientName: input.clientName },
        ipAddress: (ctx.req as any).ip,
        userAgent: (ctx.req as any).headers['user-agent'],
      });

      return {
        diagnosticId,
        analysis,
        status: 'completed',
      };
    }),

  /**
   * Calcular ROI e gerar script de fechamento
   */
  calculateROI: protectedProcedure
    .input(z.object({
      diagnosticId: z.number(),
      costPerLiterDiluted: z.number().positive(),
      yield: z.number().positive(), // m²/litro
      monthlyConsumption: z.number().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Buscar diagnóstico
      const diagResult = await db.select()
        .from(diagnostics)
        .where(eq(diagnostics.id, input.diagnosticId))
        .limit(1);

      if (diagResult.length === 0) throw new Error('Diagnostic not found');

      const diagnostic = diagResult[0];

      // Verificar permissão
      if (diagnostic.userId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      // Cálculos de ROI
      const currentCost = Number(diagnostic.currentCost);
      const afterCost = input.costPerLiterDiluted * input.monthlyConsumption;
      const monthlySavings = currentCost - afterCost;
      const savingsPercentage = (monthlySavings / currentCost) * 100;
      const paybackMonths = monthlySavings > 0 ? 0 : (afterCost - currentCost) / Math.abs(monthlySavings);

      // Gerar script de fechamento
      const closingScript = await generateClosingScript(
        diagnostic.clientName,
        Number(diagnostic.area),
        monthlySavings,
        paybackMonths,
        savingsPercentage
      );

      // Salvar cálculo de ROI
      const roiResult = await db.insert(roiCalculations).values({
        diagnosticId: input.diagnosticId,
        costPerLiterDiluted: String(input.costPerLiterDiluted) as any,
        yield: String(input.yield) as any,
        monthlyConsumption: String(input.monthlyConsumption) as any,
        monthlySavings: String(monthlySavings) as any,
        paybackMonths: String(paybackMonths) as any,
        beforeCost: String(currentCost) as any,
        afterCost: String(afterCost) as any,
        savingsPercentage: String(savingsPercentage) as any,
      });

      // Atualizar diagnóstico com script de fechamento
      await db.update(diagnostics)
        .set({ closingScript })
        .where(eq(diagnostics.id, input.diagnosticId));

      // Log de auditoria
      await logAudit({
        userId: ctx.user.id,
        action: 'roi_calculated',
        entityType: 'diagnostic',
        entityId: input.diagnosticId,
        details: {
          monthlySavings,
          paybackMonths,
          savingsPercentage,
        },
        ipAddress: (ctx.req as any).ip,
        userAgent: (ctx.req as any).headers['user-agent'],
      });

      return {
        monthlySavings: Number(monthlySavings.toFixed(2)),
        paybackMonths: Number(paybackMonths.toFixed(1)),
        beforeCost: Number(currentCost.toFixed(2)),
        afterCost: Number(afterCost.toFixed(2)),
        savingsPercentage: Number(savingsPercentage.toFixed(2)),
        closingScript,
      };
    }),

  /**
   * Listar diagnósticos do usuário
   */
  list: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      return db.select()
        .from(diagnostics)
        .where(eq(diagnostics.userId, ctx.user.id))
        .limit(input.limit)
        .offset(input.offset);
    }),

  /**
   * Obter detalhes de um diagnóstico
   */
  getById: protectedProcedure
    .input(z.object({ diagnosticId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db.select()
        .from(diagnostics)
        .where(eq(diagnostics.id, input.diagnosticId))
        .limit(1);

      if (result.length === 0) return null;

      const diagnostic = result[0];

      // Verificar permissão
      if (diagnostic.userId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      // Buscar ROI associado
      const roi = await db.select()
        .from(roiCalculations)
        .where(eq(roiCalculations.diagnosticId, input.diagnosticId))
        .limit(1);

      return {
        ...diagnostic,
        roi: roi.length > 0 ? roi[0] : null,
      };
    }),
});
