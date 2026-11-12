const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createAuthApi } = require('../src/services/authApi.js');
test('signup validation prevents invalid requests and preserves confirmation-required response', async () => {
  let calls = 0;
  const api = createAuthApi({
    auth: {
      signUp: async (input) => {
        calls++;
        assert.equal(input.email, 'a@example.com');
        return { data: { session: null, user: { id: 'a' } }, error: null };
      },
    },
  });
  assert.throws(() => api.signUp('bad', '12345678'));
  assert.throws(() => api.signUp('a@example.com', '123'));
  assert.equal(calls, 0);
  assert.equal((await api.signUp(' a@example.com ', '12345678')).session, null);
});
test('login propagates rejected credentials and returns session on success', async () => {
  const err = new Error('invalid_credentials');
  await assert.rejects(
    createAuthApi({ auth: { signInWithPassword: async () => ({ error: err }) } }).signIn(
      'a@example.com',
      'wrong',
    ),
    err,
  );
  const session = { user: { id: 'a' } };
  assert.deepEqual(
    await createAuthApi({
      auth: { signInWithPassword: async () => ({ data: { session } }) },
    }).signIn('a@example.com', 'valid'),
    { session },
  );
});
test('logout only revokes current device and reports failures', async () => {
  let input;
  await createAuthApi({
    auth: {
      signOut: async (args) => {
        input = args;
        return { error: null };
      },
    },
  }).signOut();
  assert.deepEqual(input, { scope: 'local' });
  await assert.rejects(
    createAuthApi({ auth: { signOut: async () => ({ error: new Error('offline') }) } }).signOut(),
    /offline/,
  );
});
