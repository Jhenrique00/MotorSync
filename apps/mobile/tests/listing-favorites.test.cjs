const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  createListingFavoritesRepository,
} = require('../src/services/listingFavoritesRepository.js');

const uid = 'a1111111-1111-4111-8111-000000000001';
const otherUid = 'a2222222-2222-4222-8222-000000000002';
const listingId = 'b1111111-1111-4111-8111-000000000001';
const listingId2 = 'b2222222-2222-4222-8222-000000000002';

function mockFavorites({
  rows = [],
  insertError = null,
  deleteError = null,
  readError = null,
} = {}) {
  const events = [];
  const client = {
    from(table) {
      events.push(['from', table]);
      let offset = 0;
      let end = 499;
      let operation = 'read';
      const query = {
        select() {
          return this;
        },
        insert(row) {
          operation = 'insert';
          events.push(['insert', row]);
          return this;
        },
        delete() {
          operation = 'delete';
          return this;
        },
        eq(column, value) {
          events.push(['eq', column, value]);
          return this;
        },
        order() {
          return this;
        },
        range(start, last) {
          offset = start;
          end = last;
          return this;
        },
        then(resolve, reject) {
          return Promise.resolve(
            operation === 'insert'
              ? { data: null, error: insertError }
              : operation === 'delete'
                ? { data: null, error: deleteError }
                : { data: rows.slice(offset, end + 1), error: readError },
          ).then(resolve, reject);
        },
      };
      return query;
    },
  };
  return { client, events };
}

test('Favoritos reais são carregados por usuário e paginados, sem consultar lista pública', async () => {
  const rows = Array.from({ length: 501 }, (_, i) => ({
    listing_id: i % 2 ? listingId : listingId2,
  }));
  const { client, events } = mockFavorites({ rows });
  const favorites = await createListingFavoritesRepository(client).list(uid);
  assert.equal(favorites.length, 501);
  assert.equal(events.filter((e) => e[0] === 'from').length, 2);
  assert.ok(events.some((e) => e[0] === 'eq' && e[1] === 'user_id' && e[2] === uid));
  assert.ok(!events.some((e) => e[0] === 'from' && e[1] === 'listings'));
});

test('Favoritos são inseridos somente com usuário e anúncio e remoção filtra ambos', async () => {
  const { client, events } = mockFavorites();
  const repo = createListingFavoritesRepository(client);
  assert.equal(await repo.set(uid, listingId, true), true);
  assert.deepEqual(events.find((e) => e[0] === 'insert')[1], {
    user_id: uid,
    listing_id: listingId,
  });
  events.length = 0;
  assert.equal(await repo.set(uid, listingId, false), false);
  assert.ok(events.some((e) => e[0] === 'eq' && e[1] === 'user_id' && e[2] === uid));
  assert.ok(events.some((e) => e[0] === 'eq' && e[1] === 'listing_id' && e[2] === listingId));
});

test('Favoritos rejeitam IDs inválidos, propagam falha e aceitam duplicação idempotente', async () => {
  const repo = createListingFavoritesRepository(mockFavorites().client);
  await assert.rejects(() => repo.list('forged-user-id'), /inválido/);
  await assert.rejects(() => repo.set(uid, 'local-demo', true), /inválido/);
  const failed = createListingFavoritesRepository(
    mockFavorites({ insertError: { code: '42501' } }).client,
  );
  await assert.rejects(
    () => failed.set(uid, listingId, true),
    (e) => e.code === '42501',
  );
  const duplicated = createListingFavoritesRepository(
    mockFavorites({ insertError: { code: '23505' } }).client,
  );
  assert.equal(await duplicated.set(uid, listingId, true), true);
  const deleting = createListingFavoritesRepository(
    mockFavorites({ deleteError: { code: '42501' } }).client,
  );
  await assert.rejects(
    () => deleting.set(uid, listingId, false),
    (e) => e.code === '42501',
  );
});

test('SQL dos favoritos é privado por RLS: anônimo sem acesso, dono pode ler/escrever/apagar', () => {
  const sql = fs.readFileSync(
    path.join(
      __dirname,
      '..',
      '..',
      '..',
      'supabase/migrations/20261110070000_private_listing_favorites.sql',
    ),
    'utf8',
  );
  assert.match(sql, /create table public\.listing_favorites/i);
  assert.match(sql, /primary key \(user_id, listing_id\)/i);
  assert.match(sql, /alter table public\.listing_favorites enable row level security/i);
  assert.match(sql, /revoke all on public\.listing_favorites from public, anon, authenticated/i);
  assert.match(sql, /grant select, insert, delete on public\.listing_favorites to authenticated/i);
  assert.match(sql, /for select to authenticated using \(user_id = \(select auth\.uid\(\)\)\)/i);
  assert.match(sql, /for insert to authenticated with check/i);
  assert.match(sql, /publication_status = 'published'/i);
  assert.match(sql, /for delete to authenticated using \(user_id = \(select auth\.uid\(\)\)\)/i);
});

test('Interfaces reais usam contexto remoto, mas demonstração continua separada', () => {
  const src = path.join(__dirname, '..', 'src');
  const screen = (name) => fs.readFileSync(path.join(src, name), 'utf8');
  assert.match(screen('screens/SavedScreen.jsx'), /favorites\.ids/);
  assert.match(screen('screens/ExploreScreen.jsx'), /favorites: favorites\.ids/);
  assert.match(screen('components/MarketCard.jsx'), /favorites\.toggle\(item\.id\)/);
  assert.match(screen('components/FeedPost.jsx'), /favorites\.toggle\(listing\.id\)/);
  assert.match(screen('screens/AdScreen.jsx'), /favorites\.toggle\(id\)/);
  assert.match(
    fs.readFileSync(path.join(__dirname, '..', 'app/_layout.jsx'), 'utf8'),
    /ListingFavoritesProvider/,
  );
  assert.doesNotMatch(screen('services/demoRepository.js'), /\bisUuid\b/);
});
