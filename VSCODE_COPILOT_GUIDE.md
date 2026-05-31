# 🛠️ Guia para VS Code, Copilot e Claude Code

**Objetivo:** Permitir que você continue o desenvolvimento em qualquer ferramenta  
**Público:** Developers usando VS Code, GitHub Copilot, Claude Code, etc.

---

## 🚀 Quick Start

### 1. Clonar Repositório
```bash
# Manus Git
git clone s3://vida-prod-gitrepo/webdev-git/310519663711530228/Pk69zYag8fMymKCfTVY8YX evolumix-360
cd evolumix-360

# Ou exportar para GitHub (veja seção "Exportar para GitHub")
```

### 2. Instalar Dependências
```bash
pnpm install
```

### 3. Configurar Variáveis de Ambiente
```bash
# Criar .env.local
cp .env.example .env.local

# Preencher com:
DATABASE_URL=mysql://...
JWT_SECRET=...
VITE_APP_ID=...
# etc (veja SETUP_LOCAL.md)
```

### 4. Rodar Desenvolvimento
```bash
pnpm dev
# Abre em http://localhost:3000
```

### 5. Rodar Testes
```bash
pnpm test
# Roda vitest com watch mode
```

---

## 📁 Estrutura de Arquivos

```
evolumix-360/
├── client/                          # Frontend React 19
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx            # Landing page
│   │   │   ├── Dashboard.tsx       # v1 Dashboard
│   │   │   ├── Copilot.tsx         # v1 Chat
│   │   │   ├── V2Dashboard.tsx     # v2 Dashboard (NOVO)
│   │   │   ├── V2Copilot.tsx       # v2 Chat (NOVO)
│   │   │   ├── V2Diagnostics.tsx   # v2 Diagnósticos (NOVO)
│   │   │   ├── V2Documents.tsx     # v2 Documentos (NOVO)
│   │   │   └── V2Reports.tsx       # v2 Relatórios (NOVO)
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx # Layout v1
│   │   │   ├── V2Layout.tsx        # Layout v2 (NOVO)
│   │   │   ├── AIChatBox.tsx       # Chat component
│   │   │   ├── Map.tsx             # Google Maps
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── lib/
│   │   │   └── trpc.ts             # tRPC client
│   │   ├── App.tsx                 # Routes
│   │   ├── main.tsx                # Entry point
│   │   └── index.css               # Global styles
│   ├── public/
│   └── index.html
│
├── server/                          # Backend Node.js + Express
│   ├── _core/
│   │   ├── index.ts                # Server entry point
│   │   ├── context.ts              # tRPC context
│   │   ├── oauth.ts                # OAuth integration
│   │   ├── llm.ts                  # LLM integration
│   │   ├── imageGeneration.ts      # Image generation
│   │   ├── voiceTranscription.ts   # Voice to text
│   │   ├── notification.ts         # Notifications
│   │   ├── secretsRotation.ts      # Secrets rotation (NOVO)
│   │   ├── healthChecks.ts         # Health checks (NOVO)
│   │   ├── circuitBreaker.ts       # Circuit breaker (NOVO)
│   │   ├── tracing.ts              # Distributed tracing (NOVO)
│   │   ├── metrics.ts              # Prometheus metrics (NOVO)
│   │   ├── structuredLogger.ts     # Winston logging (NOVO)
│   │   ├── backup.ts               # Backup PITR (NOVO)
│   │   ├── gracefulShutdown.ts     # Graceful shutdown (NOVO)
│   │   ├── slaMonitoring.ts        # SLA monitoring (NOVO)
│   │   ├── complianceScanner.ts    # Compliance (NOVO)
│   │   ├── wafRules.ts             # WAF rules (NOVO)
│   │   ├── chaosEngineering.ts     # Chaos engineering (NOVO)
│   │   └── costOptimization.ts     # Cost optimization (NOVO)
│   ├── routers.ts                  # tRPC routes
│   ├── db.ts                       # Database queries
│   ├── storage.ts                  # S3 integration
│   ├── auth.logout.test.ts         # Auth tests
│   └── routers/                    # (Future: split by feature)
│
├── drizzle/                         # Database
│   ├── schema.ts                   # Database schema (9 tables)
│   ├── relations.ts                # Relationships
│   ├── migrations/                 # SQL migrations
│   └── config.ts
│
├── shared/                          # Shared code
│   ├── types.ts                    # Shared types
│   └── const.ts                    # Shared constants
│
├── ARCHITECTURE.md                 # Architecture documentation
├── HANDOFF_STATUS_REAL.md          # Status real (NOVO)
├── IMPLEMENTATION_ROADMAP_PHASE1.md # Phase 1 roadmap (NOVO)
├── VSCODE_COPILOT_GUIDE.md         # Este arquivo
├── GOLD_STANDARD_AUDIT.md          # Security audit
├── SETUP_LOCAL.md                  # Local setup
├── DEPLOYMENT_GUIDE.md             # Deployment
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## 🎯 O Que Fazer Agora

### Opção 1: Implementar Fase 1 (Recomendado)
Siga `IMPLEMENTATION_ROADMAP_PHASE1.md` para implementar:
1. Upload de documentos (8h)
2. Histórico de chat (10h)
3. RAG básico (20h)

**Tempo:** 40 horas  
**Resultado:** Evolumix 360 funcional de verdade

### Opção 2: Corrigir Bugs Conhecidos
```bash
# Erros conhecidos:
# 1. prom-client não instalado
pnpm add prom-client

