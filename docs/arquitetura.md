# Arquitetura atual do MotorSync

React Native 0.86.3, Expo SDK 57, JavaScript/JSX e Expo Router. Rotas em apps/mobile/app, telas e componentes em src. Contextos mantêm autenticação, tema, demonstração e favoritos privados; hooks coordenam serviços Supabase.

As cinco posições são Home, Explorar, (+), Gestão e Perfil. Inter é usada nos textos/indicadores e Playfair Display nos títulos. O backend é Supabase/PostgreSQL com Auth, Storage e RLS. Nenhum MySQL está integrado.

Serviços de autenticação, sessão, estoque, clientes/propostas/vendas e cálculos comerciais originais foram preservados na consolidação. Serviços sociais e favoritos do ZIP usam o mesmo cliente Supabase e identidade autenticada. Eles requerem schema compatível no servidor; SQL incluso é referência, sem execução autorizada nesta tarefa.

Os módulos financeiros anteriores permanecem, inclusive componentes sem rota ativa. Manter arquivo não significa disponibilizar novo módulo; a rota /finance continua apontando à tela comercial, como na main anterior. A Home permite acesso público e ações privadas requerem sessão.

Ver consolidacao-editorial.md para evidências, limitações e decisões de compatibilidade. Referências a NandoSync em commits antigos são históricas.
