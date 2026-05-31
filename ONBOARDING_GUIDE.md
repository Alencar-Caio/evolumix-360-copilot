# Onboarding Guide - Evolumix 360 Technical Copilot

## Welcome to the Team!

Este guia foi criado para facilitar o onboarding de novos membros do time técnico no projeto Evolumix 360 Technical Copilot. O projeto é um sistema de IA consultivo avançado com foco em RAG (Retrieval-Augmented Generation), conformidade internacional e segurança de nível enterprise.

## Visão Geral do Projeto

O Evolumix 360 é uma plataforma técnica que combina:

- **RAG Pipeline Robusto**: Detecção de alucinações, validação de citações, histórico de conversas persistente
- **Conformidade Internacional**: FIPS 140-2 Level 2, ISO 27001, OWASP Top 10
- **Segurança Avançada**: Criptografia end-to-end, zero-trust architecture, incident response
- **Operações**: Rate limiting, dependency scanning, cost optimization, performance monitoring
- **Interface Moderna**: React 19, Tailwind 4, componentes shadcn/ui

## Stack Técnico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | React | 19 |
| **Styling** | Tailwind CSS | 4 |
| **Backend** | Express | 4 |
| **RPC** | tRPC | 11 |
| **Database** | MySQL/TiDB | 8 |
| **ORM** | Drizzle | Latest |
| **Testing** | Vitest | 2 |
| **Runtime** | Node.js | 22 |
| **Package Manager** | pnpm | 10 |

## Setup Inicial

### 1. Clonar Repositório

```bash
git clone https://github.com/your-org/evolumix-360-copilot.git
cd evolumix-360-copilot
```

### 2. Instalar Dependências

```bash
# Instalar pnpm se necessário
npm install -g pnpm

# Instalar dependências do projeto
pnpm install
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.example .env.local

# Editar com suas credenciais
nano .env.local
```

Variáveis obrigatórias:

```
DATABASE_URL=mysql://user:password@localhost:3306/evolumix
JWT_SECRET=your_jwt_secret_here
PINECONE_API_KEY=your_pinecone_key
GROQ_API_KEY=your_groq_api_key
NODE_ENV=development
```

### 4. Inicializar Banco de Dados

```bash
# Executar migrações
pnpm run db:migrate

# Seed com dados de teste (opcional)
pnpm run db:seed
```

### 5. Iniciar Dev Server

```bash
# Terminal 1: Backend
pnpm run dev

# Terminal 2: Type checking (opcional)
pnpm run type-check --watch
```

Acesse `http://localhost:3000`

## Estrutura do Projeto

```
evolumix-360-copilot/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities (trpc client, etc)
│   │   └── App.tsx           # Main app component
│   └── index.html
├── server/                    # Backend Express/tRPC
│   ├── routers/              # tRPC routers
│   │   ├── rateLimiter.ts
│   │   ├── dependencyScanner.ts
│   │   ├── encryption.ts
│   │   └── ...
│   ├── _core/                # Core infrastructure
│   │   ├── security/         # Encryption, compliance
│   │   ├── rag/              # RAG pipeline
│   │   ├── resilience/       # Failover, rate limiting
│   │   ├── middleware/       # Express middleware
│   │   └── index.ts          # Server entry point
│   ├── db.ts                 # Database helpers
│   └── routers.ts            # Main router
├── drizzle/                  # Database schema & migrations
│   ├── schema.ts             # Table definitions
│   └── migrations/           # SQL migration files
├── shared/                   # Shared types & constants
└── references/               # Documentation & guides
```

## Fluxo de Desenvolvimento

### 1. Criar Nova Feature

```bash
# Criar branch feature
git checkout -b feature/my-feature

# Fazer mudanças no código
# ...

# Rodar testes
pnpm test

# Commit com mensagem descritiva
git commit -m "feat: add my feature"

# Push para remote
git push origin feature/my-feature

# Criar Pull Request no GitHub
```

### 2. Estrutura de um Endpoint tRPC

```typescript
// server/routers/myFeature.ts
import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';

export const myFeatureRouter = router({
  getItems: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input, ctx }) => {
      // Lógica aqui
      return { success: true, data: [] };
    }),
});
```

