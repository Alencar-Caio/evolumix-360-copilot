# Piloto Svolta — plano de engenharia

**Status:** baseline de execução proposta  
**Escopo:** respostas fundamentadas em fichas técnicas e FDS/FISPQ, com etapa de revisão avaliada separadamente  
**Idioma canônico:** inglês. Consulte a [versão em inglês](./PROJECT_PLAN.md).

## Resultado do produto

O Svolta responderá a perguntas sobre documentos de produtos aprovados usando evidências recuperáveis e versionadas. Cada afirmação factual deverá apontar para uma localização da fonte. O sistema deverá identificar evidências ausentes ou conflitantes e abster-se quando as fontes disponíveis não sustentarem uma resposta segura. Uma etapa de revisão separada avaliará a resposta candidata e suas evidências antes que ela possa ser liberada segundo a política do piloto.

Este plano trata do piloto com documentos da Sevengel. Não afirma que o produto atual já cumpra esses requisitos.

## Baseline do repositório que fundamenta o plano

Este plano está fundamentado nos seguintes arquivos inspecionados na baseline de `main` (`be6536d6a18b3c40cfaf080dfdb089c1fcb6915b`):

- `server/routers/copilot.ts`: `copilot.query` carrega registros de documentos aprovados, inclui título/tipo/fornecedor no prompt, solicita uma resposta ao modelo, interpreta no texto gerado padrões parecidos com citações e associa as citações encontradas ao primeiro documento utilizado. Os valores de fidelidade e cobertura são calculados pela quantidade de citações e pelo tamanho da resposta; o risco é atribuído por busca de palavras-chave. O fluxo inspecionado não recupera trechos das fontes.
- `server/db.ts`: `getApprovedDocuments` seleciona registros aprovados; `createQuery` persiste resposta, IDs de documentos, objetos de citação e métricas heurísticas. Esse helper não estabelece proveniência por trecho.
- `package.json`: declara Vitest, verificações TypeScript, build e dependências como pacotes Pinecone/OpenAI e plugin de runtime Manus. A presença de uma dependência não comprova seu uso no fluxo do copiloto.
- `.github/workflows/deploy.yml`: executa `pnpm run lint || true`, testes e build; o job de deploy imprime mensagens de placeholder e referencia segredos Manus. O `package.json` inspecionado não declara script `lint`.
- Os documentos existentes na raiz contêm afirmações de status e implementação conflitantes. Por exemplo, `RAG_ARCHITECTURE_DECISION.md` declara o RAG Core concluído, enquanto a rota inspecionada não recupera trechos; `todo.md`, `HANDOFF_STATUS_REAL.md`, `IMPLEMENTATION_ROADMAP_PHASE1.md`, `V3_IMPLEMENTATION_MASTER_PLAN.md` e `RAG_GOLD_STANDARD_SPECIFICATION.md` também contêm afirmações que precisam ser conferidas no código antes de serem consideradas atuais.

Esta é uma baseline delimitada, não uma auditoria completa de todas as rotas, migrações, testes ou integrações. A Fase 0 resolve esse escopo antes de fechar decisões de implementação.

## Plano de trabalho

### 0. Estabelecer a baseline de implementação e o registro canônico do projeto

**Trabalho**

1. Rastrear o caminho ativo do copiloto desde a chamada da interface até a rota tRPC, consulta de documentos, persistência e renderização da resposta.
2. Rastrear o ciclo de vida e o schema de documentos: upload/armazenamento de origem, estado de aprovação, versões, extração/indexação de texto se existirem, exclusão e retenção.
3. Executar os comandos existentes de verificação, teste e build em ambiente capaz de acessar o repositório; registrar comandos, resultados e falhas. Inspecionar testes do copiloto em vez de confiar em contagens citadas em handoffs antigos.
4. Inventariar integrações de fornecedores por imports, chamadas de runtime e leituras de variáveis de ambiente. Classificar cada uma como ativa no fluxo do produto, disponível mas não utilizada, apenas documental ou não verificada.
5. Reconciliar a documentação existente. Manter um plano atual de produto/arquitetura; marcar material substituído como histórico ou atualizá-lo, em vez de criar outro documento concorrente de status.

