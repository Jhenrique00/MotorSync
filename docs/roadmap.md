# Roadmap do MotorSync

Este documento descreve **prioridades**, não datas prometidas. O código mobile e o backend ainda não estão versionados neste repositório. As Issues antigas de NandoSync representam histórico do escopo anterior e devem ser reavaliadas.

## Estado atual

- [x] Identidade e conceito MotorSync definidos.
- [x] Navegação e fluxos explorados em protótipo HTML externo.
- [x] Módulos de comunidade, marketplace e Gestão mapeados.
- [ ] Código React Native e Expo real versionado.
- [ ] Autenticação segura e banco persistente.
- [ ] Deploy, CI e testes em aparelhos físicos.

## Fase 1 — Fundação

- [ ] Auditar HTML de referência e estabelecer inventário de funcionalidades.
- [ ] Inicializar React Native + Expo Router + TypeScript.
- [ ] Estabelecer design system, tema claro/escuro e navegação.
- [ ] Definir backend e preparar migrações, RLS, ambientes e autenticação.
- [ ] Configurar testes, lint e CI.

## Fase 2 — Comunidade funcional

- [ ] Usuários reais, perfis e sessão.
- [ ] Upload e armazenamento persistente de fotos/vídeos.
- [ ] Feed, comentários, curtidas, favoritos, seguir criadores e estados de erro.

## Fase 3 — Marketplace funcional

- [ ] Publicar anúncios de veículos e peças, com propriedade verificada.
- [ ] Pesquisa, filtros, categorias e comparação.
- [ ] Favoritos, detalhes, propostas e comunicação com o anunciante.

## Fase 4 — Gestão conectada

- [ ] Estoque, Clientes, Propostas e Vendas conectados a anúncios reais.
- [ ] Permissões de vendedor, gerente e administrador.
- [ ] Regras transacionais de reserva, venda e histórico.
- [ ] Indicadores financeiros corretos e pendências acionáveis.

## Fase 5 — Módulos complementares e lançamento

- [ ] Financeiro, ordens de serviço, contratos, documentos, tarefas, relatórios.
- [ ] Testes de segurança, desempenho, privacidade e acessibilidade.
- [ ] Builds Android/iOS e testes em dispositivos.
- [ ] Estudar integrações oficiais e serviços regulados com fornecedores autorizados.

## Definição de pronto para o MVP

- Login e sessões reais, acesso por perfil seguro.
- Anúncios e publicações persistentes entre dispositivos.
- Propostas no marketplace vinculadas ao CRM.
- Venda e reserva consistentes mesmo com uso concorrente.
- Fluxos testados e documentação de instalação reproduzível.

Não anunciar FIPE, DETRAN/Senatran, boletos ou NFS-e como integrados até existirem testes com serviços reais.
