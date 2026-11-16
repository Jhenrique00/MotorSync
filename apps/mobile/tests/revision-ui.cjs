const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../dist');
const out = path.resolve(__dirname, '../../../docs/evidence/revision-ui');
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep) && file !== root) return res.writeHead(403).end();
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
  const errors = [];
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
    page.on('pageerror', (e) => errors.push(e.message));
    fs.mkdirSync(out, { recursive: true });
    let fail = false;
    await page.route('https://kyfkizweglxuymnfkrsz.supabase.co/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/signup'))
        return route.fulfill({
          status: fail ? 400 : 200,
          contentType: 'application/json',
          body: JSON.stringify(
            fail
              ? { msg: 'Invalid signup' }
              : { id: 'test-user', identities: [{ id: 'test' }], email: 'test@example.com' },
          ),
        });
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    const btn = (name) => page.getByRole('button', { name, exact: true }).filter({ visible: true });
    await page.goto(base + '/login');
    await btn('Criar conta').click();
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('test@example.com');
    await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('PasswordTest123');
    await btn('Criar conta').click();
    await page
      .getByText('Conta criada! Confirme seu e-mail para entrar.', { exact: true })
      .waitFor();
    await page.screenshot({ path: path.join(out, 'signup-confirm.png') });
    await btn('Confirmar').click();
    await btn('Entrar').waitFor();
    assert.equal(
      await page.getByRole('textbox', { name: 'E-mail', exact: true }).inputValue(),
      'test@example.com',
    );
    fail = true;
    await btn('Criar conta').click();
    await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('PasswordTest123');
    await btn('Criar conta').click();
    await page.getByText('Cadastro não concluído', { exact: true }).waitFor();
    await btn('Confirmar').click();
    assert.equal(
      await page.getByRole('textbox', { name: 'Senha', exact: true }).inputValue(),
      'PasswordTest123',
    );
    await page.goto(base + '/explore');
    await btn('Categorias').click();
    await btn('Veículos').click();
    await btn('Carros').click();
    await page.getByText('Combustível', { exact: true }).waitFor();
    await page.getByRole('textbox', { name: 'Ano mín.', exact: true }).fill('2020');
    await btn('Ver resultados').click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await btn('Categorias').click();
    assert.equal(
      await page.getByRole('textbox', { name: 'Ano mín.', exact: true }).inputValue(),
      '2020',
    );
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Limpar filtros', exact: true })
      .click();
    await btn('Peças').click();
    await btn('Freios').click();
    assert.equal(await page.getByText('Combustível', { exact: true }).count(), 0);
    await page.getByText('Código de referência', { exact: true }).waitFor();
    await btn('Ver resultados').click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.screenshot({ path: path.join(out, 'explore.png') });
    await page.goto(base + '/management');
    await btn('Estoque').waitFor();
    await btn('Clientes').waitFor();
    assert.equal(await page.getByText('R$ 496.100', { exact: true }).count(), 0);
    await page.screenshot({ path: path.join(out, 'management.png') });
    await btn('Abrir ações rápidas').click();
    await btn('Anunciar veículo').waitFor();
    assert.equal(await btn('Novo cliente').isDisabled(), true);
    await page.screenshot({ path: path.join(out, 'actions.png') });
    await btn('Fechar').click();
    await btn('Estoque').waitFor();
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      path.join(out, 'report.json'),
      JSON.stringify(
        {
          date: new Date().toISOString(),
          api: 'mocked',
          platform: 'React Native Web / Chrome 360x800',
          checks: [
            'signup success modal and retained email',
            'signup error retains password',
            'category hierarchy and retained filters',
            'parts exclude vehicle filters',
            'management no fictitious metric',
            'actions sheet and disabled planned actions',
          ],
          errors,
        },
        null,
        2,
      ),
    );
    console.log('6 UI regression checks passed (mock API).');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await browser?.close();
    server.close();
  }
})();
