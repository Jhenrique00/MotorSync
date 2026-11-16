const fs = require('fs'),
  path = require('path'),
  http = require('http'),
  assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve('dist'),
  out = path.resolve('../../docs/evidence/refactor-2026-11-06');
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  let p = path.resolve(root, '.' + req.url.split('?')[0]);
  if (!p.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(root, 'index.html');
  res.setHeader(
    'Content-Type',
    p.endsWith('.js')
      ? 'application/javascript'
      : p.endsWith('.html')
        ? 'text/html'
        : 'application/octet-stream',
  );
  fs.createReadStream(p).pipe(res);
});
const report = {
  date: new Date().toISOString(),
  api: 'SIMULATED HTTP; no real business writes',
  checks: [],
  errors: [],
};
let browser, page;
(async () => {
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const base = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', (e) => report.errors.push(e.message));
    const user = {
      id: 'a1111111-1111-4111-8111-111111111111',
      email: 'fixture@example.invalid',
      aud: 'authenticated',
      role: 'authenticated',
      identities: [{ id: 'fixture' }],
      app_metadata: { provider: 'email' },
      user_metadata: {},
    };
    const token = [
      'eyJhbGciOiJIUzI1NiJ9',
      Buffer.from(
        JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 }),
      ).toString('base64url'),
      'fixture',
    ].join('.');
    const session = {
      access_token: token,
      refresh_token: 'fixture',
      token_type: 'bearer',
      expires_in: 3600,
      user,
    };
    let confirm = true,
      logouts = 0,
      rows = [],
      writes = 0,
      failStock = false;
    await page.route('https://kyfkizweglxuymnfkrsz.supabase.co/**', async (route) => {
      const req = route.request(),
        u = new URL(req.url()),
        body = req.postDataJSON();
      let data = [],
        status = 200,
        headers = {};
      if (u.pathname.endsWith('/signup')) data = confirm ? user : session;
      else if (u.pathname.endsWith('/token')) data = session;
      else if (u.pathname.endsWith('/user')) data = user;
      else if (u.pathname.endsWith('/logout')) {
        logouts++;
        return route.fulfill({ status: 204 });
      } else if (u.pathname.endsWith('/profiles')) data = { id: user.id, display_name: 'Fixture' };
      else if (u.pathname.endsWith('/organization_members'))
        data = [
          {
            organization_id: 'org-fixture',
            role: 'owner',
            organizations: { name: 'Empresa simulada' },
          },
        ];
      else if (u.pathname.endsWith('/vehicles')) {
        if (failStock) {
          status = 503;
          data = { message: 'Temporary test failure' };
        } else if (req.method() === 'POST') {
          data = { ...body, id: 'vehicle-fixture', created_at: new Date().toISOString() };
          rows.push(data);
          writes++;
        } else if (req.method() === 'PATCH') {
          Object.assign(rows[0], body);
          data = rows[0];
          writes++;
        } else if (req.method() === 'DELETE') {
          data = { id: rows[0].id };
          rows = [];
          writes++;
        } else data = rows;
      } else if (u.pathname.includes('/rpc/')) {
        status = 404;
        data = { code: 'PGRST202', message: 'Unavailable in fixture' };
      } else if (u.pathname.endsWith('/listings')) {
        const offset = Number(u.searchParams.get('offset') || 0),
          limit = Number(u.searchParams.get('limit') || 20);
        const all = Array.from({ length: 24 }, (_, i) => ({
          id: `b1111111-1111-4111-8111-${String(i).padStart(12, '0')}`,
          title: 'Anúncio simulado ' + i,
          price: 100 + i,
          category: 'vehicles',
          subcategory: 'cars',
          attributes: {},
          publication_status: 'published',
          photo_paths: [],
          location: 'Cidade de teste',
        }));
        data = all.slice(offset, offset + limit);
        headers = {
          'Content-Range': `${offset}-${offset + data.length - 1}/24`,
          'Access-Control-Expose-Headers': 'Content-Range',
        };
      }
      await route.fulfill({
        status,
        headers,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    });
    const btn = (n) => page.getByRole('button', { name: n, exact: true }).filter({ visible: true }),
      field = (n) => page.getByRole('textbox', { name: n, exact: true });
    await page.goto(base + '/login');
    await btn('Criar conta').click();
    await field('E-mail').fill(user.email);
    await field('Senha').fill('Password123');
    await btn('Criar conta').click();
    await page
      .getByText('Conta criada! Confirme seu e-mail para entrar.', { exact: true })
      .waitFor();
    await btn('Confirmar').click();
    await btn('Entrar').waitFor();
    report.checks.push('signup respects confirmation-required response');
    confirm = false;
    await btn('Criar conta').click();
    await field('Senha').fill('Password123');
    await btn('Criar conta').click();
    await page
      .getByText('Tudo pronto. Sua conta já está conectada ao MotorSync.', { exact: true })
      .waitFor();
    await btn('Confirmar').click();
    await btn('Sair da conta').waitFor();
    assert.equal(logouts, 0);
    report.checks.push('signup with immediate session keeps login and opens Profile');
    await page.goto(base + '/management/inventory');
    await btn('Empresa simulada').click();
    await field('Marca e modelo').fill('Veículo simulado');
    await field('Preço (R$)').fill('-1');
    await btn('Salvar veículo').click();
    await page
      .getByText('Informe um preço maior que zero, com até duas casas decimais.', { exact: true })
      .waitFor();
    assert.equal(writes, 0);
    report.checks.push('invalid stock price rejected before request');
    await field('Preço (R$)').fill('100,25');
    await btn('Salvar veículo').click();
    await page.getByText('Veículo simulado', { exact: true }).waitFor();
    assert.equal(rows[0].price, 100.25);
    await btn('Editar').click();
    await field('Marca e modelo').fill('Veículo atualizado');
    await btn('Salvar veículo').click();
    await page.getByText('Veículo atualizado', { exact: true }).waitFor();
    await page.reload();
    await btn('Empresa simulada').click();
    await page.getByText('Veículo atualizado', { exact: true }).waitFor();
    report.checks.push('stock create/edit/reload with simulated persistence');
    failStock = true;
    await btn('Atualizar estoque').click();
    await page
      .getByText('Não foi possível carregar os veículos. Tente novamente.', { exact: true })
      .waitFor();
    failStock = false;
    await btn('Tentar novamente').click();
    await page.getByText('Veículo atualizado', { exact: true }).waitFor();
    report.checks.push('stock connection failure and retry');
    await btn('Excluir').click();
    assert.equal(rows.length, 1);
    await btn('Manter veículo').click();
    assert.equal(rows.length, 1);
    await btn('Excluir').click();
    await btn('Confirmar exclusão').click();
    await page.getByText('Nenhum veículo cadastrado.', { exact: true }).waitFor();
    assert.equal(rows.length, 0);
    report.checks.push('stock cancel deletion and confirmed deletion');
    await page.goto(base + '/explore');
    await page.getByText('24 anúncios encontrados', { exact: true }).waitFor();
    await btn('Próxima').click();
    await page.getByText('Página 2 de 2', { exact: true }).waitFor();
    await page.waitForTimeout(150);
    const searchBox = await field('Pesquisar anúncios').boundingBox();
    assert.ok(searchBox.y >= 0 && searchBox.y < 844);
    report.checks.push('changing result page returns to top');
    await btn('Categorias').click();
    await btn('Veículos').click();
    await btn('Carros').click();
    assert.equal(await btn('Carros').getAttribute('aria-pressed'), 'true');
    await btn('Aplicar categoria').click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    report.checks.push('category selection is marked and applies');
    await btn('Abrir ações rápidas').click();
    await btn('Anunciar veículo').waitFor();
    assert.equal(await btn('Novo cliente').count(), 0);
    await btn('Criar publicação').waitFor();
    await page.screenshot({ path: path.join(out, 'create-390.png') });
    await btn('Fechar').click();
    report.checks.push('create includes social publishing alongside marketplace and management');
    await btn('Gestão').click();
    await btn('Estoque').click();
    await btn('Empresa simulada').click();
    await field('Marca e modelo').waitFor();
    report.checks.push('management stock shortcut opens inventory');
    assert.deepEqual(report.errors, []);
  } catch (e) {
    report.errors.push(e.message);
    process.exitCode = 1;
    if (page) await page.screenshot({ path: path.join(out, 'mock-failure.png') }).catch(() => {});
  } finally {
    report.passed = report.checks.length;
    report.failed = report.errors.length;
    fs.writeFileSync(path.join(out, 'mocked.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    await browser?.close();
    server.close();
  }
})();
