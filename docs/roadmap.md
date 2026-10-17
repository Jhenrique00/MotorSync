# Roadmap do NandoSync

Este roadmap representa **prioridades de produto**, sem compromisso público de datas. A implementação ainda não foi iniciada neste repositório.

## Estado atual

- [x] Conceito, problema e público-alvo definidos.
- [x] Protótipos das principais áreas elaborados.
- [x] Fluxo inicial de navegação descrito.
- [x] Modelo conceitual de dados documentado.
- [ ] Código mobile, API e persistência reais.

## Etapa 1 — Base técnica

- [ ] [#5](https://github.com/Jhenrique00/NandoSync/issues/5) Configurar o projeto React Native.
- [ ] [#14](https://github.com/Jhenrique00/NandoSync/issues/14) Definir backend, API e persistência MySQL.
- [ ] [#13](https://github.com/Jhenrique00/NandoSync/issues/13) Implementar navegação mobile.
- [ ] [#12](https://github.com/Jhenrique00/NandoSync/issues/12) Implementar cadastro/login.

## Etapa 2 — Operações comerciais

- [ ] [#6](https://github.com/Jhenrique00/NandoSync/issues/6) CRUD de veículos.
- [ ] [#7](https://github.com/Jhenrique00/NandoSync/issues/7) Cadastro e acompanhamento de clientes.
- [ ] [#8](https://github.com/Jhenrique00/NandoSync/issues/8) Propostas, vendas e status de financiamentos.

## Etapa 3 — Gestão e qualidade

- [ ] [#15](https://github.com/Jhenrique00/NandoSync/issues/15) Permissões por perfil.
- [ ] [#16](https://github.com/Jhenrique00/NandoSync/issues/16) Dashboard e indicadores gerenciais.
- [ ] [#9](https://github.com/Jhenrique00/NandoSync/issues/9) Validação, testes e correções.
- [ ] [#10](https://github.com/Jhenrique00/NandoSync/issues/10) Demonstração funcional e guia de execução.

## Critérios de qualidade para um primeiro fluxo utilizável

- Aplicativo React Native inicializa e navega entre telas em dispositivo/emulador.
- Cadastro e login funcionam com validação básica.
- Ao menos o módulo de veículos permite **criar, consultar, editar e excluir**.
- Os dados continuam disponíveis após reiniciar a aplicação.
- Erros comuns e dados inválidos recebem tratamento compreensível.
- Fluxos com informações restritas são protegidos na API.
- README traz instruções realmente reproduzíveis assim que o código existir.

Os itens acima são **metas**, não funcionalidades já disponíveis.

## Fora do escopo confirmado

Integração direta com bancos, aprovação automatizada de crédito, assinatura digital e emissão de contratos. Essas possibilidades exigiriam avaliação posterior e não devem ser anunciadas como recursos existentes.

O estado mais recente das tarefas deve ser consultado nas [Issues](https://github.com/Jhenrique00/NandoSync/issues). O quadro de trabalho ideal utiliza **Backlog → Em desenvolvimento → Em revisão → Concluído**.
