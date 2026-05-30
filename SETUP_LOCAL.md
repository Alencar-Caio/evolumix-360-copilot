# Setup Local - Evolumix 360 Technical Copilot
## Como Rodar a Plataforma no Seu Computador

**Autor:** Caio Alencar  
**Data:** 30 de Maio de 2026  
**Versão:** 1.0.0  
**Objetivo:** Permitir que você rode a plataforma localmente sem depender de ninguém

---

## 📋 Pré-requisitos

### Ferramentas Necessárias

| Ferramenta | Versão | Download | Por quê |
|-----------|--------|----------|---------|
| **Git** | 2.40+ | https://git-scm.com | Clonar repositório |
| **Node.js** | 22.13.0+ | https://nodejs.org | Runtime JavaScript |
| **pnpm** | 9.0+ | https://pnpm.io | Gerenciador de pacotes |
| **MySQL** | 8.0+ | https://dev.mysql.com/downloads/mysql/ | Banco de dados |
| **VS Code** | Latest | https://code.visualstudio.com | Editor (opcional) |

### Conhecimentos Mínimos

- ✅ Usar terminal/prompt de comando
- ✅ Entender variáveis de ambiente
- ✅ Conhecimento básico de Node.js
- ✅ Familiaridade com Git

---

## 🚀 Passo 1: Clonar o Repositório

### Windows (PowerShell)

```powershell
# Abra PowerShell e execute:
git clone https://github.com/Alencar-Caio/evolumix-360-copilot.git
cd evolumix-360-copilot
```

### macOS / Linux (Terminal)

```bash
# Abra Terminal e execute:
git clone https://github.com/Alencar-Caio/evolumix-360-copilot.git
cd evolumix-360-copilot
```

### Verificar Clone

```bash
# Deve listar os arquivos do projeto
ls -la
# Deve mostrar: README.md, package.json, client/, server/, drizzle/, etc.
```

---

## 🛠️ Passo 2: Instalar Dependências

### Instalar pnpm (se não tiver)

```bash
# Windows (PowerShell como Admin)
npm install -g pnpm

# macOS / Linux
sudo npm install -g pnpm
```

### Instalar Dependências do Projeto

```bash
# No diretório do projeto
pnpm install

# Isso vai instalar:
# - React 19
# - Express 4
# - tRPC 11
# - Drizzle ORM
# - Tailwind CSS 4
# - E mais 100+ pacotes
```

**Tempo esperado:** 3-5 minutos

---

## 🗄️ Passo 3: Configurar Banco de Dados

### Opção A: MySQL Local (Recomendado)

#### 1. Instalar MySQL

**Windows:**
- Download: https://dev.mysql.com/downloads/mysql/
- Execute o instalador
- Configure senha do root (ex: `root123`)

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux (Ubuntu):**
```bash
sudo apt-get install mysql-server
sudo systemctl start mysql
```

#### 2. Criar Banco de Dados

```bash
# Conecte ao MySQL
mysql -u root -p

# Digite a senha quando pedir

# Execute no MySQL prompt:
CREATE DATABASE evolumix_360;
CREATE USER 'evolumix'@'localhost' IDENTIFIED BY 'evolumix123';
GRANT ALL PRIVILEGES ON evolumix_360.* TO 'evolumix'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. Verificar Conexão

```bash
# Teste a conexão
mysql -u evolumix -p evolumix_360
# Digite: evolumix123
# Se conectar, digite: EXIT;
```

### Opção B: Docker (Alternativa)

Se preferir usar Docker:

```bash
# Instale Docker: https://www.docker.com/products/docker-desktop

# Execute:
docker run --name evolumix-mysql \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -e MYSQL_DATABASE=evolumix_360 \
  -e MYSQL_USER=evolumix \
  -e MYSQL_PASSWORD=evolumix123 \
  -p 3306:3306 \
  -d mysql:8.0
```

---

## 🔐 Passo 4: Configurar Variáveis de Ambiente

### Criar arquivo `.env.local`

```bash
# No diretório raiz do projeto, crie arquivo: .env.local
# Copie o conteúdo abaixo:
```

**Conteúdo do `.env.local`:**

```env
# ========== DATABASE ==========
DATABASE_URL="mysql://evolumix:evolumix123@localhost:3306/evolumix_360"

# ========== JWT ==========
JWT_SECRET="seu-secret-super-seguro-aqui-minimo-32-caracteres"

