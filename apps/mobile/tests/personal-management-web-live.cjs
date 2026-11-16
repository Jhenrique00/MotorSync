// Real browser + real API. No route interception, no business mutations.
const fs = require('fs'),
  path = require('path'),
  http = require('http'),
  assert = require('node:assert/strict');
const { chromium } = require('playwright');
const runs = path.resolve('../../docs/evidence/personal-management-live');
const latest = fs
  .readdirSync(runs)
  .map((name) => ({ name, time: fs.statSync(path.join(runs, name)).mtimeMs }))
  .sort((a, b) => b.time - a.time)[0].name;
const out = path.join(runs, latest),
  apiReport = JSON.parse(fs.readFileSync(path.join(out, 'report.json'), 'utf8'));
assert.equal(apiReport.failed, 0);
const account = JSON.parse(fs.readFileSync('.env.redesign-test', 'utf8'));
const root = path.resolve('dist'),
  report = {
    date: new Date().toISOString(),
    mode: 'REAL browser + Supabase; no mocks; no business writes',
    physicalAndroid: false,
    checks: [],
    errors: [],
  };
const server = http.createServer((req, res) => {
  let p = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
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
let browser, context, page;
(async () => {
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const base = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    page = await context.newPage();
    page.on('pageerror', (e) => report.errors.push(e.message));
    const btn = (name) => page.getByRole('button', { name, exact: true }).filter({ visible: true }),
      field = (name) => page.getByRole('textbox', { name, exact: true });
    await page.goto(base + '/login');
    await field('E-mail').fill(account.email);
    await field('Senha').fill(account.password);
    await btn('Entrar').click();
    await btn('Sair da conta').waitFor();
    await page.goto(base + '/management/clients');
    await field('Pesquisar clientes').fill(apiReport.run);
    assert.equal(await field('Nome do cliente *').count(), 0);
    assert.equal(await btn('Excluir cliente').count(), 0);
    await btn('Adicionar cliente').click();
    await field('Nome do cliente *').waitFor();
    await btn('Cancelar cadastro').click();
    await btn(`Ficha de Teste real ${apiReport.run}`).click();
    await page.getByText('Histórico comercial', { exact: true }).waitFor();
    await page
      .getByText(/Venda: Teste real/)
      .first()
      .waitFor();
    await page.screenshot({ path: path.join(out, 'client-real-web.png') });
    report.checks.push('personal customer and commercial history rendered from real database');
    await page.goto(base + '/finance');
    await field('Pesquisar vendas').fill(apiReport.run);
    await page.getByText('2 vendas concluídas', { exact: true }).waitFor();
    await page.getByText('Lucro bruto apurado: R$ 75,00', { exact: true }).waitFor();
    await page.getByText(/1 vendas com custos desconhecidos/).waitFor();
    await page.screenshot({ path: path.join(out, 'results-real-web.png') });
    report.checks.push('real sales and profit rendered; unknown cost excluded');
    await page.goto(base + '/vehicles');
    await btn('Meu estoque pessoal').click();
    await page.getByText(`Teste real ${apiReport.run} direto`, { exact: true }).waitFor();
    assert.ok((await page.getByText('Vendido', { exact: true }).count()) >= 2);
    report.checks.push('real sold stock rendered');
    const state = await context.storageState();
    await browser.close();
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    context = await browser.newContext({
      storageState: state,
      viewport: { width: 390, height: 844 },
    });
    page = await context.newPage();
    page.on('pageerror', (e) => report.errors.push(e.message));
    await page.goto(base + '/finance');
    await field('Pesquisar vendas').fill(apiReport.run);
    await page.getByText('2 vendas concluídas', { exact: true }).waitFor();
    report.checks.push('browser restart restores session and persistent real sales');
    await page.goto(base + '/profile');
    await btn('Sair da conta').click();
    await btn('Entrar na conta').waitFor();
    report.checks.push('real web logout');
    assert.deepEqual(report.errors, []);
  } catch (e) {
    report.errors.push(e.message);
    process.exitCode = 1;
    if (page) await page.screenshot({ path: path.join(out, 'web-failure.png') }).catch(() => {});
  } finally {
    report.passed = report.checks.length;
    report.failed = report.errors.length;
    fs.writeFileSync(path.join(out, 'web-report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    await browser?.close();
    server.close();
  }
})();
