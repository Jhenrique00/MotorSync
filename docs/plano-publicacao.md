# Plano e resultado da publicação

Atualização de 12/11/2026: publicação autorizada pelo usuário e realizada em main, commit 0a51193. Issues #5–#16 atualizadas; #17–#20 criadas. Nenhuma funcionalidade alterada. Project existente https://github.com/users/Jhenrique00/projects/1 continua sem alterações porque a autenticação disponível não permite acesso de edição a Projects. O restante deste documento preserva o plano revisado antes da publicação. Veja validacao-publicacao.md para resultados executados.

Fonte exclusiva: outputs/MotorSync.zip, de 08/11/2026. Sem .git. Preparação em cópia isolada; nenhum arquivo funcional alterado.

Repositório confirmado: https://github.com/Jhenrique00/MotorSync, atualmente público, branch main. Já possui documentação e issues. Preservar o histórico, autores, datas e arquivos existentes. Não mudar visibilidade sem decisão explícita do proprietário.

Após aprovação: buscar o HEAD remoto atualizado; comparar todos os caminhos; adicionar o aplicativo do ZIP e documentos novos; apresentar qualquer conflito antes de substituir conteúdo remoto. Criar commit real de importação da versão existente, sem retroagir datas. Excluir .env da publicação, preservando .env.example. Não enviar node_modules ou resultados locais.

## Quadro proposto

Nome: MotorSync — Desenvolvimento Mobile. Status: A fazer, Em desenvolvimento, Em teste, Concluído. Verificar existência e reutilizar quadro antes de criar duplicata. Acesso a Projects ainda não verificado.

| Atividade | Status proposto | Evidência / aceite |
| --- | --- | --- |
| Registrar arquitetura e escopo acadêmico | Em desenvolvimento | README/modelo preparados; faltam dados acadêmicos |
| Importar projeto Expo preservando histórico (#5) | Em teste | Código presente no ZIP; publicação e aparelho pendentes |
| Autenticação e sessão | Em teste | AuthContext, authService e testes; falta repetir fluxo real no Android |
| Rede social persistente | A fazer | Home usa DemoContext; publicação social ready:false |
| Marketplace e fotos | Em teste | listingRepository/exploreApi; validar Storage, publicação e filtros no Android |
| Estoque (#6) | Em teste | vehicleRepository; comprovar ciclo no aparelho e reinício |
| Clientes (#7) | Em teste | CustomersPanel/commercialApi; validar no aparelho |
| Propostas e vendas (#8) | Em teste | RPC/serviços; validar estoque vendido e anúncio indisponível no aparelho |
| Banco/RLS e integração | Em teste | SQL/serviços presentes; execução remota não realizada nesta preparação |
| Interface e navegação | Em teste | Cinco áreas presentes; revisão física de teclado/layout pendente |
| Testes reproduzíveis (#9) | Em desenvolvimento | Unitários acessíveis; dois scripts apontam arquivos ausentes |
| Apresentação e documentação (#10) | Em desenvolvimento | Instalação documentada; faltam roteiro confirmado e evidências físicas |
| Financeiro completo | A fazer | Não demonstrar como concluído |

Não encerrar issues antigas só pela presença das telas. Atualizar critérios com evidência e manter pendências existentes.

## Novas issues propostas, sem criação remota

- P1 — Validar fluxo completo no Android físico: login, fotos, anúncios, estoque, clientes, proposta, venda e reinício. Aceite: registros e evidências reais, incluindo falha de conexão.
- P1 — Restaurar reprodutibilidade dos scripts de interface: test:ui e test:live:explore apontam arquivos ausentes. Aceite: incluir fontes oficiais faltantes ou corrigir scripts em tarefa funcional separada.
- P2 — Confirmar dados acadêmicos e roteiro: integrantes, professor, turma/período e critérios oficiais.
- P2 — Implementar persistência da rede social: manter explícito que a Home atual é demonstração local.

Financeiro permanece backlog, sem implementação nesta tarefa.

## Consolidação Editorial Preto — 16/11/2026 (branch de revisão)

A versão de referência é MOTORSYNC_EDITORIAL_PRETO_11-11.zip. A consolidação preserva os arquivos exclusivos da main, autenticação, recuperação de senha, acesso público à Home, retorno ao Perfil após login e os módulos financeiros. Não houve alteração no banco remoto.

A interface utiliza Inter e Playfair Display, preto/branco/cinza/laranja. Home social e favoritos privados possuem serviços persistentes incorporados do ZIP; funcionamento remoto depende das tabelas, bucket e RLS correspondentes. O estado anterior de Home apenas demonstrativa descreve a versão anterior: o código atual tenta integração real e sinaliza indisponibilidade. Não houve comprovação no Android ou Supabase nesta tarefa.

Os dois testes antes ausentes (finance-ui.cjs e explore-live.cjs) agora vieram no ZIP. Presença não equivale a teste aprovado. O gráfico mensal acrescenta visualização de vendas com custos conhecidos, mantendo os cálculos comerciais originais e react-native-chart-kit para os gráficos anteriores. Financeiro completo continua sem validação operacional.

Windows: configure apps/mobile/.env a partir de .env.example e execute INICIAR_MOTORSYNC.cmd ou INICIAR_TUNEL.cmd. Ambos verificam Node/npm e executam scripts/ensure-dependencies.cjs, que confere todas as dependências (incluindo as fontes) e o fingerprint de package.json/package-lock.json; se necessário executa npm ci. Não instala o Node automaticamente.

Consulte docs/consolidacao-editorial.md para resultados e limitações desta revisão. Nenhuma migração deve ser aplicada automaticamente.
