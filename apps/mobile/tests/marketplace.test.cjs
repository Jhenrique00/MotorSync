const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateListing, filterListings } = require('../src/services/listingRepository.js');
const { fieldsFor, taxonomy } = require('../src/data/taxonomy.js');
const base = {
  title: 'Meu carro',
  price: '120,50',
  category: 'vehicles',
  subcategory: 'cars',
  location: 'Salvador, BA',
  publication_status: 'draft',
  attributes: { year: '2020' },
};
test('personal listing validates without an organization and excludes private costs', () => {
  const result = validateListing({
    ...base,
    owner_user_id: 'intruder',
    attributes: { year: '2020' },
  });
  assert.equal(result.price, 120.5);
  assert.equal(result.organization_id, undefined);
  assert.equal(result.owner_user_id, undefined);
  assert.equal(result.attributes.cost, undefined);
  assert.throws(() => validateListing({ ...base, attributes: { cost: 999 } }));
});
test('taxonomy distinguishes product forms and invalid cross-category selection', () => {
  assert.equal(taxonomy.length, 3);
  assert.ok(fieldsFor('parts', 'brakes').includes('reference'));
  assert.ok(!fieldsFor('parts', 'brakes').includes('mileage'));
  assert.throws(() => validateListing({ ...base, category: 'parts' }));
  assert.throws(() => validateListing({ ...base, attributes: { year: '1800' } }));
});
test('filters use real attributes, inclusive ranges, no unknown matches and price sorting', () => {
  const rows = [
    { ...base, id: 'a', price: 120.5, attributes: { year: '2020' }, created_at: '2026-01-01' },
    { ...base, id: 'b', price: 100, attributes: { year: '2022' }, created_at: '2026-02-01' },
  ];
  assert.deepEqual(
    filterListings(rows, {
      category: 'vehicles',
      subcategory: 'cars',
      filters: { 'year:min': '2021' },
    }).map((x) => x.id),
    ['b'],
  );
  assert.equal(filterListings(rows, { filters: { fuel: 'Diesel' } }).length, 0);
  assert.deepEqual(
    filterListings(rows, { sort: 'price-asc' }).map((x) => x.id),
    ['b', 'a'],
  );
  assert.equal(filterListings(rows, { favoritesOnly: true, favorites: ['a'] })[0].id, 'a');
});
