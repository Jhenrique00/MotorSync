# MotorSync

**Tudo sobre automotivo: comunidade, marketplace e gestão em uma única plataforma.**

O **MotorSync** é um produto mobile em desenvolvimento que conecta pessoas, criadores, compradores, vendedores e negócios do universo automotivo. O objetivo é transformar conteúdo em descoberta, anúncios em negociações e negociações em operações comerciais organizadas.

> **Estado do repositório:** aqui estão versionados o planejamento e a documentação. O protótipo interativo HTML foi desenvolvido à parte e **ainda não é um aplicativo Android/iOS de produção**. O código React Native, banco persistente, autenticação real e integrações externas ainda precisam ser implementados e versionados.

## Três pilares

| Pilar | Experiência prevista |
| --- | --- |
| **Home / Comunidade** | Feed de fotos, vídeos e texto, perfis, seguir criadores, comentários, curtidas, favoritos e conteúdo associado a anúncios. |
| **Explorar / Marketplace** | Automóveis, motos, caminhões, embarcações, jet skis, peças e acessórios; pesquisa, filtros, comparação, anúncios e propostas. |
| **Gestão / ERP e CRM** | Estoque, clientes, propostas, vendas, indicadores e, progressivamente, financeiro, contratos, documentos, tarefas, OS e recursos empresariais. |

A navegação de produto prevê **Home · Explorar · Criar (+) · Gestão · Perfil**.

### Fluxo que conecta o produto

1. Um anunciante cadastra um veículo.
2. O veículo aparece no marketplace.
3. Uma publicação pode vincular-se ao anúncio.
4. Um interessado abre o anúncio a partir do conteúdo e envia uma proposta.
5. Se o anunciante usar a Gestão, a proposta entra no CRM de sua organização.
6. Uma venda concluída atualiza disponibilidade e indicadores, com validação de permissões e consistência no backend.

## Identidade visual

A marca **MotorSync** utiliza preto, branco, cinza e laranja. A logo original deve ser preservada sem redesenho ou distorção. O design prioriza experiência mobile, legibilidade, acessibilidade e modos claro/escuro.

## Estado de implementação

- **Conceito e documentação:** disponíveis neste repositório.
- **Protótipo HTML navegável:** desenvolvido separadamente, com **dados fictícios e armazenamento local**, sem serviços oficiais conectados; ainda não está versionado aqui.
- **Aplicativo React Native/Expo real:** não iniciado neste repositório.
- **Autenticação, banco de dados e mídia persistente:** planejados, não disponíveis em produção.
- **FIPE, DETRAN/Senatran, notas, boletos e assinaturas:** sem integração real; não apresentar simulações como documentos ou consultas oficiais.

## Stack proposta para a versão funcional

- **Mobile:** React Native, Expo, TypeScript e Expo Router.
- **Backend:** Supabase como opção preferencial a validar (PostgreSQL, Auth, Storage, RLS e funções para transações críticas).
- **Qualidade:** testes de interface, regras de negócio, permissões, segurança e fluxos Android/iOS.

Estas são **decisões de planejamento**, não dependências já instaladas.

## Próximas etapas

1. Auditar o protótipo e criar a matriz de telas/regras.
2. Inicializar projeto Expo com design system e navegação.
3. Implementar autenticação, organizações e permissões com dados persistentes.
4. Conectar Home, anúncios do Explorar, propostas e módulos essenciais de Gestão.
5. Testar em aparelhos, corrigir fluxos e só depois ampliar módulos regulados.

Veja a [visão geral](docs/visao-geral.md), a [arquitetura proposta](docs/arquitetura.md), o [modelo de dados](docs/modelo-de-dados.md), o [mapa de interfaces](docs/prototipos.md) e o [roadmap](docs/roadmap.md).

## Como executar

**Ainda não há aplicativo React Native executável neste repositório.** Não execute comandos npm/Expo nesta raiz até que o projeto seja inicializado. O protótipo HTML externo, quando disponibilizado aqui, deverá permanecer identificado como demonstração.

## Histórico e licença

Este projeto começou com o nome **NandoSync** e evoluiu para **MotorSync**. Referências antigas podem permanecer no histórico de commits e Issues para preservar rastreabilidade.

**Licença ainda não definida.** A ausência de licença não autoriza redistribuição ou uso comercial do código.
