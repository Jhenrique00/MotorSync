# MotorSync mobile

Aplicativo acadêmico em React Native 0.86.3, Expo SDK 57, Expo Router e JavaScript. Usa Supabase Auth para cadastro e login, PostgreSQL para persistência e Supabase Storage para fotos.

## Executar

1. Use Node.js 22.13 ou superior. Nesta pasta, execute `npm ci`.
2. Copie `.env.example` para `.env`. Preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com a URL e a chave publicável do projeto. Não inclua senhas ou chaves administrativas.
3. Rode `npm run start:go` e abra o QR no Expo Go compatível com o SDK 57. Para redes que bloqueiam a conexão local, use `npm run start:tunnel`.

## Banco e testes

O [modelo lógico](../../docs/modelo-logico.md) descreve as relações entre usuários, estoque, anúncios, clientes, propostas, vendas e publicações. O SQL fica em [`supabase/migrations`](../../supabase/migrations). Confira o histórico do banco antes de aplicar migrações a uma instância existente.

Use `npm test` para a suíte local e `npm run export` para gerar os bundles. Para a entrega acadêmica, valide cadastro/login e o CRUD de Clientes em aparelho físico ou emulador com um Supabase configurado. Consulte o [README do repositório](../../README.md) para os detalhes.
