# GitHub Export Guide - Evolumix 360 Technical Copilot

## Overview

Este guia descreve como exportar o projeto Evolumix 360 Technical Copilot para um repositório GitHub, mantendo o histórico completo e configurando CI/CD pipeline.

## Pré-requisitos

- Conta GitHub ativa
- Git instalado localmente
- Acesso ao repositório Manus
- Credenciais de autenticação GitHub (token ou SSH)

## Passos para Exportação

### 1. Preparação do Repositório Local

```bash
cd /home/ubuntu/evolumix-360-copilot

# Verificar status do git
git status

# Verificar histórico de commits
git log --oneline | head -20
```

### 2. Criar Novo Repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Nome do repositório: `evolumix-360-copilot`
3. Descrição: "Technical Copilot with Advanced RAG, Security, and Compliance Features"
4. Visibilidade: Private (recomendado para código proprietário)
5. Não inicialize com README (já existe)
6. Clique em "Create repository"

### 3. Configurar Remote e Push

```bash
# Adicionar remote
git remote add github https://github.com/YOUR_USERNAME/evolumix-360-copilot.git

# Ou usar SSH
git remote add github git@github.com:YOUR_USERNAME/evolumix-360-copilot.git

# Verificar remote
git remote -v

# Push de todos os branches
git push github --all

# Push de tags
git push github --tags
```

### 4. Configurar Proteção de Branch

No GitHub:
1. Vá para Settings → Branches
2. Adicione rule para `main` branch:
   - Require pull request reviews before merging
   - Require status checks to pass
   - Require branches to be up to date before merging

### 5. Configurar CI/CD com GitHub Actions

Criar arquivo `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: evolumix_test
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
        ports:
          - 3306:3306

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '22'
        cache: 'pnpm'
    
    - name: Install pnpm
      run: npm install -g pnpm
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Run TypeScript check
      run: pnpm run type-check
    
    - name: Run tests
      run: pnpm test
      env:
        DATABASE_URL: mysql://root:root@localhost:3306/evolumix_test
    
    - name: Build
      run: pnpm run build
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      if: always()
```

### 6. Configurar Secrets no GitHub

No GitHub Settings → Secrets and variables → Actions:

```
DATABASE_URL=mysql://user:pass@host:3306/db
JWT_SECRET=your_jwt_secret
PINECONE_API_KEY=your_pinecone_key
GROQ_API_KEY=your_groq_key
```

### 7. Configurar Dependabot

No GitHub Settings → Code security and analysis:
- Enable "Dependabot alerts"
- Enable "Dependabot security updates"
- Enable "Dependabot version updates"

Criar `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    reviewers:
      - "owner"
    allow:
      - dependency-type: "all"
```

### 8. Configurar Code Scanning

Criar `.github/workflows/codeql.yml`:

```yaml
name: CodeQL

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 0'

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    
    strategy:
      fail-fast: false
      matrix:
        language: [ 'javascript' ]
    
    steps:
    - name: Checkout repository
      uses: actions/checkout@v3
    
    - name: Initialize CodeQL
      uses: github/codeql-action/init@v2
      with:
        languages: ${{ matrix.language }}
    
    - name: Autobuild
      uses: github/codeql-action/autobuild@v2
    
    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v2
```

### 9. Criar CODEOWNERS

Criar `.github/CODEOWNERS`:

```
# Global owners
* @owner_username

# Specific paths
/server/_core/security/ @security_team
/server/_core/rag/ @rag_team
/client/ @frontend_team
```

### 10. Documentação no README

Atualizar `README.md` com:
- Badges de status (build, coverage, license)
- Instruções de setup
- Arquitetura do projeto
- Guia de contribuição
- Licença

## Verificação Pós-Exportação

```bash
# Verificar que todos os commits foram enviados
git log --oneline | wc -l
git log --oneline --remotes | wc -l

# Verificar tags
git tag | wc -l
git ls-remote github --tags | wc -l

# Verificar branches
git branch -a
git ls-remote github --heads
```

## Troubleshooting

### Erro: "fatal: remote origin already exists"

```bash
git remote remove origin
git remote add github https://github.com/YOUR_USERNAME/evolumix-360-copilot.git
```

### Erro: "fatal: The remote end hung up unexpectedly"

```bash
# Aumentar buffer de git
git config http.postBuffer 524288000

# Tentar push novamente
git push github --all
```

### Erro de Autenticação

```bash
# Usar token de acesso pessoal
git remote set-url github https://YOUR_USERNAME:YOUR_TOKEN@github.com/YOUR_USERNAME/evolumix-360-copilot.git

# Ou configurar SSH
ssh-keygen -t ed25519 -C "your_email@example.com"
# Adicionar chave pública ao GitHub
git remote set-url github git@github.com:YOUR_USERNAME/evolumix-360-copilot.git
```

## Próximos Passos

1. Configurar branch protection rules
2. Configurar auto-deployment para staging/production
3. Adicionar documentação de deployment
4. Configurar monitoring e alertas
5. Estabelecer processo de code review

## Referências

- [GitHub Documentation](https://docs.github.com)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Git Documentation](https://git-scm.com/doc)
