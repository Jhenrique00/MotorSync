const fs = require('fs'),
  path = require('path'),
  http = require('http'),
  assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const env = Object.fromEntries(
  fs
    .readFileSync('.env', 'utf8')
    .trim()
    .split(/\r?\n/)
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const out = path.resolve('../../docs/evidence/commercial');
fs.mkdirSync(out, { recursive: true });
const root = path.resolve('dist'),
  url = env.EXPO_PUBLIC_SUPABASE_URL,
  key = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert.equal(url, 'https://kyfkizweglxuymnfkrsz.supabase.co');
const client = createClient(url, key, { auth: { persistSession: false } }),
  guest = createClient(url, key, { auth: { persistSession: false } });
const server = http.createServer((req, res) => {
  let p = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(root, 'index.html');
  res.setHeader(
    'Content-Type',
    {
      '.js': 'application/javascript',
      '.html': 'text/html',
      '.png': 'image/png',
      '.ttf': 'font/ttf',
    }[path.extname(p)] || 'application/octet-stream',
  );
  fs.createReadStream(p).pipe(res);
});
let browser, page;
const report = {
  date: new Date().toISOString(),
  api: 'REAL read-only business data; Auth login/logout',
  androidPhysical: false,
  checks: [],
  errors: [],
  businessWrites: 0,
};
(async () => {
  try {
    const account = JSON.parse(fs.readFileSync('.env.redesign-test', 'utf8'));
    const response = await fetch(url + '/auth/v1/settings', { headers: { apikey: key } });
    assert.equal(response.status, 200);
    report.emailAutoConfirm = (await response.json()).mailer_autoconfirm;
    const auth = await client.auth.signInWithPassword(account);
    assert.ifError(auth.error);
    const uid = auth.data.user.id;
    const profile = await client.from('profiles').select('id,display_name').eq('id', uid).single();
    assert.ifError(profile.error);
    const others = await client.from('profiles').select('id').neq('id', uid);
    assert.ifError(others.error);
    assert.deepEqual(others.data, []);
    report.checks.push('real login/profile read; RLS hides other profiles');
    const membership = await client
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', uid);
    assert.ifError(membership.error);
    report.accountCompanyCount = membership.data.length;
    const stock = await client.from('vehicles').select('id,organization_id');
    assert.ifError(stock.error);
    assert.ok(
      stock.data.every((v) => membership.data.some((m) => m.organization_id === v.organization_id)),
    );
    const anonStock = await guest.from('vehicles').select('id');
    assert.ok(anonStock.error || anonStock.data.length === 0);
    report.checks.push('real stock read constrained to memberships; visitor has no stock access');
    const catalog = await guest
      .from('listings')
      .select('id,publication_status', { count: 'exact' })
      .limit(20);
    assert.ifError(catalog.error);
    assert.ok(catalog.data.every((l) => l.publication_status === 'published'));
    report.publicListingCount = catalog.count;
    report.checks.push('public listing consultation succeeds and returns published rows only');
    const previous = JSON.parse(
      fs.readFileSync('../../docs/evidence/live-marketplace/1bdeb89cfd/report.json', 'utf8'),
    );
    const photo = previous.photosRetained[0];
    const ownPhoto = await client.storage.from('listing-photos').download(photo);
    assert.ifError(ownPhoto.error);
    assert.ok(ownPhoto.data.size > 0);
    const privatePhoto = await guest.storage.from('listing-photos').createSignedUrl(photo, 60);
    assert.ok(privatePhoto.error);
    report.checks.push('owner downloads existing private photo; visitor cannot sign it');
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const base = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    page = await context.newPage();
    page.on('pageerror', (e) => report.errors.push(e.message));
    // Fail the test if a UI regression attempts to write business data.
    await page.route('**/rest/v1/**', async (route) => {
      if (
        route.request().method() !== 'GET' &&
        !/\/rpc\/(search_listings|listing_choices|finance_report|commercial_ready|commercial_summary)$/.test(
          new URL(route.request().url()).pathname,
        )
      ) {
        report.businessWrites++;
        await route.abort();
      } else await route.continue();
    });
    const btn = (n) => page.getByRole('button', { name: n, exact: true }).filter({ visible: true });
    await page.goto(base + '/login');
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(account.email);
    await page.getByRole('textbox', { name: 'Senha', exact: true }).fill(account.password);
    await btn('Entrar').click();
    await btn('Sair da conta').waitFor();
    await page.reload();
    await btn('Sair da conta').waitFor();
    report.checks.push('real UI login, Profile and session restoration after reload');
    await btn('Home').click();
    await context.setOffline(true);
    await btn('Perfil').click();
    await page
      .getByText('Não foi possível carregar seu perfil. Verifique a conexão.', { exact: true })
      .waitFor();
    await context.setOffline(false);
    await btn('Recarregar perfil').click();
    await page.getByText(profile.data.display_name, { exact: true }).waitFor();
    await btn('Recarregar perfil').waitFor({ state: 'hidden' });
    report.checks.push('real offline profile failure is visible and retry recovers');
    await btn('Home').click();
    await page.getByRole('button', { name: 'Ver mais', exact: true }).first().click();
    await page.getByRole('button', { name: 'Ver menos', exact: true }).first().click();
    await btn('Explorar').click();
    await page.getByText(/^\d+ anúncios? encontrad/).waitFor();
    await btn('Categorias').click();
    await btn('Veículos').click();
    await btn('Carros').click();
    await btn('Aplicar categoria').click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await btn('Filtros').click();
    await page.getByRole('textbox', { name: 'Preço (R$) mín.', exact: true }).fill('100');
    await btn('Fechar').click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await btn('Filtros').click();
    assert.equal(
      await page.getByRole('textbox', { name: 'Preço (R$) mín.', exact: true }).inputValue(),
      '100',
    );
    await btn('Ver resultados').click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await btn('Abrir ações rápidas').click();
    await btn('Anunciar veículo').click();
    await page.getByRole('textbox', { name: 'Título *', exact: true }).waitFor();
    await btn('Voltar').click();
    await btn('Gestão').click();
    await btn('Estoque').click();
    await page
      .getByText('Nenhuma empresa vinculada. Solicite o vínculo ao administrador.', { exact: true })
      .waitFor();
    await btn('Voltar').click();
    await btn('Clientes').click();
    await page
      .getByText('O fluxo comercial aguarda a atualização autorizada do banco.', { exact: true })
      .waitFor();
    await btn('Voltar').click();
    await btn('Abrir Financeiro').click();
    await page.getByText('Seu financeiro está sendo preparado', { exact: true }).waitFor();
    await btn('Voltar').click();
    await btn('Perfil').click();
    report.checks.push(
      'all five navigation areas, category/filter separation, ad form, stock no-company and unavailable modules',
    );
    await btn('Escuro').click();
    await page.reload();
    assert.equal(await page.evaluate(() => localStorage.getItem('motorsync.theme')), 'dark');
    await btn('Claro').click();
    await page.setViewportSize({ width: 320, height: 640 });
    await btn('Entrar na conta').count();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: path.join(out, 'profile-320.png') });
    report.checks.push(
      'theme preference survives reload; 320px Profile has no horizontal overflow',
    );
    await btn('Sair da conta').click();
    await btn('Entrar na conta').waitFor();
    await page.reload();
    await btn('Entrar na conta').waitFor();
    report.checks.push('real logout persists after reload');
    assert.equal(report.businessWrites, 0);
    assert.deepEqual(report.errors, []);
  } catch (e) {
    report.errors.push(e.message);
    process.exitCode = 1;
    if (page) await page.screenshot({ path: path.join(out, 'failure.png') }).catch(() => {});
  } finally {
    await client.auth.signOut({ scope: 'local' });
    await browser?.close();
    server.close();
    report.passed = report.checks.length;
    report.failed = report.errors.length;
    fs.writeFileSync(path.join(out, 'readonly.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  }
})();