# ========== OAUTH (Manus) ==========
# Deixe em branco para desenvolvimento local
VITE_APP_ID=""
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://portal.manus.im"

# ========== LLM (Groq) ==========
# Obtenha em: https://console.groq.com/keys
GROQ_API_KEY="sua-chave-groq-aqui"

# ========== Storage (S3) ==========
# Para desenvolvimento local, deixe em branco
# Será usado storage local em /tmp
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET=""

# ========== Frontend ==========
VITE_APP_TITLE="Evolumix 360 - Local Dev"
VITE_APP_LOGO=""
VITE_FRONTEND_FORGE_API_KEY=""
VITE_FRONTEND_FORGE_API_URL=""
VITE_ANALYTICS_ENDPOINT=""
VITE_ANALYTICS_WEBSITE_ID=""

# ========== Owner Info ==========
OWNER_NAME="Caio Alencar"
OWNER_OPEN_ID="local-dev"

# ========== Built-in APIs ==========
BUILT_IN_FORGE_API_KEY=""
BUILT_IN_FORGE_API_URL=""
```

### Obter Chave Groq (Importante!)

1. Acesse: https://console.groq.com/keys
2. Faça login (crie conta se necessário)
3. Clique em "Create API Key"
4. Copie a chave
5. Cole em `GROQ_API_KEY` no `.env.local`

---

## 📊 Passo 5: Criar Tabelas do Banco de Dados

### Executar Migrations

```bash
# Gere as migrations
pnpm drizzle-kit generate

# Aplique as migrations
pnpm drizzle-kit migrate

# Verifique as tabelas
mysql -u evolumix -p evolumix_360
# Digite: evolumix123
# Execute: SHOW TABLES;
# Deve listar: users, documents, queries, diagnostics, approvals, etc.
# EXIT;
```

---

## ▶️ Passo 6: Rodar a Plataforma

### Iniciar Servidor de Desenvolvimento

```bash
# No diretório do projeto
pnpm dev

# Deve mostrar:
# [OAuth] Initialized with baseURL: https://api.manus.im
# Server running on http://localhost:3000/
```

### Acessar a Plataforma

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3000/api/trpc

### Parar o Servidor

```bash
# Pressione: Ctrl + C
```

---

## 🧪 Passo 7: Rodar Testes

### Executar Testes Unitários

```bash
# Rode todos os testes
pnpm test

# Deve mostrar:
# ✓ server/auth.logout.test.ts (1 test)
# ✓ server/routers/documents.test.ts (9 tests)
# Test Files 2 passed (2)
# Tests 10 passed (10)
```

### Rodar Testes em Watch Mode

```bash
# Testes rodão automaticamente quando você salva arquivos
pnpm test:watch
```

---

## 🏗️ Passo 8: Build para Produção

### Compilar TypeScript

```bash
# Verifica erros de tipo
pnpm check
```

### Build Frontend

```bash
# Cria pasta dist/ com assets otimizados
pnpm build

# Deve criar:
# dist/
#   ├── index.html
#   ├── assets/
#   │   ├── main-xxx.js
#   │   ├── main-xxx.css
#   │   └── ...
```

### Build Backend

```bash
# O backend é compilado automaticamente
# Não precisa fazer nada adicional
```

---

## 🔧 Troubleshooting

### Erro: "Cannot find module 'react'"

**Solução:**
```bash
# Reinstale dependências
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Erro: "ECONNREFUSED 127.0.0.1:3306"

**Significa:** MySQL não está rodando

**Solução:**
```bash
# Windows
# Abra Services (services.msc) e inicie MySQL

# macOS
brew services start mysql

# Linux
sudo systemctl start mysql
```

### Erro: "Access denied for user 'evolumix'"

**Significa:** Senha do MySQL está errada

**Solução:**
```bash
# Verifique a senha em .env.local
# DATABASE_URL="mysql://evolumix:SENHA_AQUI@localhost:3306/evolumix_360"

# Se esqueceu, resete:
mysql -u root -p
# Digite senha do root
# Execute: ALTER USER 'evolumix'@'localhost' IDENTIFIED BY 'evolumix123';
```

### Erro: "Groq API key not found"

**Significa:** Você não configurou a chave Groq

**Solução:**
1. Obtenha chave em: https://console.groq.com/keys
2. Adicione em `.env.local`: `GROQ_API_KEY="sua-chave"`
3. Reinicie o servidor: `pnpm dev`

