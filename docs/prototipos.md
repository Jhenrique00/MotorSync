# Interfaces e protótipo — MotorSync

O MotorSync possui um **protótipo HTML interativo desenvolvido fora deste repositório**. Ele demonstra navegação, estilos, dados fictícios e fluxos locais. **Não é uma implementação mobile de produção.**

## Mapa de telas

| Área | Experiência demonstrada ou planejada |
| --- | --- |
| Home | Feed de vídeos/fotos/texto, perfis de criadores, seguir, curtidas, comentários, descrição “ver mais” |
| Explorar | Automóveis, Autopeças, pesquisa, filtros, listas, detalhes, comparação e propostas |
| Criar (+) | Publicar vídeo, foto, texto e anunciar veículo/peça |
| Gestão | Visão geral, atenção prioritária, estoque, clientes, propostas, vendas, financeiro, OS e demais módulos |
| Perfil | Dados, favoritos, publicações, preferências e alternância de contexto demonstrativa |

## Diretrizes de interface

- Identidade MotorSync: preto, branco, cinza e laranja; preservar rigorosamente a **logo original**.
- Interface smartphone-first, barra inferior, teclado e safe areas.
- Tipografia nativa, incluindo SF Pro apenas quando disponível e licenciado.
- Modo claro e escuro, contraste consistente.
- Home prioriza mídia; texto longo começa recolhido com “ver mais / ver menos”.
- Fotos e vídeos exigem fallback e estados de erro.
- Controles do ERP são contextuais; números levam a ações e registros.

## Limites do protótipo

Os dados, preços, usuários, anúncios e indicadores são **fictícios**. O armazenamento local não é persistência em servidor. Consultas oficiais, boletos, NFS-e, assinaturas e autenticação verdadeira ainda não existem.

## Próximo passo

Versionar explicitamente o arquivo HTML de referência em uma pasta `prototype/` **quando a versão e os direitos dos assets forem revisados**; em seguida, mapear interfaces para componentes e rotas React Native. Não marcar módulos como concluídos sem teste real.

Veja [visão geral](visao-geral.md) e [roadmap](roadmap.md).