**Entregáveis**

- Mapa verificado dos componentes e do fluxo de dados do copiloto e do ciclo de vida documental.
- Registro de verificações da baseline: comandos, resultados e bloqueios conhecidos.
- Decisão de reconciliação documental identificando documentos canônicos.
- Inventário de dependências de fornecedores e referências de marca.

**Critério de saída**

A equipe consegue apontar o caminho de código ativo e distinguir comportamento implementado de intenção documentada. Nenhum status de implementação é inferido de checkboxes ou documentos arquiteturais aspiracionais.

### 1. Definir o contrato de fontes do piloto e o conjunto de avaliação

**Trabalho**

1. Definir identidade/versão/localização documental suficientes para rastrear cada trecho recuperado ao produto, documento de origem, revisão, seção e página ou offset, quando disponíveis.
2. Registrar proveniência e direitos de publicação separadamente do conteúdo técnico. O repositório é público; publicar apenas material autorizado. Usar fixtures sintéticas ou mínimas licenciadas quando as fontes completas não puderem ser commitadas.
3. Criar casos de avaliação para perguntas respondíveis, não respondíveis, ambíguas, conflitantes e sensíveis à segurança. Para cada caso, especificar evidências esperadas, ressalvas obrigatórias, alegações não sustentadas proibidas e resultado esperado (`answer`, `clarify` ou `abstain`).
4. Incluir conteúdo de prompt injection nas fixtures e verificar que o texto documental é tratado como evidência não confiável, não como instrução de sistema.
5. Obter e verificar as fontes antes de afirmar fatos técnicos específicos dos produtos. Até isso ocorrer, fatos fornecidos na conversa permanecem informação do usuário, sem verificação independente.

**Riscos iniciais de avaliação a verificar nas fontes**

- SEVEN ÁLCOOL 70°: ambiguidade relatada entre `70° INPM` e `70° GL`.
- PEROXY GUARD: inconsistência relatada entre classificação de toxicidade oral e valores de DL50; alegação de eficácia antimicrobiana sem laudos/condições de teste fornecidos; declaração de `10% de ativo` frente a faixas de ingredientes relatadas como 4–6%.
- LIM+ LAVA LOUÇAS: alinhamento de datas/revisões e se as fontes sustentam usos e afirmações de segurança propostos.

Estes são itens para investigação e testes, não conclusões confirmadas sobre os produtos. Não os resolva por inferência do modelo.

**Entregáveis**

- Contrato de proveniência/dados e decisão de acesso às fontes.
- Casos de avaliação versionados com evidências e resultados esperados.
- Rubrica de avaliação de recuperação, suporte das afirmações, validade das citações, detecção de conflito e abstenção.

**Critério de saída**

Os casos são reproduzíveis, referências às fontes são rastreáveis e as permissões de publicação são conhecidas para cada fixture commitada.

### 2. Substituir contexto somente de metadados por recuperação de trechos

**Trabalho**

1. Definir contrato de recuperação neutro em relação a fornecedores, retornando texto do trecho, identificadores do documento/versão/localização e metadados de recuperação.
2. Escolher o desenho mínimo de ingestão/recuperação compatível com o ciclo de vida documental verificado. Avaliar dependências existentes antes de adicionar outro vector store ou provedor de embeddings.
3. Implementar ingestão, divisão estrutural em trechos e recuperação por interfaces testadas. Preservar limites de página/seção quando a fonte os fornecer.
4. Passar os trechos recuperados — não apenas títulos e metadados — para a etapa de resposta. Aplicar filtros de aprovação e versão na recuperação.
5. Derivar citações dos identificadores dos trechos recuperados. Validar que as localizações e excertos citados existem na fonte recuperada; não associar citações inventadas pelo modelo a um documento arbitrário.
6. Para recuperação vazia, fraca, desatualizada ou conflitante, seguir o comportamento de esclarecimento/abstenção definido na avaliação.

