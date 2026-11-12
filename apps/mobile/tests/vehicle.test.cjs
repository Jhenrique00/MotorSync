const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateVehicle, createVehicleApi } = require('../src/services/vehicleRepository.js');
test('vehicle validation rejects missing, negative, zero, excessive and malformed prices', () => {
  for (const price of [
    '',
    ' ',
    '-1',
    '0',
    'Infinity',
    'NaN',
    '1000000000000',
    '1.999',
    '1e2',
    '1.000,00',
  ])
    assert.throws(() => validateVehicle({ title: 'Car', price }));
  assert.throws(() => validateVehicle({ title: ' ', price: '10' }));
  assert.deepEqual(validateVehicle({ title: ' Car ', price: '10,50' }), {
    title: 'Car',
    price: 10.5,
  });
});
test('vehicle writes whitelist fields and scope updates/deletes by organization', async () => {
  const calls = [];
  const chain = {};
  for (const op of ['select', 'eq', 'order', 'insert', 'update', 'delete'])
    chain[op] = (...args) => {
      calls.push([op, ...args]);
      return chain;
    };
  chain.single = async () => ({ data: { id: 'v' }, error: null });
  const api = createVehicleApi({ from: () => chain });
  await api.save('a', { title: 'Car', price: '10', organization_id: 'b', id: 'spoof' }, 'v');
  assert.deepEqual(
    calls.find((c) => c[0] === 'update'),
    ['update', { title: 'Car', price: 10 }],
  );
  assert.ok(calls.some((c) => c[0] === 'eq' && c[1] === 'organization_id' && c[2] === 'a'));
  calls.length = 0;
  await api.remove('a', 'v');
  assert.ok(calls.some((c) => c[0] === 'eq' && c[1] === 'organization_id' && c[2] === 'a'));
});
test('vehicle server failures propagate instead of returning demo data', async () => {
  const failure = new Error('network failed');
  const chain = { select: () => chain, order: async () => ({ error: failure }) };
  await assert.rejects(createVehicleApi({ from: () => chain }).catalog(), /network failed/);
});

test('real vehicle money formatting preserves cents and Brazilian separators', () => {
  const { moneyWithCents } = require('../src/utils/catalog.js');
  assert.match(moneyWithCents(123456.78), /^R\$\s123\.456,78$/);
  assert.match(moneyWithCents('120000.50'), /^R\$\s120\.000,50$/);
});
