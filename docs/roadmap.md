# Roadmap do MotorSync — estado em 18/11/2026

Este roadmap separa implementação encontrada no ZIP, validação pendente e funcionalidades futuras. Não trate tela ou serviço no código como prova de homologação em dispositivo ou backend remoto.

## Estado atual do snapshot editorial

- [x] Conceito MotorSync: comunidade automotiva, marketplace e gestão.
- [x] Aplicativo React Native/Expo com Expo Router e JavaScript/JSX.
- [x] Navegação inferior em cinco posições.
- [x] Tema claro/escuro, tokens visuais, identidade e tipografia.
- [x] Integração de cliente Supabase Auth/PostgreSQL/Storage no código.
- [x] Código de Home social, Explorar, estoque e gestão comercial.
- [x] 100 testes Node aprovados no ZIP em 18/11/2026.
- [x] Código e migrações do ZIP editorial importados na branch do PR #22.
- [ ] Revisar e integrar o PR à `main`.
- [ ] Homologação ponta a ponta no Android físico ou emulador.
- [ ] Confirmação remota da migração de favoritos privados.
- [ ] Atualização e uso regular do GitHub Projects.

## Prioridade imediata — entrega acadêmica Fase 2

1. Revisar a atualização do código no PR #22.
2. Executar login e CRUD completo (preferencialmente Clientes) no Android.
3. Comprovar persistência após reiniciar o aplicativo.
4. Validar erros, rede indisponível, validações e isolamento por usuário.
5. Validar Home social e marketplace sem afirmar como homologado o que ainda não foi testado.
6. Atualizar GitHub Projects com tarefas e estados apoiados por evidência.
7. Preparar vídeo de até 10 minutos e enviar links pelo AVA.

## Próximas etapas do produto

### Comunidade
- Persistência e homologação de publicação, mídia, curtidas, comentários, respostas e posts salvos.
- Seguir perfis com persistência.
- Vídeo, notificações e moderação em etapas posteriores.

### Marketplace
- Homologar cadastro, edição, filtros, fotos e favoritos entre contas.
- Propostas e comunicação comprador-vendedor.
- Ampliar categorias de veículos, peças e acessórios com dados consistentes.

### Gestão
- Homologar Estoque, Clientes, Propostas e Vendas.
- Validar permissões pessoais e por organização.
- Preservar transações, prevenção de venda duplicada e separação entre faturamento e lucro.

### Complementos
- Ordens de serviço, contratos, documentos, tarefas, relatórios e integrações futuras somente após validar fornecedores e requisitos.
- Não declarar FIPE, DETRAN/Senatran, serviços financeiros, assinatura eletrônica ou emissão fiscal como integrados sem prova técnica.

## Definição de pronto para a entrega acadêmica

Login/cadastro, múltiplas telas, CRUD persistente completo, validação, tratamento de erros e demonstração em dispositivo físico ou emulador, com README e vídeo conforme o regulamento institucional.
