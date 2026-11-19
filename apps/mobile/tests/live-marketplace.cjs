const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  os = require('node:os'),
  crypto = require('node:crypto'),
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
const url = env.EXPO_PUBLIC_SUPABASE_URL;
assert.equal(url, 'https://kyfkizweglxuymnfkrsz.supabase.co');
const key = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert.ok(key.startsWith('sb_publishable_'));
const account = JSON.parse(
  fs.readFileSync(process.env.MOTORSYNC_TEST_ACCOUNT || '.env.auth-test', 'utf8'),
);
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }),
  guest = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const run = crypto.randomBytes(5).toString('hex'),
  prefix = `Teste API ${run}`,
  out = path.resolve('../../docs/evidence/live-marketplace', run);
fs.mkdirSync(out, { recursive: true });
const photo =
  process.env.MOTORSYNC_TEST_PHOTO ||
  'C:/Users/João Henrique/OneDrive/Imagens/Camera Roll/WhatsApp Image 2026-10-16 at 10.38.42.jpeg';
const report = {
  date: new Date().toISOString(),
  run,
  project: 'kyfkizweglxuymnfkrsz',
  api: 'real',
  mockRoutes: 0,
  android: 'pending user verification',
  web: [],
  apiChecks: [],
  requests: [],
  photosRetained: [],
  failures: [],
};
const ids = [];
let context, page, base, uid;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'motorsync-market-'));
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
        : p.endsWith('.ttf')
          ? 'font/ttf'
          : 'application/octet-stream',
  );
  fs.createReadStream(p).pipe(res);
});
const unwrap = async (q) => {
  const { data, error } = await q;
  if (error) throw Error(error.message);
  return data;
};
const btn = (n) => page.getByRole('button', { name: n, exact: true }).filter({ visible: true });
const field = (n) => page.getByRole('textbox', { name: n, exact: true });
async function open() {
  context = await chromium.launchPersistentContext(profile, {
    channel: 'chrome',
    headless: true,
    viewport: { width: 390, height: 844 },
  });
  page = context.pages()[0] || (await context.newPage());
  page.setDefaultTimeout(15000);
  page.on('response', (r) => {
    const u = new URL(r.url());
    if (u.origin === url)
      report.requests.push({ method: r.request().method(), path: u.pathname, status: r.status() });
  });
}
async function save() {
  await btn('Revisar anúncio').click();
  await btn('Salvar anúncio').click();
  await page.getByText('Anúncio salvo', { exact: true }).filter({ visible: true }).waitFor();
  await btn('Confirmar').click();
}
async function choosePublication(label) {
  await btn('Salvar rascunho').click();
  await btn(label).click();
}
async function snapshot(name) {
  await page.screenshot({ path: path.join(out, name + '.png'), fullPage: true });
}
(async () => {
  try {
    const auth = await unwrap(client.auth.signInWithPassword(account));
    uid = auth.user.id;
    const memberships = await unwrap(
      client.from('organization_members').select('organization_id').eq('user_id', uid),
    );
    report.automatedAccountHasCompany = memberships.length > 0;
    report.apiChecks.push(
      'login real; personal ownership tested independently from company membership',
    );
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;
    await open();
    await page.goto(base + '/login');
    await field('E-mail').fill(account.email);
    await field('Senha').fill(account.password);
    await btn('Entrar').click();
    await btn('Meus anúncios').waitFor();
    report.web.push('login real pela interface');
    await page.goto(base + '/ad/new');
    await field('Título *').fill(prefix + ' veiculo');
    await field('Preço (R$) *').fill('50000,50');
    await field('Cidade e estado *').fill('Salvador, BA');
    const chooser = page.waitForEvent('filechooser');
    await btn('Adicionar fotos').click();
    await (await chooser).setFiles(photo);
    await btn('Remover foto').waitFor();
    await save();
    let records = await unwrap(
      client
        .from('listings')
        .select('*')
        .eq('title', prefix + ' veiculo')
        .eq('owner_user_id', uid),
    );
    assert.equal(records.length, 1);
    const vehicle = records[0];
    ids.push(vehicle.id);
    report.photosRetained.push(...vehicle.photo_paths);
    assert.equal(vehicle.organization_id, null);
    assert.equal(vehicle.publication_status, 'draft');
    assert.equal(vehicle.photo_paths.length, 1);
    report.web.push('veículo pessoal criado como rascunho com foto real pelo seletor web');
    await snapshot('01-draft');
    const bucket = client.storage.from('listing-photos'),
      publicBucket = guest.storage.from('listing-photos'),
      file = vehicle.photo_paths[0];
    const downloaded = await unwrap(bucket.download(file));
    assert.ok(downloaded.size > 0);
    report.apiChecks.push('download autenticado do arquivo enviado pela interface');
    assert.deepEqual(await unwrap(guest.from('listings').select('id').eq('id', vehicle.id)), []);
    assert.ok((await publicBucket.download(file)).error);
    assert.ok((await publicBucket.createSignedUrl(file, 300)).error);
    report.apiChecks.push(
      'visitante não consulta rascunho, não baixa foto privada e não emite URL assinada',
    );
    const invalid = await bucket.upload(
      `user/${uid}/test-${run}-invalid.jpg`,
      Buffer.from('not an image'),
      { contentType: 'text/plain' },
    );
    assert.ok(invalid.error);
    const oversized = await bucket.upload(
      `user/${uid}/test-${run}-large.jpg`,
      Buffer.alloc(5242881),
      { contentType: 'image/jpeg' },
    );
    assert.ok(oversized.error);
    report.apiChecks.push('Storage real rejeitou MIME inválido e arquivo acima de 5 MiB');
    await page.goto(base + `/ad/${vehicle.id}?edit=1`);
    await field('Título *').fill(prefix + ' veiculo editado');
    await choosePublication('Publicar para compradores');
    await save();
    report.web.push('edição e publicação pela interface');
    for (const [category, subcategory, attrs] of [
      ['parts', 'brakes', { brand: 'Teste', quantity: '1', condition: 'Usado' }],
      ['accessories', 'audio', { brand: 'Teste', quantity: '1', condition: 'Novo' }],
    ]) {
      const row = await unwrap(
        client
          .from('listings')
          .insert({
            owner_user_id: uid,
            category,
            subcategory,
            title: prefix + ' ' + category,
            price: 100.25,
            location: 'Salvador, BA',
            attributes: attrs,
            photo_paths: [file],
            publication_status: 'draft',
          })
          .select()
          .single(),
      );
      ids.push(row.id);
      await unwrap(
        client.from('listings').update({ publication_status: 'published' }).eq('id', row.id),
      );
    }
    report.apiChecks.push(
      'peça e acessório criados como rascunho e publicados pela API real, reutilizando foto do mesmo titular',
    );
    const signed = await unwrap(publicBucket.createSignedUrl(file, 300));
    const publicDownload = await fetch(signed.signedUrl);
    assert.equal(publicDownload.status, 200);
    assert.equal(
      crypto
        .createHash('sha256')
        .update(Buffer.from(await publicDownload.arrayBuffer()))
        .digest('hex'),
      crypto
        .createHash('sha256')
        .update(Buffer.from(await downloaded.arrayBuffer()))
        .digest('hex'),
    );
    report.apiChecks.push(
      'foto publicada: URL assinada acessível e bytes iguais ao download autenticado',
    );
    await page.goto(base + '/explore');
    await field('Pesquisar anúncios').fill(prefix);
    await btn('Ver ' + prefix + ' veiculo editado').waitFor();
    await snapshot('02-explore');
    for (const [cat, sub, expected] of [
      ['Peças', 'Freios', 'parts'],
      ['Acessórios', 'Som e multimídia', 'accessories'],
      ['Veículos', 'Carros', 'veiculo editado'],
    ]) {
      await btn('Categorias').click();

      await btn(cat).click();
      await btn(sub).click();
      await btn('Aplicar categoria').click();
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      await btn('Ver ' + prefix + ' ' + expected).waitFor();
      assert.equal(
        await page.getByRole('button', { name: new RegExp('^Ver Teste API ' + run) }).count(),
        1,
      );
    }
    report.web.push('filtros das três categorias sobre registros reais');
    await context.close();
    await open();
    await page.goto(base + '/my-listings');
    await page.getByText(prefix + ' veiculo editado', { exact: true }).waitFor();
    report.web.push('sessão e anúncios persistem após fechar/reabrir Chrome');
    await context.setOffline(true);
    await btn('Novo anúncio').click();
    await page
      .getByText('Não foi possível carregar este anúncio. Verifique sua conexão.', { exact: true })
      .waitFor();
    await snapshot('03-offline');
    await context.setOffline(false);
    await page.reload();
    await field('Título *').waitFor();
    report.web.push('perda real de rede no navegador, erro visível e recuperação após recarga');
    await page.goto(base + `/ad/${vehicle.id}?edit=1`);
    await btn('Publicar para compradores').click();
    await btn('Arquivar').click();
    await save();
    assert.deepEqual(await unwrap(guest.from('listings').select('id').eq('id', vehicle.id)), []);
    report.web.push('arquivamento pela interface bloqueia leitura pública do anúncio');
    for (const id of ids.slice(1))
      await unwrap(client.from('listings').update({ publication_status: 'archived' }).eq('id', id));
    assert.ok((await publicBucket.createSignedUrl(file, 300)).error);
    report.apiChecks.push(
      'após arquivar todas as referências, visitante não emite nova URL da foto',
    );
    await page.goto(base + `/ad/${vehicle.id}?edit=1`);
    await btn('Excluir anúncio').click();
    await btn('Confirmar exclusão').click();
    await btn('Novo anúncio').waitFor();
    assert.equal(
      await unwrap(client.from('listings').select('id').eq('id', vehicle.id).maybeSingle()),
      null,
    );
    report.web.push('exclusão pela interface confirmada por consulta independente');
    await snapshot('04-cleanup');
  } catch (e) {
    report.failures.push(e.message);
    console.error(e.message);
    if (page) await snapshot('failure').catch(() => {});
    process.exitCode = 1;
  } finally {
    for (const id of ids) {
      const { error } = await client
        .from('listings')
        .delete()
        .eq('id', id)
        .eq('owner_user_id', uid);
      if (error) report.failures.push('cleanup listing ' + id + ': ' + error.message);
    }
    report.testListingIds = ids;
    report.photoCleanup =
      'Retained private, no client DELETE policy. Administrative Storage API cleanup only; no SQL deletion.';
    report.completed = new Date().toISOString();
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log(
      JSON.stringify({
        out,
        web: report.web,
        apiChecks: report.apiChecks,
        failures: report.failures,
      }),
    );
    await context?.close();
    server.close();
    await client.auth.signOut({ scope: 'local' });
    const resolved = path.resolve(profile);
    if (
      path.dirname(resolved) === path.resolve(os.tmpdir()) &&
      path.basename(resolved).startsWith('motorsync-market-')
    )
      fs.rmSync(resolved, { recursive: true, force: true });
  }
})();
