# Recovery Guide - Evolumix 360 Technical Copilot
## Como Recuperar Acesso em Caso de Emergência

**Autor:** Caio Alencar  
**Data:** 30 de Maio de 2026  
**Versão:** 1.0.0  
**Objetivo:** Permitir recuperação total sem depender de ninguém

---

## 🚨 Cenários de Emergência

### Cenário 1: Perdi Acesso ao Manus
**Problema:** Não consigo mais acessar a plataforma em `evolucopil-pk69zyag.manus.space`

**Solução:** Rodar localmente (veja SETUP_LOCAL.md)

---

### Cenário 2: Perdi o Código-Fonte
**Problema:** Deletei os arquivos localmente

**Solução:** Clonar do GitHub

---

### Cenário 3: Banco de Dados Corrompido
**Problema:** Dados foram perdidos ou corrompidos

**Solução:** Restaurar de backup

---

### Cenário 4: Esqueci a Senha do Banco de Dados
**Problema:** Não consigo conectar ao MySQL

**Solução:** Resetar senha

---

### Cenário 5: Servidor Travou
**Problema:** Aplicação não responde

**Solução:** Reiniciar e diagnosticar

---

## 🔄 Recuperação Passo-a-Passo

### Cenário 1: Perdi Acesso ao Manus

#### Passo 1: Clonar Código do GitHub

```bash
# Abra terminal/prompt de comando

# Vá para um diretório seguro
cd ~/Desktop
# ou
cd C:\Users\SeuUsuario\Desktop

# Clone o repositório
git clone https://github.com/Alencar-Caio/evolumix-360-copilot.git
cd evolumix-360-copilot
```

#### Passo 2: Instalar Dependências

```bash
# Instale dependências
pnpm install

# Se não tiver pnpm
npm install -g pnpm
pnpm install
```

#### Passo 3: Configurar Banco de Dados Local

```bash
# Crie banco de dados
mysql -u root -p

# Execute:
CREATE DATABASE evolumix_360;
CREATE USER 'evolumix'@'localhost' IDENTIFIED BY 'evolumix123';
GRANT ALL PRIVILEGES ON evolumix_360.* TO 'evolumix'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Passo 4: Criar .env.local

```bash
# Crie arquivo .env.local no diretório raiz
# Copie conteúdo de SETUP_LOCAL.md (seção "Configurar Variáveis de Ambiente")
```

#### Passo 5: Rodar Localmente

```bash
# Gere e aplique migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Inicie o servidor
pnpm dev

# Acesse em http://localhost:3000
```

---

### Cenário 2: Perdi o Código-Fonte

#### Passo 1: Clonar do GitHub

```bash
# Se deletou a pasta inteira
git clone https://github.com/Alencar-Caio/evolumix-360-copilot.git

# Se apenas alguns arquivos foram deletados
cd evolumix-360-copilot
git checkout .
```

#### Passo 2: Verificar Integridade

```bash
# Verifique se todos os arquivos estão lá
ls -la

# Deve listar:
# - client/
# - server/
# - drizzle/
# - package.json
# - README.md
# - etc
```

#### Passo 3: Reinstalar Dependências

```bash
# Se tiver dúvida, reinstale tudo
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

### Cenário 3: Banco de Dados Corrompido

#### Opção A: Restaurar de Backup

```bash
# Se você fez backup regularmente
mysql -u evolumix -p evolumix_360 < backup.sql

# Se não tiver backup, vá para Opção B
```

#### Opção B: Recriar do Zero

```bash
# 1. Delete o banco antigo
mysql -u root -p
# Execute:
DROP DATABASE evolumix_360;
EXIT;

# 2. Crie novo banco
mysql -u root -p
# Execute:
CREATE DATABASE evolumix_360;
CREATE USER 'evolumix'@'localhost' IDENTIFIED BY 'evolumix123';
GRANT ALL PRIVILEGES ON evolumix_360.* TO 'evolumix'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 3. Aplique migrations
pnpm drizzle-kit migrate

# 4. Inicie servidor (dados estarão vazios)
pnpm dev
```

#### Opção C: Fazer Backup Regularmente

```bash
# Crie script de backup (backup.sh no Linux/macOS)
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mysqldump -u evolumix -p'evolumix123' evolumix_360 > backup_$TIMESTAMP.sql
echo "Backup criado: backup_$TIMESTAMP.sql"

# Execute regularmente (cron job)
# Adicione a crontab:
# 0 2 * * * /path/to/backup.sh

# Windows: Use Task Scheduler
# Crie arquivo backup.bat:
@echo off
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
mysqldump -u evolumix -p'evolumix123' evolumix_360 > backup_%mydate%_%mytime%.sql
```

---

### Cenário 4: Esqueci Senha do Banco de Dados

#### Windows

```powershell
# 1. Abra Services (services.msc)
# 2. Procure por "MySQL80" ou "MySQL"
# 3. Clique direito → "Stop"
# 4. Abra PowerShell como Admin
# 5. Execute:
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
mysqld --skip-grant-tables

# 6. Em outro PowerShell, execute:
mysql -u root
# Execute:
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'nova-senha';
EXIT;

# 7. Reinicie MySQL normalmente
```

#### macOS

```bash
# 1. Pare MySQL
brew services stop mysql

# 2. Inicie sem validação de senha
mysqld_safe --skip-grant-tables &

# 3. Conecte como root
mysql -u root

# 4. Execute:
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'nova-senha';
EXIT;

# 5. Reinicie MySQL
brew services start mysql
```

#### Linux

