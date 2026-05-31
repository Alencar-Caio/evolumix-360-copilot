# 🚀 Evolumix 360 V3 - Implementation Master Plan

**Versão:** 3.0  
**Data Início:** 31 de Maio de 2026  
**Timeline:** 4 semanas (160 horas)  
**Objetivo:** Arquitetura completa com funcionalidade v1 + interface v2 + melhorias ouro SOTA 2026

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Semana 1: RAG Pipeline](#semana-1-rag-pipeline)
3. [Semana 2: Fluxos Críticos](#semana-2-fluxos-críticos)
4. [Semana 3: Aprovação & Auditoria](#semana-3-aprovação--auditoria)
5. [Semana 4: Testes & Entrega](#semana-4-testes--entrega)
6. [Checklist Completo](#checklist-completo)

---

## 🎯 Visão Geral

### Arquitetura V3

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React 19)                    │
│              V2 Interface + V2 Components                │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Dashboard | Chat | Upload | Diagnósticos | Rel  │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (Express + tRPC)                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │ RAG Pipeline (v1 + melhorias)                    │   │
│  │ ├── Indexação Semântica                         │   │
│  │ ├── Busca por Similaridade                      │   │
│  │ ├── Extração de Citações                        │   │
│  │ ├── Validação de Qualidade                      │   │
│  │ └── Classificação de Risco                      │   │
│  │                                                  │   │
│  │ Document Management (v1 + melhorias)            │   │
│  │ ├── Upload & Validação                          │   │
│  │ ├── S3 Versionamento                            │   │
│  │ ├── Indexação Automática                        │   │
│  │ └── Metadata Extraction                         │   │
│  │                                                  │   │
│  │ Chat & Queries (v1 + melhorias)                 │   │
│  │ ├── Chat com Contexto RAG                       │   │
│  │ ├── Histórico Persistente                       │   │
│  │ ├── Streaming Responses                         │   │
│  │ └── Citation Tracking                           │   │
│  │                                                  │   │
│  │ Diagnósticos 360 (v1 + melhorias)               │   │
│  │ ├── Análise 3 Pilares                           │   │
│  │ ├── Cálculo ROI                                 │   │
│  │ ├── Recomendações                               │   │
│  │ └── Script de Fechamento                        │   │
│  │                                                  │   │
│  │ Approval Workflow (v1 + melhorias)              │   │
│  │ ├── Fila de Aprovação                           │   │
│  │ ├── Notificações                                │   │
│  │ ├── Audit Trail                                 │   │
│  │ └── SLA Tracking                                │   │
│  │                                                  │   │
│  │ Segurança (v2 + melhorias)                      │   │
│  │ ├── Secrets Rotation                            │   │
│  │ ├── Audit Trail Imutável                        │   │
│  │ ├── WAF Rules                                   │   │
│  │ ├── Encryption at Rest                          │   │
│  │ └── Encryption in Transit                       │   │
│  │                                                  │   │
│  │ Observabilidade (v2 + melhorias)                │   │
│  │ ├── Distributed Tracing                         │   │
│  │ ├── Metrics & Monitoring                        │   │
│  │ ├── Structured Logging                          │   │
│  │ └── Health Checks                               │   │
│  │                                                  │   │
│  │ Resiliência (v2 + melhorias)                    │   │
│  │ ├── Circuit Breaker                             │   │
│  │ ├── Backup PITR                                 │   │
│  │ ├── Graceful Shutdown                           │   │
│  │ ├── SLA Monitoring                              │   │
│  │ └── Chaos Engineering                           │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    ┌────────┐   ┌──────────┐   ┌─────────┐
    │ Vector │   │ Database │   │  S3     │
    │  DB    │   │ (MySQL)  │   │(Docs)   │
    │Pinecone│   │          │   │         │
    └────────┘   └──────────┘   └─────────┘
```

### Componentes Principais

| Componente | V1 | V2 | V3 | Status |
|---|---|---|---|---|
| RAG Pipeline | ✅ | ❌ | ✅ | Restaurado |
| Upload & Indexação | ✅ | ❌ | ✅ | Restaurado |
| Chat com Contexto | ✅ | ❌ | ✅ | Restaurado |
| Histórico | ✅ | ❌ | ✅ | Restaurado |
| Diagnósticos 360 | ✅ | ❌ | ✅ | Restaurado |
| Aprovações | ✅ | ❌ | ✅ | Restaurado |
| Auditoria | ✅ | ⚠️ | ✅ | Melhorado |
| UI/UX | ⚠️ | ✅ | ✅ | V2 |
| Segurança | ✅ | ✅ | ✅ | V2+ |
| Observabilidade | ❌ | ✅ | ✅ | V2 |
| Resiliência | ❌ | ✅ | ✅ | V2 |

---

## 📅 Semana 1: RAG Pipeline (40h)

### 1.1 Indexação Semântica (8h)

**Objetivo:** Implementar geração de embeddings e armazenamento em Pinecone

**Tarefas:**

```typescript
// 1. Criar interface de Chunk
interface Chunk {
  id: string;
  documentId: string;
  versionId: string;
  text: string;
  pageNumber: number;
  sectionTitle: string;
  tokenCount: number;
  metadata: Record<string, any>;
}

// 2. Implementar chunking strategy
function chunkDocument(text: string, metadata: DocumentMetadata): Chunk[] {
  // Dividir por seções
  // Preservar limites semânticos
  // Overlap de 50 tokens
  // Validar token count
}

// 3. Implementar embedding generation
async function generateEmbeddings(chunks: Chunk[]): Promise<Embedding[]> {
  // Usar OpenAI text-embedding-3-large
  // Batch processing (100 chunks por requisição)
  // Normalizar para L2 norm = 1
  // Validar dimensões (3072)
}

// 4. Implementar Pinecone integration
async function upsertEmbeddings(embeddings: Embedding[]): Promise<void> {
  // Conectar ao Pinecone
  // Upsert em batches de 100
  // Validar stats
}

// 5. Criar testes unitários
test('chunk document correctly', () => {});
test('generate embeddings with correct dimensions', () => {});
test('normalize embeddings to unit norm', () => {});
test('upsert to Pinecone', () => {});
```

**Arquivos a Criar:**
- `server/_core/rag/chunking.ts` (200 linhas)
- `server/_core/rag/embeddings.ts` (250 linhas)
- `server/_core/rag/vectorIndex.ts` (200 linhas)
- `server/_core/rag/indexing.test.ts` (150 linhas)

**Dependências:**
- `@pinecone-database/pinecone`
- `openai`
- `js-tiktoken`

**Checklist:**
- [ ] Criar interfaces de tipos
- [ ] Implementar chunking strategy
- [ ] Implementar embedding generation
- [ ] Integrar Pinecone
- [ ] Criar testes (8+ testes)
- [ ] Validar com dados reais
- [ ] Documentar decisões

---

### 1.2 Busca por Similaridade (6h)

**Objetivo:** Implementar retrieval de documentos relevantes

**Tarefas:**

```typescript
// 1. Implementar query embedding
async function embedQuery(query: string): Promise<number[]> {
  // Gerar embedding da query
  // Normalizar
  // Retornar vetor
}

// 2. Implementar similarity search
async function searchSimilar(
  queryVector: number[],
  topK: number = 5,
  filter?: Record<string, any>
): Promise<RetrievalResult[]> {
  // Buscar em Pinecone
  // Filtrar por score mínimo (0.5)
  // Recuperar metadata
  // Retornar top-K
}

// 3. Implementar reranking (opcional)
async function rerank(
  results: RetrievalResult[],
  query: string
): Promise<RetrievalResult[]> {
  // Usar modelo de reranking
  // Reordenar por relevância
}

// 4. Criar testes
test('embed query correctly', () => {});
test('search similar documents', () => {});
test('filter by minimum score', () => {});
test('return top-K results', () => {});
```

**Arquivos a Criar:**
- `server/_core/rag/retrieval.ts` (200 linhas)
- `server/_core/rag/retrieval.test.ts` (120 linhas)

**Checklist:**
- [ ] Implementar query embedding
- [ ] Implementar similarity search
- [ ] Implementar filtering
- [ ] Implementar reranking
- [ ] Criar testes (6+ testes)
- [ ] Validar com queries reais

---

### 1.3 Extração de Citações (10h)

**Objetivo:** Extrair citações automáticas da resposta do LLM

**Tarefas:**

```typescript
// 1. Criar interface de Citation
interface Citation {
  documentId: string;
  documentTitle: string;
  versionId: string;
  pageNumber: number;
  sectionTitle: string;
  excerpt: string;
  confidence: number;
}

// 2. Implementar extraction via LLM
async function extractCitations(
  response: string,
  retrievedChunks: RetrievalResult[]
): Promise<Citation[]> {
  // Usar LLM para extrair citações
  // Validar contra chunks
  // Calcular confidence
}

// 3. Implementar validação
function validateCitation(
  citation: Citation,
  chunks: RetrievalResult[]
): boolean {
  // Verificar se citação existe nos chunks
  // Verificar página
  // Verificar seção
}

// 4. Criar testes
test('extract citations from response', () => {});
test('validate citations', () => {});
test('calculate confidence scores', () => {});
```

**Arquivos a Criar:**
- `server/_core/rag/citations.ts` (250 linhas)
- `server/_core/rag/citations.test.ts` (150 linhas)

**Checklist:**
- [ ] Implementar extraction via LLM
- [ ] Implementar validação
- [ ] Implementar confidence scoring
- [ ] Criar testes (8+ testes)
- [ ] Validar com respostas reais

---

### 1.4 Validação de Qualidade (8h)

**Objetivo:** Calcular métricas de qualidade da resposta

**Tarefas:**

```typescript
// 1. Criar interface de QualityMetrics
interface QualityMetrics {
  faithfulnessScore: number; // 0-1
  citationCoverageScore: number; // 0-1
  relevanceScore: number; // 0-1
  completenessScore: number; // 0-1
  overallScore: number; // 0-1
}

// 2. Implementar faithfulness score
async function calculateFaithfulnessScore(
  response: string,
  context: string
): Promise<number> {
  // Usar LLM para avaliar fidelidade
  // Retornar score 0-1
}

// 3. Implementar citation coverage
function calculateCitationCoverage(
  response: string,
  citations: Citation[]
): number {
  // Calcular % da resposta citada
  // Retornar score 0-1
}

// 4. Implementar relevance score
function calculateRelevanceScore(
  chunks: RetrievalResult[]
): number {
  // Média dos scores de similaridade
  // Retornar score 0-1
}

// 5. Implementar completeness score
async function calculateCompletenessScore(
  query: string,
  response: string
): Promise<number> {
  // Usar LLM para avaliar completude
  // Retornar score 0-1
}

// 6. Implementar overall score
function calculateOverallScore(metrics: QualityMetrics): number {
  // Média ponderada
  // 0.4×F + 0.3×C + 0.2×R + 0.1×Co
}

// 7. Criar testes
test('calculate faithfulness score', () => {});
test('calculate citation coverage', () => {});
test('calculate relevance score', () => {});
test('calculate completeness score', () => {});
test('calculate overall score', () => {});
```

**Arquivos a Criar:**
- `server/_core/rag/qualityMetrics.ts` (300 linhas)
- `server/_core/rag/qualityMetrics.test.ts` (150 linhas)

**Checklist:**
- [ ] Implementar 4 métricas
- [ ] Implementar overall score
- [ ] Criar testes (10+ testes)
- [ ] Validar com dados reais

---

### 1.5 Classificação de Risco (8h)

**Objetivo:** Classificar risco da resposta (RAI - Responsible AI)

**Tarefas:**

```typescript
// 1. Criar enum de RiskLevel
enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// 2. Criar interface de RiskAssessment
interface RiskAssessment {
  level: RiskLevel;
  score: number; // 0-1
  factors: string[];
  requiresApproval: boolean;
  recommendations: string[];
}

// 3. Implementar risk classification
async function classifyRisk(
  query: string,
  response: string,
  metrics: QualityMetrics
): Promise<RiskAssessment> {
  // Analisar fidelidade
  // Analisar cobertura de citações
  // Analisar relevância
  // Detectar tópicos críticos
  // Calcular score
  // Determinar nível
  // Gerar recomendações
}

// 4. Implementar critical topic detection
function detectCriticalTopics(text: string): string[] {
  // Detectar tópicos: safety, health, compliance, legal
  // Retornar lista de tópicos
}

// 5. Criar testes
test('classify low-risk response', () => {});
test('classify high-risk response', () => {});
test('detect critical topics', () => {});
test('require approval for high-risk', () => {});
```

**Arquivos a Criar:**
- `server/_core/rag/riskClassification.ts` (250 linhas)
- `server/_core/rag/riskClassification.test.ts` (120 linhas)

**Checklist:**
- [ ] Implementar risk classification
- [ ] Implementar critical topic detection
- [ ] Implementar approval requirement
- [ ] Criar testes (8+ testes)
- [ ] Validar com queries críticas

---

### 1.6 Integração no Router (2h)

**Objetivo:** Integrar RAG pipeline no tRPC router

**Tarefas:**

```typescript
// 1. Criar RAG router
export const ragRouter = router({
  // Indexar documento
  indexDocument: protectedProcedure
    .input(z.object({ documentId: z.number(), versionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Chamar indexing pipeline
    }),

  // Chat com contexto
  chat: protectedProcedure
    .input(z.object({ query: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // 1. Embed query
      // 2. Search similar
      // 3. Extract citations
      // 4. Call LLM
      // 5. Calculate metrics
      // 6. Classify risk
      // 7. Save query
      // 8. Return response
    }),

  // Obter histórico
  getHistory: protectedProcedure
    .query(async ({ ctx }) => {
      // Retornar histórico de queries
    }),

  // Obter aprovações pendentes
  getPendingApprovals: protectedProcedure
    .query(async ({ ctx }) => {
      // Retornar aprovações pendentes
    }),
});

// 2. Adicionar ao appRouter
export const appRouter = router({
  rag: ragRouter,
  // ... outros routers
});
```

**Checklist:**
- [ ] Criar RAG router
- [ ] Integrar no appRouter
- [ ] Testar endpoints
- [ ] Validar tipos

---

### Semana 1 - Resumo

**Horas:** 40h  
**Componentes:** 5 (Indexação, Busca, Citações, Qualidade, Risco)  
**Arquivos:** 15+ (código + testes)  
**Testes:** 50+  
**Resultado:** RAG Pipeline completo e funcional

---

## 📅 Semana 2: Fluxos Críticos (30h)

### 2.1 Upload de Documentos (8h)

**Objetivo:** Implementar upload com validação e indexação automática

**Tarefas:**
- [ ] Validação de arquivo (tipo, tamanho, integridade)
- [ ] Extração de texto (PDF, DOCX)
- [ ] S3 upload com versionamento
- [ ] Metadata extraction
- [ ] Indexação automática
- [ ] Testes (10+)

---

### 2.2 Chat com Contexto (10h)

**Objetivo:** Implementar chat com RAG integration

**Tarefas:**
- [ ] Query embedding
- [ ] Retrieval
- [ ] LLM call com contexto
- [ ] Citation extraction
- [ ] Quality metrics
- [ ] Risk classification
- [ ] Histórico persistente
- [ ] Streaming responses
- [ ] Testes (12+)

---

### 2.3 Diagnósticos 360 (12h)

**Objetivo:** Implementar diagnóstico com 3 pilares

**Tarefas:**
- [ ] Formulário → LLM análise
- [ ] Análise Químico
- [ ] Análise Higiene
- [ ] Análise ROI
- [ ] Cálculo ROI persistido
- [ ] Recomendações
- [ ] Script de fechamento
- [ ] Integração com RAG
- [ ] Testes (15+)

---

## 📅 Semana 3: Aprovação & Auditoria (14h)

### 3.1 Aprovação Humana (8h)

**Objetivo:** Implementar workflow de aprovação

**Tarefas:**
- [ ] Fila de aprovação
- [ ] Status workflow (pending → approved/rejected)
- [ ] Notificações
- [ ] Review notes
- [ ] Audit trail
- [ ] Testes (8+)

---

### 3.2 Auditoria Imutável (6h)

**Objetivo:** Implementar hash chain para auditoria

**Tarefas:**
- [ ] Hash chain implementation
- [ ] Validação de integridade
- [ ] Append-only logs
- [ ] Testes (6+)

---

## 📅 Semana 4: Testes & Entrega (36h)

### 4.1 Testes E2E (20h)

**Objetivo:** Testar todo o pipeline end-to-end

**Tarefas:**
- [ ] Upload → Indexação → Chat → Aprovação → Auditoria
- [ ] Load testing (1000 queries simultâneas)
- [ ] Security testing
- [ ] Performance testing
- [ ] Testes (50+)

---

### 4.2 Documentação (10h)

**Objetivo:** Documentar arquitetura e API

**Tarefas:**
- [ ] ARCHITECTURE.md (atualizado)
- [ ] API docs
- [ ] Deployment guide
- [ ] Troubleshooting guide

---

### 4.3 Validação (6h)

**Objetivo:** Validar qualidade e performance

**Tarefas:**
- [ ] Code review
- [ ] Performance validation
- [ ] Security audit
- [ ] Conformidade check

---

## ✅ Checklist Completo

### Semana 1: RAG Pipeline (40h)

- [ ] **1.1 Indexação Semântica (8h)**
  - [ ] Criar interfaces de Chunk
  - [ ] Implementar chunking strategy
  - [ ] Implementar embedding generation
  - [ ] Integrar Pinecone
  - [ ] Criar testes (8+)
  - [ ] Validar com dados reais

- [ ] **1.2 Busca por Similaridade (6h)**
  - [ ] Implementar query embedding
  - [ ] Implementar similarity search
  - [ ] Implementar filtering
  - [ ] Implementar reranking
  - [ ] Criar testes (6+)

- [ ] **1.3 Extração de Citações (10h)**
  - [ ] Implementar extraction via LLM
  - [ ] Implementar validação
  - [ ] Implementar confidence scoring
  - [ ] Criar testes (8+)

- [ ] **1.4 Validação de Qualidade (8h)**
  - [ ] Implementar faithfulness score
  - [ ] Implementar citation coverage
  - [ ] Implementar relevance score
  - [ ] Implementar completeness score
  - [ ] Implementar overall score
  - [ ] Criar testes (10+)

- [ ] **1.5 Classificação de Risco (8h)**
  - [ ] Implementar risk classification
  - [ ] Implementar critical topic detection
  - [ ] Implementar approval requirement
  - [ ] Criar testes (8+)

- [ ] **1.6 Integração no Router (2h)**
  - [ ] Criar RAG router
  - [ ] Integrar no appRouter
  - [ ] Testar endpoints

### Semana 2: Fluxos Críticos (30h)

- [ ] **2.1 Upload de Documentos (8h)**
  - [ ] Validação de arquivo
  - [ ] Extração de texto
  - [ ] S3 upload
  - [ ] Metadata extraction
  - [ ] Indexação automática
  - [ ] Testes (10+)

- [ ] **2.2 Chat com Contexto (10h)**
  - [ ] Query embedding
  - [ ] Retrieval
  - [ ] LLM call
  - [ ] Citation extraction
  - [ ] Quality metrics
  - [ ] Risk classification
  - [ ] Histórico persistente
  - [ ] Streaming responses
  - [ ] Testes (12+)

- [ ] **2.3 Diagnósticos 360 (12h)**
  - [ ] Formulário → LLM
  - [ ] Análise 3 pilares
  - [ ] Cálculo ROI
  - [ ] Recomendações
  - [ ] Script de fechamento
  - [ ] Integração RAG
  - [ ] Testes (15+)

### Semana 3: Aprovação & Auditoria (14h)

- [ ] **3.1 Aprovação Humana (8h)**
  - [ ] Fila de aprovação
  - [ ] Workflow
  - [ ] Notificações
  - [ ] Testes (8+)

- [ ] **3.2 Auditoria Imutável (6h)**
  - [ ] Hash chain
  - [ ] Validação
  - [ ] Testes (6+)

### Semana 4: Testes & Entrega (36h)

- [ ] **4.1 Testes E2E (20h)**
  - [ ] Upload → Chat → Aprovação → Auditoria
  - [ ] Load testing
  - [ ] Security testing
  - [ ] Performance testing
  - [ ] Testes (50+)

- [ ] **4.2 Documentação (10h)**
  - [ ] ARCHITECTURE.md
  - [ ] API docs
  - [ ] Deployment guide
  - [ ] Troubleshooting

- [ ] **4.3 Validação (6h)**
  - [ ] Code review
  - [ ] Performance validation
  - [ ] Security audit

---

## 🎯 Métricas de Sucesso

| Métrica | Target |
|---------|--------|
| **Testes** | 150+ passando |
| **Cobertura** | 85%+ |
| **Latência** | < 5s por query |
| **Throughput** | > 100 queries/s |
| **Faithfulness** | > 0.85 |
| **Citation Coverage** | > 0.70 |
| **Overall Quality** | > 0.80 |
| **Uptime** | 99.99% |
| **Documentação** | 100% |

---

## 🚀 Próximos Passos

1. Começar Semana 1 (RAG Pipeline)
2. Implementar 40 horas de código
3. Passar 50+ testes
4. Continuar para Semana 2-4
5. Entregar V3 completo

**Timeline:** 4 semanas (160 horas)  
**Resultado:** Evolumix 360 V3 - Padrão Ouro SOTA 2026

