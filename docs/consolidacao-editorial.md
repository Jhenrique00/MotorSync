# Consolidação Editorial Preto — 16/11/2026

Base: main 66b796c. Fonte: MOTORSYNC_EDITORIAL_PRETO_11-11.zip. Integração autorizada em branch; merge não autorizado.

## Preservado

Todos os arquivos rastreados anteriores permanecem. Os 12 caminhos ausentes do ZIP foram mantidos, incluindo FinanceScreen, FinancialChart, FinanceOverview, SalesPanel, useFinance, useCatalog, accountRepository, financeApi e documentos. Serviços Auth/supabase, AuthContext, recuperação de senha, commercialApi, vehicleRepository e commercialResults não foram alterados. react-native-chart-kit 7.0.4 permanece no manifesto e lockfile.

Home permanece pública; login e cadastro com sessão retornam ao Perfil; logout mantém o comportamento anterior. O ZIP obrigava login na Home e redirecionava ao sair: essas diferenças não foram incorporadas. Recuperação de senha e confirmação de cadastro permanecem.

## Incorporado

Visual Editorial Preto, Inter/Playfair Display, compositor/feed social, serviços sociais, favoritos privados e gráfico mensal de resultados. O novo gráfico agrega vendas concluídas com custos conhecidos usando saleResult/saleDay existentes; não substitui totais anteriores. Os gráficos anteriores permanecem sem criar rotas novas para componentes que já estavam sem rota na main.

SQL social/favoritos do ZIP incluído somente como referência; nenhuma migração executada, política editada ou dado remoto escrito. Consulta de metadados confirmou social_posts, social_post_likes, social_post_saves, social_post_comments e listing_favorites com RLS ativado. Isso não comprova permissões efetivas, bucket ou isolamento. Os serviços compartilham o cliente/autenticação existentes; schema ausente e erro de rede têm tratamento distinto. Validação remota por usuário continua obrigatória.

## Alterações de compatibilidade

- Mantida biblioteca dos gráficos antigos ao acrescentar fontes; lockfile regenerado.
- Testes do ZIP que exigiam excluir módulos financeiros e retornar à Home foram adaptados às decisões de preservação. Testes financeiros voltaram a importar o serviço real preservado, em vez da cópia legacy.
- Formatação normalizada sem alterações deliberadas de regras.
- Inicializadores verificam Node/npm, todos os pacotes declarados e fingerprint do manifesto/lockfile. Reinstalam por npm ci quando necessário; não instalam Node nem alteram banco.
- GitHub Actions executa instalação, testes locais e formatação em push/PR, sem deploy ou segredos.

## Testes efetivamente executados

| Verificação | Resultado |
| --- | --- |
| Baseline anterior | 50 aprovados, zero falhas |
| ZIP original | 100 aprovados, zero falhas |
| Consolidado | 100 aprovados, zero falhas; incluem contratos/API simulada |
| npm ci --ignore-scripts | 615 pacotes instalados |
| Expo check | Aprovado pelo mapa local; consulta online indisponível |
| format:check | Aprovado após normalização |
| expo export --platform all | Android/iOS/web exportados; não execução em aparelho |
| auth-navigation.cjs | Falhou: seletor antigo Cadastrar conta não existe |
| finance-ui.cjs | Falhou: espera Registrar despesa em /finance, que já aponta a CommercialScreen na main |
| Inicializador | Sintaxe do helper validada; fluxo interativo completo Windows não executado |
| Android físico/Supabase CRUD | Não executados nesta consolidação |

UI foi testada em build com chave fictícia e requisições interceptadas, sem operações reais. Tentativas iniciais também tiveram bloqueio de rede local e configuração ausente; não foram contabilizadas como aprovação.

## Pendências antes de merge

Atualizar os testes web aos fluxos preservados, executar regressão visual e Android; validar upload social, permissões de favoritos e isolamento real. Não afirmar ausência total de regressões com base em testes locais. GitHub Projects permanecia bloqueado por falta de escopo project; esta tarefa não alterou permissões. Financeiro completo segue pendente de validação.

Não foram importados .env, cache .expo, relatórios históricos ou evidências privadas do ZIP. Busca de padrões de tokens privados não identificou segredo nos fontes/testes. Scripts live não foram executados e exigem revisão/configuração explícita antes do uso. Não há remoção de arquivos, force push ou merge nesta entrega.
