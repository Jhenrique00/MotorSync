const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createAccountApi } = require('../src/services/accountApi.js');
function mock({ user = { id: 'user-a' }, failure = null, existing = true } = {}) {
  const calls = [];
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table) {
      const query = { table, operation: 'select' };
      calls.push(query);
      const chain = {
        select() {
          return chain;
        },
        eq(key, value) {
          query.filter = [key, value];
          return chain;
        },
        update(payload) {
          query.operation = 'update';
          query.payload = payload;
          return chain;
        },
        insert(payload) {
          query.operation = 'insert';
          query.payload = payload;
          return chain;
        },
        then(resolve) {
          return Promise.resolve({ data: [], error: failure }).then(resolve);
        },
        maybeSingle: async () => ({
          data: existing ? { id: 'user-a', display_name: 'Nome' } : null,
          error: failure,
        }),
        single: async () => ({ data: { id: 'user-a', ...query.payload }, error: failure }),
      };
      return chain;
    },
  };
  return { client, calls };
}
test('account rejects unauthenticated reads without querying tables', async () => {
  const { client, calls } = mock({ user: null });
  await assert.rejects(createAccountApi(client).load(), /Autenticação/);
  assert.equal(calls.length, 0);
});
test('account queries scope to identity returned by server', async () => {
  const { client, calls } = mock();
  await createAccountApi(client).load();
  assert.deepEqual(
    calls.map((x) => x.filter),
    [
      ['id', 'user-a'],
      ['user_id', 'user-a'],
    ],
  );
});
test('editing a name cannot change user ID or organizational role', async () => {
  const { client, calls } = mock();
  await createAccountApi(client).saveName(' Alex ');
  assert.deepEqual(calls[0].payload, { display_name: 'Alex' });
  assert.deepEqual(calls[0].filter, ['id', 'user-a']);
});
test('first profile uses verified user ID and validates name before database calls', async () => {
  const { client, calls } = mock({ existing: false });
  const api = createAccountApi(client);
  await assert.rejects(api.saveName(' '));
  assert.equal(calls.length, 0);
  await api.saveName('Alex');
  assert.deepEqual(calls[1].payload, { id: 'user-a', display_name: 'Alex' });
});
test('database failures are never replaced by demonstration records', async () => {
  const { client } = mock({ failure: new Error('RLS denied') });
  await assert.rejects(createAccountApi(client).load(), /RLS denied/);
  await assert.rejects(createAccountApi(client).saveName('Alex'), /RLS denied/);
});
