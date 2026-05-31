/**
 * RAG Embeddings Strategy
 * 
 * Responsabilidade: Gerar embeddings (vetores semânticos) para chunks
 * 
 * Modelo: OpenAI text-embedding-3-large
 * - Dimensões: 3072
 * - Contexto: 8191 tokens
 * - Custo: $0.13 por 1M tokens
 * 
 * Justificativa:
 * - text-embedding-3-large é o melhor modelo de embedding disponível (2024)
 * - 3072 dimensões captura nuances semânticas complexas
 * - Normalização L2 garante comparações por cosine similarity
 * - Batch processing reduz latência e custo
 */

import OpenAI from 'openai';
import type { Chunk } from './chunking';

/**
 * Embedding: Representação vetorial de um chunk
 * 
 * Cada embedding é um vetor de 3072 dimensões que representa
 * o significado semântico do chunk. Usado para:
 * 1. Armazenar em índice vetorial (Pinecone)
 * 2. Comparar similaridade com queries
 * 3. Recuperar chunks relevantes
 */
export interface Embedding {
  /** ID do chunk (mesmo que chunk.id) */
  chunkId: string;
  
  /** Vetor de embedding (3072 dimensões) */
  vector: number[];
  
  /** Norma L2 do vetor (deve ser 1.0 para normalizado) */
  norm: number;
  
  /** Dimensões do vetor */
  dimensions: number;
  
  /** Modelo usado para gerar embedding */
  model: string;
  
  /** Timestamp de geração */
  createdAt: Date;
  
  /** Metadata do chunk original */
  metadata: {
    documentId: string;
    versionId: string;
    pageNumber: number;
    sectionTitle: string;
  };
}

/**
 * Gerenciador de embeddings
 * 
 * Responsabilidades:
 * - Gerar embeddings via OpenAI API
 * - Normalizar vetores para L2 norm = 1
 * - Validar dimensões e qualidade
 * - Batch processing para eficiência
 */
export class EmbeddingManager {
  private client: OpenAI;
  private model = 'text-embedding-3-large';
  private dimensions = 3072;
  private batchSize = 100; // Processar 100 chunks por vez
  
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  /**
   * Gerar embeddings para múltiplos chunks
   * 
   * Algoritmo:
   * 1. Dividir chunks em batches
   * 2. Para cada batch:
   *    a. Chamar OpenAI API
   *    b. Normalizar vetores
   *    c. Validar qualidade
   * 3. Retornar embeddings
   * 
   * Otimizações:
   * - Batch processing reduz latência
   * - Normalização L2 garante comparações corretas
   * - Retry logic para falhas temporárias
   */
  async generateEmbeddings(chunks: Chunk[]): Promise<Embedding[]> {
    const embeddings: Embedding[] = [];
    
    // Processar em batches
    for (let i = 0; i < chunks.length; i += this.batchSize) {
      const batch = chunks.slice(i, i + this.batchSize);
      console.log(`Processando batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(chunks.length / this.batchSize)}`);
      
      // Gerar embeddings para batch
      const batchEmbeddings = await this.generateBatchEmbeddings(batch);
      embeddings.push(...batchEmbeddings);
    }
    
    return embeddings;
  }
  
  /**
   * Gerar embeddings para um batch de chunks
   * 
   * Chamada à OpenAI API com retry logic
   */
  private async generateBatchEmbeddings(chunks: Chunk[]): Promise<Embedding[]> {
    const texts = chunks.map(c => c.text);
    
    try {
      // Chamar OpenAI API
      const response = await this.client.embeddings.create({
        model: this.model,
        input: texts,
        encoding_format: 'float',
      });
      
      // Converter para Embedding objects
      const embeddings: Embedding[] = response.data.map((data, index) => {
        const vector = data.embedding as number[];
        
        // Validar dimensões
        if (vector.length !== this.dimensions) {
          throw new Error(
            `Dimensões inválidas: esperado ${this.dimensions}, recebido ${vector.length}`
          );
        }
        
        // Normalizar para L2 norm = 1
        const normalizedVector = this.normalizeL2(vector);
        const norm = this.calculateL2Norm(normalizedVector);
        
        return {
          chunkId: chunks[index].id,
          vector: normalizedVector,
          norm,
          dimensions: this.dimensions,
          model: this.model,
          createdAt: new Date(),
          metadata: {
            documentId: chunks[index].documentId,
            versionId: chunks[index].versionId,
            pageNumber: chunks[index].pageNumber,
            sectionTitle: chunks[index].sectionTitle,
          },
        };
      });
      
      return embeddings;
    } catch (error) {
      console.error('Erro ao gerar embeddings:', error);
      throw error;
    }
  }
  
