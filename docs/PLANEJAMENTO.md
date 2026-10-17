# Planejamento do NandoSync — Fase 1

**Disciplina:** Desenvolvimento Mobile — Sistemas de Informação  
**Tema:** gestão comercial de concessionárias de usados e seminovos  
**Situação:** planejamento e protótipos; app funcional ainda não implementado.

## 1. Conceito e problema

O NandoSync propõe centralizar informações de estoque, clientes e negociações, hoje sujeitas a dispersão e retrabalho em rotinas de concessionárias.

## 2. Solução e público-alvo

Uma aplicação mobile organizada por cinco áreas, acessada após autenticação e com funções diferenciadas para **vendedor** e **gerente/administrador**. Destinada a equipes de vendas, gerentes e proprietários de lojas de veículos.

## 3. Objetivos

**Geral:** facilitar o acompanhamento comercial de estoque, clientes e vendas.

**Específicos:**
- Cadastrar, consultar e organizar veículos e clientes.
- Registrar e acompanhar negociações.
- Permitir uma visão do andamento comercial e, para a gerência, de resultados.

## 4. Telas e funcionalidades previstas

| Área | Planejado |
| --- | --- |
| Login/cadastro | Identificação do usuário; permissões por perfil |
| Início | Resumo da operação e atalhos |
| Estoque | Consulta, busca, filtros, cadastro e CRUD de veículos |
| Clientes | Leads, histórico/próximo contato, cadastro |
| Vendas e Financiamentos | Propostas, forma de pagamento, entrada, andamento comercial |
| Relatórios & Resultados | Indicadores, margens, tempo de pátio, equipe; perfil gerencial |

**Delimitação:** financiamentos representam **acompanhamento do status da proposta**, não emissão de crédito ou integração com bancos. Contratos/assinatura digital e relatórios complexos não fazem parte do mínimo obrigatório e só devem ser prometidos como entrega se efetivamente desenvolvidos.

## 5. Fluxo planejado

~~~mermaid
flowchart TD
  A[Cadastro / Login] --> B[Início]
  B --> C[Menu]
  C --> D[Estoque]
  C --> E[Clientes]
  C --> F[Vendas e Financiamentos]
  C --> G[Relatórios e Resultados]
  G --> H{Usuário gerencial?}
  H -->|Sim| I[Indicadores gerenciais]
  H -->|Não| J[Acesso negado]
~~~

O vendedor acessará operações autorizadas. Gerente/administrador terá acesso a dados gerenciais. Os controles ainda não estão implementados.

## 6. Tecnologia e persistência

- React Native no mobile.
- MySQL para persistência.
- MySQL Workbench para modelagem e administração.
- API intermediária a definir para comunicação segura entre aplicativo e banco.
- GitHub Projects para acompanhar tarefas.

## 7. Entidades iniciais

**Veículos**, **Clientes**, **Vendas/Propostas** e **Usuários**. Os campos e relacionamentos estão em [MODELO_DADOS.md](MODELO_DADOS.md). Trata-se de um modelo preliminar para a Fase 1.

## 8. Cronograma por etapas

| Etapa | Trabalho planejado |
| --- | --- |
| Planejamento | Conceito, objetivos, protótipos, navegação e modelo de dados |
| Preparação | Ambiente React Native, repositório, navegação e API |
| Desenvolvimento | Autenticação, CRUD, persistência, telas e testes |
| Entrega final | Demonstração funcional, README, vídeo e apresentação |

As etapas intermediárias são uma proposta de organização do trabalho, sujeita à evolução registrada no GitHub Projects.

## 9. Estratégia de viabilidade

1. Fazer login/cadastro e navegação.
2. Entregar **um CRUD completo e persistente de veículos**, que é o mínimo verificável.
3. Ampliar para clientes e propostas.
4. Adicionar indicadores e restrições gerenciais conforme o tempo.
5. Testar no dispositivo físico ou emulador e demonstrar dados preservados após reabrir o app.

Essa ordem é uma **decisão de planejamento**, não uma exigência adicional do professor.

## 10. Evidência da Fase 1

Os protótipos foram criados e aparecem na apresentação acadêmica de 14 slides. O PDF oficial requer enviar **o PDF dos slides** e **o link do GitHub Projects** pelo AVA. O envio ainda deve ser confirmado pelo responsável.
