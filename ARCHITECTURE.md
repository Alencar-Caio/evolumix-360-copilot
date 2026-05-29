# Evolumix 360 Technical Copilot - Arquitetura

## Visão Geral

O Evolumix 360 é uma plataforma sofisticada de diagnóstico técnico-comercial para consultores de higiene profissional. A arquitetura integra autenticação baseada em papéis, gerenciamento de documentos com versionamento, pipeline RAG (Retrieval-Augmented Generation) com LLM Groq, sistema de aprovações humanas obrigatório, e auditoria completa de operações.

## Modelo de Dados

### Entidades Principais

**users** - Usuários autenticados com controle de acesso por papel
- id: chave primária
- openId: identificador Manus OAuth (único)
- name, email, loginMethod
- role: enum ['user', 'admin'] (consultor ou administrador)
- createdAt, updatedAt, lastSignedIn

**documents** - Documentos técnicos (FISPQs, fichas técnicas, catálogos)
- id: chave primária
- title: nome do documento
- description: resumo/propósito
- documentType: enum ['FISPQ', 'technical_sheet', 'catalog', 'other']
- supplierId: fornecedor
- currentVersionId: referência à versão ativa
- status: enum ['draft', 'approved', 'archived']
- createdBy: userId do uploader
- createdAt, updatedAt

**documentVersions** - Histórico versionado de documentos
- id: chave primária
- documentId: referência ao documento
- versionNumber: número sequencial
- storageKey: chave S3 para arquivo
- storageUrl: URL persistente para referência
- fileSize, mimeType
- metadata: JSON com informações adicionais
- approvedBy: userId de quem aprovou (null se pendente)
- approvalStatus: enum ['pending', 'approved', 'rejected']
- rejectionReason: motivo de rejeição
- createdAt, approvedAt

**queries** - Consultas ao copiloto de IA
- id: chave primária
- userId: consultor que fez a consulta
- queryText: pergunta/prompt do usuário
- responseText: resposta gerada pelo LLM
- usedDocumentIds: JSON array de IDs de documentos usados
- citations: JSON array com {documentId, versionId, excerpt, page}
- faithfulnessScore: métrica de qualidade (0-1)
- citationCoverageScore: percentual de resposta citada
- riskClassification: enum ['low', 'medium', 'high', 'critical']
- requiresApproval: boolean (true se risco >= high)
- createdAt

**approvals** - Fluxo de aprovação humana
- id: chave primária
- queryId: referência à consulta
- submittedBy: userId de quem submeteu
- submittedAt: timestamp
- reviewedBy: userId de quem revisou (null se pendente)
- reviewedAt: timestamp
- status: enum ['pending', 'approved', 'rejected']
- reviewNotes: comentários do revisor
- createdAt, updatedAt

**diagnostics** - Diagnósticos 360º estruturados
- id: chave primária
- userId: consultor responsável
- clientName: nome do cliente
- area: área em m²
- footTraffic: fluxo de pessoas
- currentProducts: JSON array de produtos atuais
- currentConsumption: consumo em litros/mês
- currentCost: custo mensal em R$
- analysisChemical: análise do pilar Químico (texto)
- analysisHygiene: análise do pilar Higiene (texto)
- analysisROI: análise do pilar ROI (texto)
- recommendations: JSON array de recomendações
- closingScript: script de fechamento comercial gerado
- status: enum ['draft', 'completed', 'approved']
- createdAt, updatedAt

**roiCalculations** - Cálculos de ROI persistidos
- id: chave primária
- diagnosticId: referência ao diagnóstico
- costPerLiterDiluted: custo por litro diluído (R$)
- yield: rendimento (m²/litro)
- monthlyConsumption: consumo mensal (litros)
- monthlySavings: economia mensal (R$)
- paybackMonths: payback em meses
- beforeCost: custo antes (R$/mês)
- afterCost: custo depois (R$/mês)
- savingsPercentage: percentual de economia
- createdAt

**auditLogs** - Auditoria completa de operações
- id: chave primária
- userId: quem executou a ação
- action: tipo de ação (upload, query, approval, etc.)
- entityType: tipo de entidade afetada
- entityId: ID da entidade
- details: JSON com informações adicionais
- ipAddress: IP do usuário
- userAgent: navegador/cliente
- createdAt

## Fluxos Principais

### 1. Autenticação e Autorização

O sistema usa **Manus OAuth** para autenticação. Após login, o usuário recebe um cookie de sessão. Cada requisição tRPC injeta o contexto de usuário (`ctx.user`) com role e permissões.

**Papéis:**
- **Consultor (user)**: pode fazer consultas, criar diagnósticos, acessar documentos aprovados
- **Administrador (admin)**: acesso total, aprova documentos e minutas críticas, gerencia usuários