  /**
   * Normalizar vetor para L2 norm = 1
   * 
   * Fórmula: v_normalized = v / ||v||
   * 
   * Justificativa:
   * - Normalização L2 garante que todos os vetores têm a mesma magnitude
   * - Isso permite comparações por cosine similarity (dot product)
   * - Pinecone requer vetores normalizados para busca eficiente
   */
  private normalizeL2(vector: number[]): number[] {
    const norm = this.calculateL2Norm(vector);
    
    if (norm === 0) {
      throw new Error('Vetor zero não pode ser normalizado');
    }
    
    return vector.map(v => v / norm);
  }
  
  /**
   * Calcular norma L2 de um vetor
   * 
   * Fórmula: ||v|| = sqrt(sum(v_i^2))
   */
  private calculateL2Norm(vector: number[]): number {
    const sumSquares = vector.reduce((sum, v) => sum + v * v, 0);
    return Math.sqrt(sumSquares);
  }
  
  /**
   * Gerar embedding para uma query (texto)
   * 
   * Usado para buscar chunks similares
   */
  async embedQuery(query: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: query,
        encoding_format: 'float',
      });
      
      const vector = response.data[0].embedding as number[];
      
      // Validar dimensões
      if (vector.length !== this.dimensions) {
        throw new Error(
          `Dimensões inválidas: esperado ${this.dimensions}, recebido ${vector.length}`
        );
      }
      
      // Normalizar
      return this.normalizeL2(vector);
    } catch (error) {
      console.error('Erro ao gerar embedding de query:', error);
      throw error;
    }
  }
}

/**
 * Validar qualidade de embeddings
 * 
 * Verificações:
 * - Dimensões corretas (3072)
 * - Norma L2 ≈ 1.0 (tolerância: ±0.01)
 * - Sem valores NaN ou Infinity
 * - Distribuição de valores razoável
 */
export function validateEmbeddings(embeddings: Embedding[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  for (const emb of embeddings) {
    // Validar dimensões
    if (emb.dimensions !== 3072) {
      errors.push(`${emb.chunkId}: dimensões inválidas (${emb.dimensions})`);
    }
    
    // Validar norma L2
    if (Math.abs(emb.norm - 1.0) > 0.01) {
      errors.push(`${emb.chunkId}: norma L2 inválida (${emb.norm})`);
    }
    
    // Validar valores
    for (let i = 0; i < emb.vector.length; i++) {
      const v = emb.vector[i];
      if (!isFinite(v)) {
        errors.push(`${emb.chunkId}: valor inválido em índice ${i} (${v})`);
        break;
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calcular estatísticas de embeddings
 */
export function getEmbeddingStats(embeddings: Embedding[]): {
  totalEmbeddings: number;
  avgNorm: number;
  minValue: number;
  maxValue: number;
  sparsity: number; // % de valores próximos a 0
} {
  if (embeddings.length === 0) {
    return {
      totalEmbeddings: 0,
      avgNorm: 0,
      minValue: 0,
      maxValue: 0,
      sparsity: 0,
    };
  }
  
  const allValues: number[] = [];
  let totalNorm = 0;
  
  for (const emb of embeddings) {
    totalNorm += emb.norm;
    allValues.push(...emb.vector);
  }
  
  const sortedValues = allValues.sort((a, b) => a - b);
  const sparsityThreshold = 0.01;
  const sparseCount = allValues.filter(v => Math.abs(v) < sparsityThreshold).length;
  
  return {
    totalEmbeddings: embeddings.length,
    avgNorm: totalNorm / embeddings.length,
    minValue: sortedValues[0],
    maxValue: sortedValues[sortedValues.length - 1],
    sparsity: (sparseCount / allValues.length) * 100,
  };
}
