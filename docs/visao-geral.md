# Visão geral do MotorSync

## Produto

O **MotorSync** é um ecossistema mobile automotivo que integra **comunidade/rede social**, **marketplace de veículos, peças e acessórios** e **gestão empresarial ERP/CRM**. Conecta pessoas físicas, criadores, vendedores, oficinas, revendas, concessionárias e empresas de autopeças.

O snapshot editorial analisado em 18/11/2026 contém aplicativo React Native com Expo Router, JavaScript/JSX e integração de serviços Supabase. A existência do código não significa que todos os fluxos foram homologados no Android ou que todas as migrações estão aplicadas no banco remoto.

## Problemas que resolve

- Conteúdo automotivo e anúncios ficam espalhados entre aplicativos.
- Compradores têm dificuldade para comparar ofertas e conversar com anunciantes.
- Empresas acompanham estoque, clientes e propostas em ferramentas desconectadas.

## Experiência do usuário

- **Home:** feed de publicações automotivas, fotos, autoria, curtidas, comentários, respostas e posts salvos; posts podem ter vínculo com anúncios.
- **Explorar:** marketplace de veículos e peças, categorias, anúncios, pesquisa, filtros, detalhes e vendedores.
- **Criar (+):** ponto de entrada para criar publicação, anúncio ou item de estoque.
- **Gestão:** visão geral e acessos principais a Estoque, Clientes e Propostas; fluxo de Vendas e resultados comerciais/financeiros.
- **Perfil:** conta, publicações, anúncios, coleção/favoritos e preferências.

## Navegação principal

Cinco posições fixas: **Home · Explorar · Criar (+) · Gestão · Perfil**.

## Públicos e permissões

- **Pessoa física:** conteúdo, anúncios e gestão pessoal.
- **Pessoa jurídica:** organização com anúncios e operação empresarial.
- **Vendedor:** acesso comercial autorizado por organização.
- **Gerente/administrador:** permissões ampliadas conforme papel.

A autorização deve ser verificada no backend e no banco. Ocultar botões na interface não protege dados.

## Integração entre áreas

Uma publicação na Home pode levar a um anúncio no Explorar. Um interessado pode iniciar uma proposta que aparece na Gestão da empresa responsável. A venda concluída deve atualizar estoque, anúncio e indicadores em operação consistente, sem expor informações privadas.

## Identidade visual

Paleta neutra preto/branco/cinza com laranja `#FF6B00`, temas claro e escuro, componentes mobile e tipografia consistente. Preservar a logo original e a navegação.

## Limitações e estado de validação

O ZIP contém integração de cliente Supabase e migrações. A migração social é descrita como aplicada na documentação do pacote, mas ainda falta homologação autenticada completa no Android. A migração de favoritos privados tem estado remoto contraditório e requer confirmação. Seguir perfis, notificações, chat e integrações oficiais/financeiras não devem ser apresentados como recursos concluídos sem implementação e testes específicos.

Consulte [arquitetura](arquitetura.md), [modelo de dados](modelo-de-dados.md), [status técnico](status-2026-11-18.md) e [roadmap](roadmap.md).
