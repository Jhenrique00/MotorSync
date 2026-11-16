# Modelo lógico extraído do SQL do ZIP

Este documento descreve o código de migração, não uma inspeção atual do banco remoto.

| Entidade | Finalidade e relações |
| --- | --- |
| auth.users / profiles | Conta autenticada e perfil |
| organizations / organization_members | Empresa e associação entre usuário, empresa e função |
| vehicles | Estoque privado; propriedade pessoal ou empresarial após migração de gestão pessoal |
| listings | Anúncio pessoal/empresarial, estado de publicação, atributos e referências de fotos; vínculo opcional com veículo |
| customers | Cliente privado de um proprietário ou empresa |
| proposals | Proposta vinculada ao cliente, veículo e opcionalmente anúncio |
| sales | Venda vinculada a veículo, cliente e proposta opcional no fluxo pessoal |
| proposal_events | Histórico de eventos da proposta |
| financial_sales / financial_entries / financial_cancellations | Estruturas do SQL financeiro de referência; operação remota não comprovada |

As migrações comerciais usam funções transacionais, restrições de integridade e RLS. A migração de gestão pessoal acrescenta escopo de propriedade e relações compostas para impedir mistura entre proprietários/empresas. O estoque não deve tornar custos e dados privados públicos ao publicar anúncio. Fotos ficam no Storage privado; regras de acesso dependem de propriedade, equipe e publicação.

Não há entidade persistente de rede social usada pelo feed desta versão: Home consome dados locais de demonstração.

## Consolidação Editorial Preto — 16/11/2026 (branch de revisão)

A versão de referência é MOTORSYNC_EDITORIAL_PRETO_11-11.zip. A consolidação preserva os arquivos exclusivos da main, autenticação, recuperação de senha, acesso público à Home, retorno ao Perfil após login e os módulos financeiros. Não houve alteração no banco remoto.

A interface utiliza Inter e Playfair Display, preto/branco/cinza/laranja. Home social e favoritos privados possuem serviços persistentes incorporados do ZIP; funcionamento remoto depende das tabelas, bucket e RLS correspondentes. O estado anterior de Home apenas demonstrativa descreve a versão anterior: o código atual tenta integração real e sinaliza indisponibilidade. Não houve comprovação no Android ou Supabase nesta tarefa.

Os dois testes antes ausentes (finance-ui.cjs e explore-live.cjs) agora vieram no ZIP. Presença não equivale a teste aprovado. O gráfico mensal acrescenta visualização de vendas com custos conhecidos, mantendo os cálculos comerciais originais e react-native-chart-kit para os gráficos anteriores. Financeiro completo continua sem validação operacional.

Windows: configure apps/mobile/.env a partir de .env.example e execute INICIAR_MOTORSYNC.cmd ou INICIAR_TUNEL.cmd. Ambos verificam Node/npm e executam scripts/ensure-dependencies.cjs, que confere todas as dependências (incluindo as fontes) e o fingerprint de package.json/package-lock.json; se necessário executa npm ci. Não instala o Node automaticamente.

Consulte docs/consolidacao-editorial.md para resultados e limitações desta revisão. Nenhuma migração deve ser aplicada automaticamente.
