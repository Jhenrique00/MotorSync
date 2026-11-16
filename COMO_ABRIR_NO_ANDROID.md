# Como abrir o MotorSync no Android (Expo Go)

**Esta versão foi preparada para Expo Go, não é um APK.** Ela precisa que o servidor Expo fique aberto no computador enquanto você usa o aplicativo.

## Antes de começar

- No Windows, instale **Node.js 22.13 ou superior**, se ainda não tiver.
- No Android, use **Expo Go compatível com SDK 57**, disponível em https://expo.dev/go?sdkVersion=57&platform=android&device=true . A versão mais recente do Expo Go pode ser incompatível.
- Tenha uma conexão à internet, além do Wi-Fi para o modo local.
- Esta entrega inclui `apps/mobile/.env` **somente com URL e chave publicável** do Supabase, para não comprometer o login. Se não existir, use o `.env` da cópia anterior. Não compartilhe senhas, `service_role` ou `sb_secret_`.

## Abrir (Windows)

1. Extraia o ZIP do projeto para uma **pasta nova**, sem substituir a versão antiga.
2. Dentro da pasta `motorsync`, dê **dois cliques em `INICIAR_MOTORSYNC.cmd`**.
3. O arquivo `.env` público já está preparado. Se estiver ausente por algum motivo, o iniciador pedirá o **caminho completo do `.env` antigo**. Não é necessário copiar a senha da conta.
4. O iniciador verifica o Node.js, instala as bibliotecas com `npm ci` (somente se faltarem) e inicia o Expo. A primeira instalação exige internet.
5. Com o **computador e Android na mesma rede Wi-Fi**, abra Expo Go e escaneie o QR Code mostrado no terminal.
6. Entre na sua conta habitual. Para interromper o servidor, use **Ctrl+C** no terminal.

**Se o QR falhar na rede local:** encerre o processo com Ctrl+C e dê dois cliques em `INICIAR_TUNEL.cmd`. O túnel usa internet e pode pedir a instalação de um componente oficial do Expo.

**Se não houver um `.env` antigo:** crie `apps/mobile/.env` com os nomes de variáveis de `apps/mobile/.env.example` e preencha a chave **publicável** do seu projeto Supabase. Nunca use `service_role`, `sb_secret_` ou senha de banco no aplicativo.

## Roteiro rápido de teste antes da apresentação

1. Login → Perfil: confira e-mail e recarregue o app.
2. Gestão → Clientes: confirme que **Adicionar cliente** abre o cadastro; salve um cliente `DEMO 16-11` e abra sua ficha; edite e consulte.
3. Gestão → Estoque: cadastre um veículo de teste e confira os dados; publique um anúncio apenas se os dados estiverem corretos.
4. Explorar: confira o anúncio, sua foto e seus detalhes.
5. Gestão → Propostas: crie uma proposta **opcional** vinculada ao cliente; não confunda aceite com venda.
6. Financeiro: se for demonstrar venda, use somente um veículo **descartável** e verifique mudança para vendido e arquivamento do anúncio.
7. Feche e abra novamente o aplicativo e confirme que os **dados do Supabase** permaneceram.
8. Home: veja o feed com fotos grandes. **Até a migração social ser aprovada e aplicada**, posts e interações continuam prévias locais identificadas. Depois da ativação, teste também fotos, curtidas, comentários, respostas e posts salvos no Supabase.
9. Verifique navegação entre todas as cinco abas, tema claro/escuro, teclado, botão Voltar e mensagens sem internet.

Não exclua os registros reais de outras pessoas nem execute SQL para testar. Registre falhas com foto e mensagem do terminal. Não chame teste no navegador de validação física no Android.

## Se não funcionar

- **Node/npm não encontrado:** instale Node.js adequado e reabra o iniciador.
- **Dependências não instalam:** confira internet e espaço em disco; execute novamente; o ZIP não contém `node_modules`.
- **Supabase não configurado:** confira se `.env` está em `apps/mobile/.env` e usa `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **Expo Go incompatível:** instale a versão Android adequada ao SDK 57 no link acima.
- **Celular não conecta:** mesma rede Wi-Fi, desligue VPN se necessário, ou use `INICIAR_TUNEL.cmd`.

O banco remoto, usuários, clientes e anúncios **não são apagados** ao parar ou reinstalar o Expo.
