const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const root = path.resolve(__dirname, '../dist');
const output = path.resolve(__dirname, '../test-results/live-vehicles');
const expectedProject = 'https://kyfkizweglxuymnfkrsz.supabase.co';
const env = Object.fromEntries(
  fs
    .readFileSync('.env', 'utf8')
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);
assert.equal(env.EXPO_PUBLIC_SUPABASE_URL, expectedProject);
const client = createClient(expectedProject, env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const account = JSON.parse(fs.readFileSync('.env.auth-test', 'utf8'));
const title = 'Teste MotorSync ' + crypto.randomBytes(4).toString('hex');
const editedTitle = title + ' editado';
const browserProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'motorsync-live-'));
const report = {
  timestamp: new Date().toISOString(),
  project: 'kyfkizweglxuymnfkrsz',
  api: 'real',
  mockRoutes: 0,
  platform: 'React Native Web / Chrome',
  viewport: '390x844',
  passed: [],
  requests: [],
  runtimeErrors: [],
  nativeDeviceTested: false,
};
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  const mime = {
    '.js': 'application/javascript',
    '.html': 'text/html',
    '.css': 'text/css',
    '.png': 'image/png',
    '.ttf': 'font/ttf',
  };
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
let context, page, vehicleId, org, baseline, base;
async function unwrap(query) {
  const result = await query;
  if (result.error) throw Error(result.error.message);
  return result.data;
}
async function openBrowser() {
  context = await chromium.launchPersistentContext(browserProfile, {
    channel: 'chrome',
    headless: true,
    viewport: { width: 390, height: 844 },
  });
  page = context.pages()[0] || (await context.newPage());
  page.on('pageerror', (error) => report.runtimeErrors.push(error.message));
  page.on('response', (r) => {
    const url = new URL(r.url());
    if (url.origin === expectedProject)
      report.requests.push({
        method: r.request().method(),
        path: url.pathname,
        status: r.status(),
      });
  });
}
function button(name) {
  return page.getByRole('button', { name, exact: true });
}
async function screenshot(name) {
  await page.screenshot({ path: path.join(output, name + '.png'), fullPage: true });
}
function row(name) {
  return page.getByText(name, { exact: true }).locator('..');
}
async function stock() {
  await page.goto(base + '/management/inventory');
  await button('MotorSync Acadêmico').click();
  await button('Salvar veículo').waitFor();
  await page.getByText('Carregando…', { exact: true }).waitFor({ state: 'hidden' });
}
async function readRecord() {
  return unwrap(
    client
      .from('vehicles')
      .select('id,organization_id,title,price')
      .eq('id', vehicleId)
      .maybeSingle(),
  );
}
async function mutation(method, action) {
  const response = page.waitForResponse(
    (r) =>
      r.url().startsWith(expectedProject + '/rest/v1/vehicles') && r.request().method() === method,
  );
  await action();
  const r = await response;
  if (!r.ok()) throw Error(method + ' /vehicles returned ' + r.status() + ': ' + (await r.text()));
  return r.json();
}
(async () => {
  fs.mkdirSync(output, { recursive: true });
  try {
    await unwrap(client.auth.signInWithPassword(account));
    const memberships = await unwrap(
      client.from('organization_members').select('organization_id,role,organizations(name)'),
    );
    org = memberships.find((m) => m.organizations?.name === 'MotorSync Acadêmico');
    assert.ok(org, 'Academic organization membership missing');
    assert.equal(org.role, 'owner');
    baseline = await unwrap(
      client
        .from('vehicles')
        .select('id,organization_id,title,price')
        .eq('organization_id', org.organization_id)
        .order('id'),
    );
    report.passed.push('real owner membership and baseline read');
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    base = 'http://127.0.0.1:' + server.address().port;
    await openBrowser();
    await page.goto(base + '/login');
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(account.email);
    await page.getByLabel('Senha', { exact: true }).fill(account.password);
    await button('Entrar').click();
    await page.getByRole('textbox', { name: 'Nome de exibição', exact: true }).waitFor();
    report.passed.push('login through UI against real Supabase');
    await stock();
    await page.getByRole('textbox', { name: 'Marca e modelo', exact: true }).fill(title);
    await page.getByRole('textbox', { name: 'Preço (R$)', exact: true }).fill('120000,50');
    const created = await mutation('POST', () => button('Salvar veículo').click());
    vehicleId = created.id;
    assert.ok(vehicleId);
    await page.getByText(title, { exact: true }).waitFor();
    assert.deepEqual(await readRecord(), {
      id: vehicleId,
      organization_id: org.organization_id,
      title,
      price: 120000.5,
    });
    report.passed.push('UI create and stock read confirmed by independent real API query');
    await screenshot('01-created');
    await row(title).getByRole('button', { name: 'Editar', exact: true }).click();
    await page.getByRole('textbox', { name: 'Marca e modelo', exact: true }).fill(editedTitle);
    await page.getByRole('textbox', { name: 'Preço (R$)', exact: true }).fill('123456,78');
    await mutation('PATCH', () => button('Salvar veículo').click());
    await page.getByText(editedTitle, { exact: true }).filter({ visible: true }).waitFor();
    assert.equal((await readRecord()).price, 123456.78);
    report.passed.push('UI update persisted to PostgreSQL');
    await page.goto(base + '/explore');
    await button('Ver ' + editedTitle).waitFor();
    assert.ok(
      (await page.locator('body').innerText()).includes('123.456,78'),
      'Explore must display exact price including cents',
    );
    await screenshot('02-explore');
    await button('Ver ' + editedTitle).click();
    await page.getByText('Detalhes do veículo', { exact: true }).waitFor();
    await page.getByText(editedTitle, { exact: true }).filter({ visible: true }).waitFor();
    report.passed.push('Explore and detail show edited real record and exact price');
    await context.close();
    await openBrowser();
    await stock();
    await page.getByText(editedTitle, { exact: true }).filter({ visible: true }).waitFor();
    assert.equal((await readRecord()).title, editedTitle);
    await screenshot('03-after-restart');
    report.passed.push('browser process restart restored session and persisted vehicle');
    await context.setOffline(true);
    await button('Atualizar estoque').click();
    await page
      .getByText('Não foi possível carregar os veículos. Tente novamente.', { exact: true })
      .waitFor();
    await context.setOffline(false);
    await button('Tentar novamente').click();
    await page.getByText(editedTitle, { exact: true }).filter({ visible: true }).waitFor();
    report.passed.push('real network disabled and restored: retry recovered server data');
    await row(editedTitle).getByRole('button', { name: 'Excluir', exact: true }).click();
    await button('Confirmar exclusão').click();
    await page.getByText(editedTitle, { exact: true }).waitFor({ state: 'hidden' });
    assert.equal(await readRecord(), null);
    report.passed.push('UI confirmed deletion verified in real database');
    await screenshot('04-deleted');
    await context.close();
    await openBrowser();
    await stock();
    assert.equal(await page.getByText(editedTitle, { exact: true }).count(), 0);
    await page.goto(base + '/explore');
    await page.getByText('Carregando…', { exact: true }).waitFor({ state: 'hidden' });
    assert.equal(await button('Ver ' + editedTitle).count(), 0);
    assert.equal(await readRecord(), null);
    report.passed.push('deletion remains absent after browser restart in stock and Explore');
    await page.goto(base + '/profile');
    await button('Sair da conta').click();
    await button('Entrar na conta').waitFor();
    await page.reload();
    await button('Entrar na conta').waitFor();
    report.passed.push('logout survives reload');
    assert.deepEqual(report.runtimeErrors, []);
    report.success = true;
  } catch (error) {
    report.success = false;
    report.failure = error.message;
    if (page && !page.isClosed()) await screenshot('failure').catch(() => {});
    process.exitCode = 1;
  } finally {
    // Only remove the unique disposable record created by this run; never touch baseline records.
    if (vehicleId && org) {
      const { error } = await client
        .from('vehicles')
        .delete()
        .eq('id', vehicleId)
        .eq('organization_id', org.organization_id);
      report.cleanupError = error?.message || null;
    }
    if (org && baseline) {
      const result = await client
        .from('vehicles')
        .select('id,organization_id,title,price')
        .eq('organization_id', org.organization_id)
        .order('id');
      report.baselinePreserved =
        !result.error && JSON.stringify(result.data) === JSON.stringify(baseline);
      if (!report.baselinePreserved) process.exitCode = 1;
    }
    await context?.close();
    await client.auth.signOut({ scope: 'local' });
    server.close();
    assert.equal(path.dirname(path.resolve(browserProfile)), path.resolve(os.tmpdir()));
    fs.rmSync(browserProfile, { recursive: true, force: true });
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(
      JSON.stringify(
        {
          success: report.success,
          passed: report.passed,
          failure: report.failure,
          baselinePreserved: report.baselinePreserved,
          cleanupError: report.cleanupError,
        },
        null,
        2,
      ),
    );
  }
})();
