const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../dist');
const out = path.resolve(__dirname, '../test-results');
const mime = {
  '.js': 'application/javascript',
  '.html': 'text/html',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.json': 'application/json',
};
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep) && file !== root) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser;
  const errors = [];
  const completed = [];
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({
      channel: process.env.BROWSER_CHANNEL || 'chrome',
      headless: true,
    });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
    });
    page.on('pageerror', (error) => errors.push(error.message));
    fs.mkdirSync(out, { recursive: true });
    await page.goto(base);
    const button = (name) => page.getByRole('button', { name, exact: true });
    await button('Explorar').waitFor();
    await page.waitForFunction(() =>
      [...document.images].some((img) => img.src.includes('unsplash') && img.complete),
    );
    await page.screenshot({ path: path.join(out, 'home.png') });
    await button('Curtir Pura precisão. Em cada curva.').click();
    await page.getByText('1285', { exact: true }).waitFor();
    await button('Salvar Pura precisão. Em cada curva.').click();
    await button('Comentários de Pura precisão. Em cada curva.').click();
    await page.getByRole('textbox', { name: 'Seu comentário' }).fill('Comentário de teste local');
    await button('Adicionar comentário local').click();
    await page.getByText('Comentário de teste local', { exact: true }).waitFor();
    await button('Voltar').click();
    completed.push('Curtida, salvar, comentário local e retorno');
    await button('Explorar').click();
    await page.getByRole('textbox', { name: 'Pesquisar anúncios' }).fill('civic');
    await button('Ver Honda Civic Touring').waitFor();
    assert.equal(await button('Ver Toyota Corolla XEi').count(), 0);
    await button('Favoritar Honda Civic Touring').click();
    await button('Ver Honda Civic Touring').click();
    await button('Remover dos favoritos').waitFor();
    await page.screenshot({ path: path.join(out, 'listing.png') });
    await button('Voltar').click();
    await page.getByRole('textbox', { name: 'Pesquisar anúncios' }).fill('');
    await button('Motos').click();
    await page.getByText('Nenhum anúncio encontrado', { exact: true }).waitFor();
    await button('Limpar filtros').click();
    await button('Ver Honda Civic Touring').waitFor();
    await page.screenshot({ path: path.join(out, 'explore.png') });
    completed.push('Pesquisa, categoria vazia, limpar filtros, favorito e detalhes');
    await button('Abrir ações rápidas').click();
    await page.getByText('O que vamos criar?', { exact: true }).waitFor();
    await page.getByRole('button', { name: /Publicar vídeo/ }).click();
    await page.getByText(/O acesso desta ação já está preparado/).waitFor();
    await page.screenshot({ path: path.join(out, 'create.png') });
    await button('Voltar').click();
    completed.push('Central + abre e retorna sem mudar a aba');
    await button('Gestão').click();
    await page.getByText('Sua operação, em foco.', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(out, 'management.png') });
    for (const section of ['Estoque', 'Clientes', 'Propostas', 'Vendas']) {
      await page.getByRole('button', { name: section, exact: false }).last().click();
      await button('Voltar').waitFor();
      await button('Voltar').click();
    }
    completed.push('Quatro consultas da Gestão e retorno');
    await button('Perfil').click();
    await button('Escuro').click();
    await page.screenshot({ path: path.join(out, 'profile-dark.png') });
    assert.equal(
      await button('Escuro').evaluate((el) => getComputedStyle(el).backgroundColor),
      'rgb(245, 245, 247)',
    );
    await page.reload();
    await button('Escuro').waitFor();
    assert.equal(
      await button('Escuro').evaluate((el) => getComputedStyle(el).backgroundColor),
      'rgb(245, 245, 247)',
    );
    if (await button('Entrar na conta').count()) {
      await button('Entrar na conta').click();
      await button('Entrar').waitFor();
      await page.goto(base + '/profile');
      completed.push('Tema escuro persistente e formulário de autenticação configurado');
    } else {
      await button('Sobre a conexão da conta').click();
      await page
        .getByText('A conexão com o Supabase ainda não foi configurada.', { exact: true })
        .waitFor();
      await button('Voltar à demonstração').click();
      completed.push('Tema escuro persistente e estado sem backend');
    }
    for (const width of [360, 390, 412]) {
      await page.setViewportSize({ width, height: 844 });
      for (const theme of ['Claro', 'Escuro']) {
        await button('Perfil').click();
        await button(theme).click();
        for (const tab of ['Home', 'Explorar', 'Gestão', 'Perfil']) {
          await button(tab).click();
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            `${tab} ${theme} ${width} overflow`,
          );
          await page.screenshot({ path: path.join(out, `${tab}-${theme}-${width}.png`) });
        }
      }
    }
    completed.push('24 combinações de tela/tema/largura sem overflow horizontal');
    await page.route('https://images.unsplash.com/**', (route) => route.abort());
    await page.goto(base + '/listing/v1');
    await page.getByText('Imagem indisponível', { exact: true }).waitFor();
    completed.push('Fallback de imagem sem conexão');
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      path.join(out, 'navigation.json'),
      JSON.stringify({ completed, errors }, null, 2),
    );
    console.log(JSON.stringify({ completed, errors }, null, 2));
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
