# Redesign editorial (11/11/2026)
Somente interface. Sem alterações em banco, serviços, auth, rotas, cálculos ou navegação.

## Fontes (licença OFL-1.1)
- Playfair Display 600/700: títulos de tela, seções, destaques editoriais.
- Inter 400/500/600/700: textos, botões (500), formulários, preços, gráficos; números tabulares.
- Pacotes: @expo-google-fonts/inter e @expo-google-fonts/playfair-display (imports por peso). Carregadas em app/_layout.jsx; falha de carga não bloqueia o app.
- Centralizado em src/theme/fonts.js, tokens.js e feedTypography.js.

## Visual
Gestão: cartão grafite com valor em destaque. Feed: foto maior com gradiente discreto. Cabeçalhos com fio laranja. Laranja #FF6B00 preservado.

## Testes
100 automatizados OK (testes de tipografia atualizados para a nova diretriz); bundles Android e web compilados.
Não executados: Supabase real, Android físico, iOS, captura visual.

## Preto neutro (11/11)
Tema escuro sem azul: fundo #000000, superfícies #0D0D0D/#171717, bordas #2A2A2A, painel grafite #111111. Claro com cinzas neutros.
