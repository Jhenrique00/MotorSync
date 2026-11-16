const fs = require('fs'),
  path = require('path'),
  http = require('http'),
  assert = require('node:assert/strict'),
  crypto = require('crypto');
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
assert.equal(env.EXPO_PUBLIC_SUPABASE_URL, 'https://kyfkizweglxuymnfkrsz.supabase.co');
const client = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false } },
);
const guest = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});
const account = JSON.parse(
  fs.readFileSync(process.env.MOTORSYNC_TEST_ACCOUNT || '.env.auth-test', 'utf8'),
);
const run = crypto.randomBytes(4).toString('hex');
const title = 'Revisao Explorar ' + run;
const out = path.resolve('../../docs/evidence/explore-live', run);
fs.mkdirSync(out, { recursive: true });
const report = {
  date: new Date().toISOString(),
  api: 'real',
  mockRoutes: 0,
  android: false,
  checks: [],
  errors: [],
};
const ids = [];
let browser, page, uid;
const root = path.resolve('dist');
const server = http.createServer((req, res) => {
  let p = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root + path.sep) && p !== root) return res.writeHead(403).end();
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
const unwrap = async (q) => {
  const { data, error } = await q;
  if (error) throw Error(error.message);
  return data;
};
const button = (n) => page.getByRole('button', { name: n, exact: true }).filter({ visible: true });
const field = (n) => page.getByRole('textbox', { name: n, exact: true });
(async () => {
  try {
    const auth = await unwrap(client.auth.signInWithPassword(account));
    uid = auth.user.id;
    const rows = Array.from({ length: 24 }, (_, i) => ({
      owner_user_id: uid,
      title: title + ' ' + String(i).padStart(2, '0'),
      category: 'vehicles',
      subcategory: 'cars',
      price: 100 + i,
      location: 'Cidade de teste, BA',
      publication_status: 'published',
      attributes: {
        brand: 'Marca ' + run,
        model: i < 12 ? 'Modelo A' : 'Modelo B',
        year: '2024',
        mileage: '1000',
      },
    }));
    rows.push({ ...rows[0], title: title + ' privado', publication_status: 'draft' });
    const inserted = await unwrap(client.from('listings').insert(rows).select('id'));
    ids.push(...inserted.map((r) => r.id));
    const { createExploreApi } = await import('../src/services/exploreApi.js');
    const api = createExploreApi(guest);
    let result = await api.search({ query: title, filters: {} });
    assert.equal(result.count, 24);
    assert.equal(result.rows.length, 20);
    assert.equal((await api.search({ query: title, filters: {} }, 1)).rows.length, 4);
    result = await api.search({
      query: title,
      category: 'vehicles',
      subcategory: 'cars',
      filters: { 'price:min': '110', 'price:max': '115' },
    });
    assert.equal(result.count, 6);
    assert.equal(
      (
        await api.search({
          query: title,
          category: 'vehicles',
          subcategory: 'cars',
          filters: { brand: 'Marca ' + run, model: 'Modelo B' },
        })
      ).count,
      12,
    );
    report.checks.push(
      'API: count exact, 20+4 pagination, numeric price filter, dependent brand/model, draft excluded',
    );
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const base = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', (e) => report.errors.push(e.message));
    await page.goto(base + '/explore');
    await field('Pesquisar anúncios').fill(title);
    await page.getByText('24 anúncios encontrados', { exact: true }).waitFor();
    await button('Categorias').click();
    assert.equal(await page.getByRole('dialog').getByRole('textbox').count(), 0);
    await button('Veículos').click();
    await button('Carros').click();
    await button('Aplicar categoria').click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.getByText('24 anúncios encontrados', { exact: true }).waitFor();
    report.checks.push('UI: category-only panel applies without characteristic fields');
    await button('Filtros').click();
    await field('Preço (R$) mín.').fill('110');
    await field('Preço (R$) máx.').fill('115');
    await button('Fechar').click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await button('Filtros').click();
    assert.equal(await field('Preço (R$) mín.').inputValue(), '110');
    await button('Ver resultados').click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.getByText('6 anúncios encontrados', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(out, 'explore.png') });
    report.checks.push('UI: filters persist on close and actual database count becomes 6');
    await button('Categorias').click();
    await button('Peças').click();
    await button('Freios').click();
    await button('Aplicar categoria').click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.getByText('0 anúncios encontrados', { exact: true }).waitFor();
    await button('Filtros (2)').click();
    assert.equal(await page.getByText('Combustível', { exact: true }).count(), 0);
    await page.getByText('Código de referência', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(out, 'parts-filters.png') });
    await button('Limpar filtros').click();
    await button('Ver resultados').click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    report.checks.push(
      'UI: parts exclude vehicle fields; price retained across category change, clear filters works',
    );
    await page.goto(base + '/login');
    await field('E-mail').fill(account.email);
    await field('Senha').fill(account.password);
    await button('Entrar').click();
    await button('Meus anúncios').waitFor();
    await page.goto(base + '/management');
    await button('Abrir Financeiro').click();
    await page.getByText('Seu financeiro está sendo preparado', { exact: true }).waitFor();
    assert.equal(await button('Registrar receita').count(), 0);
    await page.screenshot({ path: path.join(out, 'finance-pending.png') });
    report.checks.push(
      'UI real: Gestão → Financeiro shows pending backend with no fake amounts or saving controls',
    );
    await page.setViewportSize({ width: 320, height: 640 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    report.checks.push('web viewport 320 px without document horizontal overflow');
    assert.deepEqual(report.errors, []);
  } catch (e) {
    report.errors.push(e.message);
    console.error(e.message);
    if (page) await page.screenshot({ path: path.join(out, 'failure.png') }).catch(() => {});
    process.exitCode = 1;
  } finally {
    for (const id of ids) {
      const { error } = await client
        .from('listings')
        .delete()
        .eq('id', id)
        .eq('owner_user_id', uid);
      if (error) report.errors.push('cleanup ' + id + ': ' + error.message);
    }
    if (ids.length)
      report.remainingTestRows = (
        await unwrap(client.from('listings').select('id').in('id', ids))
      ).length;
    await client.auth.signOut({ scope: 'local' });
    await browser?.close();
    server.close();
    report.completed = new Date().toISOString();
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ out, ...report }));
  }
})();
