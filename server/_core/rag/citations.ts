/**
 * RAG Citation Extraction - Extração de Citações
 * 
 * Responsabilidade: Extrair citações automáticas dos chunks recuperados
 * 
 * Algoritmo:
 * 1. LLM gera resposta com referências internas
 * 2. Identificar trechos citados nos chunks
 * 3. Mapear citações para chunks originais
 * 4. Validar fidelidade das citações
 * 5. Retornar resposta com citações estruturadas
 * 
 * Justificativa:
 * - Citações automáticas aumentam confiança do usuário
 * - Rastreabilidade completa da resposta
 * - Permite auditoria e conformidade
 * - Essencial para uso crítico (FISPQ, regulatório)
 */

import { invokeLLM } from '../llm';

/**
 * Citação: Referência a um chunk no contexto da resposta
 */
export interface Citation {
  /** ID único da citação */
  id: string;
  
  /** ID do chunk citado */
  chunkId: string;
  
  /** Texto citado do chunk */
  citedText: string;
  
  /** Posição no texto da resposta (início, fim) */
  position: {
    start: number;
    end: number;
  };
  
  /** Confiança da citação (0-1) */
  confidence: number;
  
  /** Tipo de citação */
  type: 'direct' | 'paraphrase' | 'inference';
  
  /** Metadata do chunk */
  metadata: {
    documentId: string;
    pageNumber: number;
    sectionTitle: string;
  };
}

/**
 * Resposta com citações
 */
export interface ResponseWithCitations {
  /** Texto da resposta */
  text: string;
  
  /** Citações extraídas */
  citations: Citation[];
  
  /** Score geral de fidelidade */
  fidelityScore: number;
  
  /** Cobertura de citações (% de texto citado) */
  citationCoverage: number;
}

/**
 * Gerenciador de extração de citações
 */
export class CitationExtractor {
  /**
   * Extrair citações de uma resposta LLM
   * 
   * Algoritmo:
   * 1. Usar LLM para identificar citações
   * 2. Mapear para chunks
   * 3. Validar fidelidade
   * 4. Estruturar resultado
   */
  async extractCitations(
    response: string,
    chunks: Array<{
      id: string;
      text: string;
      documentId: string;
      pageNumber: number;
      sectionTitle: string;
    }>
  ): Promise<ResponseWithCitations> {
    try {
      // 1. Usar LLM para identificar citações
      const citationPrompt = `
Analise a seguinte resposta e identifique todas as citações dos chunks fornecidos.
Para cada citação, indique:
- O texto citado
- O ID do chunk
- Tipo de citação (direct, paraphrase, inference)
- Confiança (0-1)

Resposta: "${response}"

Chunks disponíveis:
${chunks.map((c, i) => `[${i}] ID: ${c.id}\nTexto: ${c.text.substring(0, 200)}...`).join('\n\n')}

Retorne um JSON com a estrutura:
{
  "citations": [
    {
      "chunkIndex": 0,
      "citedText": "...",
      "type": "direct",
      "confidence": 0.95,
      "startPos": 10,
      "endPos": 50
    }
  ],
  "fidelityScore": 0.85,
  "citationCoverage": 0.75
}
`;

      const llmResponse = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em extração de citações. Analise respostas e identifique citações dos chunks fornecidos.',
          },
          {
            role: 'user',
            content: citationPrompt,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'citation_extraction',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                citations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      chunkIndex: { type: 'number' },
                      citedText: { type: 'string' },
                      type: { type: 'string', enum: ['direct', 'paraphrase', 'inference'] },
                      confidence: { type: 'number' },
                      startPos: { type: 'number' },
                      endPos: { type: 'number' },
                    },
                    required: ['chunkIndex', 'citedText', 'type', 'confidence', 'startPos', 'endPos'],
                  },
                },
                fidelityScore: { type: 'number' },
                citationCoverage: { type: 'number' },
              },
              required: ['citations', 'fidelityScore', 'citationCoverage'],
            },
          },
        },
      });

      // Parse resposta
      const content = llmResponse.choices[0].message.content;
      const parsed = JSON.parse(content);

      // 2. Mapear para chunks
      const citations: Citation[] = parsed.citations.map((c: any, idx: number) => {
        const chunk = chunks[c.chunkIndex];
        return {
          id: `citation-${idx}`,
          chunkId: chunk.id,
          citedText: c.citedText,
          position: {
            start: c.startPos,
            end: c.endPos,
          },
          confidence: c.confidence,
          type: c.type,
          metadata: {
            documentId: chunk.documentId,
            pageNumber: chunk.pageNumber,
            sectionTitle: chunk.sectionTitle,
          },
        };
      });

      return {
        text: response,
        citations,
        fidelityScore: parsed.fidelityScore,
        citationCoverage: parsed.citationCoverage,
      };
    } catch (error) {
      console.error('Erro ao extrair citações:', error);
      throw error;
    }
  }

  /**
   * Validar fidelidade de uma citação
   * 
   * Verifica se o texto citado é fiel ao chunk original
   */
  async validateCitationFidelity(
    citedText: string,
    originalText: string
  ): Promise<{
    isFaithful: boolean;
    score: number;
    issues: string[];
  }> {
    try {
      const validationPrompt = `
Valide se o texto citado é fiel ao texto original.

Texto original: "${originalText}"
Texto citado: "${citedText}"

Retorne um JSON com:
{
  "isFaithful": true/false,
  "score": 0-1,
  "issues": ["lista de problemas encontrados"]
}
`;

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em validação de citações. Verifique se citações são fiéis ao texto original.',
          },
          {
            role: 'user',
            content: validationPrompt,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'citation_validation',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                isFaithful: { type: 'boolean' },
                score: { type: 'number' },
                issues: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
              required: ['isFaithful', 'score', 'issues'],
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('Erro ao validar fidelidade:', error);
      throw error;
    }
  }

  /**
   * Calcular cobertura de citações
   * 
   * Métrica: % do texto da resposta que é citado
   */
  calculateCitationCoverage(
    responseText: string,
    citations: Citation[]
  ): number {
    if (citations.length === 0) return 0;

    // Calcular caracteres citados
    const citedChars = new Set<number>();
    
    for (const citation of citations) {
      for (let i = citation.position.start; i < citation.position.end; i++) {
        citedChars.add(i);
      }
    }

    return (citedChars.size / responseText.length) * 100;
  }

  /**
   * Gerar markdown com citações
   * 
   * Formato: Texto com [^1] referências
   */
  generateMarkdownWithCitations(
    response: ResponseWithCitations
  ): string {
    let markdown = response.text;

    // Adicionar referências em ordem reversa (para não quebrar posições)
    const sortedCitations = [...response.citations].sort(
      (a, b) => b.position.start - a.position.start
    );

    for (const citation of sortedCitations) {
      const ref = `[^${citation.id}]`;
      markdown =
        markdown.substring(0, citation.position.end) +
        ref +
        markdown.substring(citation.position.end);
    }

    // Adicionar rodapé com referências
    markdown += '\n\n---\n\n';

    for (const citation of response.citations) {
      markdown += `[^${citation.id}]: **${citation.metadata.sectionTitle}** (${citation.metadata.documentId}, p. ${citation.metadata.pageNumber}) - ${citation.type}\n`;
    }

    return markdown;
  }
}

