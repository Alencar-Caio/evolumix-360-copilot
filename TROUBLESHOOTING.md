# Troubleshooting - Evolumix 360 Technical Copilot
## Soluções para Problemas Comuns

**Autor:** Caio Alencar  
**Data:** 30 de Maio de 2026  
**Versão:** 1.0.0  
**Objetivo:** Resolver 95% dos problemas sem precisar de suporte

---

## 🔍 Como Usar Este Guia

1. **Procure seu erro** na seção correspondente
2. **Leia a causa** para entender o problema
3. **Siga a solução** passo-a-passo
4. **Verifique** se funcionou
5. **Se não funcionar**, tente a próxima solução

---

## 📋 Índice de Problemas

1. [Problemas de Instalação](#problemas-de-instalação)
2. [Problemas de Banco de Dados](#problemas-de-banco-de-dados)
3. [Problemas de Servidor](#problemas-de-servidor)
4. [Problemas de Frontend](#problemas-de-frontend)
5. [Problemas de Autenticação](#problemas-de-autenticação)
6. [Problemas de Performance](#problemas-de-performance)
7. [Problemas de Deployment](#problemas-de-deployment)

---

## 🛠️ Problemas de Instalação

### ❌ Erro: "npm: command not found"

**Causa:** Node.js não está instalado

**Solução:**
```bash
# 1. Baixe Node.js
# Windows/macOS: https://nodejs.org/
# Linux: sudo apt-get install nodejs npm

# 2. Verifique instalação
node --version
npm --version

# 3. Instale pnpm
npm install -g pnpm

# 4. Verifique pnpm
pnpm --version
```

---

### ❌ Erro: "pnpm: command not found"

**Causa:** pnpm não está instalado globalmente

**Solução:**
```bash
# Instale pnpm globalmente
npm install -g pnpm

# Verifique
pnpm --version

# Se ainda não funcionar, use npm diretamente
npm install
npm run dev
```

---

### ❌ Erro: "Cannot find module 'react'"

**Causa:** Dependências não foram instaladas

**Solução:**
```bash
# 1. Limpe cache
pnpm store prune

# 2. Reinstale tudo
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 3. Se ainda não funcionar, tente:
pnpm install --force
```

---

### ❌ Erro: "EACCES: permission denied"

**Causa:** Sem permissão para instalar globalmente

**Solução (macOS/Linux):**
```bash
# Opção 1: Use sudo
sudo pnpm install -g pnpm

# Opção 2: Configure npm para não precisar sudo
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

---

### ❌ Erro: "Git not found"

**Causa:** Git não está instalado

**Solução:**
```bash
# Windows: https://git-scm.com/download/win
# macOS: brew install git
# Linux: sudo apt-get install git

# Verifique
git --version
```

---

## 🗄️ Problemas de Banco de Dados

### ❌ Erro: "ECONNREFUSED 127.0.0.1:3306"

**Causa:** MySQL não está rodando

**Solução:**

**Windows:**
```powershell
# 1. Abra Services (services.msc)
# 2. Procure por "MySQL80" ou "MySQL"
# 3. Clique direito → "Start"
# 4. Verifique se está rodando
```

**macOS:**
```bash
# 1. Inicie MySQL
brew services start mysql

# 2. Verifique status
brew services list | grep mysql

# 3. Se não funcionar, reinstale
brew reinstall mysql
```

**Linux:**
```bash
# 1. Inicie MySQL
sudo systemctl start mysql

# 2. Verifique status
sudo systemctl status mysql

# 3. Se não funcionar, reinstale
sudo apt-get install --reinstall mysql-server
```

---

### ❌ Erro: "Access denied for user 'evolumix'@'localhost'"

**Causa:** Senha do MySQL está errada

**Solução:**
```bash
# 1. Conecte como root
mysql -u root -p

# 2. Digite a senha do root (padrão: vazio, só pressione Enter)

# 3. Execute no MySQL prompt:
ALTER USER 'evolumix'@'localhost' IDENTIFIED BY 'evolumix123';
FLUSH PRIVILEGES;
EXIT;

# 4. Teste a nova conexão
mysql -u evolumix -p evolumix_360
# Digite: evolumix123
```

---

### ❌ Erro: "Unknown database 'evolumix_360'"

**Causa:** Banco de dados não foi criado

**Solução:**
```bash
# 1. Conecte ao MySQL como root
mysql -u root -p

# 2. Execute:
CREATE DATABASE evolumix_360;
CREATE USER 'evolumix'@'localhost' IDENTIFIED BY 'evolumix123';
GRANT ALL PRIVILEGES ON evolumix_360.* TO 'evolumix'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 3. Verifique
mysql -u evolumix -p evolumix_360
# Deve conectar sem erro
```

---

### ❌ Erro: "Table 'evolumix_360.users' doesn't exist"

**Causa:** Migrations não foram executadas

**Solução:**
```bash
# 1. Gere as migrations
pnpm drizzle-kit generate

# 2. Aplique as migrations
pnpm drizzle-kit migrate

# 3. Verifique as tabelas
mysql -u evolumix -p evolumix_360
# Execute: SHOW TABLES;
# Deve listar: users, documents, queries, etc.
```

---

### ❌ Erro: "Duplicate entry '1' for key 'PRIMARY'"

**Causa:** Tentou inserir ID duplicado

**Solução:**
```bash
# 1. Limpe a tabela (cuidado!)
mysql -u evolumix -p evolumix_360
# Execute: DELETE FROM users;
# Execute: ALTER TABLE users AUTO_INCREMENT = 1;

# 2. Ou resete o banco inteiro
# Execute: DROP DATABASE evolumix_360;
# Execute: CREATE DATABASE evolumix_360;
# Depois rode as migrations novamente
```

---

## 🖥️ Problemas de Servidor

### ❌ Erro: "Port 3000 is already in use"

**Causa:** Outra aplicação está usando a porta 3000

**Solução:**

**Windows:**
```powershell
# 1. Encontre o processo
netstat -ano | findstr :3000

# 2. Mate o processo (XXXX é o PID)
taskkill /PID XXXX /F

# 3. Ou use outra porta
# Edite server/_core/index.ts:
# const PORT = 3001;
```

**macOS/Linux:**
```bash
# 1. Encontre o processo
lsof -i :3000

# 2. Mate o processo
kill -9 XXXX

# 3. Ou use outra porta
# Edite server/_core/index.ts:
# const PORT = 3001;
```

---

### ❌ Erro: "Cannot find module 'express'"

**Causa:** Dependências não instaladas

**Solução:**
```bash
# Reinstale dependências
pnpm install

# Se ainda não funcionar
pnpm install --force
```

---

### ❌ Erro: "ENOENT: no such file or directory"

**Causa:** Arquivo ou pasta não existe

**Solução:**
```bash
# 1. Verifique se está no diretório correto
pwd
# Deve mostrar: .../evolumix-360-copilot

# 2. Verifique se os arquivos existem
ls -la
# Deve listar: client/, server/, drizzle/, package.json, etc.

# 3. Se não existir, clone novamente
git clone https://github.com/Alencar-Caio/evolumix-360-copilot.git
```

---

### ❌ Erro: "TypeError: Cannot read property 'query' of undefined"

**Causa:** Banco de dados não conectou

**Solução:**
```bash
# 1. Verifique .env.local
cat .env.local | grep DATABASE_URL

# 2. Verifique se MySQL está rodando
# (veja "ECONNREFUSED" acima)

# 3. Verifique se o banco existe
mysql -u evolumix -p evolumix_360

# 4. Reinicie o servidor
# Ctrl + C para parar
pnpm dev
```

---

### ❌ Erro: "Error: GROQ_API_KEY is not set"

**Causa:** Chave Groq não foi configurada

**Solução:**
```bash
# 1. Obtenha chave em: https://console.groq.com/keys

# 2. Adicione em .env.local
GROQ_API_KEY="sua-chave-aqui"

# 3. Reinicie o servidor
# Ctrl + C
pnpm dev
```

---

### ❌ Erro: "Error: connect ECONNREFUSED 127.0.0.1:5432"

**Causa:** Tentando conectar em PostgreSQL (não MySQL)

**Solução:**
```bash
# Verifique DATABASE_URL em .env.local
# Deve ser: mysql://...
# NÃO: postgresql://...

# Corrija para MySQL
DATABASE_URL="mysql://evolumix:evolumix123@localhost:3306/evolumix_360"
```

---

## 🎨 Problemas de Frontend

### ❌ Erro: "Module not found: Can't resolve 'react'"

**Causa:** React não foi instalado

**Solução:**
```bash
# Reinstale dependências
pnpm install

# Se ainda não funcionar
rm -rf node_modules pnpm-lock.yaml
pnpm install --force
```

---

### ❌ Erro: "Unexpected token '<' in JSON"

**Causa:** Servidor retornando HTML em vez de JSON

**Solução:**
```bash
# 1. Verifique se o servidor está rodando
# Deve ver: "Server running on http://localhost:3000/"

# 2. Verifique se há erros no servidor
# Procure por linhas vermelhas no terminal

# 3. Reinicie o servidor
# Ctrl + C
pnpm dev
```

---

### ❌ Erro: "Blank page / Nothing loads"

**Causa:** Frontend não conecta ao backend

**Solução:**
```bash
# 1. Abra DevTools (F12)
# 2. Vá para "Console"
# 3. Procure por erros vermelhos
# 4. Verifique se o servidor está rodando:
curl http://localhost:3000/api/trpc/auth.me

# 5. Se não responder, reinicie
# Ctrl + C
pnpm dev
```

---

### ❌ Erro: "Tailwind CSS not working"

**Causa:** Estilos não foram compilados

**Solução:**
```bash
# 1. Verifique se tailwind.config.js existe
ls -la tailwind.config.js

# 2. Limpe cache
rm -rf .next dist

# 3. Reinicie o servidor
# Ctrl + C
pnpm dev

# 4. Se ainda não funcionar, reinstale Tailwind
pnpm install tailwindcss postcss autoprefixer
```

---

### ❌ Erro: "CORS error / Cross-Origin Request Blocked"

**Causa:** Frontend e backend em portas diferentes

**Solução:**
```bash
# 1. Verifique se ambos estão rodando na mesma porta
# Frontend: http://localhost:3000
# Backend: http://localhost:3000

# 2. Se estiverem em portas diferentes, configure CORS
# Edite: server/_core/index.ts
# Adicione:
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

# 3. Reinicie o servidor
```

---

## 🔐 Problemas de Autenticação

### ❌ Erro: "OAuth callback failed"

**Causa:** Configuração OAuth incorreta

**Solução:**
```bash
# 1. Verifique .env.local
cat .env.local | grep OAUTH

# 2. Para desenvolvimento local, deixe em branco:
VITE_APP_ID=""
OAUTH_SERVER_URL="https://api.manus.im"

# 3. Reinicie o servidor
# Ctrl + C
pnpm dev
```

---

### ❌ Erro: "Session cookie not found"

**Causa:** Cookies não estão sendo salvos

**Solução:**
```bash
# 1. Abra DevTools (F12)
# 2. Vá para "Application" → "Cookies"
# 3. Procure por cookie com nome contendo "session"
# 4. Se não existir, verifique se HTTPS está ativo

# 5. Para desenvolvimento local, desabilite HTTPS check:
# Edite: server/_core/cookies.ts
# Procure por: secure: true
# Mude para: secure: false
```

---

### ❌ Erro: "User not authenticated"

**Causa:** Usuário não fez login

**Solução:**
```bash
# 1. Clique em "Entrar" no canto superior direito
# 2. Faça login com suas credenciais
# 3. Se não tiver conta, crie uma

# 4. Se o botão de login não aparecer:
# Abra DevTools (F12) → Console
# Execute: console.log(localStorage)
# Procure por "auth" ou "session"
```

---

## ⚡ Problemas de Performance

### ❌ Problema: "Página carrega muito lentamente"

**Causa:** Múltiplas razões possíveis

**Solução:**
```bash
# 1. Verifique se o servidor está rodando
# Deve ver "Server running on..." no terminal

# 2. Verifique conexão de internet
# Teste: ping google.com

# 3. Verifique se MySQL está rápido
# Execute no MySQL:
SELECT COUNT(*) FROM users;
# Deve ser instantâneo

# 4. Verifique se há muitos dados
# Se houver 1M+ registros, adicione índices

# 5. Limpe cache do navegador
# DevTools (F12) → Network → "Disable cache"
# Recarregue a página
```

---

### ❌ Problema: "Servidor trava / Não responde"

**Causa:** Processo travou ou memória cheia

**Solução:**
```bash
# 1. Mate o processo
# Ctrl + C

# 2. Verifique memória disponível
# Windows: Task Manager
# macOS: Activity Monitor
# Linux: free -h

# 3. Se memória está cheia, feche outras aplicações

# 4. Reinicie o servidor
pnpm dev
```

---

### ❌ Problema: "Banco de dados lento"

**Causa:** Queries sem índices ou muitos dados

**Solução:**
```bash
# 1. Verifique índices
mysql -u evolumix -p evolumix_360
# Execute: SHOW INDEXES FROM users;

# 2. Adicione índices se necessário
# Edite: drizzle/schema.ts
# Adicione: .index()

# 3. Analise queries lentas
# Execute: SET GLOBAL slow_query_log = 'ON';

# 4. Limpe dados antigos
# Execute: DELETE FROM queries WHERE createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

---

## 🚀 Problemas de Deployment

### ❌ Erro: "Build failed"

**Causa:** Erros no código durante build

**Solução:**
```bash
# 1. Verifique erros TypeScript
pnpm check

# 2. Corrija os erros mostrados

# 3. Tente build novamente
pnpm build

# 4. Se ainda não funcionar, verifique:
# - Imports incorretos
# - Tipos faltando
# - Módulos não instalados
```

---

### ❌ Erro: "Railway deployment failed"

**Causa:** Variáveis de ambiente não configuradas

**Solução:**
```bash
# 1. No painel Railway, vá para "Variables"
# 2. Adicione todas as variáveis de .env.local:
DATABASE_URL=...
JWT_SECRET=...
GROQ_API_KEY=...
# etc

# 3. Clique "Deploy"
# 4. Aguarde 5-10 minutos
```

---

### ❌ Erro: "Cannot connect to database in production"

**Causa:** DATABASE_URL incorreta

**Solução:**
```bash
# 1. Verifique DATABASE_URL em Railway
# Deve ser: mysql://user:pass@host:port/database

# 2. Teste a conexão localmente
mysql -u user -p database -h host

# 3. Se não conectar, recrie o banco no Railway
# 4. Copie a nova DATABASE_URL
# 5. Atualize em Railway → Variables
```

---

## 📞 Se Nada Funcionar

### Última Opção: Reset Completo

```bash
# 1. Limpe tudo
rm -rf node_modules pnpm-lock.yaml .env.local dist

# 2. Reinstale do zero
pnpm install

# 3. Recrie .env.local (veja SETUP_LOCAL.md)

# 4. Resete o banco
# Conecte ao MySQL e execute:
DROP DATABASE evolumix_360;
CREATE DATABASE evolumix_360;

# 5. Rode migrations novamente
pnpm drizzle-kit migrate

# 6. Inicie o servidor
pnpm dev
```

---

## 🆘 Precisa de Ajuda Profissional?

### Recursos

1. **GitHub Copilot:**
   - Abra VS Code
   - Instale extensão "GitHub Copilot"
   - Faça perguntas sobre o erro

2. **Stack Overflow:**
   - Procure por seu erro
   - Geralmente alguém já resolveu

3. **Documentação Oficial:**
   - Node.js: https://nodejs.org/docs
   - React: https://react.dev
   - MySQL: https://dev.mysql.com/doc
   - Groq: https://console.groq.com/docs

4. **Comunidades:**
   - Reddit: r/node, r/typescript, r/react
   - Discord: Node.js, React, TypeScript communities

---

## 📝 Reportar Bugs

Se encontrar um bug não listado aqui:

1. **Reproduza o erro** com passos claros
2. **Copie a mensagem de erro** completa
3. **Verifique logs:**
   ```bash
   # Frontend (DevTools)
   F12 → Console → Copie erro
   
   # Backend (Terminal)
   Copie linhas vermelhas
   ```
4. **Crie issue no GitHub:**
   - https://github.com/Alencar-Caio/evolumix-360-copilot/issues

---

**Última Atualização:** 30 de Maio de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para Uso
