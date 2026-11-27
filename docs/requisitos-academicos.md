# Requisitos acadêmicos — Desenvolvimento Mobile

**Fonte:** `Projeto_Conclusao_Desenvolvimento_Mobile.pdf`, orientações das Fases 1 e 2.  
**Curso:** Sistemas de Informação.  
**Disciplina:** Desenvolvimento Mobile.

Este documento transcreve e organiza os requisitos relevantes para a entrega do MotorSync. Em caso de dúvida, o PDF institucional é a referência.

## Fase 2 — apresentação do aplicativo

**Datas indicadas no documento:** 24 e 26 de novembro, durante a aula.

### Requisitos mínimos

1. Aplicação desenvolvida obrigatoriamente em React Native.
2. Navegação entre múltiplas telas.
3. Interface adequada para dispositivos móveis.
4. Persistência por banco de dados ou serviço escolhido.
5. Cadastro de usuário e login (não contam como CRUD).
6. Pelo menos uma funcionalidade com criação, consulta, alteração e exclusão (CRUD), quando aplicável.
7. Validação básica dos dados inseridos.
8. Tratamento básico de erros e situações inesperadas.
9. Demonstração de um fluxo completo de utilização.

### Apresentação prática

A apresentação deve combinar breve explicação e demonstração funcionando:

- problema e público-alvo;
- solução desenvolvida;
- principais funcionalidades;
- persistência dos dados;
- tecnologias utilizadas;
- banco de dados/serviço de persistência;
- dificuldades e melhorias futuras.

### Fluxo sugerido pela instituição

1. Abrir o aplicativo.
2. Realizar login ou acessar a tela inicial.
3. Cadastrar/inserir uma informação.
4. Consultar os dados cadastrados.
5. Alterar uma informação.
6. Excluir ou concluir uma operação.
7. Demonstrar que os dados permanecem armazenados.

### Entregáveis

- Aplicativo funcionando para demonstração.
- Código-fonte React Native em repositório GitHub.
- README na raiz do diretório do código-fonte, com tecnologias, modelo lógico do banco e configuração para executar.
- Vídeo de demonstração de no máximo 10 minutos, armazenado no Google Drive.
- Links do repositório e do vídeo enviados pela atividade no AVA.

## Critérios de avaliação — Fase 2

| Critério | Pontuação |
| --- | ---: |
| Funcionamento e completude | 3,0 |
| Persistência, banco de dados e CRUD | 2,0 |
| Interface e experiência do usuário | 3,0 |
| Apresentação e domínio técnico | 1,0 |
| Organização do código e testes | 1,0 |
| **Total** | **10,0** |

## GitHub Projects

Na Fase 1, o documento orienta manter um GitHub Project associado ao repositório, com atividades registradas e status como **A Fazer**, **Em Desenvolvimento**, **Em Teste** e **Concluído**. Commits, issues e pull requests podem registrar a evolução técnica.

## Prioridade de execução para MotorSync

Para cumprir a Fase 2, priorizar um fluxo que possa ser demonstrado de ponta a ponta, por exemplo:

1. Login.
2. Acessar Gestão.
3. Cadastrar cliente.
4. Consultar o cliente.
5. Editar dados.
6. Fechar e reabrir o aplicativo para confirmar que a edição foi persistida.
7. Excluir um cliente de teste sem histórico comercial e confirmar que ele não reaparece. Para clientes com histórico, demonstrar o arquivamento como regra de negócio.

Não apresentar testes unitários isolados, dados de demonstração ou telas estáticas como prova de persistência remota. O fluxo deve ser testado no aparelho físico ou emulador.
