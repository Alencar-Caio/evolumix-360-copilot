# Referência de Variáveis de Ambiente - Evolumix 360

## 📋 Variáveis Obrigatórias

### Banco de Dados
```
DATABASE_URL=mysql://usuario:senha@host:porta/database
```
- **Descrição:** Connection string do MySQL/TiDB
- **Exemplo:** `mysql://root:password@localhost:3306/evolumix_360`

### Autenticação Manus OAuth
```
VITE_APP_ID=seu_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
JWT_SECRET=sua_chave_secreta_aleatoria
```
- **Obtenha em:** https://manus.im/settings/apps
- **JWT_SECRET:** Gere com: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Manus Built-in APIs
```
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua_chave_api
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=sua_chave_frontend
```

### Groq LLM (para Copiloto de IA)
```
GROQ_API_KEY=sua_chave_groq
```
- **Obtenha em:** https://console.groq.com/keys

---

## 📋 Variáveis Opcionais

### Armazenamento S3
```
AWS_ACCESS_KEY_ID=sua_chave
AWS_SECRET_ACCESS_KEY=sua_secreta
AWS_REGION=us-east-1
AWS_S3_BUCKET=seu-bucket
```

### Configuração da Aplicação
```
OWNER_NAME=Seu Nome
OWNER_OPEN_ID=seu_open_id
VITE_APP_TITLE=Evolumix 360
VITE_APP_LOGO=https://url-da-logo.com/logo.png
```

### Analytics
```
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=seu_id
```

### Configuração do Servidor
```
NODE_ENV=production
PORT=3000
```

---

## 🔧 Como Configurar em Diferentes Plataformas

### Railway
1. Vá para "Variables" no dashboard
2. Clique em "Add Variable"
3. Cole cada variável

### Render
1. Vá para "Environment"
2. Clique em "Add Environment Variable"
3. Cole cada variável

### Vercel
1. Vá para "Settings → Environment Variables"
2. Clique em "Add New"
3. Cole cada variável

### Heroku
```bash
heroku config:set DATABASE_URL=mysql://...
heroku config:set GROQ_API_KEY=...
# etc
```

### Local (.env.local)
```bash
# Crie arquivo .env.local na raiz do projeto
cp .env.example .env.local
# Edite com suas variáveis
```

---

## ✅ Checklist de Setup

- [ ] DATABASE_URL configurada
- [ ] VITE_APP_ID configurada
- [ ] JWT_SECRET configurada (string aleatória forte)
- [ ] GROQ_API_KEY configurada
- [ ] BUILT_IN_FORGE_API_KEY configurada
- [ ] Todas as URLs apontam para endpoints corretos
- [ ] Variáveis testadas localmente antes de deploy

---

## 🔐 Segurança

**NUNCA:**
- ❌ Commit `.env` ou `.env.local` no Git
- ❌ Compartilhe suas chaves de API
- ❌ Use valores de teste em produção
- ❌ Deixe variáveis vazias

**SEMPRE:**
- ✅ Use `.gitignore` para excluir arquivos `.env`
- ✅ Gere JWT_SECRET aleatório e forte
- ✅ Rotacione chaves periodicamente
- ✅ Use variáveis diferentes para dev/prod
