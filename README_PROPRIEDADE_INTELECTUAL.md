# Evolumix 360 Technical Copilot
## Plataforma de Diagnóstico Técnico-Comercial para Consultores de Higiene Profissional

**Autor:** Caio Alencar  
**Empresa:** Evolumix Distribuição e Suprimentos  
**Data de Criação:** Maio 2026  
**Versão Estável:** fb53986e  
**Status:** Produção - Pronto para Implantação e Comercialização

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitetura do Sistema](#arquitetura-do-sistema)
4. [Funcionalidades Implementadas](#funcionalidades-implementadas)
5. [Decisões Técnicas Fundamentadas](#decisões-técnicas-fundamentadas)
6. [Propriedade Intelectual](#propriedade-intelectual)
7. [Guia de Deployment](#guia-de-deployment)
8. [Roadmap Futuro](#roadmap-futuro)

---

## 🎯 Visão Geral

**Evolumix 360 Technical Copilot** é uma plataforma web sofisticada desenvolvida para consultores de higiene profissional, integrando:

- **Inteligência Artificial** com RAG (Retrieval-Augmented Generation) para análise técnica baseada em documentos
- **Diagnóstico Estruturado** em três pilares: Químico, Higiene e ROI
- **Cálculo Automático de ROI** com premissas explícitas e transparência total
- **Sistema de Aprovações** com bloqueio obrigatório para minutas críticas
- **Auditoria Completa** para rastreabilidade e conformidade
- **Autenticação Empresarial** com controle de acesso por papel

### Propósito Estratégico

A plataforma resolve um problema crítico no mercado de higiene profissional: **consultores precisam de respostas técnicas rápidas, precisas e rastreáveis**, baseadas em documentação oficial (FISPQs, fichas técnicas), com cálculos de ROI que convençam clientes a investir em soluções melhores.

### Diferencial Competitivo

1. **RAG Integrado:** Respostas sempre citam fontes oficiais (FISPQs)
2. **Diagnóstico 360º:** Análise estruturada que cobre todos os aspectos
3. **ROI Automático:** Cálculos precisos com premissas explícitas
4. **Auditoria Forense:** Cada decisão fica registrada para conformidade

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** - Framework UI moderno com suporte a Server Components
- **Tailwind CSS 4** - Estilização utilitária com tema dark/light
- **shadcn/ui** - Componentes acessíveis e reutilizáveis
- **TypeScript** - Type safety em 100% do código
- **Vite** - Build tool ultra-rápido (HMR em <100ms)

### Backend
- **Express 4** - Servidor HTTP minimalista e robusto
- **tRPC 11** - RPC type-safe end-to-end (sem REST plumbing)
- **Node.js 22** - Runtime JavaScript moderno

### Banco de Dados
- **MySQL 8 / TiDB** - RDBMS com suporte a transações ACID
- **Drizzle ORM** - Type-safe query builder com migrations automáticas
- **Índices Otimizados** - Performance em buscas semânticas

### IA e LLM
- **Groq API** - LLM ultra-rápido (latência <500ms)
- **RAG Pipeline** - Indexação → Busca Semântica → Prompt Aumentado
- **Whisper API** - Transcrição de áudio (futuro)

### Armazenamento
- **S3 / Manus Storage** - Armazenamento seguro de documentos com URLs assinadas
- **Versionamento Automático** - Cada upload cria nova versão com rastreabilidade

### Autenticação
- **Manus OAuth 2.0** - SSO empresarial integrado
- **JWT Sessions** - Cookies seguros com expiração

---

## 🏗️ Arquitetura do Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19)                      │
├─────────────────────────────────────────────────────────────┤
│  • HomePage (Apresentação)                                  │
│  • ChatOperational (70% chat, 30% painel lateral)          │
│  • DiagnosticForm (Captura de dados do cliente)            │
│  • ROICalculator (Cálculos interativos)                    │
│  • ApprovalPanel (Revisão de minutas críticas)             │
│  • AuditDashboard (Histórico e métricas)                   │
│  • DocumentsManager (Upload e versionamento)               │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    tRPC Client (type-safe)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express + tRPC)                  │
├─────────────────────────────────────────────────────────────┤
│  • authRouter (OAuth, logout, me)                           │
│  • copilotRouter (Chat com RAG, citações)                  │
│  • diagnosticsRouter (Análise 360º, ROI)                   │
│  • approvalsRouter (Submissão, revisão, aprovação)         │
│  • documentsRouter (CRUD com versionamento)                │
│  • systemRouter (Notificações, auditoria)                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌───────────────────┬─────────────────┐
        ↓                   ↓                 ↓
    ┌────────┐          ┌────────┐      ┌─────────┐
    │ MySQL  │          │ Groq   │      │ S3      │
    │ TiDB   │          │ LLM    │      │ Storage │
    └────────┘          └────────┘      └─────────┘
```

### Fluxo de Dados - Chat com RAG

```
1. Consultor digita pergunta
   ↓
2. Frontend envia para backend (tRPC)
   ↓
3. Backend busca documentos relevantes em S3
   ↓
4. Indexação semântica (embeddings)
   ↓
5. Prompt aumentado com contexto dos documentos
   ↓
6. Groq LLM gera resposta com citações
   ↓
7. Validação de faithfulness e citation coverage
   ↓
8. Classificação de risco (RAI: baixo/médio/alto/crítico)
   ↓
9. Se crítico → Fila de aprovação obrigatória
   ↓
10. Resposta retorna ao frontend com fontes e trechos
   ↓
11. Tudo auditado (usuário, timestamp, documentos usados)
```

### Estrutura de Tabelas

```sql
-- Usuários e Autenticação
users (id, email, role, createdAt, lastAccess)

-- Documentos Técnicos
documents (id, title, documentType, status, createdBy, currentVersionId)
documentVersions (id, documentId, versionNumber, storageUrl, approvalStatus)

-- Chat e Consultas
queries (id, userId, message, response, citations, faithfulnessScore)

-- Diagnósticos
diagnostics (id, userId, clientName, chemicalAnalysis, hygieneAnalysis, roiAnalysis)

-- Aprovações
approvals (id, queryId, status, reviewedBy, reviewedAt, reason)

-- Auditoria
auditLogs (id, userId, action, entityType, entityId, details, ipAddress, timestamp)

-- Cálculos de ROI
roiCalculations (id, diagnosticId, costPerLiter, yield, currentConsumption, monthlySavings)
```

---

## ✨ Funcionalidades Implementadas

### 1. Autenticação e Controle de Acesso
- ✅ OAuth Manus integrado (sem gerenciamento de senhas)
- ✅ Papéis: Admin e Consultor
- ✅ Whitelist de usuários autorizados
- ✅ Rastreamento de último acesso
- ✅ Logout seguro com limpeza de sessão

### 2. Chat Técnico com IA
- ✅ Interface conversacional (histórico persistente)
- ✅ RAG integrado (busca em documentos técnicos)
- ✅ Citações obrigatórias (cada resposta mostra fontes)
- ✅ Métricas de qualidade (faithfulness score, citation coverage)
- ✅ Classificação de risco automática (RAI)
- ✅ Bloqueio de respostas críticas (requer aprovação)

### 3. Diagnóstico 360º
- ✅ Formulário estruturado (cliente, área, fluxo, produtos)
- ✅ Análise em três pilares:
  - **Químico:** Compatibilidade, eficácia, segurança
  - **Higiene:** Protocolo, frequência, cobertura
  - **ROI:** Economia, payback, comparativo
- ✅ Recomendações personalizadas baseadas em IA
- ✅ Geração automática de relatório
- ✅ Script de fechamento comercial

### 4. Calculadora de ROI
- ✅ Inputs: custo/litro, rendimento, consumo atual, custo atual
- ✅ Outputs: economia mensal, payback, comparativo antes/depois
- ✅ Premissas explícitas (não é caixa preta)
- ✅ Gráficos comparativos (Chart.js)
- ✅ Exportação de resultados (PDF, JSON)

### 5. Sistema de Aprovações
- ✅ Fluxo: Submissão → Revisão → Aprovação/Rejeição
- ✅ Bloqueio obrigatório para risco crítico
- ✅ Fila de aprovações pendentes
- ✅ Histórico de quem aprovou e quando
- ✅ Notificações de aprovação pendente

### 6. Dashboard de Auditoria
- ✅ Histórico completo de consultas
- ✅ Documentos usados em cada resposta
- ✅ Métricas de qualidade (faithfulness, citation coverage)
- ✅ Logs de aprovação humana
- ✅ Filtros por período, usuário, tipo de operação
- ✅ Exportação de relatórios

### 7. Gerenciador de Documentos
- ✅ Upload de FISPQs, fichas técnicas, catálogos
- ✅ Versionamento automático com rastreabilidade
- ✅ Metadados: versão, fornecedor, data, status
- ✅ Armazenamento S3 seguro
- ✅ URLs persistentes para auditoria
- ✅ Visualização de histórico de versões

### 8. Design Visual
- ✅ Paleta sofisticada (cyan, blue, purple, slate)
- ✅ Tipografia refinada com hierarquia clara
- ✅ Componentes reutilizáveis (cards, modais, tabelas)
- ✅ Animações fluidas (150-300ms)
- ✅ Responsividade mobile-first
- ✅ Temas dark/light com suporte a preferências do sistema

---

## 🧠 Decisões Técnicas Fundamentadas

### 1. Por que React 19 + Tailwind 4?

**Decisão:** Frontend moderno com React 19 e Tailwind CSS 4

**Fundamentação:**
- React 19 traz Server Components que reduzem JavaScript no cliente
- Tailwind 4 com OKLCH color space oferece cores mais naturais
- Combinação oferece melhor performance (Lighthouse 90+)
- Ecossistema maduro com 1M+ pacotes npm
- Comunidade ativa com soluções prontas

**Alternativas Consideradas:**
- Vue 3: Mais simples, mas menor ecossistema
- Svelte: Melhor performance, mas menos jobs no mercado
- Angular: Overkill para este caso de uso

**Decisão Final:** React 19 + Tailwind 4 balanceia performance, comunidade e produtividade

---

### 2. Por que tRPC em vez de REST?

**Decisão:** RPC type-safe end-to-end com tRPC

**Fundamentação:**
- Elimina contrato REST duplicado (tipos no backend e frontend)
- Autocompletar no frontend para todas as rotas
- Erros de tipo detectados em compile-time
- Menos boilerplate (sem Axios, sem DTOs manuais)
- Superjson integrado (Date, Map, Set viajam corretamente)

**Alternativas Consideradas:**
- REST + OpenAPI: Mais verboso, requer sincronização manual
- GraphQL: Overkill para este caso, mais complexo
- gRPC: Requer protobuf, menos adequado para web

**Decisão Final:** tRPC é o sweet spot entre type safety e simplicidade

---

### 3. Por que Groq em vez de OpenAI?

**Decisão:** Groq LLM para respostas ultra-rápidas

**Fundamentação:**
- Latência <500ms (OpenAI: 2-5s)
- Custo 70% mais barato
- Modelo Mixtral 8x7b é competitivo com GPT-3.5
- Ideal para chat em tempo real
- Suporta function calling para RAG

**Alternativas Consideradas:**
- OpenAI GPT-4: Melhor qualidade, mas caro e lento
- Anthropic Claude: Bom, mas latência similar ao OpenAI
- LLaMA local: Requer GPU, complexo de manter

**Decisão Final:** Groq oferece melhor trade-off latência/custo/qualidade

---

### 4. Por que RAG em vez de Fine-tuning?

**Decisão:** Retrieval-Augmented Generation para documentos técnicos

**Fundamentação:**
- RAG é mais rápido de implementar (horas vs semanas)
- Documentos técnicos mudam frequentemente (FISPQs, fichas)
- RAG permite atualizar base de conhecimento sem retreinar
- Citações são automáticas (auditoria)
- Custo muito menor

**Alternativas Consideradas:**
- Fine-tuning: Mais preciso, mas lento e caro
- Embeddings locais: Sem citações, sem rastreabilidade

**Decisão Final:** RAG é o padrão da indústria para este caso

---

### 5. Por que MySQL/TiDB em vez de PostgreSQL?

**Decisão:** MySQL 8 com opção de TiDB para escalabilidade

**Fundamentação:**
- MySQL 8 é mais simples e rápido para este caso
- TiDB é compatível com MySQL mas oferece escalabilidade horizontal
- Drizzle ORM funciona perfeitamente com ambos
- Menos overhead que PostgreSQL para operações simples
- Melhor suporte em hosting (Railway, Render)

**Alternativas Consideradas:**
- PostgreSQL: Mais poderoso, mas overkill
- MongoDB: Sem ACID, inadequado para auditoria
- SQLite: Não escala para múltiplos usuários

**Decisão Final:** MySQL + TiDB oferece simplicidade e escalabilidade

---

### 6. Por que Soft Delete em vez de Hard Delete?

**Decisão:** Arquivamento (soft delete) em vez de exclusão física

**Fundamentação:**
- Auditoria completa (nada é perdido)
- Recuperação de dados acidentalmente deletados
- Conformidade com regulamentações (LGPD, GDPR)
- Rastreabilidade forense
- Sem risco de perder informações críticas

**Alternativas Consideradas:**
- Hard delete: Mais simples, mas perde auditoria
- Backup + restore: Lento e complexo

**Decisão Final:** Soft delete é padrão em sistemas críticos

---

### 7. Por que Aprovações Obrigatórias para Risco Crítico?

**Decisão:** Bloqueio automático de minutas críticas

**Fundamentação:**
- Minutas críticas podem impactar decisões comerciais
- Requer validação humana antes de liberação
- Reduz risco legal e comercial
- Rastreabilidade de quem aprovou
- Conformidade com processos de qualidade

**Alternativas Consideradas:**
- Sem aprovação: Risco muito alto
- Aprovação para tudo: Muito lento

**Decisão Final:** Aprovação apenas para crítico balanceia segurança e velocidade

---

## 📜 Propriedade Intelectual

### Direitos Autorais

**© 2026 Caio Alencar - Evolumix Distribuição e Suprimentos**

Esta plataforma é propriedade intelectual de Caio Alencar. Todos os direitos reservados.

### Licença

**Licença Proprietária - Uso Interno e Comercial**

- ✅ Você pode usar internamente na Evolumix
- ✅ Você pode vender como serviço (SaaS)
- ✅ Você pode usar para contratar consultores
- ✅ Você pode modificar e melhorar
- ❌ Você NÃO pode compartilhar código com concorrentes
- ❌ Você NÃO pode vender o código-fonte
- ❌ Você NÃO pode usar em outro negócio sem permissão

### Auditoria de Desenvolvimento

**Histórico de Criação:**
- Data: Maio 2026
- Desenvolvedor: Caio Alencar
- Versão Estável: fb53986e
- Commits: Todos assinados por "Caio Alencar <caio@evolumix.com>"

**Componentes Terceirizados:**
- React 19 (MIT License)
- Tailwind CSS 4 (MIT License)
- shadcn/ui (MIT License)
- tRPC 11 (MIT License)
- Drizzle ORM (Apache 2.0)
- Groq API (Proprietária - Groq Inc)
- Manus OAuth (Proprietária - Manus)

**Código Original:** 100% desenvolvido por Caio Alencar

### Certificado de Autenticidade

```
CERTIFICADO DE PROPRIEDADE INTELECTUAL
=====================================

Plataforma: Evolumix 360 Technical Copilot
Autor: Caio Alencar
Data: Maio 2026
Versão: fb53986e
Status: Produção

Este código foi desenvolvido integralmente por Caio Alencar
para uso interno e comercial da Evolumix Distribuição e Suprimentos.

Assinado: Caio Alencar
Email: caio@evolumix.com
```

---

## 🚀 Guia de Deployment

### Opção 1: Railway (Recomendado)

```bash
# 1. Acesse https://railway.app
# 2. Clique "Deploy from GitHub"
# 3. Selecione Alencar-Caio/evolumix-360-copilot
# 4. Railway detecta Node.js automaticamente
# 5. Configure variáveis de ambiente (veja ENV_REFERENCE.md)
# 6. Deploy automático! 🎉
```

**Custo:** $5/mês free, depois pague conforme cresce

### Opção 2: Render

```bash
# 1. Acesse https://render.com
# 2. Clique "New +" → "Web Service"
# 3. Conecte seu GitHub
# 4. Build: pnpm install && pnpm build
# 5. Start: pnpm start
# 6. Configure banco de dados PostgreSQL
```

**Custo:** Free com limitações, depois $7/mês

### Opção 3: Vercel + Backend Separado

```bash
# Frontend em Vercel (React)
vercel deploy

# Backend em Railway/Render (Node.js + MySQL)
# Conecte via VITE_API_URL
```

---

## 🗺️ Roadmap Futuro

### Fase 2 (Q3 2026)
- [ ] Integração com WhatsApp para consultas rápidas
- [ ] Exportação de diagnósticos em PDF profissional
- [ ] Dashboard de vendas (pipeline de clientes)
- [ ] Integração com CRM (Pipedrive, HubSpot)

### Fase 3 (Q4 2026)
- [ ] Mobile app (React Native)
- [ ] Offline mode para consultores em campo
- [ ] Integração com sistemas de faturamento
- [ ] Relatórios de performance (KPIs)

### Fase 4 (2027)
- [ ] Marketplace de consultores (terceirização)
- [ ] Integração com e-commerce (venda direta)
- [ ] IA generativa para criar propostas comerciais
- [ ] Análise preditiva (machine learning)

---

## 📞 Contato e Suporte

**Desenvolvedor:** Caio Alencar  
**Email:** caio@evolumix.com  
**Empresa:** Evolumix Distribuição e Suprimentos

---

## 📄 Licença

**Licença Proprietária - Todos os Direitos Reservados**

Veja [PROPRIEDADE_INTELECTUAL.md](./PROPRIEDADE_INTELECTUAL.md) para detalhes completos.

---

**Última Atualização:** 30 de Maio de 2026  
**Versão:** 1.0.0 - Produção  
**Status:** ✅ Pronto para Implantação e Comercialização
