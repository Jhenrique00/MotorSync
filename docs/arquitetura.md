# Arquitetura real do MotorSync — snapshot editorial de 11/11/2026

> Este documento descreve os arquivos do ZIP editorial analisado em 18/11/2026. Não representa homologação de todos os fluxos nem comprova o estado atual do banco remoto.

## Stack identificada

- React Native 0.86.3, Expo SDK 57, Expo Router e JavaScript/JSX.
- Supabase Auth, PostgreSQL, Row Level Security (RLS) e Supabase Storage.
- Tipografia Inter e Playfair Display, temas claro/escuro e acento `#FF6B00`.
- A versão atual analisada não usa TypeScript nem WebView como casca do aplicativo.

## Organização do código

```text
apps/mobile/
  app/             rotas Expo Router
  src/screens/     composição das telas
  src/components/  componentes de interface
  src/hooks/       carregamento e sincronização
  src/services/    APIs, autenticação e repositórios
  src/contexts/    sessão, tema, favoritos e estado demonstrativo
  src/data/        dados de exemplo e regras de domínio
  src/config/      configuração pública e ações
  src/utils/       validações e cálculos
  src/theme/       tokens e tipografia
  tests/           testes Node e scripts de integração
supabase/
  migrations/      histórico SQL versionado
  tests/           testes e inspeções SQL
docs/              arquitetura, modelo e evidências
```

## Fluxos técnicos encontrados

- **Home:** rota de aba → `HomeScreen` → `useSocialFeed` → `socialApi`/`socialRepository` → Supabase. O cliente implementa publicação, mídia, curtidas, comentários, respostas e posts salvos. A validação autenticada completa no Android ainda está pendente.
- **Explorar:** `ExploreScreen` → `useExplore` → `exploreApi`; anúncios e fotos dependem do Supabase e das políticas de acesso.
- **Favoritos de anúncios:** `ListingFavoritesContext` → API/repositório dedicados. A migração SQL está no ZIP, mas a aplicação remota é contraditória nos documentos; tratar como não confirmada até conferir o histórico remoto.
- **Gestão:** `ManagementScreen` → `useCommercial` → `commercialApi`; estoque, clientes, propostas e vendas têm validações e operações comerciais. A conclusão de venda deve continuar no backend transacional.
- **Autenticação:** `AuthContext`, `authService` e cliente Supabase. A interface não substitui RLS.

## Navegação e domínio

- Barra inferior: Home, Explorar, Criar (+), Gestão, Perfil.
- Gestão principal: Estoque, Clientes, Propostas; vendas/resultados são acessados pela área comercial/financeira.
- Gestão pessoal não deve exigir organização. Acesso empresarial depende de vínculo e papel autorizado.
- Veículos: em preparação, disponível, reservado, vendido.
- Proposta aceita não é venda. Venda deve atualizar o veículo e o anúncio de forma consistente e impedir duplicidade.
- Compra, preparação, preço anunciado, valor efetivo, faturamento e lucro são grandezas distintas.

## Segurança

- RLS e validação no backend para operações sensíveis.
- Somente URL e chave publicável Supabase podem estar no cliente.
- Nunca incluir `.env`, `service_role`, `sb_secret_*` ou senha de banco no Git.
- Não expor dados de CRM, custos ou indicadores privados no feed/marketplace.

## Validação conhecida e limites

Na cópia do ZIP, `npm test` passou com 100 testes em 18/11/2026. São testes locais Node, parte com mocks; não comprovam Supabase autenticado ou execução no Android. Não foram executados `npm run check` nem `npm run export` nesta revisão.

Consulte [status consolidado](status-2026-11-18.md), [modelo lógico](modelo-logico.md) e [modelo de dados](modelo-de-dados.md).
