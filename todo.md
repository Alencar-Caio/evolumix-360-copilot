# Evolumix 360 Technical Copilot - TODO

## Arquitetura e Planejamento
- [x] Definir modelo de dados completo (usuários, documentos, consultas, aprovações, auditoria)
- [x] Desenhar fluxo de autenticação e autorização por papel
- [x] Especificar integração com LLM (Groq) e RAG
- [x] Definir estratégia de armazenamento de documentos com versionamento

## Banco de Dados
- [x] Criar schema Drizzle para tabelas: users, documents, queries, approvals, audit_logs, rai_classifications
- [x] Gerar e executar migrações SQL
- [x] Implementar índices para performance de busca

## Backend - Rotas tRPC
- [x] Autenticação e gestão de usuários (login, logout, perfis)
- [x] Upload e gerenciamento de documentos técnicos (CRUD com versionamento)
- [x] Consultas ao copiloto de IA com rastreamento de fontes
- [x] Cálculo de ROI e análise estruturada
- [x] Sistema de aprovações humanas (submissão, revisão, rejeição)
- [x] Classificação de risco automática (RAI)
- [x] Auditoria e logs de operações

## Backend - Integração LLM e RAG
- [x] Configurar cliente Groq (já pré-configurado no template)
- [x] Implementar pipeline RAG: indexação de documentos → busca semântica → prompt com contexto
- [x] Extração automática de citações e trechos das respostas
- [x] Validação de faithfulness e cobertura de citação
- [x] Geração de script de fechamento comercial

## Armazenamento de Documentos
- [ ] Integrar S3 para armazenamento seguro e versionado
- [ ] Gerar URLs persistentes para cada versão de documento
- [ ] Implementar metadados: versão, fornecedor, data, status de aprovação
- [ ] Sistema de exclusão lógica para auditoria

## Frontend - Páginas Principais
- [x] Página inicial: apresentação da metodologia Diagnóstico Evolumix 360º, três pilares, CTA
- [x] Dashboard: visão geral de diagnósticos, documentos, aprovações pendentes
- [x] Página de chat técnico com IA
- [x] Formulário de Diagnóstico 360º com captura de cenário
- [x] Calculadora de ROI interativa
- [ ] Gerenciador de documentos técnicos
- [x] Dashboard de auditoria

## Frontend - Design Visual
- [x] Definir paleta de cores sofisticada e elegante
- [x] Tipografia refinada com hierarquia clara
- [x] Componentes reutilizáveis (cards, modais, tabelas, gráficos)
- [x] Animações fluidas e micro-interações
- [x] Responsividade mobile-first
- [x] Temas dark/light

## Chat com IA e Citações
- [x] Interface de chat com histórico de mensagens
- [x] Exibição obrigatória de fontes e trechos citados
- [x] Indicador visual de confiabilidade (faithfulness score)
- [x] Rastreamento de documentos usados em cada resposta
- [x] Fallback para consultas sem documentos relevantes

## Calculadora de ROI
- [x] Campos de entrada: custo por litro diluído, rendimento, consumo atual, custo atual
- [x] Cálculo de economia mensal, payback, comparativo antes/depois
- [x] Exibição explícita de premissas
- [x] Gráficos comparativos (antes vs. depois)
- [x] Exportação de resultados

## Diagnóstico 360º
- [x] Formulário: área, fluxo de pessoas, produtos atuais, consumo, custo
- [x] Análise estruturada nos três pilares: Químico, Higiene, ROI
- [x] Recomendações personalizadas baseadas em IA
- [x] Geração de relatório estruturado
- [x] Script de fechamento comercial automático

## Sistema de Aprovações
- [x] Fluxo de submissão de minutas para aprovação
- [x] Painel de revisor com histórico de aprovações/rejeições
- [x] Bloqueio obrigatório para minutas críticas (RAI crítico)
- [x] Notificações de aprovação pendente
- [x] Rastreamento de quem aprovou e quando

## Classificação de Risco (RAI)
- [x] Classificador automático de risco: baixo, médio, alto, crítico
- [x] Critérios de classificação baseados em conteúdo técnico
- [x] Indicador visual de risco nas respostas
- [x] Bloqueio de liberação para risco crítico

## Dashboard de Auditoria
- [x] Histórico completo de consultas com timestamps
- [x] Documentos usados em cada consulta
- [x] Métricas de qualidade: faithfulness, cobertura de citação
- [x] Logs de aprovação humana
- [x] Filtros e busca por período, usuário, tipo de operação
- [x] Exportação de relatórios

## Painel de Administração
- [ ] Gerenciamento de usuários (criar, editar, deletar, atribuir papéis)
- [ ] Upload e versionamento de documentos técnicos
- [ ] Visualização de documentos com metadados
- [ ] Fila de aprovações pendentes
- [ ] Configurações de sistema (prompts, modelos LLM, thresholds de risco)

## Testes e Qualidade
- [ ] Testes unitários para lógica de cálculo de ROI
- [ ] Testes de integração para pipeline RAG
- [ ] Testes de autenticação e autorização
- [ ] Testes de UI para componentes críticos
- [ ] Validação de citações em respostas de IA

## Otimizações e Deploy
- [ ] Otimização de performance de busca semântica
- [ ] Caching de documentos indexados
- [ ] Compressão de assets
- [ ] SEO básico
- [ ] Checkpoint final e publicação