**Entregáveis**

- Módulos de ingestão e recuperação integrados ao ciclo de vida documental verificado.
- Contrato de citação por trecho.
- Testes unitários e de integração com fixtures autorizadas/sintéticas.

**Critério de saída**

Em cada caso respondível, as evidências esperadas são recuperáveis e as citações apontam para a versão/localização exata. Casos sem suporte não recebem fundamentação de fonte fabricada.

### 3. Produzir respostas estruturadas e avaliá-las independentemente

**Trabalho**

1. Definir resultado tipado de resposta separando afirmações sustentadas, citações, incertezas/conflitos, informações ausentes e disposição.
2. Gerar respostas somente com base nas evidências recuperadas para alegações específicas de produtos. Explicações gerais devem ficar claramente separadas de declarações derivadas das fontes.
3. Implementar contrato separado para o revisor: pergunta, resposta candidata, trechos recuperados e metadados entram; `approve`, `revise` ou `abstain` e achados por afirmação saem.
4. Fazer a elegibilidade de liberação depender de verificações determinísticas de política e do resultado do revisor. Uma segunda chamada de modelo não é garantia de segurança; avaliá-la contra casos fixos e exemplos adjudicados por humanos.
5. Não apresentar ao usuário os valores heurísticos atuais de fidelidade/cobertura como medidas de qualidade até que sejam calibrados e validados pelo conjunto de avaliação. Classificação de risco por palavras-chave não é validação de evidências.

**Entregáveis**

- Contratos estruturados de resposta e revisão.
- Validação de relação afirmação-evidência e aplicação de política.
- Relatório de avaliação comparando resultados do respondente/revisor com rótulos esperados.

**Critério de saída**

Nenhum caso crítico com orientação de segurança sem suporte, atribuição inválida de fonte ou conflito conhecido não detectado pode passar pelo gate de liberação. Falhas restantes devem estar documentadas e tratadas.

### 4. Integrar o piloto sob acesso controlado

**Trabalho**

1. Integrar o pipeline validado ao router atual do copiloto por uma fronteira de serviço estreita.
2. Persistir as versões/trechos exatos ou referências estáveis, disposição da resposta, decisão do revisor e versão da política necessárias à reprodução, respeitando minimização e retenção de dados.
3. Garantir que saídas de alto risco ou não resolvidas não sejam apresentadas como aprovadas. Conectar exigência de aprovação humana a um fluxo real antes de descrevê-la como operacional.
4. Adicionar logs operacionais com proteção de privacidade; evitar credenciais e conteúdo de documentos/usuários desnecessário.
5. Restringir o piloto até que a revisão de domínio e os critérios de lançamento sejam atendidos.

**Entregáveis**

- Fluxo de piloto de ponta a ponta testado em ambiente não produtivo.
- Registros reproduzíveis para avaliação e revisão.
- Aprovação de revisão de domínio e limitações documentadas antes da exposição a usuários.

**Critério de saída**

Testes end-to-end demonstram rastreabilidade das fontes, aplicação de política, resultados de revisão e abstenção segura. Build bem-sucedido não basta para lançamento.

### 5. Tornar as verificações do repositório confiáveis

**Trabalho**

1. Substituir o comando de lint ignorado por script de lint real e bloqueante, com configuração, ou remover a etapa até existir.
2. Executar verificação de tipos, testes e build como verificações explícitas obrigatórias; usar versões de Actions suportadas e fixadas e instalação de dependências determinística.
3. Separar validação de deploy. Substituir o placeholder somente quando houver ambiente-alvo e procedimento de implantação escolhidos e autorizados.
4. Adicionar checklist de PR para testes, mudanças de avaliação, direitos de dados, impacto de segurança, documentação bilíngue e acoplamento de fornecedores.

