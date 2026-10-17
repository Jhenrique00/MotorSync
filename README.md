# NandoSync

**Gestão comercial de veículos, clientes e negociações em um só lugar.**

O NandoSync é um ERP/CRM mobile **em desenvolvimento**, pensado para concessionárias e lojas de veículos usados e seminovos. A proposta é reunir estoque, relacionamento com clientes, propostas de venda e informações comerciais em uma experiência adequada ao celular.

**Estado atual:** conceito, protótipos de interface, requisitos e modelo inicial de dados documentados. **Ainda não existe uma versão executável do aplicativo neste repositório.**

## Por que o NandoSync?

No dia a dia de uma loja de veículos, dados de estoque, contatos e negociações podem ficar espalhados entre ferramentas e registros. O NandoSync busca centralizar essas informações para facilitar a consulta, o acompanhamento e a tomada de decisão. O público previsto inclui vendedores, gerentes e proprietários.

## Módulos do produto

| Módulo | Escopo previsto | Estado |
| --- | --- | --- |
| Dashboard | Resumo da operação, status de veículos e atalhos | Prototipado |
| Estoque de veículos | Cadastro, listagem, filtros, detalhes, edição e exclusão | Prototipado |
| CRM | Cadastro de clientes/leads, etapas do funil e histórico de contatos | Prototipado |
| Vendas | Propostas, negociação, preço e fechamento de venda | Prototipado |
| Financiamentos | Registro da forma de pagamento e acompanhamento do status comercial | Prototipado |
| Relatórios | Indicadores de desempenho, tempo em estoque e resultados | Prototipado |
| Administração | Cadastro/login e permissões por perfil | Planejado e representado em protótipos |

**Prototipado** significa que a ideia foi representada visualmente, **não que a função esteja implementada**. Nenhum módulo possui implementação funcional versionada até o momento. A integração com bancos, a aprovação de crédito e a assinatura digital **não fazem parte do escopo confirmado**.

## Tecnologias

| Tecnologia | Finalidade | Situação |
| --- | --- | --- |
| React Native | Aplicativo para dispositivos móveis | Previsto; projeto ainda não inicializado |
| MySQL | Persistência de dados | Previsto; banco ainda não implementado |
| MySQL Workbench | Modelagem e administração do banco | Ferramenta de planejamento |
| API de backend | Comunicação entre aplicativo e banco | Arquitetura prevista; stack ainda não definida |
| Markdown e Mermaid | Documentação e modelo conceitual | Disponíveis no repositório |

A aplicação **não** deve conectar diretamente ao MySQL. A estratégia planejada é utilizar uma API intermediária com autenticação e regras de acesso. Veja [arquitetura](docs/arquitetura.md).

## Organização do repositório

```text
NandoSync/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── pull_request_template.md
├── docs/
│   ├── arquitetura.md
│   ├── modelo-de-dados.md
│   ├── prototipos.md
│   ├── roadmap.md
│   └── visao-geral.md
├── .gitignore
└── README.md
```

A estrutura atual é **somente de documentação e organização**. Os diretórios do aplicativo e do backend serão incluídos quando seus projetos forem criados, sem antecipar arquivos fictícios.

## Documentação

- [Visão geral e escopo do produto](docs/visao-geral.md)
- [Arquitetura proposta](docs/arquitetura.md)
- [Modelo inicial de dados](docs/modelo-de-dados.md)
- [Protótipos e telas planejadas](docs/prototipos.md)
- [Roadmap e critérios de evolução](docs/roadmap.md)

## Roadmap resumido

1. **Fundação:** definir stack do backend, inicializar React Native, configurar API e persistência.
2. **Fluxo principal:** autenticação, navegação mobile e CRUD persistente de veículos.
3. **Operação comercial:** CRM, propostas, vendas e acompanhamento de financiamento.
4. **Gestão e qualidade:** controle de acesso, indicadores, testes e documentação de execução.

As prioridades podem mudar conforme a evolução do produto. O acompanhamento do trabalho acontece nas [Issues](https://github.com/Jhenrique00/NandoSync/issues).

## Instalação e execução

**Ainda não há comandos de instalação ou execução para o aplicativo:** o código mobile e a API não foram adicionados ao repositório. Quando estiverem disponíveis, esta seção terá pré-requisitos, configuração do ambiente e comandos validados para iniciar o projeto.

## Participação e licença

Sugestões de melhorias e relatos de problemas podem ser registrados nas [Issues](https://github.com/Jhenrique00/NandoSync/issues). Alterações propostas podem ser discutidas antes de um pull request.

**Licença ainda não definida.** Até que o autor escolha uma, não se deve presumir permissão de redistribuição ou uso comercial do código.
