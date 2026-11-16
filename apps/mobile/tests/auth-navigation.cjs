const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../dist');
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.setHeader(
    'Content-Type',
    file.endsWith('.js')
      ? 'application/javascript'
      : file.endsWith('.html')
        ? 'text/html'
        : 'application/octet-stream',
  );
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser;
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const base = 'http://127.0.0.1:' + server.address().port;
    let vehicles = [],
      offline = false;
    let profile = null,
      logouts = 0,
      signups = 0;
    const user = {
      id: 'b0000000-0000-4000-8000-000000000001',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: { provider: 'email' },
      user_metadata: {},
      created_at: new Date().toISOString(),
    };
    const token = [
      'eyJhbGciOiJIUzI1NiJ9',
      Buffer.from(
        JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 }),
      ).toString('base64url'),
      'test',
    ].join('.');
    await page.route('https://kyfkizweglxuymnfkrsz.supabase.co/**', async (route) => {
      const req = route.request(),
        url = new URL(req.url()),
        body = req.postDataJSON();
      let data = {};
      if (url.pathname.endsWith('/signup')) {
        signups++;
        data = { user, session: null };
      } else if (url.pathname.endsWith('/token')) {
        data = {
          access_token: token,
          refresh_token: 'test-refresh',
          token_type: 'bearer',
          expires_in: 3600,
          user,
        };
      } else if (url.pathname.endsWith('/user')) data = user;
      else if (url.pathname.endsWith('/logout')) {
        logouts++;
        await route.fulfill({ status: 204 });
        return;
      } else if (url.pathname.includes('/profiles')) {
        if (req.method() === 'POST' || req.method() === 'PATCH')
          profile = { id: user.id, display_name: body.display_name };
        data = profile;
      } else if (url.pathname.includes('/organization_members'))
        data = [
          { organization_id: 'org-a', role: 'owner', organizations: { name: 'Empresa teste' } },
        ];
      else if (url.pathname.includes('/vehicles')) {
        if (offline) {
          await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Conexão indisponível' }),
          });
          return;
        }
        if (req.method() === 'POST') {
          data = { id: 'vehicle-a', created_at: new Date().toISOString(), ...body };
          vehicles.push(data);
        } else if (req.method() === 'PATCH') {
          Object.assign(vehicles[0], body);
          data = vehicles[0];
        } else if (req.method() === 'DELETE') {
          data = { id: vehicles[0].id };
          vehicles = [];
        } else data = url.searchParams.has('id') ? vehicles[0] : vehicles;
      } else throw Error('Unexpected endpoint ' + url.pathname);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    });
    const button = (n) => page.getByRole('button', { name: n, exact: true });
    await page.goto(base + '/login');
    await button('Cadastrar conta').click();
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(user.email);
    await page.getByLabel('Senha', { exact: true }).fill('Test-password-123');
    await button('Criar conta').click();
    await page
      .getByText('Confira seu e-mail para confirmar o cadastro e depois entre na conta.', {
        exact: true,
      })
      .waitFor();
    assert.equal(signups, 1);
    await button('Já tenho conta').click();
    await page.getByLabel('Senha', { exact: true }).fill('Test-password-123');
    await button('Entrar').click();
    await page.getByRole('textbox', { name: 'Nome de exibição', exact: true }).fill('Pessoa teste');
    await button('Salvar nome').click();
    await page.getByText('Nome salvo no servidor.', { exact: true }).waitFor();
    assert.equal(profile.display_name, 'Pessoa teste');
    await page.reload();
    await page.getByRole('textbox', { name: 'Nome de exibição', exact: true }).waitFor();
    assert.equal(
      await page.getByRole('textbox', { name: 'Nome de exibição', exact: true }).inputValue(),
      'Pessoa teste',
    );
    await page.goto(base + '/management/inventory');
    await button('Empresa teste').click();
    await page
      .getByRole('textbox', { name: 'Marca e modelo', exact: true })
      .fill('Carro acadêmico');
    await button('Salvar veículo').click();
    await page
      .getByText('Informe um preço maior que zero, com até duas casas decimais.', { exact: true })
      .waitFor();
    assert.equal(vehicles.length, 0);
    await page.getByRole('textbox', { name: 'Preço (R$)', exact: true }).fill('100,50');
    await button('Salvar veículo').click();
    await button('Editar').waitFor();
    assert.equal(vehicles[0].price, 100.5);
    await page.goto(base + '/explore');
    await button('Ver Carro acadêmico').click();
    await page.getByText('Detalhes do veículo', { exact: true }).waitFor();
    await page.goto(base + '/management/inventory');
    await button('Empresa teste').click();
    await button('Editar').click();
    await page.getByRole('textbox', { name: 'Preço (R$)', exact: true }).fill('200');
    await button('Salvar veículo').click();
    await page.getByText(/R\$\s200,00/, { exact: true }).waitFor();
    await page.reload();
    await button('Empresa teste').click();
    await page.getByText(/R\$\s200,00/, { exact: true }).waitFor();
    offline = true;
    await button('Atualizar estoque').click();
    await page
      .getByText('Não foi possível carregar os veículos. Tente novamente.', { exact: true })
      .waitFor();
    offline = false;
    await button('Tentar novamente').click();
    await button('Excluir').click();
    await button('Confirmar exclusão').click();
    await page.getByText('Nenhum veículo cadastrado.', { exact: true }).waitFor();
    assert.equal(vehicles.length, 0);
    await page.goto(base + '/explore');
    await page.getByText('Nenhum anúncio encontrado', { exact: true }).waitFor();
    assert.equal(await button('Ver Carro acadêmico').count(), 0);
    await page.goto(base + '/profile');
    await button('Sair da conta').click();
    await button('Entrar na conta').waitFor();
    await page.reload();
    await button('Entrar na conta').waitFor();
    assert.equal(logouts, 1);
    assert.deepEqual(errors, []);
    console.log(
      'PASS: vehicle CRUD, validation, explore/details, offline retry, reload persistence, signup confirmation, login, profile save/read, restored session, logout, reload signed out (mock HTTP, no real email sent).',
    );
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
