# 🏆 RAG Classe Ouro SOTA 2026 - Especificação Completa

**Versão:** 1.0  
**Data:** 31 de Maio de 2026  
**Status:** Implementação em Progresso  
**Nível:** Uso Crítico - Conformidade Enterprise

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Componentes](#componentes)
4. [Fluxos](#fluxos)
5. [Métricas de Qualidade](#métricas-de-qualidade)
6. [Segurança e Conformidade](#segurança-e-conformidade)
7. [Implementação](#implementação)
8. [Testes](#testes)

---

## 🎯 Visão Geral

O RAG Classe Ouro é um sistema de geração aumentada por recuperação que integra documentos técnicos (FISPQs, fichas técnicas) com um modelo de linguagem para fornecer respostas precisas, citadas e auditáveis para consultores de higiene profissional.

**Características Principais:**

| Característica | Descrição |
|---|---|
| **Indexação Semântica** | Embeddings de alta qualidade usando modelos de última geração |
| **Busca Inteligente** | Recuperação de top-K documentos por similaridade semântica |
| **Citações Automáticas** | Extração automática de referências com página e trecho |
| **Validação de Qualidade** | Faithfulness score + Citation coverage score |
| **Classificação de Risco** | Low, Medium, High, Critical com RAI (Responsible AI) |
| **Aprovação Humana** | Fluxo obrigatório para respostas críticas |
| **Auditoria Completa** | Log imutável de todas as operações |
| **Conformidade** | ISO 27001, SOC 2, GDPR, HIPAA-ready |

---

## 🏗️ Arquitetura

### Componentes Principais

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 19)                       │
│  - Chat Interface                                            │
│  - Document Upload                                           │
│  - Approval Dashboard                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend (Express + tRPC)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ RAG Pipeline                                         │   │
│  │  1. Document Ingestion                              │   │
│  │  2. Chunking & Preprocessing                        │   │
│  │  3. Embedding Generation                            │   │
│  │  4. Vector Index Management                         │   │
│  │  5. Query Processing                                │   │
│  │  6. Retrieval & Ranking                             │   │
│  │  7. Citation Extraction                             │   │
│  │  8. Quality Validation                              │   │
│  │  9. Risk Classification                             │   │
│  │  10. Approval Routing                               │   │
│  │  11. Audit Logging                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    ┌────────┐   ┌──────────┐   ┌─────────┐
    │ Vector │   │ Database │   │  S3     │
    │  DB    │   │ (MySQL)  │   │(Docs)   │
    │Pinecone│   │          │   │         │
    └────────┘   └──────────┘   └─────────┘
```

### Fluxo de Dados

```
Document Upload
    │
    ▼
Validation & Approval
    │
    ▼
Text Extraction & Chunking
    │
    ▼
Embedding Generation (OpenAI/Cohere)
    │
    ▼
Vector Index (Pinecone)
    │
    ▼
Database (MySQL - metadata)
    │
    ▼
Ready for Queries
    │
    ├─────────────────────────┐
    │                         │
    ▼                         ▼
User Query          Similarity Search
    │                    │
    ▼                    ▼
LLM Prompt ◄──────── Top-K Documents
    │
    ▼
Response Generation
    │
    ├─────────────────────────┐
    │                         │
    ▼                         ▼
Citation Extraction    Quality Metrics
    │                    │
    ▼                    ▼
Risk Classification ◄─── Faithfulness Score
    │
    ├─────────────────────────┐
    │                         │
    ▼                         ▼
Low/Medium Risk        High/Critical Risk
    │                         │
    ▼                         ▼
Direct Response        Approval Queue
    │                         │
    ▼                         ▼
Audit Log              Human Review
    │                         │
    └─────────────┬───────────┘
                  │
                  ▼
            Final Audit Log
```

---

## 🔧 Componentes Detalhados

### 1. Document Ingestion Pipeline

**Responsabilidade:** Receber, validar e preparar documentos para indexação.

**Entrada:** Arquivo (PDF, DOCX, TXT) + Metadados  
**Saída:** Documento indexado com embeddings

**Processo:**

```typescript
// 1.1 Validação
- Verificar tipo de arquivo (FISPQ, technical_sheet, etc)
- Verificar tamanho (máx 50MB)
- Verificar integridade (hash)
- Verificar conformidade (sem malware)

// 1.2 Extração de Texto
- Extrair texto de PDF/DOCX
- Preservar estrutura (seções, tabelas)
- Remover artefatos (headers, footers)
- Normalizar encoding (UTF-8)

// 1.3 Metadata Extraction
- Título, autor, data
- Tipo de documento
- Fornecedor, versão
- Palavras-chave, tags

// 1.4 Armazenamento
- Salvar em S3 com versionamento
- Salvar metadata no banco
- Criar URL persistente
```

**Testes:**
```typescript
test('validate PDF document', () => {
  const doc = uploadDocument('fispq.pdf');
  expect(doc.type).toBe('FISPQ');
  expect(doc.size).toBeLessThan(50 * 1024 * 1024);
});

test('extract text from PDF', () => {
  const text = extractText('fispq.pdf');
  expect(text.length).toBeGreaterThan(0);
});

test('preserve document structure', () => {
  const doc = uploadDocument('fispq.pdf');
  expect(doc.sections).toBeDefined();
  expect(doc.tables).toBeDefined();
});
```

### 2. Chunking & Preprocessing

**Responsabilidade:** Dividir documentos em chunks otimizados para embedding.

**Estratégia:**
- Chunk size: 512 tokens (≈ 2000 caracteres)
- Overlap: 50 tokens (para contexto)
- Preservar limites semânticos (seções, parágrafos)
- Manter metadata de origem (página, seção)

**Processo:**

```typescript
interface Chunk {
  id: string; // unique chunk ID
  documentId: string;
  versionId: string;
  text: string;
  pageNumber: number;
  sectionTitle: string;
  startChar: number;
  endChar: number;
  tokenCount: number;
  metadata: {
    source: string;
    documentType: string;
    supplier: string;
  };
}

// Algoritmo de chunking
function chunkDocument(text: string, metadata: DocumentMetadata): Chunk[] {
  // 1. Dividir por seções
  const sections = splitBySections(text);
  
  // 2. Para cada seção, dividir em chunks
  const chunks: Chunk[] = [];
  for (const section of sections) {
    const sectionChunks = chunkSection(section, 512, 50);
    chunks.push(...sectionChunks);
  }
  
  // 3. Adicionar metadata e validar
  return chunks.map((chunk, i) => ({
    id: `${metadata.id}-chunk-${i}`,
    documentId: metadata.id,
    versionId: metadata.versionId,
    text: chunk.text,
    pageNumber: chunk.pageNumber,
    sectionTitle: chunk.sectionTitle,
    startChar: chunk.startChar,
    endChar: chunk.endChar,
    tokenCount: countTokens(chunk.text),
    metadata: {
      source: metadata.title,
      documentType: metadata.type,
      supplier: metadata.supplier,
    },
  }));
}
```

**Testes:**
```typescript
test('chunk document into 512-token chunks', () => {
  const chunks = chunkDocument(largeDocument);
  chunks.forEach(chunk => {
    expect(chunk.tokenCount).toBeLessThanOrEqual(512);
  });
});

test('preserve semantic boundaries', () => {
  const chunks = chunkDocument(document);
  chunks.forEach(chunk => {
    expect(chunk.text).not.toEndWith('in');
    expect(chunk.text).not.toEndWith('the');
  });
});

test('maintain 50-token overlap', () => {
  const chunks = chunkDocument(document);
  for (let i = 0; i < chunks.length - 1; i++) {
    const overlap = calculateOverlap(chunks[i], chunks[i + 1]);
    expect(overlap).toBeCloseTo(50, 5);
  }
});
```

### 3. Embedding Generation

**Responsabilidade:** Gerar embeddings semânticos de alta qualidade.

**Modelo:** OpenAI text-embedding-3-large (3072 dimensões)  
**Alternativa:** Cohere embed-english-v3.0 (1024 dimensões)

**Processo:**

```typescript
interface Embedding {
  chunkId: string;
  vector: number[]; // 3072 dimensions
  model: string;
  generatedAt: number;
  tokenCount: number;
}

async function generateEmbeddings(chunks: Chunk[]): Promise<Embedding[]> {
  // 1. Batch chunks (máx 100 por requisição)
  const batches = chunk(chunks, 100);
  
  // 2. Gerar embeddings
  const embeddings: Embedding[] = [];
  for (const batch of batches) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: batch.map(c => c.text),
      encoding_format: 'float',
    });
    
    embeddings.push(...response.data.map((emb, i) => ({
      chunkId: batch[i].id,
      vector: emb.embedding,
      model: 'text-embedding-3-large',
      generatedAt: Date.now(),
      tokenCount: batch[i].tokenCount,
    })));
  }
  
  // 3. Validar embeddings
  embeddings.forEach(emb => {
    if (emb.vector.length !== 3072) {
      throw new Error(`Invalid embedding dimension: ${emb.vector.length}`);
    }
    if (Math.abs(norm(emb.vector) - 1) > 0.01) {
      emb.vector = normalize(emb.vector);
    }
  });
  
  return embeddings;
}

// Normalizar vetor para norma L2 = 1
function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return vector.map(v => v / norm);
}
```

**Testes:**
```typescript
test('generate embeddings with correct dimensions', async () => {
  const embeddings = await generateEmbeddings(chunks);
  embeddings.forEach(emb => {
    expect(emb.vector.length).toBe(3072);
  });
});

test('normalize embeddings to unit norm', async () => {
  const embeddings = await generateEmbeddings(chunks);
  embeddings.forEach(emb => {
    const norm = Math.sqrt(emb.vector.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1, 2);
  });
});

test('handle batch processing', async () => {
  const largeChunkSet = generateChunks(500);
  const embeddings = await generateEmbeddings(largeChunkSet);
  expect(embeddings.length).toBe(500);
});
```

### 4. Vector Index Management (Pinecone)

**Responsabilidade:** Gerenciar índice vetorial para busca rápida.

**Configuração:**
- Index: `evolumix-360-prod`
- Dimensão: 3072 (OpenAI text-embedding-3-large)
- Métrica: Cosine similarity
- Namespace: Por usuário (isolamento)

**Processo:**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.Index('evolumix-360-prod');

async function upsertEmbeddings(embeddings: Embedding[], documentId: string) {
  // 1. Preparar vectors para Pinecone
  const vectors = embeddings.map(emb => ({
    id: emb.chunkId,
    values: emb.vector,
    metadata: {
      documentId,
      chunkId: emb.chunkId,
      generatedAt: emb.generatedAt,
    },
  }));
  
  // 2. Upsert em batches
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.upsert(batch);
  }
  
  // 3. Validar
  const stats = await index.describeIndexStats();
  console.log(`Index stats: ${stats.totalVectorCount} vectors`);
}

async function searchSimilar(
  queryVector: number[],
  topK: number = 5,
  filter?: Record<string, any>
): Promise<Array<{ chunkId: string; score: number; metadata: any }>> {
  const results = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
    filter,
  });
  
  return results.matches.map(match => ({
    chunkId: match.id,
    score: match.score, // cosine similarity
    metadata: match.metadata,
  }));
}
```

**Testes:**
```typescript
test('upsert embeddings to Pinecone', async () => {
  await upsertEmbeddings(embeddings, 'doc-123');
  const stats = await index.describeIndexStats();
  expect(stats.totalVectorCount).toBeGreaterThan(0);
});

test('search similar chunks', async () => {
  const queryVector = embeddings[0].vector;
  const results = await searchSimilar(queryVector, 5);
  expect(results.length).toBeLessThanOrEqual(5);
  expect(results[0].score).toBeCloseTo(1, 1); // self-similarity
});

test('filter by document ID', async () => {
  const results = await searchSimilar(queryVector, 5, {
    documentId: { $eq: 'doc-123' },
  });
  results.forEach(r => {
    expect(r.metadata.documentId).toBe('doc-123');
  });
});
```

### 5. Query Processing & Retrieval

**Responsabilidade:** Processar query do usuário e recuperar documentos relevantes.

**Processo:**

```typescript
interface RetrievalResult {
  chunkId: string;
  documentId: string;
  text: string;
  score: number; // cosine similarity
  pageNumber: number;
  sectionTitle: string;
  metadata: any;
}

async function retrieveRelevantDocuments(
  query: string,
  topK: number = 5
): Promise<RetrievalResult[]> {
  // 1. Gerar embedding da query
  const queryEmbedding = await generateEmbedding(query);
  
  // 2. Buscar chunks similares
  const searchResults = await searchSimilar(queryEmbedding, topK * 2); // 2x para filtro
  
  // 3. Filtrar por score mínimo (0.5 cosine similarity)
  const filtered = searchResults.filter(r => r.score > 0.5);
  
  // 4. Recuperar texto completo do banco
  const results: RetrievalResult[] = [];
  for (const result of filtered.slice(0, topK)) {
    const chunk = await db.query.chunks.findFirst({
      where: eq(chunks.id, result.chunkId),
    });
    
    if (chunk) {
      results.push({
        chunkId: result.chunkId,
        documentId: chunk.documentId,
        text: chunk.text,
        score: result.score,
        pageNumber: chunk.pageNumber,
        sectionTitle: chunk.sectionTitle,
        metadata: chunk.metadata,
      });
    }
  }
  
  // 5. Reranking (opcional, para melhor precisão)
  // Usar modelo de reranking (ex: Cohere rerank)
  
  return results;
}
```

**Testes:**
```typescript
test('retrieve relevant documents for query', async () => {
  const results = await retrieveRelevantDocuments('Como usar FISPQ?', 5);
  expect(results.length).toBeGreaterThan(0);
  expect(results[0].score).toBeGreaterThan(0.5);
});

test('filter by minimum similarity score', async () => {
  const results = await retrieveRelevantDocuments('query', 10);
  results.forEach(r => {
    expect(r.score).toBeGreaterThan(0.5);
  });
});

test('return top-K results', async () => {
  const results = await retrieveRelevantDocuments('query', 5);
  expect(results.length).toBeLessThanOrEqual(5);
});
```

### 6. Citation Extraction & Validation

**Responsabilidade:** Extrair citações automáticas da resposta do LLM.

**Processo:**

```typescript
interface Citation {
  documentId: string;
  documentTitle: string;
  versionId: string;
  pageNumber: number;
  sectionTitle: string;
  excerpt: string; // trecho citado
  confidence: number; // 0-1
}

async function extractCitations(
  response: string,
  retrievedChunks: RetrievalResult[]
): Promise<Citation[]> {
  const citations: Citation[] = [];
  
  // 1. Usar LLM para extrair citações
  const extractionPrompt = `
    Analise a seguinte resposta e identifique todas as citações de documentos.
    Para cada citação, extraia:
    - Documento citado
    - Página
    - Seção
    - Trecho exato
    
    Resposta: "${response}"
    
    Documentos disponíveis:
    ${retrievedChunks.map(c => `- ${c.metadata.source} (página ${c.pageNumber}): "${c.text.substring(0, 100)}..."`).join('\n')}
    
    Retorne JSON com array de citações.
  `;
  
  const extractionResponse = await invokeLLM({
    messages: [{ role: 'user', content: extractionPrompt }],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'citations',
        schema: {
          type: 'object',
          properties: {
            citations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  documentId: { type: 'string' },
                  pageNumber: { type: 'number' },
                  excerpt: { type: 'string' },
                },
                required: ['documentId', 'pageNumber', 'excerpt'],
              },
            },
          },
        },
      },
    },
  });
  
  // 2. Validar citações contra chunks recuperados
  const extractedCitations = JSON.parse(extractionResponse.choices[0].message.content);
  
  for (const citation of extractedCitations.citations) {
    const matchingChunk = retrievedChunks.find(
      c => c.documentId === citation.documentId && 
           c.pageNumber === citation.pageNumber &&
           c.text.includes(citation.excerpt)
    );
    
    if (matchingChunk) {
      citations.push({
        documentId: citation.documentId,
        documentTitle: matchingChunk.metadata.source,
        versionId: matchingChunk.metadata.versionId,
        pageNumber: citation.pageNumber,
        sectionTitle: matchingChunk.sectionTitle,
        excerpt: citation.excerpt,
        confidence: 0.95, // alta confiança se validada
      });
    }
  }
  
  return citations;
}
```

**Testes:**
```typescript
test('extract citations from response', async () => {
  const citations = await extractCitations(response, chunks);
  expect(citations.length).toBeGreaterThan(0);
  citations.forEach(c => {
    expect(c.documentId).toBeDefined();
    expect(c.excerpt).toBeDefined();
  });
});

test('validate citations against retrieved chunks', async () => {
  const citations = await extractCitations(response, chunks);
  citations.forEach(c => {
    expect(c.confidence).toBeGreaterThan(0.9);
  });
});
```

### 7. Quality Validation Metrics

**Responsabilidade:** Calcular métricas de qualidade da resposta.

**Métricas:**

```typescript
interface QualityMetrics {
  faithfulnessScore: number; // 0-1: fidelidade ao contexto
  citationCoverageScore: number; // 0-1: % da resposta citada
  relevanceScore: number; // 0-1: relevância dos documentos
  completenessScore: number; // 0-1: completude da resposta
  overallScore: number; // 0-1: score combinado
}

async function calculateQualityMetrics(
  query: string,
  response: string,
  retrievedChunks: RetrievalResult[],
  citations: Citation[]
): Promise<QualityMetrics> {
  // 1. Faithfulness Score
  // Verificar se resposta é fiel ao contexto dos documentos
  const faithfulnessPrompt = `
    Avalie se a seguinte resposta é fiel aos documentos fornecidos.
    Escala: 0 (completamente infiel) a 1 (totalmente fiel)
    
    Documentos: ${retrievedChunks.map(c => c.text).join('\n')}
    Resposta: "${response}"
    
    Retorne apenas um número entre 0 e 1.
  `;
  
  const faithfulnessResponse = await invokeLLM({
    messages: [{ role: 'user', content: faithfulnessPrompt }],
  });
  
  const faithfulnessScore = parseFloat(
    faithfulnessResponse.choices[0].message.content
  );
  
  // 2. Citation Coverage Score
  // Percentual da resposta que é citado
  const citedWords = citations.reduce((sum, c) => sum + c.excerpt.split(' ').length, 0);
  const totalWords = response.split(' ').length;
  const citationCoverageScore = Math.min(citedWords / totalWords, 1);
  
  // 3. Relevance Score
  // Score médio dos documentos recuperados
  const relevanceScore = retrievedChunks.length > 0
    ? retrievedChunks.reduce((sum, c) => sum + c.score, 0) / retrievedChunks.length
    : 0;
  
  // 4. Completeness Score
  // Verificar se resposta é completa
  const completenessPrompt = `
    Avalie se a seguinte resposta é completa e aborda totalmente a pergunta.
    Escala: 0 (incompleta) a 1 (completa)
    
    Pergunta: "${query}"
    Resposta: "${response}"
    
    Retorne apenas um número entre 0 e 1.
  `;
  
  const completenessResponse = await invokeLLM({
    messages: [{ role: 'user', content: completenessPrompt }],
  });
  
  const completenessScore = parseFloat(
    completenessResponse.choices[0].message.content
  );
  
  // 5. Overall Score (média ponderada)
  const overallScore = (
    faithfulnessScore * 0.4 +
    citationCoverageScore * 0.3 +
    relevanceScore * 0.2 +
    completenessScore * 0.1
  );
  
  return {
    faithfulnessScore,
    citationCoverageScore,
    relevanceScore,
    completenessScore,
    overallScore,
  };
}
```

**Testes:**
```typescript
test('calculate faithfulness score', async () => {
  const metrics = await calculateQualityMetrics(query, response, chunks, citations);
  expect(metrics.faithfulnessScore).toBeGreaterThanOrEqual(0);
  expect(metrics.faithfulnessScore).toBeLessThanOrEqual(1);
});

test('calculate citation coverage score', async () => {
  const metrics = await calculateQualityMetrics(query, response, chunks, citations);
  expect(metrics.citationCoverageScore).toBeGreaterThanOrEqual(0);
  expect(metrics.citationCoverageScore).toBeLessThanOrEqual(1);
});

test('calculate overall score', async () => {
  const metrics = await calculateQualityMetrics(query, response, chunks, citations);
  expect(metrics.overallScore).toBeGreaterThanOrEqual(0);
  expect(metrics.overallScore).toBeLessThanOrEqual(1);
});
```

### 8. Risk Classification & RAI

**Responsabilidade:** Classificar risco da resposta e aplicar Responsible AI.

**Classificação:**

```typescript
enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

interface RiskAssessment {
  level: RiskLevel;
  score: number; // 0-1
  factors: string[]; // fatores que contribuem ao risco
  requiresApproval: boolean;
  recommendations: string[];
}

async function classifyRisk(
  query: string,
  response: string,
  metrics: QualityMetrics
): Promise<RiskAssessment> {
  const factors: string[] = [];
  let riskScore = 0;
  
  // 1. Baixa fidelidade = risco alto
  if (metrics.faithfulnessScore < 0.7) {
    factors.push('Low faithfulness score');
    riskScore += 0.3;
  }
  
  // 2. Baixa cobertura de citações = risco alto
  if (metrics.citationCoverageScore < 0.5) {
    factors.push('Low citation coverage');
    riskScore += 0.2;
  }
  
  // 3. Baixa relevância = risco alto
  if (metrics.relevanceScore < 0.6) {
    factors.push('Low document relevance');
    riskScore += 0.2;
  }
  
  // 4. Resposta incompleta = risco médio
  if (metrics.completenessScore < 0.7) {
    factors.push('Incomplete response');
    riskScore += 0.1;
  }
  
  // 5. Detectar tópicos críticos (segurança, saúde, conformidade)
  const criticalTopics = ['safety', 'health', 'compliance', 'legal', 'regulatory'];
  const hasCriticalTopic = criticalTopics.some(topic =>
    query.toLowerCase().includes(topic) || response.toLowerCase().includes(topic)
  );
  
  if (hasCriticalTopic) {
    factors.push('Critical topic detected');
    riskScore += 0.2;
  }
  
  // 6. Determinar nível de risco
  let level: RiskLevel;
  if (riskScore >= 0.7) {
    level = RiskLevel.CRITICAL;
  } else if (riskScore >= 0.5) {
    level = RiskLevel.HIGH;
  } else if (riskScore >= 0.3) {
    level = RiskLevel.MEDIUM;
  } else {
    level = RiskLevel.LOW;
  }
  
  // 7. Gerar recomendações
  const recommendations: string[] = [];
  if (metrics.faithfulnessScore < 0.7) {
    recommendations.push('Consider additional document review');
  }
  if (metrics.citationCoverageScore < 0.5) {
    recommendations.push('Increase citation coverage');
  }
  if (hasCriticalTopic) {
    recommendations.push('Require human expert review');
  }
  
  return {
    level,
    score: riskScore,
    factors,
    requiresApproval: level === RiskLevel.HIGH || level === RiskLevel.CRITICAL,
    recommendations,
  };
}
```

**Testes:**
```typescript
test('classify low-risk response', async () => {
  const metrics = { faithfulnessScore: 0.95, citationCoverageScore: 0.9, relevanceScore: 0.85, completenessScore: 0.9, overallScore: 0.9 };
  const risk = await classifyRisk(query, response, metrics);
  expect(risk.level).toBe(RiskLevel.LOW);
  expect(risk.requiresApproval).toBe(false);
});

test('classify high-risk response', async () => {
  const metrics = { faithfulnessScore: 0.5, citationCoverageScore: 0.3, relevanceScore: 0.4, completenessScore: 0.5, overallScore: 0.45 };
  const risk = await classifyRisk(query, response, metrics);
  expect(risk.level).toBe(RiskLevel.HIGH);
  expect(risk.requiresApproval).toBe(true);
});

test('detect critical topics', async () => {
  const criticalQuery = 'Is this chemical safe for health?';
  const risk = await classifyRisk(criticalQuery, response, metrics);
  expect(risk.factors).toContain('Critical topic detected');
});
```

### 9. Approval Workflow

**Responsabilidade:** Gerenciar fluxo de aprovação para respostas críticas.

**Processo:**

```typescript
interface ApprovalRequest {
  id: string;
  queryId: string;
  submittedBy: string;
  submittedAt: number;
  query: string;
  response: string;
  citations: Citation[];
  metrics: QualityMetrics;
  riskAssessment: RiskAssessment;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: number;
  reviewNotes?: string;
}

async function submitForApproval(
  queryId: string,
  query: string,
  response: string,
  citations: Citation[],
  metrics: QualityMetrics,
  riskAssessment: RiskAssessment,
  userId: string
): Promise<ApprovalRequest> {
  const approvalId = generateId();
  
  const approval: ApprovalRequest = {
    id: approvalId,
    queryId,
    submittedBy: userId,
    submittedAt: Date.now(),
    query,
    response,
    citations,
    metrics,
    riskAssessment,
    status: 'pending',
  };
  
  // Salvar no banco
  await db.insert(approvals).values(approval);
  
  // Notificar admins
  await notifyAdmins({
    title: 'New Approval Request',
    content: `Query from ${userId} requires approval. Risk level: ${riskAssessment.level}`,
    link: `/approvals/${approvalId}`,
  });
  
  return approval;
}

async function approveRequest(
  approvalId: string,
  reviewedBy: string,
  reviewNotes: string
): Promise<void> {
  await db.update(approvals)
    .set({
      status: 'approved',
      reviewedBy,
      reviewedAt: Date.now(),
      reviewNotes,
    })
    .where(eq(approvals.id, approvalId));
  
  // Audit log
  await auditLog({
    action: 'APPROVAL_GRANTED',
    entityType: 'approval',
    entityId: approvalId,
    details: { reviewedBy, reviewNotes },
  });
}

async function rejectRequest(
  approvalId: string,
  reviewedBy: string,
  reviewNotes: string
): Promise<void> {
  await db.update(approvals)
    .set({
      status: 'rejected',
      reviewedBy,
      reviewedAt: Date.now(),
      reviewNotes,
    })
    .where(eq(approvals.id, approvalId));
  
  // Audit log
  await auditLog({
    action: 'APPROVAL_REJECTED',
    entityType: 'approval',
    entityId: approvalId,
    details: { reviewedBy, reviewNotes },
  });
}
```

**Testes:**
```typescript
test('submit response for approval', async () => {
  const approval = await submitForApproval(
    queryId, query, response, citations, metrics, riskAssessment, userId
  );
  expect(approval.status).toBe('pending');
  expect(approval.submittedBy).toBe(userId);
});

test('approve request', async () => {
  const approval = await submitForApproval(...);
  await approveRequest(approval.id, adminId, 'Looks good');
  
  const updated = await db.query.approvals.findFirst({ where: eq(approvals.id, approval.id) });
  expect(updated.status).toBe('approved');
});

test('reject request', async () => {
  const approval = await submitForApproval(...);
  await rejectRequest(approval.id, adminId, 'Needs revision');
  
  const updated = await db.query.approvals.findFirst({ where: eq(approvals.id, approval.id) });
  expect(updated.status).toBe('rejected');
});
```

### 10. Audit Logging

**Responsabilidade:** Registrar todas as operações de forma imutável.

**Processo:**

```typescript
interface AuditLog {
  id: string;
  timestamp: number;
  userId: string;
  action: string; // DOCUMENT_UPLOAD, QUERY_SUBMITTED, APPROVAL_GRANTED, etc
  entityType: string; // document, query, approval, etc
  entityId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  hash: string; // SHA-256 do log anterior para imutabilidade
}

async function auditLog(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, any>,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  // 1. Obter último hash
  const lastLog = await db.query.auditLogs.findFirst({
    orderBy: desc(auditLogs.timestamp),
    limit: 1,
  });
  
  const previousHash = lastLog?.hash || 'genesis';
  
  // 2. Criar novo log
  const logEntry: AuditLog = {
    id: generateId(),
    timestamp: Date.now(),
    userId,
    action,
    entityType,
    entityId,
    details,
    ipAddress,
    userAgent,
    hash: '', // será calculado abaixo
  };
  
  // 3. Calcular hash (SHA-256 do log + previous hash)
  const logString = JSON.stringify({
    timestamp: logEntry.timestamp,
    userId: logEntry.userId,
    action: logEntry.action,
    entityType: logEntry.entityType,
    entityId: logEntry.entityId,
    details: logEntry.details,
    previousHash,
  });
  
  logEntry.hash = await sha256(logString);
  
  // 4. Salvar no banco (append-only)
  await db.insert(auditLogs).values(logEntry);
  
  // 5. Validar integridade (opcional, para auditoria)
  // Verificar se hash anterior está correto
}

// Validar integridade da auditoria
async function validateAuditIntegrity(): Promise<boolean> {
  const logs = await db.query.auditLogs.findMany({
    orderBy: asc(auditLogs.timestamp),
  });
  
  let previousHash = 'genesis';
  
  for (const log of logs) {
    const logString = JSON.stringify({
      timestamp: log.timestamp,
      userId: log.userId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      previousHash,
    });
    
    const expectedHash = await sha256(logString);
    
    if (log.hash !== expectedHash) {
      console.error(`Audit log integrity violation at ${log.id}`);
      return false;
    }
    
    previousHash = log.hash;
  }
  
  return true;
}
```

**Testes:**
```typescript
test('create audit log', async () => {
  await auditLog(userId, 'QUERY_SUBMITTED', 'query', queryId, { query }, ip, ua);
  
  const log = await db.query.auditLogs.findFirst({
    where: eq(auditLogs.entityId, queryId),
  });
  
  expect(log).toBeDefined();
  expect(log.action).toBe('QUERY_SUBMITTED');
});

test('validate audit integrity', async () => {
  const isValid = await validateAuditIntegrity();
  expect(isValid).toBe(true);
});

test('detect audit tampering', async () => {
  // Simular tampering
  const log = await db.query.auditLogs.findFirst();
  await db.update(auditLogs)
    .set({ details: { tampered: true } })
    .where(eq(auditLogs.id, log.id));
  
  const isValid = await validateAuditIntegrity();
  expect(isValid).toBe(false);
});
```

---

## 📊 Métricas de Qualidade

| Métrica | Descrição | Target | Fórmula |
|---------|-----------|--------|---------|
| **Faithfulness Score** | Fidelidade ao contexto | > 0.85 | LLM evaluation |
| **Citation Coverage** | % da resposta citada | > 0.70 | cited_words / total_words |
| **Relevance Score** | Relevância dos docs | > 0.75 | avg(cosine_similarity) |
| **Completeness Score** | Completude da resposta | > 0.80 | LLM evaluation |
| **Overall Score** | Score combinado | > 0.80 | 0.4×F + 0.3×C + 0.2×R + 0.1×Co |
| **Latency** | Tempo de resposta | < 5s | end_time - start_time |
| **Throughput** | Queries por segundo | > 100 | queries / second |

---

## 🔒 Segurança e Conformidade

### Conformidade

- **ISO 27001:** Information Security Management
- **SOC 2 Type II:** Security, Availability, Processing Integrity
- **GDPR:** Data Protection and Privacy
- **HIPAA:** Health Information Privacy (ready)

### Segurança

- **Encryption at Rest:** AES-256 para dados sensíveis
- **Encryption in Transit:** TLS 1.3 para todas as comunicações
- **Access Control:** Role-based (user, admin, auditor)
- **Audit Trail:** Imutável com hash chain
- **Secrets Management:** Rotação automática a cada 30 dias

---

## 🚀 Implementação

### Timeline

| Fase | Componente | Duração | Status |
|------|-----------|---------|--------|
| 1 | Indexação Semântica | 8h | Em Progresso |
| 2 | Busca por Similaridade | 6h | Planejado |
| 3 | Citações e Validação | 10h | Planejado |
| 4 | Classificação de Risco | 8h | Planejado |
| 5 | Aprovação Humana | 8h | Planejado |
| 6 | Auditoria | 6h | Planejado |
| 7 | Testes E2E | 10h | Planejado |

**Total:** 56 horas (1.4 semanas)

---

## ✅ Testes

### Cobertura

- Unit Tests: 80%+
- Integration Tests: 90%+
- E2E Tests: 100% dos fluxos críticos

### Cenários de Teste

1. **Happy Path:** Query → Retrieval → Response → Approval → Audit
2. **Low Quality:** Resposta com baixa fidelidade → Rejection
3. **Critical Risk:** Tópico crítico → Mandatory approval
4. **Audit Integrity:** Validar imutabilidade dos logs
5. **Performance:** 1000 queries simultâneas → < 5s latência

---

## 📚 Referências

- OpenAI Embeddings: https://platform.openai.com/docs/guides/embeddings
- Pinecone: https://www.pinecone.io/
- RAG Best Practices: https://arxiv.org/abs/2312.10997
- Responsible AI: https://www.microsoft.com/en-us/ai/responsible-ai

