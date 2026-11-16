# Validação da publicação — 12/11/2026

## Publicação autorizada e executada

- Importação publicada em main no commit `0a51193`, descendente do HEAD anterior `21be4dc`. Histórico anterior e documentos não relacionados preservados. Nenhum arquivo remoto excluído.
- Fonte funcional exclusiva: o ZIP oficial. Nenhuma mudança funcional. README atualizado e regras adicionais de .gitignore somadas às existentes.
- Instalação repetida com acesso à rede: 613 pacotes instalados com sucesso via `npm ci --ignore-scripts --no-audit --no-fund`. Não foi realizada auditoria de vulnerabilidades das dependências.
- Na cópia para publicação: `node --test tests/*.test.cjs`, 50 aprovados e zero falhas.
- `npm run check`: código de saída 0, dependências compatíveis segundo o mapa local do Expo. A consulta online estava indisponível e o Expo avisou que a verificação offline tem limitações.
- Issues #5–#16 receberam atualização verificável, preservando os critérios anteriores. #14 foi corrigida de MySQL para Supabase/PostgreSQL. Nenhuma issue foi encerrada por inferência.
- Criadas #17 (Android), #18 (scripts ausentes), #19 (dados acadêmicos) e #20 (persistência social), com critérios e estados explícitos.
- Project existente: https://github.com/users/Jhenrique00/projects/1, nome observado Project NandoSync. O navegador está desconectado; a credencial GitHub disponível não possui os escopos read:project/project. Renomear, configurar status e incluir tarefas está bloqueado por falta de permissão. Não foi criado quadro duplicado.
- Continuam pendentes os testes físicos Android, integrações reais nesta execução, dados acadêmicos e dois scripts ausentes do ZIP. Financeiro não declarado funcional.

## Registro da preparação inicial, antes da autorização

- Fonte: MotorSync.zip de 08/11/2026, 121 arquivos, sem histórico .git.
- Comparação SHA-256 de todos os arquivos extraídos com as entradas originais: nenhuma divergência. Apenas documentação e .gitignore foram acrescentados.
- Executado `node --test tests/*.test.cjs`: 50 aprovados, 0 falhas, 0 ignorados. São testes locais, incluindo API simulada; não são operações reais no Supabase ou Android.
- Tentativa de instalação `npm ci --ignore-scripts --no-audit --no-fund`: falhou com ENOTFOUND ao acessar registry.npmjs.org. A instalação completa e o check do Expo não foram confirmados nesta preparação. Os scripts de instalação não foram executados.
- Não executados nesta entrega: testes de interface, Supabase real, SQL, Android físico e iOS. Evidências de conversas anteriores não foram incorporadas como resultados desta execução, pois não vieram no ZIP.
- `test:ui` referencia tests/finance-ui.cjs e `test:live:explore` referencia tests/explore-live.cjs, ambos ausentes no ZIP. Preservados sem alteração funcional.
- Busca por padrões de chaves privilegiadas, tokens GitHub, URLs PostgreSQL com senha, JWT e chaves privadas: único achado é um marcador de chave inválida na fixture de tests/foundation.test.cjs, usado para testar rejeição. Nenhuma credencial privilegiada identificada por essa busca. Isso não constitui garantia de detecção universal.
- O .env original tem somente URL e chave publicável do cliente Supabase. Ele fica preservado na cópia local e excluído do pacote para publicação e do Git. .env.example permanece disponível. Nunca publicar credenciais de contas ou service_role.
- Dependências não auditadas quanto a vulnerabilidades nesta execução; a busca de segredos não substitui auditoria de dependências.
- Repositório remoto confirmado como público, branch main, com documentação/histórico e issues existentes. Nenhum commit, push, alteração de visibilidade, issue ou Project foi criado.
- Preservação do conteúdo remoto exige comparação final com HEAD atualizado antes de qualquer publicação aprovada. Conflitos deverão ser apresentados ao proprietário.

O registro acima descreve a preparação anterior à aprovação; os resultados atuais estão na seção inicial deste documento.

## Consolidação Editorial Preto — 16/11/2026 (branch de revisão)

A versão de referência é MOTORSYNC_EDITORIAL_PRETO_11-11.zip. A consolidação preserva os arquivos exclusivos da main, autenticação, recuperação de senha, acesso público à Home, retorno ao Perfil após login e os módulos financeiros. Não houve alteração no banco remoto.

A interface utiliza Inter e Playfair Display, preto/branco/cinza/laranja. Home social e favoritos privados possuem serviços persistentes incorporados do ZIP; funcionamento remoto depende das tabelas, bucket e RLS correspondentes. O estado anterior de Home apenas demonstrativa descreve a versão anterior: o código atual tenta integração real e sinaliza indisponibilidade. Não houve comprovação no Android ou Supabase nesta tarefa.

Os dois testes antes ausentes (finance-ui.cjs e explore-live.cjs) agora vieram no ZIP. Presença não equivale a teste aprovado. O gráfico mensal acrescenta visualização de vendas com custos conhecidos, mantendo os cálculos comerciais originais e react-native-chart-kit para os gráficos anteriores. Financeiro completo continua sem validação operacional.

Windows: configure apps/mobile/.env a partir de .env.example e execute INICIAR_MOTORSYNC.cmd ou INICIAR_TUNEL.cmd. Ambos verificam Node/npm e executam scripts/ensure-dependencies.cjs, que confere todas as dependências (incluindo as fontes) e o fingerprint de package.json/package-lock.json; se necessário executa npm ci. Não instala o Node automaticamente.

Consulte docs/consolidacao-editorial.md para resultados e limitações desta revisão. Nenhuma migração deve ser aplicada automaticamente.
