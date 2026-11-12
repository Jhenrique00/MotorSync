const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createExploreApi, adaptSelection } = require('../src/services/exploreApi.js');
const { periodRange, validateEntry, createFinanceApi } = require('../src/services/financeApi.js');
function mock() {
  const calls = [];
  const q = {
    then(resolve) {
      return Promise.resolve({ data: [], count: 42, error: null }).then(resolve);
    },
  };
  for (const method of ['select', 'eq', 'ilike', 'or', 'in', 'gte', 'lte', 'order', 'range'])
    q[method] = (...args) => {
      calls.push([method, ...args]);
      return q;
    };
  return {
    calls,
    client: {
      from: (t) => {
        calls.push(['from', t]);
        return q;
      },
      rpc: async () => ({ error: { code: 'PGRST202' } }),
    },
  };
}
test('REST search counts on server, pages results and always requires publication', async () => {
  const { client, calls } = mock();
  const r = await createExploreApi(client).search(
    {
      category: 'vehicles',
      subcategory: 'cars',
      filters: { 'price:min': '100,50' },
      sort: 'price-asc',
    },
    2,
  );
  assert.equal(r.count, 42);
  assert.deepEqual(
    calls.find((x) => x[0] === 'range'),
    ['range', 40, 59],
  );
  assert.ok(calls.some((x) => x[0] === 'select' && x[2].count === 'exact'));
  assert.ok(
    calls.some((x) => x[0] === 'eq' && x[1] === 'publication_status' && x[2] === 'published'),
  );
  assert.ok(calls.some((x) => x[0] === 'gte' && x[2] === 100.5));
});
test('numeric JSON ranges never fall back to lexical comparisons', async () => {
  const { client } = mock();
  await assert.rejects(
    () =>
      createExploreApi(client).search({
        category: 'vehicles',
        subcategory: 'cars',
        filters: { 'mileage:min': '100' },
      }),
    /numéricos/,
  );
});
test('favorites exclude malformed IDs and never broaden an empty saved search', async () => {
  const { client, calls } = mock();
  const validId = 'b1111111-1111-4111-8111-000000000001';
  const api = createExploreApi(client);
  await api.search({ favoritesOnly: true, favorites: ['local-demo', validId, 'invalid'] });
  assert.deepEqual(
    calls.find((call) => call[0] === 'in'),
    ['in', 'id', [validId]],
  );
  calls.length = 0;
  await api.search({ favoritesOnly: true, favorites: ['local-demo'] });
  assert.deepEqual(
    calls.find((call) => call[0] === 'in'),
    ['in', 'id', ['00000000-0000-0000-0000-000000000000']],
  );
});
test('changing category removes incompatible fields and keeps price/location', () => {
  const old = {
    category: 'vehicles',
    subcategory: 'cars',
    filters: { brand: 'A', 'year:min': '2020', 'price:max': '1000', location: 'BA' },
  };
  assert.deepEqual(adaptSelection(old, 'parts', 'brakes').filters, {
    'price:max': '1000',
    location: 'BA',
  });
  assert.equal(adaptSelection(old, 'vehicles', 'cars'), old);
});
test('remote RPC errors do not silently become empty results or REST fallback', async () => {
  await assert.rejects(
    () =>
      createExploreApi({
        rpc: async () => ({ error: { code: '42501', message: 'denied' } }),
      }).search({}),
    (e) => e.code === '42501',
  );
});
test('periods use Bahia date, include today and handle year boundaries', () => {
  const now = new Date('2026-01-01T02:00:00Z');
  assert.deepEqual(periodRange('7', now), { from: '2025-12-25', to: '2025-12-31' });
  assert.deepEqual(periodRange('12m', new Date('2026-10-29T18:00:00Z')), {
    from: '2025-11-01',
    to: '2026-10-29',
  });
});
test('financial amounts/dates reject misleading precision, future and invalid calendar days', () => {
  const base = {
    kind: 'expense',
    description: 'Serviço',
    amount: '10,25',
    occurred_on: '2026-01-01',
  };
  assert.equal(validateEntry(base).amount, 10.25);
  for (const amount of ['0', '-1', '1.001', 'NaN'])
    assert.throws(() => validateEntry({ ...base, amount }));
  for (const occurred_on of ['2026-02-30', '2099-01-01', '1999-01-01'])
    assert.throws(() => validateEntry({ ...base, occurred_on }));
  assert.throws(() => validateEntry({ ...base, kind: 'sale' }));
});
test('finance save binds owner to verified user and rejects changed identity', async () => {
  let body;
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'verified' } } }) },
    from: () => ({
      insert: (p) => {
        body = p;
        return { select: () => ({ single: async () => ({ data: p }) }) };
      },
    }),
  };
  const api = createFinanceApi(client);
  const base = {
    kind: 'income',
    description: 'Receita',
    amount: '10',
    occurred_on: '2026-01-01',
    owner_user_id: 'forged',
  };
  await api.save(base, null, 'manual-123', 'verified');
  assert.equal(body.owner_user_id, 'verified');
  assert.equal(body.organization_id, null);
  await assert.rejects(() => api.save(base, null, 'manual-456', 'another'), /conta mudou/);
});
test('chart timeline preserves elapsed days and leaves wholly empty periods empty', () => {
  const { financialSeries } = require('../src/services/financeApi.js');
  assert.deepEqual(financialSeries([], '2026-01-01', '2026-01-03'), []);
  const rows = financialSeries(
    [{ day: '2026-01-02', revenue: 10, cost: 0, income: 0, expenses: 0, missing_cost: 0 }],
    '2026-01-01',
    '2026-01-03',
  );
  assert.equal(rows.length, 3);
  assert.equal(rows[0].noRecords, true);
  assert.equal(rows[1].revenue, 10);
});
test('numeric range syntax rejects text ranges and extra path fragments', () => {
  const { validateFilters } = require('../src/data/listingRules.js');
  assert.throws(() => validateFilters('vehicles', 'cars', { 'brand:min': 'Ford' }));
  assert.throws(() => validateFilters('vehicles', 'cars', { 'year:min:extra': '2020' }));
});
