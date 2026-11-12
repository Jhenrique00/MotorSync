# Validação da preparação — 12/11/2026

- Fonte: MotorSync.zip de 08/11/2026, 121 arquivos, sem histórico .git.
- Comparação SHA-256 de todos os arquivos extraídos com as entradas originais: nenhuma divergência. Apenas documentação e .gitignore foram acrescentados.
- Executado `node --test tests/*.test.cjs`: 50 aprovados, 0 falhas, 0 ignorados. São testes locais, incluindo API simulada; não são operações reais no Supabase ou Android.
- Tentativa de instalação `npm ci --ignore-scripts --no-audit --no-fund`: falhou com ENOTFOUND ao acessar registry.npmjs.org. A instalação completa e o check do Expo não foram confirmados nesta preparação. Os scripts de instalação não foram executados.
- Não executados nesta entrega: testes de interface, Supabase real, SQL, Android físico e iOS. Evidências de conversas anteriores não foram incorporadas como resultados desta execução, pois não vieram no ZIP.
- `test:ui` referencia tests/finance-ui.cjs e `test:live:explore` referencia tests/explore-live.cjs, ambos ausentes no ZIP. Preservados sem alteração funcional.
- Busca por padrões de chaves privilegiadas, tokens GitHub, URLs PostgreSQL com senha, JWT e chaves privadas: único achado é um marcador de chave inválida na fixture de tests/foundation.test.cjs, usado para testar rejeição. Nenhuma credencial privilegiada identificada por essa busca. Isso não constitui garantia de detecção universal.
- O .env original tem somente URL e chave publicável do cliente Supabase. Ele fica preservado na cópia local e excluído do pacote para publicação e do Git. .env.example permanece disponível. Nunca publicar credenciais de contas ou service_role.
- Dependências não auditadas quanto a vulnerabilidades nesta execução; a busca de segredos não substitui auditoria de dependências.
- Repositório remoto confirmado como público, branch main, com documentação/histórico e issues existentes. Nenhum commit, push, alteração de visibilidade, issue ou Project foi criado.
- Preservação do conteúdo remoto exige comparação final com HEAD atualizado antes de qualquer publicação aprovada. Conflitos deverão ser apresentados ao proprietário.

A publicação permanece pendente de aprovação. O quadro e as issues em plano-publicacao.md são propostas locais, sem link de Project criado.
