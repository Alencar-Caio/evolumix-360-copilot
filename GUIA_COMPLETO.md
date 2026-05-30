# Guia Completo - Evolumix 360 Technical Copilot

## 1. Acesso à Plataforma

### 1.1 URL de Acesso
A plataforma está disponível em: **https://evolucopil-pk69zyag.manus.space**

### 1.2 Autenticação
A plataforma utiliza autenticação OAuth 2.0 do Manus. Ao acessar pela primeira vez, você será redirecionado para o portal de login.

**Passo a passo:**
1. Acesse https://evolucopil-pk69zyag.manus.space
2. Clique em "Entrar com Manus"
3. Faça login com sua conta Manus (email + senha)
4. Você será redirecionado automaticamente para a plataforma
5. Na primeira vez, você será criado como usuário e precisará ser autorizado por um administrador

### 1.3 Autorização de Usuários
Apenas usuários autorizados podem acessar a plataforma. Um administrador deve autorizar cada novo usuário.

**Para autorizar um novo usuário:**
1. Acesse a plataforma como administrador
2. Vá para a página de Gerenciamento de Usuários (/users)
3. Localize o usuário na lista de "Pendentes"
4. Clique em "Autorizar"
5. O usuário poderá acessar a plataforma imediatamente

---

## 2. Usando a Plataforma

### 2.1 Interface Principal
A plataforma possui uma interface de chat conversacional onde você interage com o copiloto técnico.

**Componentes principais:**
- **Chat Central:** Área onde você digita perguntas e recebe respostas do copiloto
- **Painel de Dados:** Mostra dados coletados durante a conversa
- **Histórico:** Todas as conversas são salvas para referência futura
- **Documentos:** Referências técnicas usadas nas respostas

### 2.2 Fluxo Típico de Uso

**Cenário: Analisar operação de limpeza de um cliente**

```
1. Usuário: "Preciso analisar a operação de limpeza do cliente XYZ"
   ↓
2. Copiloto: "Ótimo! Qual é a área em m² que você está analisando?"
   ↓
3. Usuário: "São 5000 m² de área comercial"
   ↓ [Sistema coleta: área = 5000 m²]
   ↓
4. Copiloto: "Entendi. Qual é o fluxo de pessoas por dia?"
   ↓
5. Usuário: "Cerca de 2000 pessoas por dia"
   ↓ [Sistema coleta: fluxo = 2000]
   ↓
6. Copiloto: "E quais produtos vocês usam atualmente?"
   ↓
7. Usuário: "Desinfetante X e detergente Y"
   ↓ [Sistema busca FISPQs de X e Y]
   ↓
8. Copiloto: "Analisando... O produto X tem 15% de concentração ativa..."
   ↓ [Resposta inclui citações de documentos técnicos]
   ↓
9. Usuário: "Qual seria o impacto de trocar?"
   ↓
10. Copiloto: [Gera análise técnica nos 3 pilares: Químico, Higiene, ROI]
    ↓
11. Sistema: [Calcula ROI automaticamente e mostra economia/payback]
    ↓
12. Usuário: "Salvar essa análise"
    ↓
13. Sistema: [Salva diagnóstico com histórico completo]
```

### 2.3 Recursos Principais

#### Chat com IA
O copiloto técnico responde perguntas sobre:
- Análise de cenários de limpeza
- Recomendações de produtos
- Cálculos de eficiência
- Conformidade técnica
- Segurança ocupacional

**Importante:** Toda resposta inclui citações de documentos técnicos (FISPQs, fichas técnicas) para rastreabilidade.

#### Diagnóstico 360º
O sistema gera automaticamente uma análise estruturada em três pilares:

1. **Químico:** Análise técnica dos produtos, compatibilidade, eficácia
2. **Higiene:** Recomendações de protocolos, frequência, cobertura de limpeza
3. **ROI:** Oportunidades de economia, produtos recomendados, payback

#### Calculadora de ROI
Calcula automaticamente:
- Custo atual por litro diluído
- Custo proposto por litro
- Economia mensal e anual
- Payback em meses
- Comparativo antes/depois

As premissas são sempre explícitas e editáveis.

