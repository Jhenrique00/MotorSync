const test = require('node:test'),
  assert = require('node:assert/strict');
test('results never infer zero for missing costs and exclude invalid sale prices', async () => {
  const { saleResult, commercialResults } = await import('../src/utils/commercialResults.js');
  assert.equal(saleResult({ amount: 100, purchase_cost: null, preparation_cost: 0 }).profit, null);
  assert.equal(saleResult({ amount: 0, purchase_cost: 0, preparation_cost: 0 }).margin, null);
  assert.equal(saleResult({ amount: 100, purchase_cost: 90, preparation_cost: 20 }).profit, -10);
  const r = commercialResults([
    { amount: 100, purchase_cost: 50, preparation_cost: 10 },
    { amount: 200, purchase_cost: null, preparation_cost: 0 },
    { amount: 'invalid' },
  ]);
  assert.equal(r.revenue, 300);
  assert.equal(r.profit, 40);
  assert.equal(r.margin, 40);
  assert.equal(r.unknown, 1);
  assert.equal(r.invalid, 1);
});
test('personal customer derives owner from verified auth and whitelists notes', async () => {
  const { createCommercialApi } = await import('../src/services/commercialApi.js');
  let sent;
  const q = {
    insert: (p) => {
      sent = p;
      return q;
    },
    select: () => q,
    single: async () => ({ data: sent }),
  };
  const api = createCommercialApi({
    auth: { getUser: async () => ({ data: { user: { id: 'verified' } } }) },
    from: () => q,
  });
  await api.saveCustomer('personal', {
    name: 'Pessoa',
    notes: 'Observação',
    owner_user_id: 'attacker',
  });
  assert.equal(sent.owner_user_id, 'verified');
  assert.equal(sent.organization_id, null);
  assert.equal(sent.notes, 'Observação');
});
test('personal proposal allows absent vehicle; direct sale uses exactly one RPC', async () => {
  const { createCommercialApi } = await import('../src/services/commercialApi.js');
  const calls = [];
  const api = createCommercialApi({
    rpc: async (name, args) => {
      calls.push({ name, args });
      return { data: {} };
    },
  });
  const id = '10000000-0000-4000-8000-000000000001';
  await api.createProposal('personal', { customer_id: id, amount: '100', terms: 'PIX' });
  assert.equal(calls[0].args.p_org, null);
  assert.equal(calls[0].args.p_vehicle, null);
  await api.directSale({
    customer_id: id,
    vehicle_id: id,
    amount: '100',
    terms: 'PIX',
    sold_at: '2026-11-01',
  });
  assert.equal(calls[1].name, 'commercial_direct_sale');
  assert.equal(calls.length, 2);
});
test('new scope FK selects disambiguate PostgREST embeddings', async () => {
  const { createCommercialApi } = await import('../src/services/commercialApi.js');
  let fields;
  const q = {
    select: (v) => {
      fields = v;
      return q;
    },
    is: () => q,
    order: () => q,
    range: async () => ({ data: [] }),
  };
  const api = createCommercialApi({ rpc: async () => ({ data: 2 }), from: () => q });
  await api.ready();
  await api.proposals('personal');
  assert.match(fields, /customers!proposals_customer_id_scope_fk/);
});
