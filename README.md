# MotorSync — aplicativo mobile

**Atualização do código:** 19/11/2026  
**Projeto:** conclusão da disciplina Desenvolvimento Mobile  
**Apresentação da Fase 2:** 24 ou 26/11/2026, conforme cronograma da disciplina.

O MotorSync é uma plataforma mobile automotiva que conecta três áreas: **Home (comunidade/rede social)**, **Explorar (marketplace de veículos, peças e acessórios)** e **Gestão (ERP/CRM pessoal e empresarial)**.

> Esta versão incorpora o código do aplicativo do ZIP editorial de 11/11/2026. Consulte os resultados de validação e as pendências abaixo.

## Tecnologias

- React Native 0.86.3, Expo SDK 57 e Expo Router.
- JavaScript/JSX (não TypeScript nesta versão).
- Supabase Auth, PostgreSQL, Row Level Security (RLS) e Supabase Storage.
- Navegação inferior: **Home · Explorar · Criar (+) · Gestão · Perfil**.
- Tipografia editorial: Inter para textos funcionais e Playfair Display para títulos; acento laranja `#FF6B00`, superfícies neutras e temas claro/escuro.

## Estrutura do aplicativo

- `apps/mobile/app/`: rotas Expo Router.
- `apps/mobile/src/screens/`: telas.
- `apps/mobile/src/components/`: componentes de interface.
- `apps/mobile/src/hooks/`: carregamento e sincronização.
- `apps/mobile/src/services/`: autenticação, Supabase e repositórios.
- `apps/mobile/src/contexts/`: sessão, tema, favoritos e estado demonstrativo.
- `apps/mobile/src/theme/`: tokens e tipografia.
- `apps/mobile/tests/`: testes automatizados.
- `supabase/migrations/`: migrações versionadas.
- `docs/`: arquitetura, modelo de dados, validação e requisitos acadêmicos.

## Executar localmente

Requisitos: Node.js >= 22.13 e Expo Go compatível com SDK 57.

```bash
cd apps/mobile
npm ci
```

Crie `apps/mobile/.env` a partir de `.env.example` e configure somente a URL do Supabase e a chave publicável `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`).

```bash
npm test
npm run check
npm run start:go
```

Para túnel: `npm run start:tunnel`.

**Nunca** versionar `.env`, `service_role`, chaves `sb_secret_*`, senha do banco ou credenciais administrativas. O `.gitignore` mantém `.env` excluído.

## Estado funcional

| Área | Estado descrito |
| --- | --- |
| Autenticação e perfil | Integração com Supabase implementada; repetir validação no Android |
| Home social | Feed, autoria, fotos, curtidas, comentários, respostas e posts salvos integrados ao cliente Supabase; homologação autenticada no Android pendente |
| Explorar | Anúncios e filtros integrados ao Supabase; validar publicação, fotos e persistência no Android |
| Favoritos de anúncios | Cliente e migração SQL presentes; estado da aplicação remota é contraditório nos documentos e precisa ser confirmado antes de demonstrar sincronização |
| Gestão | Estoque, Clientes, Propostas, Vendas e resultados financeiros; validar o fluxo completo no Android |
| Seguir perfis | Local/demonstrativo, sem persistência confirmada |
| APK/loja | Não necessário para a demonstração acadêmica; Expo Go é a rota prevista |

A migração social `20261110010000_social_feed.sql` é descrita na documentação do ZIP como aplicada ao Supabase em 10/11/2026, com quatro tabelas e RLS. Não reaplicar sem consultar o histórico remoto.

A migração `20261110070000_private_listing_favorites.sql` deve ser tratada como **não confirmada no banco remoto**: o README do ZIP diz que foi aplicada, enquanto os documentos técnicos específicos dizem que não. A confirmação deve vir do histórico de migrações do projeto Supabase, não de inferência.

## Regras comerciais essenciais

- Status de veículo: em preparação, disponível, reservado e vendido.
- Separar preço de compra, custos de preparação, preço anunciado, preço efetivo, faturamento, lucro bruto e margem.
- Proposta enviada ou aceita não equivale a venda concluída.
- Impedir venda duplicada no backend; concluir venda de forma transacional.
- Dados privados de clientes, custos e empresas não podem ser expostos no feed ou a usuários sem permissão.
- Gestão pessoal não deve exigir vínculo com uma empresa.

## Validação local registrada nesta revisão

Na cópia preparada para publicação, em 19/11/2026, foi executado:

```text
npm test
100 testes aprovados
0 falhas
0 ignorados
```

A instalação limpa com `npm ci` passou e o Expo gerou os bundles Android, iOS e web. A checagem online das dependências excedeu o tempo de espera, mas a checagem com as informações locais do Expo passou. Esses resultados não comprovam o fluxo no aparelho nem transações autenticadas no Supabase.

## Documentação

- [Estado técnico e pendências](docs/status-2026-11-18.md)
- [Requisitos acadêmicos da instituição](docs/requisitos-academicos.md)
- [Modelo lógico do banco](docs/modelo-logico.md)
- [Arquitetura](docs/arquitetura.md)
- [Modelo de dados](docs/modelo-de-dados.md)
- [Roadmap](docs/roadmap.md)

## Entrega acadêmica — Fase 2

A instituição exige aplicação React Native funcional, navegação entre telas, persistência, cadastro/login, ao menos um CRUD completo quando aplicável, validação, tratamento de erros e demonstração de um fluxo contínuo em dispositivo físico ou emulador.

Entregáveis: aplicativo funcionando, código-fonte no GitHub, README na raiz com tecnologias/modelo lógico/configuração e vídeo de até 10 minutos no Google Drive. Os links do repositório e do vídeo devem ser enviados pelo AVA.

Consulte [requisitos acadêmicos](docs/requisitos-academicos.md) e priorize uma funcionalidade completa e comprovável em vez de apresentar módulos não homologados como concluídos.
