const fs = require('fs'),
  path = require('path'),
  http = require('http'),
  assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve('dist'),
  out = path.resolve('../../docs/evidence/finance-ui-mocked');
fs.mkdirSync(out, { recursive: true });
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
(async () => {
  let browser, page;
  const errors = [],
    checks = [];
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', (e) => errors.push(e.message));
    const user = {
      id: 'a1111111-1111-4111-8111-111111111111',
      email: 'fixture@example.invalid',
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
    let missing = false,
      inserts = 0;
    const rows = [
      {
        id: 'sale-1',
        kind: 'sale',
        description: 'Venda de teste',
        amount: 1000,
        cost: 600,
        occurred_on: '2026-11-03',
        created_at: new Date().toISOString(),
        cancellation_id: null,
      },
      {
        id: 'expense-1',
        kind: 'expense',
        description: 'Despesa de teste',
        amount: 100,
        occurred_on: '2026-11-04',
        created_at: new Date().toISOString(),
        cancellation_id: null,
      },
    ];
    await page.route('https://kyfkizweglxuymnfkrsz.supabase.co/**', async (route) => {
      const req = route.request(),
        u = new URL(req.url()),
        body = req.postDataJSON();
      let data = {};
      if (u.pathname.endsWith('/token'))
        data = {
          access_token: token,
          refresh_token: 'fixture',
          token_type: 'bearer',
          expires_in: 3600,
          user,
        };
      else if (u.pathname.endsWith('/user')) data = user;
      else if (u.pathname.includes('/profiles')) data = { id: user.id, display_name: 'Fixture' };
      else if (u.pathname.includes('/organization_members')) data = [];
      else if (u.pathname.endsWith('/finance_report'))
        data = {
          summary: {
            n: rows.length,
            sales: 1,
            missing_cost: missing ? 1 : 0,
            revenue: 1000,
            cost: 600,
            income: 0,
            expenses: 100,
            gross: missing ? null : 400,
            result: missing ? null : 300,
          },
          first_date: '2026-11-03',
          count: rows.length,
          rows: body.p_kind ? rows.filter((r) => r.kind === body.p_kind) : rows,
          buckets: [
            {
              day: '2026-11-03',
              revenue: 1000,
              cost: 600,
              income: 0,
              expenses: 0,
              missing_cost: missing ? 1 : 0,
            },
            { day: '2026-11-04', revenue: 0, cost: 0, income: 0, expenses: 100, missing_cost: 0 },
          ],
        };
      else if (u.pathname.endsWith('/financial_entries') && req.method() === 'POST') {
        inserts++;
        data = {
          ...body,
          id: 'manual-' + inserts,
          created_at: new Date().toISOString(),
          cancellation_id: null,
        };
        rows.push(data);
      } else if (u.pathname.endsWith('/financial_cancellations')) {
        const row = rows.find((r) => r.id === (body.entry_id || body.sale_id));
        row.cancellation_id = 'cancel-1';
        row.cancellation_reason = body.reason;
        data = { id: 'cancel-1', ...body };
      } else data = [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    });
    const base = 'http://127.0.0.1:' + server.address().port;
    const btn = (n) => page.getByRole('button', { name: n, exact: true }).filter({ visible: true });
    const field = (n) => page.getByRole('textbox', { name: n, exact: true });
    await page.goto(base + '/login');
    await field('E-mail').fill(user.email);
    await field('Senha').fill('TestPassword123');
    await btn('Entrar').click();
    await btn('Meus anúncios').waitFor();
    await page.goto(base + '/finance');
    await btn('Registrar despesa').waitFor();
    await page.locator('svg').first().waitFor();
    await page.screenshot({ path: path.join(out, 'finance-chart-mocked.png'), fullPage: true });
    await page.getByText('Evolução no período', { exact: true }).scrollIntoViewIfNeeded();
    await page
      .getByText('Evolução no período', { exact: true })
      .locator('..')
      .screenshot({ path: path.join(out, 'chart-detail-mocked.png') });
    checks.push('chart rendered with fixture data and accessible period buttons');
    await btn('Detalhar Despesas operacionais').click();
    await btn('Detalhes: Despesa de teste').waitFor();
    assert.equal(await btn('Detalhes: Venda de teste').count(), 0);
    checks.push('summary card filters history');
    await btn('Registrar despesa').click();
    await field('Descrição').fill('Despesa criada no teste');
    await field('Valor (R$)').fill('0');
    await btn('Salvar lançamento').click();
    await page
      .getByText('Informe um valor positivo, com até duas casas decimais.', { exact: true })
      .waitFor();
    assert.equal(inserts, 0);
    await field('Valor (R$)').fill('25,50');
    await btn('Salvar lançamento').click();
    await page.getByText('Lançamento registrado', { exact: true }).waitFor();
    await btn('Confirmar').click();
    await btn('Detalhes: Despesa criada no teste').click();
    await field('Motivo do cancelamento').fill('Correção de teste');
    await btn('Confirmar cancelamento do registro').click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal(rows.find((r) => r.id === 'manual-1').cancellation_id, 'cancel-1');
    checks.push('validated manual expense, confirmation and cancellation detail');
    missing = true;
    await page.reload();
    await page
      .getByText('Há 1 vendas sem custo informado. Resultado indisponível.', { exact: true })
      .waitFor();
    await btn('Receita de vendas').click();
    assert.equal(await btn('Lucro bruto dos registros').count(), 0);
    assert.equal(await btn('Resultado dos registros').count(), 0);
    checks.push('missing cost hides profit and net-like metrics');
    await page.getByRole('dialog').getByRole('button', { name: 'Voltar', exact: true }).click();
    await page.setViewportSize({ width: 320, height: 640 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.deepEqual(errors, []);
    checks.push('320px viewport has no document horizontal overflow');
  } catch (e) {
    errors.push(e.message);
    if (page)
      await page
        .screenshot({ path: path.join(out, 'failure.png'), fullPage: true })
        .catch(() => {});
    process.exitCode = 1;
  } finally {
    fs.writeFileSync(
      path.join(out, 'report.json'),
      JSON.stringify(
        {
          date: new Date().toISOString(),
          api: 'MOCKED',
          platform: 'Chrome React Native Web',
          checks,
          errors,
          androidTested: false,
        },
        null,
        2,
      ),
    );
    console.log({ checks, errors });
    await browser?.close();
    server.close();
  }
})();
