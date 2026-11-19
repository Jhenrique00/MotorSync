const fs = require('fs'),
  path = require('path'),
  http = require('http'),
  assert = require('node:assert/strict'),
  { chromium } = require('playwright');
const root = path.resolve('dist'),
  out = path.resolve('../../docs/evidence/commercial');
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  let p = path.resolve(root, '.' + req.url.split('?')[0]);
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
const report = {
  date: new Date().toISOString(),
  mode: 'WEB WITH SIMULATED HTTP; no remote writes',
  checks: [],
  errors: [],
};
let browser, page;
(async () => {
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const base = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', (e) => report.errors.push(e.message));
    const org = '20000000-0000-4000-8000-000000000001',
      id = '10000000-0000-4000-8000-000000000001',
      vehicle = '30000000-0000-4000-8000-000000000001',
      listingId = '40000000-0000-4000-8000-000000000001',
      proposalId = '50000000-0000-4000-8000-000000000001';
    const user = {
      id,
      email: 'fixture@example.invalid',
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: { provider: 'email' },
      user_metadata: {},
    };
    const token = [
      'eyJhbGciOiJIUzI1NiJ9',
      Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString(
        'base64url',
      ),
      'fixture',
    ].join('.');
    const session = {
      access_token: token,
      refresh_token: 'fixture',
      token_type: 'bearer',
      expires_in: 3600,
      user,
    };
    let personal = false, personalStock = null;
    let ready = false,
      buyer = false,
      customers = [],
      proposals = [],
      sales = [],
      status = 'available',
      reservedProposal = null,
      history = [];
    const listing = {
      id: listingId,
      organization_id: org,
      owner_user_id: null,
      vehicle_id: vehicle,
      title: 'Carro teste',
      price: 100,
      category: 'vehicles',
      subcategory: 'cars',
      location: 'Salvador BA',
      description: '',
      attributes: {},
      photo_paths: [],
      publication_status: 'published',
    };
    let linked = false;
    await page.route('https://kyfkizweglxuymnfkrsz.supabase.co/**', async (route) => {
      const req = route.request(),
        url = new URL(req.url()),
        body = req.postDataJSON();
      let data = [],
        code = 200;
      if (url.pathname.endsWith('/token')) data = session;
      else if (url.pathname.endsWith('/user')) data = user;
      else if (url.pathname.endsWith('/profiles')) data = { id, display_name: 'Teste' };
      else if (url.pathname.endsWith('/organization_members'))
        data = buyer
          ? []
          : [{ organization_id: org, role: 'owner', organizations: { name: 'Empresa teste' } }];
      else if (url.pathname.endsWith('/commercial_ready')) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (ready) data = personal ? 2 : 1;
        else {
          code = 404;
          data = { code: 'PGRST202' };
        }
      } else if (url.pathname.endsWith('/commercial_summary'))
        data = {
          open_proposals: proposals.filter((p) => !['completed', 'cancelled'].includes(p.status))
            .length,
          sales_count: sales.length,
          sales_amount: sales.reduce((n, s) => n + s.amount, 0),
        };
      else if (url.pathname.endsWith('/customers')) {
        if (req.method() === 'POST') {
          data = { ...body, id, archived: false };
          customers.push(data);
        } else if (req.method() === 'PATCH') {
          Object.assign(customers[0], body);
          data = customers[0];
        } else if (req.method() === 'DELETE') {
          if (proposals.length) {
            code = 409;
            data = { code: '23503' };
          } else {
            data = { id };
            customers = [];
          }
        } else data = customers;
      } else if (url.pathname.endsWith('/vehicles')) {
        data = [
          {
            id: vehicle,
            organization_id: org,
            title: 'Carro teste',
            price: 100,
            commercial_status: status,
            reserved_proposal_id: reservedProposal,
          },
        ];
        if(personal){
          if(req.method()==='POST'){personalStock={...body,id:vehicle,commercial_status:status};data=personalStock;}
          else if(req.method()==='PATCH'){Object.assign(personalStock,body);data=personalStock;}
          else data=personalStock ? [{...personalStock,commercial_status:status}] : [];
        }
        if (url.searchParams.has('id') && Array.isArray(data)) data = data[0];
      } else if (url.pathname.endsWith('/commercial_set_vehicle_state')) {
        status = body.p_status;
        reservedProposal = body.p_proposal;
        if (status !== 'available') listing.publication_status = 'archived';
        data = { id: vehicle, commercial_status: status, reserved_proposal_id: reservedProposal };
      } else if (url.pathname.endsWith('/commercial_create_proposal')) {
        data = {
          id: proposalId,
          customer_id: id,
          vehicle_id: vehicle,
          organization_id: org,
          amount: body.p_amount,
          terms: body.p_terms,
          status: 'draft',
          created_at: new Date().toISOString(),
          customers: { name: customers[0].name },
          vehicles: { title: 'Carro teste' },
        };
        proposals = [data];
        history.push({ ...data, occurred_at: data.created_at });
      } else if (url.pathname.endsWith('/commercial_update_proposal')) {
        Object.assign(proposals[0], {
          amount: body.p_amount,
          terms: body.p_terms,
          status: body.p_status,
        });
        data = proposals[0];
        history.push({ ...data, id: history.length + 1, occurred_at: new Date().toISOString() });
      } else if (url.pathname.endsWith('/commercial_direct_sale')) {
        assert.equal(body.p_vehicle, vehicle);
        assert.equal(body.p_customer, id);
        status = 'sold';
        listing.publication_status = 'archived';
        data = {
          id,
          vehicle_id: vehicle,
          customer_id: id,
          amount: body.p_amount,
          terms: body.p_terms,
          sold_at: body.p_sold_at,
          customer_name: customers[0].name,
          vehicle_title: 'Carro teste',
          purchase_cost: 50,
          preparation_cost: 10,
          proposal_id: null,
        };
        sales = [data];
      } else if (url.pathname.endsWith('/commercial_complete_sale')) {
        proposals[0].status = 'completed';
        status = 'sold';
        listing.publication_status = 'archived';
        data = {
          id,
          amount: proposals[0].amount,
          customer_name: customers[0].name,
          vehicle_title: 'Carro teste',
          terms: proposals[0].terms,
          sold_at: new Date().toISOString(),
        };
        sales = [data];
      } else if (url.pathname.endsWith('/commercial_marketplace_offer')) {
        data = {
          id: proposalId,
          listing_id: listingId,
          buyer_user_id: id,
          status: 'sent',
          amount: body.p_amount,
          terms: body.p_terms,
          created_at: new Date().toISOString(),
          listings: { title: 'Carro teste' },
        };
        proposals = [data];
      } else if (url.pathname.endsWith('/proposals')) data = proposals;
      else if (url.pathname.endsWith('/sales')) data = sales;
      else if (url.pathname.endsWith('/proposal_events')) data = history;
      else if (url.pathname.endsWith('/listings')) {
        if (req.method() === 'POST') {
          assert.equal(body.vehicle_id, vehicle);
          Object.assign(listing, body);
          linked = true;
          data = listing;
        } else if (url.searchParams.has('vehicle_id')) data = linked ? [{ id: listingId }] : [];
        else data = url.searchParams.has('id') ? listing : [];
      } else if (url.pathname.includes('/rpc/')) {
        code = 404;
        data = { code: 'PGRST202' };
      }
      await route.fulfill({
        status: code,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    });
    const btn = (n) => page.getByRole('button', { name: n, exact: true }).filter({ visible: true }),
      field = (n) => page.getByRole('textbox', { name: n, exact: true });
    const select = async (label, option) => {
      await page.getByText(label, { exact: true }).locator('..').getByRole('button').click();
      await btn(option).click();
    };
    await page.goto(base + '/login');
    await field('E-mail').fill(user.email);
    await field('Senha').fill('Test123456');
    await btn('Entrar').click();
    await btn('Sair da conta').waitFor();
    await page.goto(base + '/management/clients');
    await page
      .getByText('O fluxo comercial aguarda a atualização autorizada do banco.', { exact: true })
      .waitFor();
    assert.equal(await field('Nome do cliente *').count(), 0);
    report.checks.push('pending migration shows explicit blocker without fake records');
    ready = true;
    await btn('Verificar novamente').click();
    await select('Gestão', 'Empresa teste');
    assert.equal(await field('Nome do cliente *').count(),0);
    await btn('Adicionar cliente').click();
    await field('Nome do cliente *').fill('Cliente teste');
    await field('E-mail do cliente').fill('cliente@example.invalid');
    await btn('Salvar cliente').click();
    await btn('Ficha de Cliente teste').waitFor();
    assert.equal(await btn('Excluir cliente').count(),0);
    await btn('Ficha de Cliente teste').click();
    await btn('Editar Cliente teste').click();
    await field('Nome do cliente *').fill('Cliente atualizado');
    await btn('Salvar cliente').click();
    await btn('Ficha de Cliente atualizado').waitFor();
    assert.equal(await btn('Editar Cliente atualizado').count(),0);
    await field('Pesquisar clientes').fill('ausente');
    await page.getByText('Nenhum cliente encontrado.', { exact: true }).waitFor();
    report.checks.push('customer create edit search through API contract');
    await page.goto(base + '/create');
    await btn('Novo cliente').click();
    await page.getByText('Clientes', { exact: true }).waitFor();
    report.checks.push('create exposes commercial actions only after backend availability');
    await page.goto(base + '/vehicles');
    await btn('Empresa teste').click();
    await btn('Anunciar este veículo').click();
    await page.getByText('Anúncio vinculado ao estoque.', { exact: true }).waitFor();
    assert.equal(await field('Título *').inputValue(), 'Carro teste');
    await field('Cidade e estado *').fill('Salvador BA');
    await btn('Revisar anúncio').click();
    await btn('Salvar anúncio').click();
    await btn('Confirmar').click();
    await page.goto(base + `/ad/new?kind=vehicles&organization=${org}&vehicle=${vehicle}`);
    await page.getByText('Editar anúncio', { exact: true }).waitFor();
    report.checks.push('stock creates a linked listing and reuses it instead of duplicating');
    await page.goto(base + '/vehicles');
    await btn('Empresa teste').click();
    await btn('Colocar em preparação').click();
    await btn('Confirmar estado do veículo').click();
    await page.getByText('Em preparação', { exact: true }).waitFor();
    assert.equal(await btn('Anunciar este veículo').count(), 0);
    await btn('Disponibilizar veículo').click();
    await btn('Confirmar estado do veículo').click();
    await btn('Anunciar este veículo').waitFor();
    report.checks.push('preparation and availability update stock without automatic republication');
    await page.goto(base + '/management/proposals');
    await select('Gestão', 'Empresa teste');
    await select('Cliente *', 'Cliente atualizado');
    await select('Veículo *', 'Carro teste');
    await field('Valor proposto (R$) *').fill('90,50');
    await field('Condições comerciais *').fill('À vista');
    await btn('Salvar rascunho').click();
    await btn('Enviar proposta').click();
    await btn('Aceitar proposta').click();
    await btn('Concluir venda').waitFor();
    assert.equal(status, 'available');
    await btn('Reservar para esta proposta').click();
    await btn('Confirmar reserva').click();
    await page.getByText('Estoque: Reservado', { exact: true }).waitFor();
    assert.equal(sales.length, 0);
    report.checks.push('explicit reservation preserves accepted proposal without creating sale');
    await btn('Ver histórico').click();
    await page.getByText(/Rascunho · R\$/).waitFor();
    report.checks.push('proposal creation transitions and history; acceptance does not sell');
    await btn('Concluir venda').click();
    await btn('Voltar à negociação').click();
    assert.equal(sales.length, 0);
    await btn('Concluir venda').click();
    await btn('Confirmar venda').click();
    await page.getByText('Venda concluída · R$ 90,50', { exact: true }).waitFor();
    await page.goto(base + '/management/sales');
    await select('Gestão', 'Empresa teste');
    await page.getByText('1 vendas concluídas', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(out, 'sales-390.png') });
    assert.equal(status, 'sold');
    report.checks.push(
      'confirmed sale and sales consultation; cancellation preserves availability',
    );
    await page.goto(base + '/management/clients');
    await select('Gestão', 'Empresa teste');
    await btn('Ficha de Cliente atualizado').click();
    await btn('Excluir cliente').click();
    await btn('Confirmar exclusão do cliente').click();
    await page
      .getByText(
        'Este registro possui vínculos comerciais. Preserve o histórico e arquive o cliente.',
        { exact: true },
      )
      .waitFor();
    report.checks.push('linked customer deletion error preserves record');
    buyer = true;
    listing.publication_status = 'published';
    status = 'available';
    await page.goto(base + '/ad/' + listingId);
    await field('Seu nome *').fill('Comprador');
    await field('Condições da oferta *').fill('PIX');
    await btn('Enviar oferta').click();
    await page
      .getByText('Proposta enviada. Ela ainda não representa uma compra concluída.', {
        exact: true,
      })
      .waitFor();
    await btn('Acompanhar proposta').click();
    await page.getByText('Enviada · R$ 100,00', { exact: true }).waitFor();
    assert.equal(await btn('Concluir venda').count(), 0);
    report.checks.push('marketplace offer and buyer tracking without sale permissions');
    personal = true;
    customers = [];
    proposals = [];
    sales = [];
    status = 'available';
    await page.goto(base + '/management/clients');
    await btn('Adicionar cliente').click();
    await field('Nome do cliente *').fill('Cliente pessoal');
    await field('Observações').fill('Contato sem empresa');
    await btn('Salvar cliente').click();
    await btn('Ficha de Cliente pessoal').waitFor();
    assert.equal(customers[0].owner_user_id, id);
    assert.equal(customers[0].organization_id, null);
    assert.equal(await btn('Editar Cliente pessoal').count(),0);
    await btn('Ficha de Cliente pessoal').click();
    await page.getByText('Contato sem empresa', { exact: true }).waitFor();
    await btn('Fez uma proposta?').click();
    await btn('Não, manter somente cliente').click();
    assert.equal(customers.length, 1);
    assert.equal(proposals.length, 0);
    report.checks.push('personal independent customer notes detail and optional proposal');
    await page.goto(base+'/vehicles');await btn('Meu estoque pessoal').click();
    await field('Marca e modelo').fill('Carro teste');await field('Preço (R$)').fill('100');
    await field('Preço de compra (R$; vazio = desconhecido)').fill('50');
    await field('Custos de preparação (R$; vazio = desconhecido)').fill('10');
    await btn('Salvar veículo').click();await btn('Anunciar este veículo').waitFor();
    assert.equal(personalStock.owner_user_id,id);assert.equal(personalStock.organization_id,null);assert.equal(personalStock.purchase_cost,50);
    report.checks.push('personal stock creation and private costs without company');
    linked=false;await btn('Anunciar este veículo').click();
    await field('Cidade e estado *').fill('Salvador BA');await btn('Revisar anúncio').click();await btn('Salvar anúncio').click();await btn('Confirmar').click();
    assert.equal(listing.owner_user_id,id);assert.equal(listing.organization_id,null);assert.equal(listing.purchase_cost,undefined);
    report.checks.push('personal inventory links public listing without leaking private costs');
    await page.goto(base + '/finance');
    await btn('Registrar venda direta').click();
    await select('Cliente *', 'Cliente pessoal');
    await select('Veículo *', 'Carro teste');
    await field('Preço efetivo (R$) *').fill('100');
    await field('Condições comerciais *').fill('PIX');
    await btn('Revisar venda').click();
    assert.equal(sales.length, 0);
    await btn('Confirmar venda direta').click();
    await page.getByText('1 vendas concluídas', { exact: true }).waitFor();
    await page.getByText('Lucro bruto apurado: R$ 40,00', { exact: true }).waitFor();
    await page.reload();
    await page.getByText('Margem bruta: 40.00%', { exact: true }).waitFor();
    assert.equal(status, 'sold');
    assert.equal(listing.publication_status, 'archived');
    report.checks.push(
      'personal direct sale financial known costs and simulated reload persistence',
    );
    await page.goto(base + '/management');
    await btn('Visão geral: resultados e vendas').waitFor();
    assert.equal(await btn('Vendas').count(), 0);
    await btn('Clientes').waitFor();
    report.checks.push('management overview and three primary shortcuts without independent sales');
    assert.deepEqual(report.errors, []);
  } catch (e) {
    report.errors.push(e.message);
    process.exitCode = 1;
    if (page) await page.screenshot({ path: path.join(out, 'ui-failure.png') }).catch(() => {});
  } finally {
    report.passed = report.checks.length;
    report.failed = report.errors.length;
    fs.writeFileSync(path.join(out, 'ui-mocked.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    await browser?.close();
    server.close();
  }
})();