**Entregáveis**

- CI cujo status verde significa que cada verificação declarada realmente executou com sucesso.
- Documentação de implantação que diferencie placeholder de deploy operacional.

**Critério de saída**

Falhas em verificações obrigatórias bloqueiam merge; nenhum workflow reporta deploy concluído quando apenas imprimiu texto placeholder.

### 6. Migrar marca e dependências de fornecedores incrementalmente

**Marca**

- Inventariar referências a `Evolumix` e classificar texto de marca, identificadores de pacote/repositório, valores de dados históricos, atribuições legais/licenças e links externos.
- Alterar referências de marca voltadas ao produto para Svolta em mudanças revisadas; preservar identificadores sensíveis à compatibilidade até que haja plano de migração.
- Avaliar separadamente a renomeação do repositório, incluindo links, Actions, secrets, integrações de deploy, clones e redirecionamentos. Executar após análise de impacto e autorização explícita.

**Portabilidade de fornecedores**

- Confirmar dependências ativas no código, runtime e configuração — não apenas listas de dependências ou documentação.
- Definir interfaces neutras apenas nas fronteiras necessárias ao produto; evitar abstrações especulativas para serviços não utilizados.
- Planejar e executar uma substituição por vez para modelo/embeddings, armazenamento, runtime/deploy e autenticação, conforme aplicável. Autenticação entra no inventário, mas não será alterada no trabalho inicial do piloto.
- Para cada migração, registrar escolha de fornecedor, implicações de dados/segurança/custo/disponibilidade, testes de paridade, cutover, rollback e remoção de credenciais/configuração antiga.

**Critério de saída**

O Svolta consegue construir, testar e executar o fluxo suportado sem os serviços e credenciais que se pretende remover. A portabilidade não terminou enquanto runtime ou caminhos de produção ainda dependerem deles.

## Sequência de entregas e gates de revisão

| Incremento | Escopo | Gate de merge |
|---|---|---|
| A | Baseline, documentação canônica, inventário de fornecedores/marca | Achados citam evidências do repositório; sem mudança de comportamento |
| B | Contrato de proveniência e conjunto de avaliação | Acesso/direitos de fontes registrados; casos reproduzíveis |
| C | Recuperação e citações fundamentadas em fontes | Testes de resolução de citações e recuperação passam |
| D | Resposta estruturada, revisor e gate de política | Avaliação fixa de segurança/conflito/abstenção passa os limites acordados |
| E | Integração controlada de ponta a ponta | Revisão de domínio, verificações operacionais e decisão de lançamento registradas |
| F | Migrações de marca e fornecedores | Análise de impacto, testes e rollback separados por migração |

Cada incremento deve ser uma mudança GitHub revisável de forma independente, com testes/evidências de avaliação próprios e documentação atualizada em inglês e português. Não combinar renomeação do repositório, migração de auth e mudanças no comportamento do piloto em uma mesma alteração.

## Decisões pendentes

- Quais documentos originais dos produtos estão disponíveis, atuais e autorizados para armazenamento e avaliação?
- Qual é o modelo aprovado de acesso e retenção para arquivos-fonte, trechos, perguntas e respostas?
- Quais provedores de recuperação/embeddings atendem aos requisitos de implantação, privacidade, custo e portabilidade após o inventário?
- Qual revisor de domínio e responsável pelo lançamento adjudicarão casos de avaliação sensíveis à segurança?
- Qual alvo de deploy substituirá o placeholder e quando a exposição do piloto a usuários externos será autorizada?

## Registro de mudança

Este plano define trabalho fundamentado no repositório. Não declara que as fases foram implementadas. Atualize o status somente quando o código correspondente, testes e evidências de revisão estiverem no GitHub.