```bash
# 1. Pare MySQL
sudo systemctl stop mysql

# 2. Inicie sem validação
sudo mysqld_safe --skip-grant-tables &

# 3. Conecte como root
mysql -u root

# 4. Execute:
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'nova-senha';
EXIT;

# 5. Reinicie MySQL
sudo systemctl start mysql
```

---

### Cenário 5: Servidor Travou

#### Passo 1: Identifique o Problema

```bash
# Verifique se o servidor está rodando
curl http://localhost:3000

# Se não responder, continue para Passo 2
```

#### Passo 2: Mate o Processo

**Windows:**
```powershell
# Encontre o processo
netstat -ano | findstr :3000

# Mate o processo (XXXX é o PID)
taskkill /PID XXXX /F
```

**macOS/Linux:**
```bash
# Encontre o processo
lsof -i :3000

# Mate o processo
kill -9 XXXX
```

#### Passo 3: Verifique Logs

```bash
# Se o servidor deixou logs
tail -100 server.log

# Procure por erros (linhas vermelhas)
```

#### Passo 4: Reinicie

```bash
# Inicie novamente
pnpm dev

# Se ainda não funcionar, vá para Troubleshooting.md
```

---

## 🔐 Backup e Restauração

### Fazer Backup Automático

#### Linux/macOS

```bash
# Crie arquivo: backup.sh
#!/bin/bash

BACKUP_DIR="$HOME/evolumix-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Crie diretório se não existir
mkdir -p $BACKUP_DIR

# Backup do banco de dados
mysqldump -u evolumix -p'evolumix123' evolumix_360 > $BACKUP_DIR/db_$TIMESTAMP.sql

# Backup do código
tar -czf $BACKUP_DIR/code_$TIMESTAMP.tar.gz ~/evolumix-360-copilot

# Mantenha apenas últimos 30 dias
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup criado: $TIMESTAMP"

# Adicione a crontab (roda todo dia às 2 da manhã)
# crontab -e
# 0 2 * * * /path/to/backup.sh
```

#### Windows

```batch
@echo off
REM Crie arquivo: backup.bat

setlocal enabledelayedexpansion
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)

set BACKUP_DIR=C:\evolumix-backups
if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

REM Backup do banco
mysqldump -u evolumix -p'evolumix123' evolumix_360 > %BACKUP_DIR%\db_%mydate%_%mytime%.sql

REM Backup do código
powershell -Command "Compress-Archive -Path C:\Users\SeuUsuario\evolumix-360-copilot -DestinationPath %BACKUP_DIR%\code_%mydate%_%mytime%.zip"

echo Backup criado: %mydate%_%mytime%

REM Adicione a Task Scheduler (Windows)
REM 1. Abra Task Scheduler
REM 2. Crie nova tarefa
REM 3. Defina para rodar backup.bat todo dia às 2 da manhã
```

### Restaurar de Backup

```bash
# Restaurar banco de dados
mysql -u evolumix -p evolumix_360 < db_20260530_020000.sql

# Restaurar código
tar -xzf code_20260530_020000.tar.gz -C ~/

# Ou no Windows
Expand-Archive -Path code_20260530_020000.zip -DestinationPath C:\Users\SeuUsuario\
```

---

## 📋 Checklist de Segurança

### Fazer Regularmente

- [ ] **Semanal:** Backup do banco de dados
- [ ] **Semanal:** Backup do código
- [ ] **Mensal:** Teste restauração de backup
- [ ] **Mensal:** Verifique se GitHub está sincronizado
- [ ] **Trimestral:** Revise permissões de acesso

### Fazer Uma Vez

- [ ] Configurar backup automático
- [ ] Documentar senhas em local seguro (1Password, LastPass)
- [ ] Criar conta de emergência no GitHub
- [ ] Testar recovery completo
- [ ] Documentar todos os serviços (MySQL, Node.js, etc)

---

## 🆘 Emergência Total: Começar do Zero

Se tudo falhar, você pode começar do zero:

```bash
# 1. Clone código do GitHub
git clone https://github.com/Alencar-Caio/evolumix-360-copilot.git

# 2. Siga SETUP_LOCAL.md completamente

# 3. Você terá:
# - Código completo
# - Banco de dados vazio
# - Servidor rodando
# - Pronto para usar

# 4. Se tiver backup, restaure dados:
mysql -u evolumix -p evolumix_360 < backup.sql
```

---

## 📞 Contatos de Emergência

### Recursos Técnicos

1. **GitHub:** https://github.com/Alencar-Caio/evolumix-360-copilot
2. **Documentação:** Veja arquivos .md neste repositório
3. **Stack Overflow:** https://stackoverflow.com (procure por seu erro)

### Suporte Profissional

Se precisar de ajuda profissional:

1. **GitHub Copilot:** Instale em VS Code
2. **Comunidades:** Discord, Reddit, Stack Overflow
3. **Consultores:** Procure por desenvolvedores Node.js/React

---

## 🎯 Resumo: Você Está Seguro

**Você tem:**
- ✅ Código no GitHub (backup permanente)
- ✅ Documentação completa (SETUP_LOCAL.md)
- ✅ Guia de troubleshooting (TROUBLESHOOTING.md)
- ✅ Guia de recuperação (este arquivo)
- ✅ Capacidade de rodar localmente
- ✅ Capacidade de fazer backup

**Você NÃO depende de:**
- ❌ Manus (pode rodar localmente)
- ❌ Ninguém (tem documentação completa)
- ❌ Internet (pode rodar offline)
- ❌ Suporte externo (pode resolver sozinho)

**Você está 100% independente! 🎉**

---

**Última Atualização:** 30 de Maio de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para Emergências
