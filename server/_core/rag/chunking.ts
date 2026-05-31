/**
 * RAG Chunking Strategy
 * 
 * Responsabilidade: Dividir documentos em chunks otimizados para embedding
 * 
 * Estratégia:
 * - Chunk size: 512 tokens (≈ 2000 caracteres)
 * - Overlap: 50 tokens (para contexto)
 * - Preservar limites semânticos (seções, parágrafos)
 * - Manter metadata de origem (página, seção)
 * 
 * Justificativa:
 * - 512 tokens é o sweet spot entre contexto e precisão
 * - 50 tokens de overlap garante continuidade semântica
 * - Preservar estrutura melhora relevância da busca
 * - Metadata permite rastreabilidade de citações
 */

import { encodingForModel } from 'js-tiktoken';

/**
 * Chunk: Unidade básica de indexação RAG
 * 
 * Cada chunk representa um segmento de documento que será:
 * 1. Convertido em embedding (vetor semântico)
 * 2. Armazenado em índice vetorial (Pinecone)
 * 3. Recuperado em buscas por similaridade
 * 4. Usado como contexto para LLM
 */
export interface Chunk {
  /** ID único do chunk: {documentId}-chunk-{index} */
  id: string;
  
  /** ID do documento original */
  documentId: string;
  
  /** ID da versão do documento */
  versionId: string;
  
  /** Texto do chunk */
  text: string;
  
  /** Número da página (para citações) */
  pageNumber: number;
  
  /** Título da seção (para contexto) */
  sectionTitle: string;
  
  /** Posição inicial do chunk no documento (caracteres) */
  startChar: number;
  
  /** Posição final do chunk no documento (caracteres) */
  endChar: number;
  
  /** Número de tokens no chunk */
  tokenCount: number;
  
  /** Metadata adicional */
  metadata: {
    source: string; // título do documento
    documentType: string; // FISPQ, technical_sheet, etc
    supplier: string; // fornecedor
  };
}

/**
 * Estratégia de chunking por seções
 * 
 * Algoritmo:
 * 1. Dividir documento por seções (headers, títulos)
 * 2. Para cada seção, dividir em chunks de 512 tokens
 * 3. Adicionar overlap de 50 tokens entre chunks
 * 4. Validar limites semânticos (não cortar palavras)
 * 5. Adicionar metadata e validar token count
 */
export function chunkDocument(
  text: string,
  metadata: {
    id: string;
    versionId: string;
    title: string;
    type: string;
    supplier: string;
    pageNumber: number;
  }
): Chunk[] {
  const chunks: Chunk[] = [];
  const enc = encodingForModel('gpt-4');
  
  // Parâmetros de chunking
  const CHUNK_SIZE = 512; // tokens
  const OVERLAP = 50; // tokens
  const MIN_CHUNK_SIZE = 50; // tokens mínimos
  
  // 1. Dividir por seções (linhas em branco duplas)
  const sections = text.split(/\n\n+/);
  
  let globalCharOffset = 0;
  let chunkIndex = 0;
  
  for (const section of sections) {
    if (!section.trim()) continue;
    
    // 2. Dividir seção em chunks
    const sectionChunks = chunkSection(
      section,
      CHUNK_SIZE,
      OVERLAP,
      MIN_CHUNK_SIZE,
      enc
    );
    
    // 3. Criar objetos Chunk com metadata
    for (let i = 0; i < sectionChunks.length; i++) {
      const chunkText = sectionChunks[i];
      const tokenCount = enc.encode(chunkText).length;
      
      // Validar token count
      if (tokenCount < MIN_CHUNK_SIZE) {
        console.warn(`Chunk ${chunkIndex} abaixo do mínimo: ${tokenCount} tokens`);
        continue;
      }
      
      const chunk: Chunk = {
        id: `${metadata.id}-chunk-${chunkIndex}`,
        documentId: metadata.id,
        versionId: metadata.versionId,
        text: chunkText,
        pageNumber: metadata.pageNumber,
        sectionTitle: extractSectionTitle(section),
        startChar: globalCharOffset,
        endChar: globalCharOffset + chunkText.length,
        tokenCount,
        metadata: {
          source: metadata.title,
          documentType: metadata.type,
          supplier: metadata.supplier,
        },
      };
      
      chunks.push(chunk);
      globalCharOffset += chunkText.length;
      chunkIndex++;
    }
  }
  
  return chunks;
}

