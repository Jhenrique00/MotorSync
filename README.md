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
git clone https://github.com/Jhenrique00/MotorSync.git
cd MotorSync
cd apps/mobile
npm ci
```

O aplicativo já inclui a URL e a chave publicável do Supabase do MotorSync, portanto **não é necessário criar `.env` para iniciar a cópia baixada do GitHub**. Para apontar para outro projeto, crie `apps/mobile/.env` a partir de `.env.example` e configure `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`). A configuração pública não substitui as políticas RLS nem garante que as migrações necessárias estejam aplicadas ao banco.

```bash
npm test
npm run check
npm run start:go
```

Para túnel: `npm run start:tunnel`.

**Nunca** versionar `.env`, `service_role`, chaves `sb_secret_*`, senha do banco ou credenciais administrativas. O `.gitignore` mantém `.env` excluído.

### Modelo lógico do banco

O Supabase Auth mantém as contas, o PostgreSQL armazena os registros e o Supabase Storage guarda as fotos. A tabela resume as chaves e relações principais. As definições de colunas, restrições e políticas estão nas [migrações SQL](supabase/migrations).

| Tabelas | Chaves e relacionamentos principais |
| --- | --- |
| `auth.users`, `profiles` | `profiles.id` é a chave primária e referencia `auth.users.id`. Cada conta pode ter um perfil. |
| `organizations`, `organization_members` | `organization_members` vincula usuários a empresas e registra a função de cada membro. A chave é o par `organization_id`, `user_id`. |
| `vehicles`, `listings` | Um veículo de estoque pode ter um anúncio associado por `listings.vehicle_id`. Anúncios também podem existir sem veículo de estoque. |
| `customers` | Cada cliente pertence a um usuário (`owner_user_id`) ou a uma empresa (`organization_id`). |
| `proposals`, `proposal_events` | Cada proposta referencia um cliente e pode referenciar veículo e anúncio. Cada evento referencia a proposta e o usuário que realizou a ação. |
| `sales` | Cada venda referencia cliente e veículo. O veículo tem vínculo único com a venda e a proposta é opcional. |
| `social_posts`, `social_post_comments` | Cada publicação e comentário referencia seu autor. Uma publicação pode apontar para um anúncio. Comentários referenciam a publicação e podem responder a outro comentário. |
| `social_post_likes`, `social_post_saves`, `listing_favorites` | Curtidas e posts salvos usam o par publicação–usuário. Favoritos de anúncios usam o par anúncio–usuário. |

As políticas de segurança por linha (RLS) controlam o acesso aos dados privados pelo proprietário ou pelo vínculo com a empresa. As chaves compostas com `scope_key` mantêm clientes, propostas, veículos e vendas no mesmo escopo comercial. O [modelo lógico detalhado](docs/modelo-logico.md) inclui o diagrama de relacionamentos.

Para usar uma instância nova do Supabase, aplique as migrações em ordem de nome e configure o cadastro por e-mail no Auth. Em uma instância existente, compare o histórico antes de aplicar qualquer migração pendente.

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

No fluxo de Clientes, entre com uma conta de teste, abra **Gestão → Clientes → Adicionar cliente** e salve um cliente fictício. Abra a ficha, edite o nome e feche e reabra o app para confirmar a persistência. Depois, exclua o cliente de teste e confira a lista novamente. Clientes com histórico comercial devem ser arquivados.

Entregáveis: aplicativo funcionando, código-fonte no GitHub, README na raiz com tecnologias/modelo lógico/configuração e vídeo de até 10 minutos no Google Drive. Os links do repositório e do vídeo devem ser enviados pelo AVA.

Consulte [requisitos acadêmicos](docs/requisitos-academicos.md) e priorize uma funcionalidade completa e comprovável em vez de apresentar módulos não homologados como concluídos.
