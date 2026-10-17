# Modelo inicial de dados — NandoSync

**Situação:** modelo preliminar para a Fase 1. Nenhuma tabela MySQL está declarada aqui como já criada no servidor.

As entidades da apresentação são **VEICULOS**, **CLIENTES**, **VENDAS** e **USUARIOS**. O modelo foi montado com base no diagrama ER e nos protótipos do projeto.

## Entidades e campos

### VEICULOS
- id_veiculo (PK)
- marca, modelo, ano, placa, cor, km, combustivel
- preco_venda, status, data_entrada

### CLIENTES
- id_cliente (PK)
- nome, telefone (WhatsApp), email, CPF
- interesse_compra, etapa_funil, ultimo_contato
- proximo_followup (proposto por aparecer no formulário de protótipo)

### USUARIOS
- id_usuario (PK)
- nome, email (único), senha_hash
- perfil: vendedor, gerente ou admin

### VENDAS (incluindo propostas)
- id_venda (PK)
- id_veiculo (FK para VEICULOS)
- id_cliente (FK para CLIENTES)
- id_vendedor (FK para USUARIOS)
- data, valor_venda, forma_pagamento, status
- valor_entrada, veiculo_troca, termo_garantia, observacoes (propostos nos protótipos)

## Relacionamentos

~~~mermaid
erDiagram
  USUARIOS ||--o{ VENDAS : registra
  CLIENTES ||--o{ VENDAS : negocia
  VEICULOS ||--o{ VENDAS : vinculado_a
  USUARIOS {
    int id_usuario PK
    string nome
    string email
    string senha_hash
    string perfil
  }
  CLIENTES {
    int id_cliente PK
    string nome
    string telefone
    string email
    string etapa_funil
  }
  VEICULOS {
    int id_veiculo PK
    string marca
    string modelo
    int ano
    string placa
    decimal preco_venda
    string status
  }
  VENDAS {
    int id_venda PK
    int id_veiculo FK
    int id_cliente FK
    int id_vendedor FK
    decimal valor_venda
    string status
  }
~~~

O diagrama dos slides mostra uma ligação conceitual **cliente tem interesse em veículo**, mas ainda não especifica uma FK/tabela de interesses. Não tratar essa ligação como relação já implementada. Se o app exigir interesses em múltiplos veículos, deverá ser definida uma tabela de associação.

## Pontos a definir na Fase 2

- Propostas e vendas podem compartilhar uma tabela com diferentes status; definir transições válidas.
- Um veículo pode ter várias propostas históricas, porém **no máximo uma venda concluída**; implementar essa regra no backend.
- Para gerar **lucro/margem**, incluir custo e gasto de preparação no modelo gerencial, com acesso restrito.
- Para **tempo de pátio**, considerar a data_entrada e a data de venda.
- Para **comissões**, definir a regra antes de calcular; os valores do protótipo são fictícios.
- Validar CPF, placa, preços e dados obrigatórios, conforme a entrada prevista.
- Nunca salvar senha em texto puro; guardar hash de senha e proteger acesso ao banco na API.
- Escolher tipos MySQL, índices, cardinalidade final e exclusão segura para registros relacionados.

## Escopo de persistência

O aplicativo React Native deve consumir uma **API**, e a API utilizará o MySQL. O MySQL Workbench é apenas ferramenta de modelagem/administração — não substitui o banco nem a API.