/**
 * Validar estrutura de citações
 */
export function validateCitations(citations: Citation[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const citation of citations) {
    // Validar posição
    if (citation.position.start >= citation.position.end) {
      errors.push(`Citação ${citation.id}: posição inválida`);
    }

    // Validar confiança
    if (citation.confidence < 0 || citation.confidence > 1) {
      errors.push(`Citação ${citation.id}: confiança inválida (${citation.confidence})`);
    }

    // Validar tipo
    if (!['direct', 'paraphrase', 'inference'].includes(citation.type)) {
      errors.push(`Citação ${citation.id}: tipo inválido (${citation.type})`);
    }

    // Validar metadata
    if (!citation.metadata.documentId || !citation.metadata.sectionTitle) {
      errors.push(`Citação ${citation.id}: metadata incompleta`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calcular estatísticas de citações
 */
export function getCitationStats(citations: Citation[]): {
  totalCitations: number;
  directCitations: number;
  paraphraseCitations: number;
  inferenceCitations: number;
  avgConfidence: number;
  minConfidence: number;
  maxConfidence: number;
} {
  if (citations.length === 0) {
    return {
      totalCitations: 0,
      directCitations: 0,
      paraphraseCitations: 0,
      inferenceCitations: 0,
      avgConfidence: 0,
      minConfidence: 0,
      maxConfidence: 0,
    };
  }

  const confidences = citations.map(c => c.confidence);

  return {
    totalCitations: citations.length,
    directCitations: citations.filter(c => c.type === 'direct').length,
    paraphraseCitations: citations.filter(c => c.type === 'paraphrase').length,
    inferenceCitations: citations.filter(c => c.type === 'inference').length,
    avgConfidence: confidences.reduce((a, b) => a + b, 0) / confidences.length,
    minConfidence: Math.min(...confidences),
    maxConfidence: Math.max(...confidences),
  };
}