### 2. Pipeline RAG (Retrieval-Augmented Generation)

1. **Indexação**: Ao aprovar um documento, o sistema extrai texto, cria embeddings semânticos e armazena em índice vetorial
2. **Busca**: Quando o usuário faz uma consulta, o sistema busca documentos relevantes por similaridade semântica
3. **Prompt com Contexto**: O LLM recebe a pergunta + trechos dos documentos mais relevantes
4. **Extração de Citações**: A resposta é processada para extrair referências automáticas aos documentos usados
5. **Validação de Qualidade**: Cálculo de faithfulness (fidelidade ao contexto) e citation coverage (percentual citado)

### 3. Fluxo de Upload de Documentos

1. Administrador faz upload de arquivo (FISPQ, ficha técnica, etc.)
2. Sistema armazena em S3 com versionamento automático
3. Documento entra em status "pending" para aprovação
4. Administrador revisa e aprova (ou rejeita)
5. Após aprovação, documento é indexado para RAG
6. URLs persistentes são geradas para rastreabilidade

### 4. Fluxo de Consulta com IA

1. Consultor faz pergunta no chat técnico
2. Sistema busca documentos relevantes via RAG
3. LLM gera resposta com contexto dos documentos
4. Sistema extrai citações automaticamente
5. Resposta é classificada por risco (RAI)
6. Se risco >= "high", requer aprovação humana obrigatória
7. Consulta é registrada em auditoria com fontes e métricas

### 5. Fluxo de Diagnóstico 360º

1. Consultor preenche formulário: área, fluxo de pessoas, produtos, consumo, custo
2. Sistema submete dados ao LLM para análise estruturada nos três pilares
3. LLM gera análise Químico, Higiene, ROI com citações de documentos
4. Sistema calcula ROI com premissas explícitas
5. Script de fechamento comercial é gerado automaticamente
6. Diagnóstico é salvo com status "draft"
7. Se contém minutas críticas, requer aprovação antes de liberação
8. Após aprovação, diagnóstico passa para "approved"

### 6. Sistema de Aprovações Humanas

1. Minutas com risco crítico são submetidas automaticamente para fila de aprovação
2. Administrador revisa e aprova/rejeita
3. Se aprovado, minuta é liberada e registrada em auditoria
4. Se rejeitado, consultor recebe feedback e pode resubmeter
5. Histórico completo é mantido para rastreabilidade

## Integração com LLM (Groq)

**Modelo**: Groq oferece LLMs de alta velocidade (ex: mixtral-8x7b, llama2-70b)

**Prompts Mestres**:
- **Chat Técnico**: Sistema instruído a responder baseado em documentos, sempre citando fontes
- **Diagnóstico 360º**: Sistema instruído a estruturar análise em três pilares com recomendações
- **Classificação de Risco**: Sistema instruído a classificar resposta por nível de risco

**Contexto de Segurança**:
- Respostas críticas (risco alto/crítico) requerem aprovação humana
- Todas as citações são validadas contra documentos originais
- Faithfulness score garante fidelidade ao contexto

## Armazenamento de Documentos

**S3 com Versionamento**:
- Cada versão de documento tem chave única: `documents/{documentId}/v{versionNumber}/{fileName}`
- URLs persistentes: `/manus-storage/{storageKey}`
- Metadados armazenados em banco de dados (versão, fornecedor, data, status)
- Exclusão lógica para auditoria (nunca deletar fisicamente)

## Dashboard de Auditoria

Rastreia todas as operações:
- Consultas ao copiloto: pergunta, resposta, documentos usados, métricas de qualidade
- Uploads de documentos: quem, quando, versão, status de aprovação
- Aprovações humanas: quem aprovou, quando, notas
- Acessos de usuários: login, logout, ações realizadas

## Segurança e Conformidade

- **Autenticação**: Manus OAuth com sessão segura
- **Autorização**: Controle por papel (consultor/admin)
- **Auditoria**: Log completo de todas as operações com timestamp e IP
- **Rastreabilidade**: Cada resposta de IA referencia documentos e versões específicas
- **Bloqueio Crítico**: Minutas críticas nunca são liberadas sem aprovação humana
- **Versionamento**: Histórico completo de documentos para conformidade

## Stack Técnico

- **Frontend**: React 19 + Tailwind 4 + TypeScript
- **Backend**: Express 4 + tRPC 11 + TypeScript
- **Banco de Dados**: MySQL/TiDB com Drizzle ORM
- **Armazenamento**: S3 com URLs persistentes
- **LLM**: Groq API (alta velocidade)
- **Auth**: Manus OAuth
- **Deployment**: Cloud Run (Node.js)