#### Métricas de Qualidade
Cada resposta mostra:
- **Faithfulness Score:** Confiabilidade da resposta (0-100%)
- **Citation Coverage:** Percentual de resposta baseado em documentos
- **Risk Level:** Classificação de risco (baixo, médio, alto, crítico)

---

## 3. Alimentando o RAG com PDFs

### 3.1 O que é RAG?
RAG (Retrieval-Augmented Generation) é um sistema que permite ao copiloto responder perguntas baseado em documentos técnicos específicos da Evolumix.

Quando você insere um PDF (FISPQ, ficha técnica, catálogo), o sistema:
1. Extrai o texto do PDF
2. Indexa o conteúdo em um banco de dados vetorial
3. Quando você faz uma pergunta, o sistema busca trechos relevantes
4. O copiloto usa esses trechos para gerar respostas com citações

### 3.2 Tipos de Documentos Suportados
- **FISPQs** (Fichas de Informações de Segurança de Produto Químico)
- **Fichas Técnicas** de produtos
- **Catálogos** de produtos
- **Guias de Aplicação** de produtos
- **Normas Técnicas** e regulamentações

### 3.3 Passo a Passo: Inserir um PDF

**Método 1: Via Interface Web**

1. Acesse a plataforma como administrador
2. Vá para "Gerenciador de Documentos" (/documents)
3. Clique em "Novo Documento"
4. Preencha os campos:
   - **Nome:** Nome do produto ou documento
   - **Fornecedor:** Empresa que forneceu (ex: "Evolumix")
   - **Tipo:** FISPQ, Ficha Técnica, Catálogo, etc.
   - **Versão:** Versão do documento (ex: "1.0", "2.1")
5. Clique em "Selecionar Arquivo" e escolha o PDF
6. Clique em "Upload"
7. O sistema processará o PDF automaticamente
8. Você receberá uma confirmação quando o documento estiver indexado

**Método 2: Via API (Para Integração)**

```bash
curl -X POST https://evolucopil-pk69zyag.manus.space/api/trpc/documents.upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "name=Produto XYZ" \
  -F "supplier=Evolumix" \
  -F "type=FISPQ" \
  -F "version=1.0"
```

### 3.4 Verificando se o Documento Foi Indexado

1. Vá para "Gerenciador de Documentos"
2. Procure pelo documento na lista
3. Verifique o status: deve estar como "Aprovado" e "Indexado"
4. Clique no documento para ver detalhes:
   - Data de upload
   - Versão
   - Número de páginas indexadas
   - Trechos extraídos

### 3.5 Testando o RAG

Após inserir um documento, teste se está funcionando:

1. Vá para o chat
2. Faça uma pergunta relacionada ao documento inserido
3. Exemplo: "Qual é a concentração ativa do Produto XYZ?"
4. O copiloto deve responder com citações do documento

**Resposta esperada:**
```
De acordo com a FISPQ do Produto XYZ (v1.0), a concentração ativa é de 15%.

Fonte: FISPQ Produto XYZ, Seção 3 - Composição/Informações sobre Ingredientes
```

### 3.6 Atualizando Documentos

Se você receber uma versão atualizada de um documento:

1. Vá para "Gerenciador de Documentos"
2. Encontre o documento antigo
3. Clique em "Nova Versão"
4. Faça upload do novo PDF
5. O sistema criará uma nova versão e manterá o histórico
6. O copiloto usará automaticamente a versão mais recente

### 3.7 Troubleshooting do RAG

**Problema:** O copiloto não encontra informações do documento inserido

**Soluções:**
1. Verifique se o documento está com status "Indexado"
2. Aguarde 5-10 minutos após o upload (indexação pode levar tempo)
3. Tente fazer uma pergunta mais específica
4. Verifique se o PDF não está protegido por senha

**Problema:** Resposta cita documento errado

**Soluções:**
1. Verifique se há documentos duplicados no sistema
2. Remova versões antigas desnecessárias
3. Atualize o documento para versão mais recente

---

## 4. Painel de Administração

### 4.1 Acesso
Apenas usuários com papel "admin" podem acessar o painel de administração.

### 4.2 Funcionalidades

