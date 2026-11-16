const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
function source(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('Home continua acessivel sem alterar o fluxo publico anterior', () => {
  assert.match(source('app/(tabs)/index.jsx'), /HomeScreen/);
  assert.doesNotMatch(source('app/(tabs)/index.jsx'), /Redirect/);
});

test('login mantém autenticação real, cadastro e recuperação com tema existente', () => {
  const login = source('src/screens/LoginScreen.jsx');
  assert.match(login, /signIn\(email, password\)/);
  assert.match(login, /signUp\(email, password\)/);
  assert.match(login, /router\.push\('\/recover'\)/);
  assert.match(login, /router\.replace\('\/profile'\)/);
  assert.match(login, /<Brand \/>/);
  assert.match(login, /colors\.accent/);
  assert.match(login, /secureTextEntry=\{secure && !visible\}/);
  assert.match(login, /Conexão com Supabase não configurada/);
});

test('sair da conta volta para login, não remove auth existente', () => {
  const profile = source('src/screens/ProfileScreen.jsx');
  assert.match(profile, /await signOut\(\)/);
  assert.doesNotMatch(profile, /router\.replace\('\/login'\)/);
  assert.match(source('src/services/supabase.js'), /persistSession: true/);
});
