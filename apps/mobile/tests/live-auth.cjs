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
    const account=JSON.parse(fs.readFileSync('.env.auth-test','utf8'));
    const button=n=>page.getByRole('button',{name:n,exact:true});
    await page.goto(base+'/login');
    await page.getByRole('textbox',{name:'E-mail',exact:true}).fill(account.email);
    await page.getByLabel('Senha',{exact:true}).fill(account.password);
    await button('Entrar').click();
    const name=page.getByRole('textbox',{name:'Nome de exibição',exact:true});
    await name.fill('João Henrique — teste acadêmico');await button('Salvar nome').click();
    await page.getByText('Nome salvo no servidor.',{exact:true}).waitFor();
    await name.fill('João Henrique');await button('Salvar nome').click();await page.getByText('Nome salvo no servidor.',{exact:true}).waitFor();
    await page.context().storageState({path:'.env.live-browser'});
    await browser.close();browser=await chromium.launch({channel:'chrome',headless:true});
    const context=await browser.newContext({storageState:'.env.live-browser'});const restored=await context.newPage();
    await restored.goto(base+'/account');await restored.getByRole('textbox',{name:'Nome de exibição',exact:true}).waitFor();
    assert.equal(await restored.getByRole('textbox',{name:'Nome de exibição',exact:true}).inputValue(),'João Henrique');
    await restored.goto(base+'/profile');await restored.getByRole('button',{name:'Sair da conta',exact:true}).click();
    await restored.getByRole('button',{name:'Entrar na conta',exact:true}).waitFor();await restored.reload();await restored.getByRole('button',{name:'Entrar na conta',exact:true}).waitFor();
    assert.deepEqual(errors,[]);
    fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/live-auth.json',JSON.stringify({timestamp:new Date().toISOString(),project:'kyfkizweglxuymnfkrsz',api:'real',passed:['confirmed email login','profile insert','profile update','profile reload after browser restart','logout','signed out after reload'],nativeDeviceTested:false},null,2));
    console.log('PASS REAL API: confirmed login, profile insert/update, browser restart, logout and reload.');
  } finally {await browser?.close();server.close();if(fs.existsSync('.env.live-browser'))fs.unlinkSync('.env.live-browser');}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
