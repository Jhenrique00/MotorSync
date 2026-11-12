# MotorSync

Aplicativo acadêmico automotivo em React Native, Expo e JavaScript. Reúne descoberta de anúncios e gestão de veículos, clientes, propostas e vendas, com serviços Supabase/PostgreSQL.

## Problema e público

Organiza anúncios e acompanhamento comercial que ficariam espalhados em contatos, planilhas e redes sociais. Destina-se a vendedores particulares e equipes de negócios automotivos. A gestão pessoal não exige empresa.

## Estado comprovável nesta versão

| Área | Implementação encontrada no ZIP | Limite de validação desta entrega |
| --- | --- | --- |
| Home | Feed, comentários e interações de demonstração locais em DemoContext | Rede social persistente não implementada |
| Explorar | Consulta a listings, pesquisa, categorias, filtros e paginação; fallback quando a função de pesquisa não existe | Integração remota e filtros precisam de teste no ambiente configurado |
| Criar (+) | Anúncios, rascunho, publicação, edição, arquivamento, exclusão e fotos via Storage | Publicação social indisponível; atalhos dependem da capacidade comercial |
| Gestão | Estoque, clientes, propostas, vendas e resultados comerciais, serviços/RPC e propriedade pessoal ou empresarial | Operações dependem do esquema e das permissões remotas; não equivalem a um financeiro completo |
| Perfil | Cadastro/login, sessão persistente, logout, edição do nome e consulta de vínculos | Confirmação de e-mail respeita o backend; precisa de teste real por conta |
| Financeiro | Existem tela, serviço e SQL de referência | Pendente; não apresentar como operacional |

Presença de implementação não comprova funcionamento em produção. Testes locais, API simulada, Supabase real e Android são evidências distintas. Veja [validação](docs/validacao-publicacao.md).

## Tecnologias e arquitetura

Expo SDK 57, React Native 0.86.3, React 19.2.3, Expo Router e JavaScript. Supabase JS 2.118.0 integra Auth, PostgreSQL/RLS e Storage. AsyncStorage e SecureStore dão suporte ao armazenamento local. Testes usam node:test; Playwright está nas dependências.

As rotas de `app/` abrem telas em `src/screens/`. Componentes e temas compõem a interface; contextos controlam sessão/tema/demonstração; hooks coordenam consultas; services encapsulam API e validações compartilhadas ficam em utils/data. As cinco posições são Home, Explorar, Criar (+), Gestão e Perfil.

```text
apps/mobile/
  app/                 rotas Expo Router
  src/                 telas, componentes, contextos, hooks e serviços
  assets/              identidade visual
  tests/               testes unitários e com API simulada
  package.json
  package-lock.json
supabase/migrations/   SQL de referência, não aplicação automática
docs/                  modelo lógico, validação e plano de publicação
```

## Instalação e execução

Requisitos: Node.js >=22.13, npm, Expo Go compatível e conexão com a internet.

```powershell
cd apps/mobile
npm.cmd ci
Copy-Item .env.example .env
```

Preencha `.env` com a URL e a chave **publicável** do seu projeto Supabase. Nunca use service_role, chave secreta ou senha do banco em variáveis Expo. A chave publicável é distribuída ao cliente; a proteção dos dados depende das políticas RLS no servidor. O arquivo `.env` fica fora do Git.

```powershell
npm.cmd run start:go
```

Escaneie o QR Code no Expo Go com celular e computador na mesma rede. Se necessário, encerre e execute `npm.cmd run start:tunnel` (pode exigir dependência adicional do túnel). Para web: `npm.cmd run web`. O ZIP contém código-fonte; instalação direta no Android exige APK, não incluído.

## Banco e segurança

O cliente usa autenticação persistente, RLS e funções de transação do PostgreSQL. Anúncios públicos e estoque privado são entidades distintas. Fotos usam o bucket privado `listing-photos`. O [modelo lógico](docs/modelo-logico.md) descreve relações encontradas no SQL do ZIP.

As migrações são referência de desenvolvimento: sua presença não comprova aplicação remota. Não executar em um banco existente sem revisar o histórico, os identificadores remotos e as permissões. Esta preparação não altera banco ou políticas.

## Testes

```powershell
cd apps/mobile
npm.cmd test
npm.cmd run check
```

`npm test` inclui validações de regras, contratos e serviços com respostas simuladas; não valida Android nem prova RLS remoto. Os scripts `test:ui` e `test:live:explore` referenciam arquivos ausentes no ZIP e não são reproduzíveis nesta versão. Esse limite foi preservado para manter o código original.

## Disciplina e pendências

Projeto para a disciplina Desenvolvimento Mobile da UniRios. Professor, integrantes, turma, período e critérios completos de avaliação precisam ser confirmados; não constam na documentação deste ZIP. Licença não definida.

O ZIP original não contém histórico Git. A publicação deve acrescentar a versão existente ao histórico do repositório, com data real e sem substituir arquivos remotos não relacionados. Planejamento de issues e quadro em [plano de publicação](docs/plano-publicacao.md).