# 2. bigint não definido (em metrics.ts)
# Solução: usar 'any' type ou remover código não usado

# 3. Secrets rotation não ativado
# Solução: chamar initSecretsRotation() em server/_core/index.ts
```

### Opção 3: Adicionar Novas Features
Siga o padrão:
1. Criar schema em `drizzle/schema.ts`
2. Gerar migration: `pnpm drizzle-kit generate`
3. Criar router em `server/routers.ts`
4. Criar UI em `client/src/pages/`
5. Criar testes em `*.test.ts`
6. Rodar `pnpm test`

---

## 🔧 Comandos Úteis

### Desenvolvimento
```bash
# Dev server com hot reload
pnpm dev

# Apenas frontend (Vite)
pnpm dev:client

# Apenas backend (tsx watch)
pnpm dev:server

# Type checking
pnpm check

# Linting
pnpm lint

# Formatting
pnpm format
```

### Testes
```bash
# Rodar todos os testes
pnpm test

# Rodar com watch mode
pnpm test:watch

# Rodar teste específico
pnpm test -- auth.logout.test.ts

# Coverage
pnpm test:coverage
```

### Database
```bash
# Gerar migration
pnpm drizzle-kit generate

# Visualizar schema
pnpm drizzle-kit studio

# Executar migration
# (Use webdev_execute_sql no Manus)
```

### Build & Deploy
```bash
# Build para produção
pnpm build

# Preview build
pnpm preview

# Deploy (via Manus UI)
# Clicar "Publish" no Management UI
```

---

## 📝 Padrões de Código

### Criar Novo Endpoint tRPC

```typescript
// server/routers.ts
export const appRouter = router({
  myFeature: router({
    // Query (GET)
    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.query.myTable.findFirst({
          where: eq(myTable.id, input.id),
        });
      }),

    // Mutation (POST)
    create: protectedProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const id = generateId();
        await db.insert(myTable).values({
          id,
          userId: ctx.user.id,
          name: input.name,
        });
        return { id };
      }),
  }),
});
```

### Usar Endpoint no Frontend

```typescript
// client/src/pages/MyPage.tsx
import { trpc } from '@/lib/trpc';

export default function MyPage() {
  // Query
  const { data, isLoading } = trpc.myFeature.get.useQuery({ id: '123' });

  // Mutation
  const createMutation = trpc.myFeature.create.useMutation({
    onSuccess: () => {
      // Invalidar cache
      utils.myFeature.get.invalidate();
    },
  });

  return (
    <div>
      {isLoading ? 'Loading...' : data?.name}
      <button onClick={() => createMutation.mutate({ name: 'Test' })}>
        Create
      </button>
    </div>
  );
}
```

### Criar Teste Unitário

```typescript
// server/routers/myFeature.test.ts
import { describe, test, expect, beforeEach } from 'vitest';
import { db } from '../db';