### 3. Consumir no Frontend

```typescript
// client/src/pages/MyPage.tsx
import { trpc } from '@/lib/trpc';

export function MyPage() {
  const { data, isLoading } = trpc.myFeature.getItems.useQuery({ limit: 10 });
  
  return (
    <div>
      {isLoading ? <Spinner /> : <ItemsList items={data?.data} />}
    </div>
  );
}
```

### 4. Escrever Testes

```typescript
// server/routers/myFeature.test.ts
import { describe, it, expect } from 'vitest';
import { getItems } from '../_core/myFeature';

describe('My Feature', () => {
  it('should return items', () => {
    const result = getItems({ limit: 10 });
    expect(result).toHaveLength(10);
  });
});
```

## Convenções de Código

### Naming

- **Arquivos**: kebab-case (`my-feature.ts`)
- **Funções**: camelCase (`getItems()`)
- **Classes**: PascalCase (`MyFeature`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_ITEMS = 100`)

### Imports

```typescript
// Ordem: built-ins, packages, local
import fs from 'fs';
import { z } from 'zod';
import { myHelper } from '../_core/helpers';
```

### Type Safety

Sempre use tipos explícitos:

```typescript
// ❌ Evitar
const result = getItems();

// ✅ Preferir
const result: Item[] = getItems();
```

## Segurança

### Princípios

1. **Never commit secrets**: Use `.env.local` e `.gitignore`
2. **Validate inputs**: Use Zod schemas em todos os endpoints
3. **Check permissions**: Use `ctx.user.role` para autorização
4. **Encrypt sensitive data**: Use `encryptData()` para dados em repouso
5. **Log security events**: Use `auditLog()` para rastrear ações

### Exemplo Seguro

```typescript
// ✅ Bom
export const deleteUser = adminProcedure
  .input(z.object({ userId: z.string().uuid() }))
  .mutation(async ({ input, ctx }) => {
    // Validação de permissão
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    
    // Audit log
    await auditLog({
      action: 'delete_user',
      userId: ctx.user.id,
      targetId: input.userId,
    });
    
    // Operação
    return db.users.delete({ where: { id: input.userId } });
  });
```

## Debugging

### Logs

```typescript
// Usar console.log com prefixo
console.log('[FeatureName] Message:', data);

// Ver logs em tempo real
tail -f .manus-logs/devserver.log
```

### Database

```bash
# Conectar ao MySQL
mysql -u root -p evolumix

# Ver schema
DESCRIBE users;

# Query rápida
SELECT * FROM users LIMIT 10;
```

### tRPC DevTools

Acesse `http://localhost:3000/api/trpc` para inspecionar chamadas tRPC

## Performance

### Otimizações Comuns

1. **Caching**: Use `getRemainingTokens()` para cache de rate limits
2. **Indexing**: Adicione índices em colunas frequentemente consultadas
3. **Pagination**: Sempre pagine resultados grandes
4. **Lazy Loading**: Carregue dados sob demanda no frontend

### Monitoramento

```bash
# Ver performance baseline
pnpm run perf:baseline

# Detectar regressões
pnpm run perf:check
```

## Testes

```bash
# Rodar todos os testes
pnpm test

# Rodar testes específicos
pnpm test server/routers/myFeature.test.ts

# Modo watch
pnpm test --watch

# Com coverage
pnpm test --coverage
```

## Deployment

### Staging

```bash
git push origin develop
# Automático via CI/CD
```

### Production

```bash
git push origin main
# Automático via CI/CD com aprovação manual
```

## Recursos Úteis

- [Documentação tRPC](https://trpc.io)
- [Documentação Drizzle](https://orm.drizzle.team)
- [Documentação React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zod Validation](https://zod.dev)

## Contatos

- **Tech Lead**: @tech_lead
- **Security Team**: @security_team
- **DevOps**: @devops_team

## Próximos Passos

1. Completar este onboarding
2. Revisar `ARCHITECTURE.md` para entender design
3. Fazer uma pequena contribuição (bug fix ou feature)
4. Participar de code review
5. Apresentar-se ao time em reunião semanal

Bem-vindo ao time! 🚀