### Porta 3000 Já Está em Uso

**Solução:**
```bash
# Mude a porta em server/_core/index.ts
# Procure por: const PORT = 3000
# Mude para: const PORT = 3001

# Ou mate o processo que está usando a porta:

# Windows
netstat -ano | findstr :3000
taskkill /PID XXXX /F

# macOS / Linux
lsof -i :3000
kill -9 XXXX
```

---

## 📁 Estrutura de Pastas

```
evolumix-360-copilot/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas principais
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilitários
│   │   └── App.tsx           # Roteamento principal
│   └── index.html            # HTML base
│
├── server/                    # Backend Node.js
│   ├── routers/              # tRPC routers
│   ├── db.ts                 # Funções de banco de dados
│   ├── storage.ts            # S3 helpers
│   └── _core/                # Framework plumbing
│
├── drizzle/                   # Banco de dados
│   ├── schema.ts             # Definição de tabelas
│   └── migrations/           # SQL migrations
│
├── shared/                    # Código compartilhado
│   ├── types.ts              # Tipos TypeScript
│   └── const.ts              # Constantes
│
├── .env.local                 # Variáveis de ambiente (LOCAL)
├── package.json              # Dependências
├── tsconfig.json             # Configuração TypeScript
├── vite.config.ts            # Configuração Vite
└── README.md                 # Este arquivo
```

---

## 🚀 Próximos Passos

### 1. Explorar o Código

```bash
# Abra em VS Code
code .

# Principais arquivos para entender:
# - client/src/App.tsx (roteamento)
# - server/routers.ts (APIs)
# - drizzle/schema.ts (banco de dados)
```

### 2. Fazer Mudanças

```bash
# Exemplo: Adicionar nova página
# 1. Crie: client/src/pages/NovaPage.tsx
# 2. Importe em: client/src/App.tsx
# 3. Adicione rota
# 4. Salve e veja mudança em tempo real (HMR)
```

### 3. Fazer Commit

```bash
# Após fazer mudanças
git add .
git commit -m "feat: descrição da mudança"
git push origin main
```

---

## 💡 Dicas Importantes

### 1. Use TypeScript Strict Mode

```typescript
// ❌ Evite
const data: any = {};

// ✅ Prefira
const data: { name: string; age: number } = { name: "Caio", age: 30 };
```

### 2. Sempre Teste Mudanças

```bash
# Antes de fazer push
pnpm test
pnpm check
```

### 3. Mantenha `.env.local` Seguro

```bash
# NUNCA faça commit de .env.local
# Já está em .gitignore, mas verifique:
cat .gitignore | grep env
```

### 4. Use Git Commits Semânticos

```bash
# ✅ Bom
git commit -m "feat: adicionar filtro de data no dashboard"
git commit -m "fix: corrigir cálculo de ROI"
git commit -m "docs: atualizar README"

# ❌ Evite
git commit -m "mudanças"
git commit -m "fix bug"
```

---

## 🆘 Precisa de Ajuda?

### Recursos

1. **Documentação do Projeto:**
   - `README_PROPRIEDADE_INTELECTUAL.md` - Stack e arquitetura
   - `MANIFESTO_DESENVOLVIMENTO.md` - Visão estratégica
   - `TROUBLESHOOTING.md` - Soluções comuns

2. **Documentação Externa:**
   - React: https://react.dev
   - Node.js: https://nodejs.org/docs
   - MySQL: https://dev.mysql.com/doc
   - Groq: https://console.groq.com/docs

3. **GitHub Copilot:**
   - Abra VS Code
   - Instale extensão "GitHub Copilot"
   - Faça perguntas sobre o código

---

## ✅ Checklist de Setup

- [ ] Git instalado
- [ ] Node.js 22+ instalado
- [ ] pnpm instalado
- [ ] MySQL rodando
- [ ] Repositório clonado
- [ ] Dependências instaladas (`pnpm install`)
- [ ] `.env.local` criado
- [ ] Banco de dados criado
- [ ] Migrations executadas
- [ ] Servidor rodando (`pnpm dev`)
- [ ] Plataforma acessível em http://localhost:3000
- [ ] Testes passando (`pnpm test`)

---

**Parabéns! Você agora pode rodar a plataforma independentemente! 🎉**

**Última Atualização:** 30 de Maio de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para Uso
