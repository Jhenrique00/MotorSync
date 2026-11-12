# Publicação sujeita a aprovação

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
