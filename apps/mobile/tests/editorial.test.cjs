const { test } = require('node:test');
const assert = require('node:assert/strict');
const { palettes } = require('../src/theme/tokens.js');
const lum = (hex) => {
  const rgb = hex
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};
const contrast = (a, b) => {
  const x = lum(a),
    y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
test('both editorial themes meet AA text contrast and essential field borders', () => {
  for (const [mode, p] of Object.entries(palettes)) {
    for (const bg of ['background', 'surface', 'elevated'])
      for (const fg of ['text', 'muted', 'accentText', 'danger', 'success', 'warning', 'info'])
        assert.ok(contrast(p[fg], p[bg]) >= 4.5, `${mode} ${fg}/${bg}`);
    assert.ok(contrast(p.onAccent, p.accent) >= 4.5, mode + ' button text');
    assert.ok(contrast(p.fieldBorder, p.surface) >= 3, mode + ' field boundary');
    assert.ok(contrast(p.accentText, p.accentSoft) >= 4.5, mode + ' selected text');
  }
});
test('signup retains immediate Supabase session without performing logout', async () => {
  const { createAuthApi } = require('../src/services/authApi.js');
  let loggedOut = false;
  const session = { access_token: 'fixture', user: { id: 'fixture-user' } };
  const api = createAuthApi({
    auth: {
      signUp: async () => ({ data: { session, user: session.user }, error: null }),
      signOut: async () => {
        loggedOut = true;
      },
    },
  });
  assert.equal((await api.signUp('fixture@example.com', '12345678')).session, session);
  assert.equal(loggedOut, false);
});