/**
 * Dividir seção em chunks com overlap
 * 
 * Algoritmo:
 * 1. Tokenizar seção
 * 2. Dividir em chunks de CHUNK_SIZE
 * 3. Adicionar OVERLAP tokens do chunk anterior
 * 4. Converter tokens de volta para texto
 * 5. Validar limites semânticos
 */
function chunkSection(
  text: string,
  chunkSize: number,
  overlap: number,
  minSize: number,
  enc: ReturnType<typeof encodingForModel>
): string[] {
  const chunks: string[] = [];
  const tokens = enc.encode(text);
  
  if (tokens.length <= chunkSize) {
    return [text];
  }
  
  let start = 0;
  
  while (start < tokens.length) {
    // Calcular fim do chunk
    let end = Math.min(start + chunkSize, tokens.length);
    
    // Validar limite semântico (não cortar palavras)
    // Procurar pelo próximo espaço antes de 'end'
    if (end < tokens.length) {
      const chunk = enc.decode(tokens.slice(start, end));
      const lastSpace = chunk.lastIndexOf(' ');
      if (lastSpace > 0 && lastSpace > chunk.length * 0.8) {
        end = start + Math.floor((end - start) * (lastSpace / chunk.length));
      }
    }
    
    // Extrair chunk
    const chunkTokens = tokens.slice(start, end);
    const chunkText = enc.decode(chunkTokens);
    
    // Validar tamanho mínimo
    if (chunkTokens.length >= minSize) {
      chunks.push(chunkText);
    }
    
    // Avançar com overlap
    start = end - overlap;
    
    // Evitar loop infinito
    if (start >= end) {
      break;
    }
  }
  
  return chunks;
}

/**
 * Extrair título da seção do texto
 * 
 * Heurística:
 * 1. Procurar por linhas que parecem títulos (curtas, em maiúsculas)
 * 2. Retornar primeira linha ou "Untitled"
 */
function extractSectionTitle(text: string): string {
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Procurar por linhas que parecem títulos
    if (
      trimmed.length > 0 &&
      trimmed.length < 100 &&
      (trimmed === trimmed.toUpperCase() || trimmed.endsWith(':'))
    ) {
      return trimmed;
    }
  }
  
  // Fallback: primeira linha
  return lines[0]?.trim().substring(0, 50) || 'Untitled';
}

/**
 * Validar chunks
 * 
 * Verificações:
 * - Token count válido
 * - Texto não vazio
 * - Metadata completa
 * - IDs únicos
 */
export function validateChunks(chunks: Chunk[]): boolean {
  const ids = new Set<string>();
  
  for (const chunk of chunks) {
    // Validar ID único
    if (ids.has(chunk.id)) {
      console.error(`Chunk ID duplicado: ${chunk.id}`);
      return false;
    }
    ids.add(chunk.id);
    
    // Validar texto
    if (!chunk.text || chunk.text.trim().length === 0) {
      console.error(`Chunk vazio: ${chunk.id}`);
      return false;
    }
    
    // Validar token count
    if (chunk.tokenCount <= 0 || chunk.tokenCount > 1000) {
      console.error(`Token count inválido para ${chunk.id}: ${chunk.tokenCount}`);
      return false;
    }
    
    // Validar metadata
    if (!chunk.metadata.source || !chunk.metadata.documentType) {
      console.error(`Metadata incompleta para ${chunk.id}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Calcular estatísticas de chunks
 */
export function getChunkStats(chunks: Chunk[]): {
  totalChunks: number;
  totalTokens: number;
  avgTokensPerChunk: number;
  minTokens: number;
  maxTokens: number;
} {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      totalTokens: 0,
      avgTokensPerChunk: 0,
      minTokens: 0,
      maxTokens: 0,
    };
  }
  
  const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0);
  const tokenCounts = chunks.map(c => c.tokenCount);
  
  return {
    totalChunks: chunks.length,
    totalTokens,
    avgTokensPerChunk: Math.round(totalTokens / chunks.length),
    minTokens: Math.min(...tokenCounts),
    maxTokens: Math.max(...tokenCounts),
  };
}
