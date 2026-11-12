const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { filterListings, inventorySummary } = require('../src/utils/catalog.js');
const { createDemoState, demoReducer } = require('../src/services/demoRepository.js');
const { validateEnvironment } = require('../src/config/environment.js');
test('search respects visibility, accents, categories and favorites', () => {
  const rows = [
    {
      id: '1',
      title: 'Veículo',
      city: 'São Paulo',
      category: 'Carros',
      published: true,
      status: 'Disponível',
    },
    { id: '2', title: 'Veículo', category: 'Carros', published: false },
    { id: '3', title: 'Veículo', category: 'Carros', published: true, status: 'Vendido' },
  ];
  assert.deepEqual(
    filterListings(rows, { query: 'SAO PAULO', favorites: ['1'] }).map((x) => x.id),
    ['1'],
  );
  assert.equal(filterListings(rows, { category: 'Motos' }).length, 0);
  assert.equal(filterListings(rows, { favorites: [] }).length, 0);
});
test('capital excludes external vehicles and separates cost from asking price', () => {
  const state = createDemoState();
  const summary = inventorySummary(state.listings);
  assert.equal(summary.cost, 496100);
  assert.equal(summary.potential, 588600);
  assert.equal(summary.available, 2);
  assert.equal(summary.reserved, 1);
});
test('social toggles remain reversible and never mutate the seed', () => {
  const initial = createDemoState();
  const liked = demoReducer(initial, { type: 'liked', id: 'f1' });
  assert.deepEqual(initial.liked, []);
  assert.deepEqual(liked.liked, ['f1']);
  assert.deepEqual(demoReducer(liked, { type: 'liked', id: 'f1' }).liked, []);
  assert.equal(demoReducer(initial, { type: 'liked', id: 'missing' }), initial);
});
test('comments are trimmed, bounded and reset clears local interactions', () => {
  const state = createDemoState();
  const count = state.posts[0].comments.length;
  const next = demoReducer(state, {
    type: 'comment',
    id: 'f1',
    text: '  Teste local  ',
    commentId: 't1',
  });
  assert.equal(next.posts[0].comments.at(-1).text, 'Teste local');
  assert.equal(state.posts[0].comments.length, count);
  assert.equal(demoReducer(state, { type: 'comment', id: 'f1', text: 'x'.repeat(501) }), state);
  assert.equal(demoReducer(next, { type: 'reset' }).posts[0].comments.length, count);
});
test('backend stays disabled for missing, partial or unsafe configuration', () => {
  assert.equal(validateEnvironment('', '').configured, false);
  assert.ok(validateEnvironment('https://example.test', '').error);
  assert.equal(validateEnvironment('http://example.test', 'sb_publishable_test').configured, false);
  assert.equal(validateEnvironment('https://example.test', 'sb_secret_test').configured, false);
  assert.equal(validateEnvironment('https://example.test', 'sb_publishable_test').configured, true);
});
test('all four original brand PNGs retain exact bytes', () => {
  const manifest = require('../../../docs/reference/brand-checksums.json');
  for (const [name, hash] of Object.entries(manifest))
    assert.equal(
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(__dirname, '../assets', name + '.png')))
        .digest('hex'),
      hash,
    );
});
test('application source is JavaScript and contains no WebView', () => {
  function walk(dir) {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
  }
  for (const file of [
    ...walk(path.join(__dirname, '../app')),
    ...walk(path.join(__dirname, '../src')),
  ]) {
    assert.ok(!/\.tsx?$/.test(file), file);
    assert.ok(!/react-native-webview/.test(fs.readFileSync(file, 'utf8')), file);
  }
});
