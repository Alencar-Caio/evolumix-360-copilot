# Guia de Deployment - Evolumix 360 Technical Copilot

## 📋 Índice
1. [Exportar Código-Fonte](#exportar-código-fonte)
2. [Plataformas FREE Recomendadas](#plataformas-free-recomendadas)
3. [Setup Local](#setup-local)
4. [Deployment em Railway](#deployment-em-railway)
5. [Deployment em Render](#deployment-em-render)
6. [Deployment em Vercel + Backend Separado](#deployment-em-vercel--backend-separado)

---

## 🔄 Exportar Código-Fonte

### Opção 1: Via GitHub (Recomendado)
1. No painel Manus, vá para **Settings → GitHub**
2. Clique em "Export to GitHub"
3. Selecione o repositório ou crie um novo
4. Seu código será sincronizado com GitHub

### Opção 2: Download Manual
```bash
# Clone o repositório do seu projeto
git clone https://github.com/seu-usuario/evolumix-360-copilot.git
cd evolumix-360-copilot
```

---

## 🌐 Plataformas FREE Recomendadas

### Para Este Projeto (Stack: React + Node.js + MySQL)

| Plataforma | Backend | Frontend | Banco de Dados | Limite Free | Recomendação |
|-----------|---------|----------|---|---|---|
| **Railway** | ✅ Node.js | ✅ React | ✅ MySQL | $5/mês crédito | ⭐⭐⭐ MELHOR |
| **Render** | ✅ Node.js | ✅ React | ✅ PostgreSQL | Sim (com limitações) | ⭐⭐ BOA |
| **Vercel** | ❌ (serverless) | ✅ React | ❌ | Sim | ⭐ Frontend Only |
| **Heroku** | ✅ Node.js | ✅ React | ✅ PostgreSQL | ❌ (descontinuado) | ❌ NÃO |

### 🏆 Recomendação: **Railway**

**Por quê Railway é ideal para você:**
- ✅ Suporta Node.js + React + MySQL (stack completo)
- ✅ $5/mês de crédito free (suficiente para começar)
- ✅ Deploy automático via GitHub
- ✅ Escalável (pague conforme cresce)
- ✅ Melhor UX para iniciantes
- ✅ Suporte a variáveis de ambiente

---

## 💻 Setup Local

### Pré-requisitos
- Node.js 22+ (https://nodejs.org)
- pnpm (https://pnpm.io)
- MySQL 8+ ou MariaDB (https://www.mysql.com)
- Git (https://git-scm.com)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/evolumix-360-copilot.git
cd evolumix-360-copilot

# 2. Instale dependências
pnpm install

# 3. Configure variáveis de ambiente
cp .env.example .env.local

# 4. Configure o banco de dados
# Edite .env.local com suas credenciais MySQL:
# DATABASE_URL=mysql://usuario:senha@localhost:3306/evolumix_360

# 5. Execute migrações
pnpm drizzle-kit migrate

# 6. Inicie o servidor de desenvolvimento
pnpm dev

# 7. Acesse http://localhost:5173
```

### Arquivo `.env.local` (Exemplo)
```env
# Banco de Dados
DATABASE_URL=mysql://root:password@localhost:3306/evolumix_360

# OAuth Manus (obtenha em https://manus.im)
VITE_APP_ID=seu_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# JWT
JWT_SECRET=sua_chave_secreta_aleatoria_aqui

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua_chave_api

# Groq LLM
GROQ_API_KEY=sua_chave_groq

# S3 (opcional, para armazenamento de documentos)
AWS_ACCESS_KEY_ID=sua_chave
AWS_SECRET_ACCESS_KEY=sua_secreta
AWS_REGION=us-east-1
AWS_S3_BUCKET=seu-bucket
```

---

## 🚀 Deployment em Railway

### Passo 1: Criar Conta Railway
1. Acesse https://railway.app
2. Clique em "Start Project"
3. Faça login com GitHub

### Passo 2: Conectar Repositório GitHub
1. Clique em "Deploy from GitHub"
2. Selecione seu repositório `evolumix-360-copilot`
3. Railway detectará automaticamente que é um projeto Node.js

### Passo 3: Configurar Banco de Dados
1. No dashboard Railway, clique em "Add Service"
2. Selecione "MySQL"
3. Railway criará um banco de dados automaticamente
4. Copie a `DATABASE_URL` gerada

### Passo 4: Configurar Variáveis de Ambiente
1. No projeto Railway, vá para "Variables"
2. Adicione todas as variáveis do `.env.local`:
   - `DATABASE_URL` (copiada do MySQL)
   - `VITE_APP_ID`
   - `OAUTH_SERVER_URL`
   - `JWT_SECRET`
   - `BUILT_IN_FORGE_API_KEY`
   - `GROQ_API_KEY`
   - Etc.

### Passo 5: Deploy
1. Railway fará deploy automático quando você fizer push para GitHub
2. Acesse seu domínio Railway (algo como `seu-projeto.railway.app`)

### Passo 6: Executar Migrações
```bash
# No dashboard Railway, abra o terminal do projeto
pnpm drizzle-kit migrate
```

---

## 🎨 Deployment em Render

### Passo 1: Criar Conta Render
1. Acesse https://render.com
2. Clique em "Get Started"
3. Faça login com GitHub

### Passo 2: Criar Web Service
1. Clique em "New +"
2. Selecione "Web Service"
3. Conecte seu repositório GitHub

### Passo 3: Configurar Build
```
Build Command: pnpm install && pnpm build
Start Command: pnpm start
```

### Passo 4: Adicionar Banco de Dados
1. Clique em "New +"
2. Selecione "PostgreSQL"
3. Copie a connection string

### Passo 5: Configurar Variáveis
Adicione todas as variáveis de ambiente no painel Render

### Passo 6: Deploy
Render fará deploy automático

---

## 🔗 Deployment em Vercel + Backend Separado

**Nota:** Vercel é apenas para frontend (React). Para backend, use Railway ou Render.

### Frontend em Vercel

```bash
# 1. Instale Vercel CLI
npm i -g vercel

# 2. Deploy
vercel
```

### Backend em Railway (veja seção acima)

### Conectar Frontend ao Backend
Edite `client/src/lib/trpc.ts`:

```typescript
const baseUrl = process.env.VITE_API_URL || 'https://seu-backend.railway.app';
```

---

## 🔐 Segurança em Produção

### Checklist de Segurança
- [ ] Todas as variáveis de ambiente estão configuradas
- [ ] `JWT_SECRET` é uma string aleatória forte (mínimo 32 caracteres)
- [ ] Banco de dados tem backup automático ativado
- [ ] CORS está configurado corretamente
- [ ] SSL/HTTPS está ativado (automático em Railway/Render)
- [ ] Rate limiting está ativado
- [ ] Logs estão sendo monitorados

### Gerar JWT_SECRET Seguro
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📊 Monitoramento em Produção

### Railway
- Dashboard automático com logs
- Alertas de erro
- Métricas de CPU/RAM

### Render
- Logs em tempo real
- Alertas de falha
- Métricas de performance

---

## 🐛 Troubleshooting

### Erro: "DATABASE_URL not found"
- Verifique se a variável está configurada no painel da plataforma
- Reinicie o serviço

### Erro: "Cannot find module"
- Execute `pnpm install` novamente
- Limpe cache: `pnpm store prune`

### Erro: "Port already in use"
- Mude a porta em `server/_core/index.ts`
- Ou use: `PORT=3001 pnpm dev`

### Erro: "CORS error"
- Verifique `server/_core/index.ts` para CORS config
- Adicione seu domínio à whitelist

---

## 📞 Suporte

- **Documentação Evolumix:** Veja `GUIA_COMPLETO.md`
- **Railway Support:** https://railway.app/support
- **Render Support:** https://render.com/docs
- **Vercel Support:** https://vercel.com/docs

---

## ✅ Próximos Passos

1. Escolha uma plataforma (recomendamos Railway)
2. Siga o guia de deployment
3. Configure variáveis de ambiente
4. Teste o fluxo completo (login, chat, diagnóstico)
5. Configure backups automáticos
6. Monitore logs e performance

**Boa sorte! 🚀**
