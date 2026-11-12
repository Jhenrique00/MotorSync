# MotorSync

1. Extraia este ZIP.
2. Instale o Node.js 22.13 ou superior no computador e o Expo Go no Android.
3. Abra o PowerShell na pasta extraída MotorSync e execute:

   cd apps/mobile
   npm.cmd ci
   npm.cmd run start:go

4. Com o computador e o celular na mesma rede, escaneie o QR Code no Expo Go.
   Se a rede local não conectar, encerre com Ctrl+C e execute npm.cmd run start:tunnel.
5. Entre na sua conta. Em Gestão → Clientes, use Adicionar cliente ou toque em uma ficha.

O projeto contém a configuração pública do Supabase. O ZIP contém o projeto Expo.
Para instalar diretamente pelo gerenciador de arquivos do Android, é necessário um APK.
As migrações incluídas servem como referência. O banco do MotorSync já está configurado.