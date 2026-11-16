const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sourceRoot = path.join(__dirname, '..', 'src');
const source = (relative) => fs.readFileSync(path.join(sourceRoot, relative), 'utf8');

test('UUIDs validos usam uma unica regra nos dominios social, comercial e marketplace', () => {
  const { isUuid } = require('../src/utils/identifiers.js');
  assert.equal(isUuid('b1111111-1111-4111-8111-000000000001'), true);
  assert.equal(isUuid('B1111111-1111-4111-8111-000000000001'), true);
  for (const value of [
    '',
    null,
    undefined,
    {},
    123,
    'local-demo',
    'b1111111-1111-4111-8111-00000000001',
  ]) {
    assert.equal(isUuid(value), false, `ID invalido aceito: ${String(value)}`);
  }
  for (const file of [
    'services/socialRepository.js',
    'services/exploreApi.js',
    'screens/CommentsScreen.jsx',
    'services/listingFavoritesRepository.js',
    'utils/commercial.js',
  ]) {
    assert.match(source(file), /\bisUuid\b/, `${file} deve usar a validacao compartilhada`);
  }
});

test('acao Criar publicacao existe e exige autenticacao', () => {
  const { actions, actionDestination } = require('../src/config/actions.js');
  const post = actions.find((action) => action.id === 'post');
  assert.equal(post.ready, true);
  assert.equal(post.domain, 'Publicar');
  assert.equal(post.auth, true);
  assert.equal(actionDestination(post, false), '/login');
  assert.equal(actionDestination(post, true), '/');
});

test('atalho Criar encaminha a Home e abre o compositor pelo parametro de navegacao', () => {
  const create = source('screens/CreateScreen.jsx');
  const home = source('screens/HomeScreen.jsx');
  assert.match(create, /pathname: '\/'/);
  assert.match(create, /params: \{ compose:/);
  assert.match(home, /useLocalSearchParams\(\)/);
  assert.match(home, /setComposeRequest\(\(value\) => value \+ 1\)/);
  assert.doesNotMatch(create, /A criacao de publicacoes sociais ainda nao esta disponivel/);
});

test('Financeiro ativo continua dentro de Comercial e modulos financeiros anteriores sao preservados', () => {
  const route = fs.readFileSync(path.join(__dirname, '..', 'app', 'finance.jsx'), 'utf8');
  assert.match(route, /CommercialScreen/);
  assert.match(route, /sectionOverride="sales"/);
  for (const unused of [
    'screens/FinanceScreen.jsx',
    'components/FinanceOverview.jsx',
    'components/FinancialChart.jsx',
    'components/SalesPanel.jsx',
    'hooks/useFinance.js',
    'hooks/useCatalog.js',
    'services/accountRepository.js',
    'services/financeApi.js',
  ]) {
    assert.equal(fs.existsSync(path.join(sourceRoot, unused)), true, unused);
  }
  assert.equal(fs.existsSync(path.join(__dirname, 'legacy/financeApi.js')), true);
});
