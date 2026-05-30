# Evolumix 360 Technical Copilot

**Plataforma de IA para análise técnica-comercial de operações de limpeza profissional**

Uma solução corporativa para consultores e administradores da área de higiene e limpeza profissional, centraliza diagnóstico técnico-comercial, inteligência artificial lastreada em documentos (RAG) e gestão de aprovações humanas.

## 🎯 Visão Geral

O Evolumix 360 é um **copiloto técnico comercial** que permite:

- **Chat conversacional com IA** para análise de cenários de limpeza
- **Diagnóstico 360º** estruturado em três pilares: Químico, Higiene e ROI
- **Cálculo de ROI automático** com premissas explícitas
- **RAG (Retrieval-Augmented Generation)** com documentos técnicos (FISPQs, fichas técnicas)
- **Sistema de aprovações humanas** com classificação de risco automática
- **Dashboard de auditoria** com rastreamento completo de operações

## 🚀 Funcionalidades Principais

### 1. Chat Técnico com IA
Copiloto integrado com LLM (Groq) que:
- Responde perguntas sobre análise de cenários de limpeza
- Levanta dados naturalmente durante a conversa
- Cita fontes técnicas obrigatoriamente em cada resposta
- Mostra métricas de qualidade (faithfulness, citation coverage, risk level)

### 2. Diagnóstico 360º
Análise estruturada em três pilares:
- **Químico:** Análise técnica de produtos, compatibilidade, eficácia
- **Higiene:** Protocolos, frequência, cobertura de limpeza
- **ROI:** Oportunidades de economia, produtos recomendados, payback

### 3. Calculadora de ROI
Cálculo automático de:
- Custo atual vs. proposto por litro diluído
- Economia mensal e anual
- Payback em meses
- Comparativo antes/depois com gráficos

### 4. RAG (Retrieval-Augmented Generation)
- Upload de documentos técnicos (PDFs)
- Indexação automática em banco de dados vetorial
- Busca semântica de trechos relevantes
- Citações obrigatórias em todas as respostas

### 5. Sistema de Aprovações
- Fluxo de submissão de consultas para aprovação
- Painel de revisor com histórico
- Bloqueio obrigatório para consultas críticas
- Rastreamento de quem aprovou e quando

### 6. Dashboard de Auditoria
- Histórico completo de operações
- Métricas de qualidade (faithfulness, citation coverage)
- Logs de aprovação humana
- Filtros e exportação de relatórios

## 🏗️ Arquitetura

### Stack Tecnológico
- **Frontend:** React 19 + Tailwind CSS 4 + TypeScript
- **Backend:** Express 4 + tRPC 11 + Node.js
- **Database:** MySQL/TiDB com Drizzle ORM
- **LLM:** Groq (API de alta velocidade)
- **Storage:** S3 (documentos e assets)
- **Auth:** OAuth 2.0 (Manus)

### Estrutura de Pastas
```
evolumix-360-copilot/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas principais
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── lib/           # Utilitários e hooks
│   │   └── App.tsx        # Roteamento
│   └── index.html
├── server/                 # Backend Express + tRPC
│   ├── routers/           # Rotas tRPC (documentos, copiloto, diagnósticos, etc.)
│   ├── db.ts              # Helpers de banco de dados
│   └── _core/             # Configuração central (auth, LLM, storage)
├── drizzle/               # Schema e migrações
├── shared/                # Tipos e constantes compartilhadas
├── GUIA_COMPLETO.md       # Documentação de uso
├── DOCUMENTATION.md       # Documentação técnica
└── package.json
```

## 📋 Como Começar

### Pré-requisitos
- Node.js 18+
- MySQL 8.0+
- Conta Manus (para OAuth)

### Setup Local

1. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/evolumix-360-copilot.git
cd evolumix-360-copilot
```

2. **Instale dependências:**
```bash
pnpm install
```

3. **Configure variáveis de ambiente:**
```bash
cp .env.example .env
# Edite .env com suas credenciais
```

4. **Configure banco de dados:**
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

5. **Inicie o servidor de desenvolvimento:**
```bash
pnpm dev
```

6. **Acesse em http://localhost:3000**

## 📚 Documentação

- **[GUIA_COMPLETO.md](./GUIA_COMPLETO.md)** - Guia completo de uso, acesso, alimentação do RAG e troubleshooting
- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Documentação técnica detalhada
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitetura do sistema

## 🔐 Autenticação e Autorização

A plataforma utiliza **OAuth 2.0 do Manus** para autenticação:

1. Usuário acessa a plataforma
2. É redirecionado para portal de login do Manus
3. Faz login com email + senha
4. Retorna autenticado à plataforma
5. Administrador autoriza o usuário no painel

## 📖 Alimentando o RAG

Para adicionar documentos técnicos ao RAG:

1. Acesse o **Gerenciador de Documentos** (admin only)
2. Clique em "Novo Documento"
3. Preencha metadados (nome, fornecedor, tipo, versão)
4. Faça upload do PDF
5. O sistema indexa automaticamente
6. O copiloto usará o documento em respostas futuras

Veja [GUIA_COMPLETO.md - Seção 3](./GUIA_COMPLETO.md#3-alimentando-o-rag-com-pdfs) para detalhes.

## 🧪 Testes

```bash
# Executar testes
pnpm test

# Executar com coverage
pnpm test:coverage
```

## 🚀 Deploy

### Deploy no Manus (Recomendado)
```bash
# Clique em "Publish" no painel de controle Manus
# Ou use domínio customizado nas configurações
```

### Deploy em Produção (Seu Servidor)
Veja [GUIA_COMPLETO.md - Seção 5.4](./GUIA_COMPLETO.md#54-deploy-em-produção) para instruções detalhadas.

## 📊 Métricas de Qualidade

Cada resposta do copiloto inclui:

- **Faithfulness Score:** Confiabilidade da resposta (0-100%)
- **Citation Coverage:** Percentual de resposta baseado em documentos
- **Risk Level:** Classificação automática (baixo, médio, alto, crítico)

## 🔄 Fluxo Típico de Uso

```
1. Usuário: "Preciso analisar operação do cliente XYZ"
   ↓
2. Copiloto: "Qual é a área em m²?"
   ↓
3. Usuário: "5000 m²"
   ↓ [Sistema coleta dados]
   ↓
4. Copiloto: "Qual é o fluxo de pessoas?"
   ↓
5. Usuário: "2000 pessoas/dia"
   ↓ [Continua coletando...]
   ↓
6. Copiloto: [Gera análise 360º com citações]
   ↓
7. Sistema: [Calcula ROI automaticamente]
   ↓
8. Usuário: "Salvar análise"
   ↓
9. Sistema: [Salva com histórico completo]
```

## 🛠️ Troubleshooting

### Problema: Não consigo fazer login
- Verifique se sua conta Manus está ativa
- Verifique se você foi autorizado por um administrador
- Limpe cookies do navegador

### Problema: Chat não responde
- Verifique conexão com internet
- Verifique se o servidor está rodando
- Tente fazer refresh da página

### Problema: Documentos não aparecem nas respostas
- Verifique se o documento foi indexado (status = "Indexado")
- Aguarde 10 minutos após upload
- Tente uma pergunta mais específica

Veja [GUIA_COMPLETO.md - Seção 6](./GUIA_COMPLETO.md#6-troubleshooting) para mais soluções.

## 📝 Contribuindo

Este é um projeto interno da Evolumix. Para contribuições, entre em contato com o time técnico.

## 📄 Licença

Propriedade da Evolumix Distribuição e Suprimentos.

## 👥 Suporte

Para suporte técnico:
1. Consulte [GUIA_COMPLETO.md](./GUIA_COMPLETO.md)
2. Consulte [DOCUMENTATION.md](./DOCUMENTATION.md)
3. Abra uma issue no GitHub
4. Entre em contato com o time técnico da Evolumix

---

**Versão:** 1.0  
**Última atualização:** 30 de maio de 2026  
**Autor:** Manus AI  
**Propriedade:** Evolumix Distribuição e Suprimentos
