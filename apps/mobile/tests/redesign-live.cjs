const fs = require('fs'),
  path = require('path'),
  http = require('http'),
  assert = require('node:assert/strict'),
  crypto = require('crypto');
const { chromium } = require('playwright');
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
const out = path.resolve(
  process.env.MOTORSYNC_EVIDENCE_DIR || '../../docs/evidence/redesign-2026-11-05',
);
fs.mkdirSync(out, { recursive: true });
const root = path.resolve('dist');
const server = http.createServer((req, res) => {
  let p = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root + path.sep) && p !== root) return res.writeHead(403).end();
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(root, 'index.html');
  res.setHeader(
    'Content-Type',
    {
      '.js': 'application/javascript',
      '.html': 'text/html',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.ttf': 'font/ttf',
    }[path.extname(p)] || 'application/octet-stream',
  );
  fs.createReadStream(p).pipe(res);
});
const report = {
  date: new Date().toISOString(),
  platform: 'Chrome / React Native Web',
  api: 'real Supabase; no mocked HTTP',
  androidPhysical: false,
  iosPhysical: false,
  checks: [],
  errors: [],
};
let browser, page;
(async () => {
  try {
    const settingsResponse = await fetch(env.EXPO_PUBLIC_SUPABASE_URL + '/auth/v1/settings', {
      headers: { apikey: env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
    });
    assert.equal(settingsResponse.status, 200);
    const settings = await settingsResponse.json();
    report.emailAutoConfirm = settings.mailer_autoconfirm;
    assert.equal(settings.mailer_autoconfirm, true, 'Supabase must have confirmation disabled');
    report.checks.push('remote settings confirm email auto-confirm enabled');
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const base = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', (e) => report.errors.push(e.message));
    const btn = (n) => page.getByRole('button', { name: n, exact: true }).filter({ visible: true });
    const visit = async (p) => {
      await page.goto(base + p);
      await page.getByText('MotorSync', { exact: true }).count();
      await page.evaluate(() => document.fonts.ready);
    };
    for (const theme of ['light', 'dark']) {
      await visit('/profile');
      await btn(theme === 'light' ? 'Claro' : 'Escuro').click();
      await page.reload();
      await btn(theme === 'light' ? 'Claro' : 'Escuro').waitFor();
      assert.equal(await page.evaluate(() => localStorage.getItem('motorsync.theme')), theme);
      for (const [name, url] of [
        ['home', '/'],
        ['explore', '/explore'],
        ['management', '/management'],
        ['profile', '/profile'],
      ]) {
        await visit(url);
        await btn('Perfil').waitFor();
        if (name === 'explore')
          await page
            .getByText('Pesquisando anúncios…', { exact: true })
            .waitFor({ state: 'hidden', timeout: 25000 });
        await page.waitForTimeout(600);
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          name + ' overflow',
        );
        await page.screenshot({ path: path.join(out, `${name}-${theme}.png`), fullPage: true });
      }
      await btn('Abrir ações rápidas').click();
      await btn('Anunciar veículo').waitFor();
      await page.screenshot({ path: path.join(out, `create-${theme}.png`), fullPage: true });
      await btn('Fechar').click();
      await visit('/login');
      await btn('Entrar').waitFor();
      await page.screenshot({ path: path.join(out, `login-${theme}.png`), fullPage: true });
      report.checks.push(
        theme + ' screenshots of all five areas + login; preference survives reload',
      );
    }
    await visit('/');
    const expand = page.getByRole('button', { name: 'Ver mais', exact: true }).first();
    await expand.click();
    await page.getByRole('button', { name: 'Ver menos', exact: true }).first().click();
    const like = page.getByRole('button', { name: /^Curtir / }).first();
    const beforeLike = await like.locator('..').innerText();
    await like.click();
    await page.waitForTimeout(200);
    assert.notEqual(await like.locator('..').innerText(), beforeLike, 'like count must update');
    await like.click();
    await page.waitForTimeout(200);
    assert.equal(await like.locator('..').innerText(), beforeLike);
    report.checks.push('feed expand/collapse and reversible like');
    await page.setViewportSize({ width: 320, height: 640 });
    for (const url of ['/explore', '/management', '/profile', '/login']) {
      await visit(url);
      await page.waitForTimeout(300);
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        url + ' narrow overflow',
      );
    }
    report.checks.push('320px main screens without document overflow');
    await page.setViewportSize({ width: 390, height: 844 });
    await visit('/profile');
    await btn('Automático').click();
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.reload();
    assert.equal(await page.evaluate(() => localStorage.getItem('motorsync.theme')), 'system');
    await page.emulateMedia({ colorScheme: 'dark' });
    report.checks.push(
      'automatic preference persists; OS light/dark and reduced-motion media exercised',
    );
    await visit('/login');
    const accountFile = process.env.MOTORSYNC_TEST_ACCOUNT || '.env.redesign-test';
    let account;
    if (fs.existsSync(accountFile)) {
      account = JSON.parse(fs.readFileSync(accountFile, 'utf8'));
      await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(account.email);
      await page.getByRole('textbox', { name: 'Senha', exact: true }).fill(account.password);
      await btn('Entrar').click();
    } else {
      const original = JSON.parse(fs.readFileSync('.env.auth-test', 'utf8'));
      const [local, domain] = original.email.split('@');
      account = {
        email: local + '+motor-' + crypto.randomBytes(4).toString('hex') + '@' + domain,
        password: crypto.randomBytes(24).toString('base64url'),
      };
      fs.writeFileSync(accountFile, JSON.stringify(account));
      await btn('Criar conta').click();
      await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(account.email);
      await page.getByRole('textbox', { name: 'Senha', exact: true }).fill(account.password);
      const responsePromise = page.waitForResponse(
        (r) => r.url().includes('/auth/v1/signup') && r.request().method() === 'POST',
      );
      await btn('Criar conta').click();
      const response = await responsePromise;
      const body = await response.json();
      assert.equal(response.status(), 200, body.msg || body.message);
      assert.ok(body.access_token, 'signup must issue session');
      report.testUserId = body.user.id;
      report.checks.push('REAL signup issues session without email confirmation');
      await page
        .getByText('Tudo pronto. Sua conta já está conectada ao MotorSync.', { exact: true })
        .waitFor();
      await btn('Confirmar').click();
    }
    await btn('Sair da conta').waitFor();
    await page.reload();
    await btn('Sair da conta').waitFor();
    report.checks.push('signup/login session restored after reload');
    await visit('/account');
    await page
      .getByRole('textbox', { name: 'Nome de exibição', exact: true })
      .fill('Conta de teste MotorSync');
    await btn('Salvar nome').click();
    await page.getByText('Perfil atualizado.', { exact: true }).waitFor();
    await visit('/profile');
    await page.getByText('Conta de teste MotorSync', { exact: true }).waitFor();
    report.checks.push('REAL profile name saved and loaded in redesigned Profile');
    for (const theme of ['light', 'dark']) {
      await btn(theme === 'light' ? 'Claro' : 'Escuro').click();
      await visit('/management');
      await btn('Abrir Financeiro').waitFor();
      await page.screenshot({ path: path.join(out, 'management-auth-' + theme + '.png') });
      await visit('/profile');
      await page.getByText('Conta de teste MotorSync', { exact: true }).waitFor();
    }

    await btn('Sair da conta').click();
    await btn('Entrar na conta').waitFor();
    await page.reload();
    await btn('Entrar na conta').waitFor();
    report.checks.push('logout persists after reload');
    await visit('/login');
    await btn('Criar conta').click();
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(account.email);
    await page.getByRole('textbox', { name: 'Senha', exact: true }).fill(account.password);
    await btn('Criar conta').click();
    await page
      .getByText('Este e-mail já possui uma conta. Entre ou recupere sua senha.', { exact: true })
      .waitFor();
    await btn('Confirmar').click();
    await btn('Já tenho uma conta').click();
    await btn('Entrar').waitFor();
    report.checks.push('duplicate real signup shows error popup; return to login works');
    assert.deepEqual(report.errors, []);
  } catch (e) {
    report.errors.push(e.message);
    process.exitCode = 1;
    if (page) await page.screenshot({ path: path.join(out, 'failure.png') }).catch(() => {});
  } finally {
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    await browser?.close();
    server.close();
  }
})();
