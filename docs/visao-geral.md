# Visão geral do MotorSync

## Produto

O **MotorSync** une **comunidade automotiva**, **marketplace de veículos/peças** e **gestão empresarial (ERP/CRM)** no mesmo produto mobile. Ele não pertence a uma loja específica: conecta pessoas físicas, criadores, vendedores, oficinas, revendas, concessionárias e empresas de autopeças.

**Estado:** existe um protótipo HTML interativo desenvolvido separadamente, com simulações e dados locais. Este repositório ainda contém documentação; não há aplicativo mobile de produção, servidor ou banco de dados real versionados aqui.

## Problemas que resolve

- Conteúdo automotivo e anúncios ficam espalhados entre aplicativos.
- Compradores têm dificuldade para comparar ofertas e conversar com anunciantes.
- Empresas acompanham estoque, clientes e propostas em ferramentas desconectadas.

## Experiência do usuário

- **Home:** feed social de fotos/vídeos/texto, criadores, curtidas, comentários, favoritos e descrição expansível; conteúdos podem apontar a anúncios.
- **Explorar:** categorias expansíveis **Automóveis** e **Autopeças**, anúncios em destaque, popularidade identificada com transparência, listagem comum, filtros e comparação.
- **Criar (+):** foto, vídeo, texto ou anúncio, com validações e pré-visualização.
- **Gestão:** visão geral, pendências acionáveis, Estoque, Clientes, Propostas e Vendas como acessos principais; demais módulos agrupados.
- **Perfil:** conta pessoal, publicações, anúncios, favoritos, preferências e contexto empresarial.

## Públicos e permissões

- **Pessoa física:** conteúdo, anúncios e negociações próprias.
- **Pessoa jurídica:** organização com anúncios e operação empresarial.
- **Vendedor:** acesso comercial autorizado por organização.
- **Gerente/administrador:** permissões ampliadas, custos e indicadores conforme regras.

No aplicativo real, acesso deverá ser verificado **no servidor e no banco**; ocultar botões na tela não basta.

## Diferencial

Uma publicação da Home pode levar ao anúncio no Explorar; uma proposta criada ali poderá abrir uma negociação no CRM da empresa. Esse vínculo precisa utilizar identificadores consistentes e regras transacionais.

## Limitações importantes

Não há login seguro, upload em servidor, pagamentos, emissão fiscal, boleto real ou consulta oficial implementados neste repositório. O protótipo HTML não deve ser confundido com ambiente de produção.

Consulte [arquitetura](arquitetura.md), [dados](modelo-de-dados.md) e [roadmap](roadmap.md).
