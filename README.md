# NandoSync

Aplicativo mobile planejado para apoiar a gestão comercial de concessionárias de veículos usados e seminovos. Projeto acadêmico da disciplina **Desenvolvimento Mobile** (Sistemas de Informação).

> **Situação atual (Fase 1):** projeto em planejamento. As telas apresentadas são **protótipos visuais**, não funcionalidades implementadas. Ainda não há aplicativo React Native funcional neste repositório.

## Problema e solução

Informações sobre veículos, clientes e negociações podem ficar dispersas. O NandoSync propõe reuni-las em uma aplicação com navegação simples e perfis de acesso.

**Público-alvo:** vendedores, gerentes e proprietários de concessionárias.

## Funcionalidades planejadas

1. **Início:** indicadores demonstrativos e atalhos.
2. **Estoque:** cadastro, listagem, busca, detalhes, edição e exclusão de veículos.
3. **Clientes:** cadastro de clientes/leads, intenção de compra, etapa do funil e contatos.
4. **Vendas e Financiamentos:** registro de propostas/vendas, forma de pagamento, entrada, veículo na troca e andamento da negociação. **Não** está prevista integração bancária real nesta entrega.
5. **Relatórios & Resultados:** indicadores e desempenho comercial com acesso gerencial; a profundidade dos relatórios dependerá da viabilidade de implementação.
6. **Usuários:** cadastro/login e permissões conforme perfil.

## Tecnologias previstas

- **React Native** para o aplicativo mobile (obrigatório na disciplina).
- **MySQL** como banco de dados relacional escolhido para o planejamento.
- **MySQL Workbench** para modelagem/administração do banco.
- Uma **API** de backend para comunicação do app com o MySQL; a tecnologia específica do servidor ainda será definida. O app **não** acessará o MySQL diretamente.
- **Git e GitHub Projects** para registro do trabalho e acompanhamento.

## Fases e datas oficiais

| Etapa | Datas de apresentação | Resultado |
| --- | --- | --- |
| Fase 1 — Planejamento | 20 e 22 de outubro de 2026 | PDF dos slides e link do GitHub Projects enviados pelo AVA |
| Fase 2 — Aplicativo funcional | 24 e 26 de novembro de 2026 | App React Native demonstrável, código GitHub, README técnico e vídeo de até 10 min no Google Drive |

**Atenção:** a tabela descreve **exigências da disciplina**, não confirma que a entrega no AVA tenha sido realizada.

## Documentação do planejamento

- [Conceito, funcionalidades, navegação e cronograma](docs/PLANEJAMENTO.md)
- [Protótipos e correspondência com as telas](docs/PROTOTIPOS.md)
- [Modelo inicial de dados](docs/MODELO_DADOS.md)
- [Critérios acadêmicos e checklist por fase](docs/CHECKLIST_DISCIPLINA.md)

As atividades de execução e acompanhamento estão nas [Issues](https://github.com/Jhenrique00/NandoSync/issues). Os **status do GitHub Projects** precisam ser mantidos atualizados no quadro.

## Escopo mínimo viável para novembro

Prioridade para: cadastro/login, navegação em telas mobile, **CRUD completo de veículos**, armazenamento persistente, validação dos campos, erros tratados e demonstração de um fluxo ponta a ponta. Depois, incorporar clientes, propostas e indicadores na medida em que as funções principais estiverem estáveis. A Fase 2 será avaliada pelas funcionalidades efetivamente entregues.

## Executar o projeto

**Ainda não aplicável:** o código React Native e a API serão criados na Fase 2. Quando houver código, este README deverá informar dependências, pré-requisitos, variáveis de ambiente (sem senhas), configuração do MySQL e comandos de execução. Não há credenciais ou configurações de produção publicadas aqui.
