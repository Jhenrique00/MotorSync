# Protótipos de interface

Os protótipos representam a proposta visual do NandoSync. **Não são capturas de um aplicativo em execução.** Veículos, pessoas, valores e indicadores mostrados nessas telas são exemplos ilustrativos.

## Mapeamento das telas

| Área | Interfaces representadas | Comportamentos previstos |
| --- | --- | --- |
| Acesso | Login e menu mobile | Autenticação e entrada nas seções |
| Dashboard | Página inicial | Indicadores, atalhos e veículos recentes |
| Estoque | Listagem e cadastro de veículo | Busca, filtros e inclusão de veículos |
| CRM | Clientes e cadastro de lead/cliente | Funil, dados de contato e próximos passos |
| Vendas | Lista de negociações e nova proposta | Valor, pagamento, status e veículo vinculado |
| Relatórios | Visão gerencial | Margens, tempo em estoque e resultados |

## Detalhes por área

**Estoque:** busca por marca/modelo/placa, filtros de status, marca, ano e preço; cadastro com dados do veículo.

**CRM:** nome, WhatsApp, e-mail, CPF, intenção de compra, etapa do funil, último contato e próximo follow-up.

**Vendas:** cliente, veículo, valor negociado, forma de pagamento, entrada, troca e status da proposta. A expressão “aguardando banco” no protótipo é **um status comercial**, não uma integração financeira real.

**Relatórios:** valores demonstrativos de margens, comissões e permanência no pátio. Acesso gerencial representado, ainda não implementado.

## Limitações e próxima evolução

- Algumas telas de origem são compridas e podem ser apresentadas por seções para melhorar a leitura; isso não cria telas ou funcionalidades adicionais.
- Detalhes e edição de registros ainda precisam de interfaces definidas na implementação.
- As imagens de referência **não estão versionadas neste repositório**. Não existem caminhos de arquivos locais fictícios nem links de imagens quebrados nesta documentação.
- Futuramente, os arquivos visuais poderão ser organizados em `docs/assets/` quando forem publicados. Não há necessidade de criar uma pasta vazia antes disso.

Veja [visão geral](visao-geral.md) e [roadmap](roadmap.md).
