const { test } = require('node:test'),
  assert = require('node:assert/strict');
const {
  validateCustomer,
  validateProposal,
  proposalTransitions,
} = require('../src/utils/commercial.js');
const { createCommercialApi } = require('../src/services/commercialApi.js');
const org = '20000000-0000-4000-8000-000000000001',
  id = '10000000-0000-4000-8000-000000000001';
test('commercial customer validates and whitelists fields', () => {
  assert.deepEqual(
    validateCustomer({
      name: ' João ',
      email: '',
      phone: '',
      organization_id: 'forged',
      archived: true,
    }),
    { name: 'João', email: '', phone: '' },
  );
  for (const v of [{ name: '' }, { name: 'A', email: 'bad' }, { name: 'A', phone: 'abc' }])
    assert.throws(() => validateCustomer(v));
});
test('commercial proposal rejects nonfinite, excessive, negative and rounded money', () => {
  for (const amount of ['0', '-1', 'Infinity', '1.001', '1000000000000'])
    assert.throws(() => validateProposal({ amount, terms: 'À vista' }));
  assert.deepEqual(validateProposal({ amount: '100,25', terms: ' PIX ' }), {
    amount: 100.25,
    terms: 'PIX',
  });
  assert.throws(() => validateProposal({ amount: 1, terms: '' }));
  assert.deepEqual(proposalTransitions.completed, []);
  assert.ok(!proposalTransitions.sent.includes('completed'));
});
test('sale completion makes one transactional RPC and never edits inventory client-side', async () => {
  const calls = [];
  const api = createCommercialApi({
    rpc: async (name, args) => {
      calls.push([name, args]);
      return { data: { id: 'sale' } };
    },
    from: () => {
      throw Error('Must not write tables');
    },
  });
  assert.deepEqual(await api.completeSale(id), { id: 'sale' });
  assert.deepEqual(calls, [['commercial_complete_sale', { p_proposal: id }]]);
});
test('commercial readiness distinguishes missing migration from broken connection', async () => {
  assert.equal(
    await createCommercialApi({ rpc: async () => ({ error: { code: 'PGRST202' } }) }).ready(),
    false,
  );
  await assert.rejects(() =>
    createCommercialApi({ rpc: async () => ({ error: { code: '503' } }) }).ready(),
  );
  assert.equal(await createCommercialApi({ rpc: async () => ({ data: 1 }) }).ready(), true);
});
test('proposal creation binds selected organization and rejects invalid IDs before HTTP', async () => {
  let call;
  const api = createCommercialApi({
    rpc: async (name, args) => {
      call = [name, args];
      return { data: { id } };
    },
  });
  await api.createProposal(org, {
    customer_id: id,
    vehicle_id: id,
    amount: 100,
    terms: 'PIX',
    status: 'completed',
    seller_user_id: 'forged',
  });
  assert.equal(call[0], 'commercial_create_proposal');
  assert.equal(call[1].p_org, org);
  assert.equal(Object.keys(call[1]).length, 5);
  assert.throws(() => api.createProposal('forged', { amount: 1, terms: 'PIX' }));
});
test('commercial lists read beyond one API page without truncating history', async () => {
  const ranges = [];
  const query = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    order() {
      return this;
    },
    range(from, to) {
      ranges.push([from, to]);
      return Promise.resolve({
        data: Array.from({ length: from === 0 ? 200 : 1 }, (_, i) => ({ id: from + i })),
      });
    },
  };
  const rows = await createCommercialApi({ from: () => query }).customers(org);
  assert.equal(rows.length, 201);
  assert.deepEqual(ranges, [
    [0, 199],
    [200, 399],
  ]);
});
test('sale eligibility respects preparation and the proposal owning a reservation', () => {
  const { canCompleteSale } = require('../src/utils/commercial.js');
  const proposal = { id, status: 'accepted' };
  assert.equal(canCompleteSale(proposal, { commercial_status: 'preparing' }), false);
  assert.equal(canCompleteSale(proposal, { commercial_status: 'available' }), true);
  assert.equal(
    canCompleteSale(proposal, { commercial_status: 'reserved', reserved_proposal_id: org }),
    false,
  );
  assert.equal(
    canCompleteSale(proposal, { commercial_status: 'reserved', reserved_proposal_id: id }),
    true,
  );
  assert.equal(
    canCompleteSale({ ...proposal, status: 'sent' }, { commercial_status: 'available' }),
    false,
  );
  assert.equal(canCompleteSale(proposal, { commercial_status: 'sold' }), false);
});
test('reservation uses the backend transaction with explicit vehicle and proposal', async () => {
  let received;
  const api = createCommercialApi({
    rpc: async (name, args) => {
      received = { name, args };
      return { data: { id } };
    },
  });
  await api.setVehicleState(id, 'reserved', org);
  assert.deepEqual(received, {
    name: 'commercial_set_vehicle_state',
    args: { p_vehicle: id, p_status: 'reserved', p_proposal: org },
  });
});