#### Gerenciamento de Usuários (/users)
- Ver lista de usuários
- Autorizar novos usuários
- Remover usuários
- Visualizar histórico de acesso

#### Gerenciador de Documentos (/documents)
- Upload de novos documentos
- Visualizar documentos indexados
- Criar novas versões
- Remover documentos
- Ver estatísticas de uso

#### Painel de Aprovações (/approvals)
- Ver consultas pendentes de aprovação
- Aprovar ou rejeitar consultas críticas
- Ver histórico de aprovações
- Adicionar comentários

#### Dashboard de Auditoria (/audit)
- Ver histórico completo de operações
- Filtrar por usuário, data, tipo de operação
- Visualizar métricas de qualidade
- Exportar relatórios

---

## 5. Transferência e Deployment

### 5.1 Backup de Dados

**Backup do Banco de Dados:**
```bash
# Exportar dados do MySQL
mysqldump -h HOST -u USER -p DATABASE > backup_evolumix_360.sql

# Restaurar dados
mysql -h HOST -u USER -p DATABASE < backup_evolumix_360.sql
```

**Backup de Documentos:**
Todos os documentos estão armazenados em S3. Você pode:
1. Fazer download via interface (Gerenciador de Documentos)
2. Fazer backup via AWS CLI:
```bash
aws s3 sync s3://seu-bucket/evolumix-docs ./backup-docs/
```

### 5.2 Exportar Código para GitHub

A plataforma está pronta para ser exportada para GitHub. Você pode:

1. **Opção 1: Via Interface Manus**
   - Vá para Settings → GitHub
   - Conecte sua conta GitHub
   - Clique em "Exportar para GitHub"
   - Escolha o repositório e nome

2. **Opção 2: Manual via Git**
   ```bash
   git clone https://github.com/seu-usuario/evolumix-360-copilot.git
   cd evolumix-360-copilot
   git remote add origin https://github.com/seu-usuario/evolumix-360-copilot.git
   git push -u origin main
   ```

### 5.3 Setup Local para Desenvolvimento

Se você quiser rodar a plataforma localmente:

**Pré-requisitos:**
- Node.js 18+
- MySQL 8.0+
- Git

**Passos:**

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/evolumix-360-copilot.git
cd evolumix-360-copilot
```

2. Instale dependências:
```bash
pnpm install
```

3. Configure variáveis de ambiente:
```bash
cp .env.example .env
# Edite .env com suas configurações
```

4. Configure banco de dados:
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

5. Inicie o servidor de desenvolvimento:
```bash
pnpm dev
```

6. Acesse em http://localhost:3000

### 5.4 Deploy em Produção

**Opção 1: Manus (Recomendado)**
A plataforma já está deployada no Manus. Você pode:
- Clicar "Publish" no painel de controle
- Usar domínio customizado
- Gerenciar SSL automaticamente

**Opção 2: Deploy Próprio (AWS, Azure, etc.)**

Consulte a documentação em `/home/ubuntu/evolumix-360-copilot/DEPLOYMENT.md` para instruções detalhadas de deploy em diferentes plataformas.

---

## 6. Troubleshooting

### Problema: Não consigo fazer login
- Verifique se sua conta Manus está ativa
- Verifique se você foi autorizado por um administrador
- Limpe cookies do navegador e tente novamente

### Problema: Chat não responde
- Verifique conexão com internet
- Verifique se o servidor está rodando (status no painel)
- Tente fazer refresh da página

### Problema: Documentos não aparecem nas respostas
- Verifique se o documento foi indexado (status = "Indexado")
- Aguarde 10 minutos após upload
- Tente fazer uma pergunta mais específica

### Problema: ROI não calcula
- Verifique se todos os dados foram coletados (área, fluxo, consumo, custo)
- Tente fazer uma nova pergunta para o copiloto coletar dados

---

## 7. Suporte

Para suporte técnico ou dúvidas:
1. Consulte este guia
2. Verifique a documentação em `/DOCUMENTATION.md`
3. Abra uma issue no GitHub
4. Entre em contato com o time técnico da Evolumix

---

**Versão:** 1.0
**Última atualização:** 30 de maio de 2026
**Autor:** Manus AI
