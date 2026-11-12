const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateAttribute, validateFilters, photoPrefix } = require('../src/data/listingRules.js');
const { validateListing, createListingApi } = require('../src/services/listingRepository.js');
const base = {
  title: 'Teste',
  price: '10,25',
  category: 'vehicles',
  subcategory: 'cars',
  location: 'Cidade, UF',
  publication_status: 'draft',
  attributes: {},
};
test('numeric contracts reject fractions, overflow, NaN and invalid enums', () => {
  for (const [field, value] of [
    ['year', '2020.0'],
    ['year', '1899'],
    ['mileage', '10000001'],
    ['displacement', '0'],
    ['axles', '21'],
    ['length', '500.01'],
    ['length', '1.001'],
    ['hours', '1000001'],
    ['quantity', '0'],
    ['quantity', '1e2'],
    ['fuel', 'Qualquer'],
    ['price', 'NaN'],
  ])
    assert.throws(() => validateAttribute(field, value), field + ':' + value);
  for (const [field, value] of [
    ['year', '2020'],
    ['mileage', '0'],
    ['length', '0,01'],
    ['length', '500'],
    ['axles', '20'],
    ['quantity', '1000000'],
  ])
    assert.ok(validateAttribute(field, value));
  assert.throws(() => validateListing({ ...base, price: '1.001' }));
});
test('filters and category forms use the same attribute limits', () => {
  assert.throws(() => validateFilters('vehicles', 'cars', { 'year:min': '2020.5' }));
  assert.throws(() => validateFilters('parts', 'brakes', { mileage: '10' }));
  assert.throws(() => validateFilters('vehicles', 'boats', { 'length:min': '500.01' }));
  assert.throws(() =>
    validateFilters('vehicles', 'cars', { 'price:min': '200', 'price:max': '100' }),
  );
  assert.doesNotThrow(() =>
    validateFilters('vehicles', 'boats', { 'length:min': '0,01', 'length:max': '500' }),
  );
});
test('photo references enforce namespace, uniqueness and count locally', () => {
  const prefix = photoPrefix('a1000000-0000-4000-8000-000000000001');
  const p = prefix + 'photo.jpg';
  assert.ok(validateListing({ ...base, photo_paths: [p] }));
  assert.equal(
    photoPrefix('u', 'b1000000-0000-4000-8000-000000000001'),
    'org/b1000000-0000-4000-8000-000000000001/',
  );
  for (const paths of [[null], [p, p], ['https://external/photo.jpg'], Array(7).fill(p)])
    assert.throws(() => validateListing({ ...base, photo_paths: paths }));
});
test('personal/org/public listing queries remain distinct and owner not in update payload', async () => {
  const calls = [];
  const query = {};
  for (const method of ['select', 'eq', 'order', 'limit', 'single', 'insert', 'update', 'delete'])
    query[method] = (...args) => {
      calls.push([method, ...args]);
      return query;
    };
  query.then = (resolve) => resolve({ data: [], error: null });
  const api = createListingApi({
    auth: { getUser: async () => ({ data: { user: { id: 'me' } } }) },
    from: (table) => {
      calls.push(['from', table]);
      return query;
    },
  });
  await api.mine();
  assert.ok(calls.some((c) => c[0] === 'eq' && c[1] === 'owner_user_id' && c[2] === 'me'));
  calls.length = 0;
  await api.organization('org-a');
  assert.ok(calls.some((c) => c[0] === 'eq' && c[1] === 'organization_id' && c[2] === 'org-a'));
  calls.length = 0;
  await api.catalog();
  assert.ok(
    calls.some((c) => c[0] === 'eq' && c[1] === 'publication_status' && c[2] === 'published'),
  );
  calls.length = 0;
  await api.save({ ...base, owner_user_id: 'other' }, 'existing', 'other-org');
  const payload = calls.find((c) => c[0] === 'update')[1];
  assert.equal(payload.owner_user_id, undefined);
  assert.equal(payload.organization_id, undefined);
});