describe('myFeature', () => {
  beforeEach(async () => {
    // Setup
  });

  test('create item', async () => {
    const result = await trpc.myFeature.create.mutate({
      name: 'Test',
    });
    expect(result.id).toBeDefined();
  });

  test('get item', async () => {
    const created = await trpc.myFeature.create.mutate({ name: 'Test' });
    const result = await trpc.myFeature.get.query({ id: created.id });
    expect(result.name).toBe('Test');
  });
});
```

---

## 🤖 Usando com Copilot / Claude Code

### Prompt Recomendado

```
Você é um desenvolvedor experiente trabalhando no Evolumix 360.

Contexto:
- Stack: React 19, Node.js, tRPC, MySQL
- Status: 65% funcional (UI OK, backend parcial)
- Objetivo: Implementar Fase 1 (Upload, Histórico, RAG)

Instruções:
1. Ler HANDOFF_STATUS_REAL.md para entender o status
2. Ler IMPLEMENTATION_ROADMAP_PHASE1.md para ver o que fazer
3. Seguir os padrões em VSCODE_COPILOT_GUIDE.md
4. Sempre escrever testes
5. Sempre usar TypeScript
6. Sempre seguir o padrão tRPC

Tarefa: [Sua tarefa aqui]
```

### Exemplo de Uso

**Você:** "Implementar upload de documentos seguindo IMPLEMENTATION_ROADMAP_PHASE1.md"

**Copilot/Claude:**
1. Lê IMPLEMENTATION_ROADMAP_PHASE1.md
2. Cria schema em drizzle/schema.ts
3. Cria endpoint em server/routers.ts
4. Cria UI em client/src/pages/V2Documents.tsx
5. Cria testes
6. Roda `pnpm test`

---

## 🐛 Troubleshooting

### Erro: "Cannot find package 'prom-client'"
```bash
pnpm add prom-client
```

### Erro: "bigint is not defined"
**Arquivo:** `server/_core/metrics.ts`  
**Solução:** Remover ou comentar código que usa bigint

### Erro: "Database connection refused"
```bash
# Verificar DATABASE_URL em .env.local
# Deve estar no formato: mysql://user:pass@host:port/db
```

### Erro: "OAuth callback failed"
```bash
# Verificar VITE_APP_ID e OAUTH_SERVER_URL em .env.local
# Devem estar corretos
```

### Testes falhando
```bash
# Limpar cache
rm -rf node_modules/.vite

# Reinstalar
pnpm install

# Rodar testes
pnpm test
```

---

## 📚 Documentação Importante

Ler nesta ordem:
1. **Este arquivo** (VSCODE_COPILOT_GUIDE.md)
2. **HANDOFF_STATUS_REAL.md** - Status real do projeto
3. **ARCHITECTURE.md** - Modelo de dados e arquitetura
4. **IMPLEMENTATION_ROADMAP_PHASE1.md** - O que fazer
5. **SETUP_LOCAL.md** - Setup local
6. **DEPLOYMENT_GUIDE.md** - Deploy

---

## ✅ Checklist Antes de Começar

- [ ] Clonar repositório
- [ ] Instalar dependências (`pnpm install`)
- [ ] Configurar .env.local
- [ ] Rodar `pnpm dev`
- [ ] Acessar http://localhost:3000
- [ ] Rodar `pnpm test` (91 testes devem passar)
- [ ] Ler HANDOFF_STATUS_REAL.md
- [ ] Ler IMPLEMENTATION_ROADMAP_PHASE1.md
- [ ] Começar pela Fase 1.1 (Upload)

---

## 🚀 Próximos Passos

1. **Hoje:** Setup local + ler documentação
2. **Amanhã:** Implementar Fase 1.1 (Upload)
3. **Dia 3:** Implementar Fase 1.2 (Histórico)
4. **Dia 4-5:** Implementar Fase 1.3 (RAG)
5. **Dia 6:** Testes e validação
6. **Dia 7:** Deploy em produção

**Tempo total:** 1 semana  
**Resultado:** Evolumix 360 funcional de verdade

---

## 💡 Dicas Finais

1. **Sempre escreva testes primeiro** (TDD)
2. **Sempre use TypeScript** (type safety)
3. **Sempre siga o padrão tRPC** (consistência)
4. **Sempre valide inputs** (segurança)
5. **Sempre trate erros** (robustez)
6. **Sempre documente** (manutenibilidade)

**Boa sorte! 🚀**

