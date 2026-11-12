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
