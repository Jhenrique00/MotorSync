# Visão geral do NandoSync

## Produto

O NandoSync é uma proposta de ERP/CRM mobile para concessionárias e lojas de veículos usados e seminovos. O propósito é apoiar rotinas de estoque, relacionamento com clientes e acompanhamento de negociações em um único sistema.

**Estado:** planejamento de produto, protótipos e modelagem preliminar. Não há implementação funcional publicada neste repositório.

## Problema

Informações de veículos, clientes e negócios podem ficar fragmentadas, dificultando localizar histórico, acompanhar propostas e visualizar resultados.

## Público previsto

- **Vendedor:** consulta ao estoque, relacionamento com clientes e acompanhamento das próprias negociações.
- **Gerente:** acompanhamento da operação, equipe, indicadores e resultados comerciais.
- **Administrador/proprietário:** configuração e visão gerencial, com permissões apropriadas.

Os perfis e permissões são **previstos**, ainda não implementados.

## Experiência planejada

1. O usuário se autentica.
2. Na tela inicial, vê um resumo da operação e atalhos.
3. Pelo menu, acessa Estoque, Clientes, Vendas e Financiamentos.
4. Perfis autorizados também acessam Relatórios & Resultados.

## Módulos

### Dashboard
Resumo visual de veículos, vendas e indicadores comerciais. Os números presentes nos protótipos são fictícios.

### Estoque de veículos
Cadastro, listagem, filtros e ciclo de vida do veículo (disponível, reservado, em preparação, vendido). O CRUD completo de veículos é a primeira funcionalidade persistente priorizada.

### CRM
Registro de clientes e leads, interesse de compra, histórico de contatos, etapa do funil e próximo acompanhamento.

### Vendas
Propostas vinculadas a veículo e cliente, valores negociados, status e finalização comercial. A conclusão de venda deve atualizar a disponibilidade do veículo.

### Financiamentos
Acompanhamento interno da forma de pagamento e do status da proposta. **Não** inclui integração bancária, análise de crédito ou aprovação automatizada.

### Relatórios e administração
Indicadores de desempenho e, futuramente, métricas gerenciais com proteção por perfil. Custos, margens e comissões exigem dados e regras de cálculo definidos antes de qualquer resultado real.

## Limites atuais

- Os formulários, números e imagens apresentados são **protótipos**, não execução real do produto.
- O desenvolvimento deve priorizar autenticação, navegação, um CRUD persistente e tratamento de erros antes de indicadores avançados.
- Integrações com instituições financeiras, contratos eletrônicos e assinatura digital não estão confirmadas no escopo.

Veja o [roadmap](roadmap.md), os [protótipos](prototipos.md) e a [arquitetura](arquitetura.md).
