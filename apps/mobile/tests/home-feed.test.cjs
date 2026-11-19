const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createDemoState, demoReducer } = require('../src/services/demoRepository.js');

const post = {
  id: 'local-test-1',
  author: '@voce',
  title: 'Meu projeto',
  text: 'Apresentando meu carro.',
  image: 'file:///foto.jpg',
  tag: 'Criado neste aparelho',
  likes: 0,
  comments: [],
  isLocal: true,
};

test('post de prévia é criado somente no estado local e preserva o original', () => {
  const original = createDemoState();
  const changed = demoReducer(original, { type: 'addPost', post });
  assert.equal(changed.posts[0].id, post.id);
  assert.equal(changed.posts.length, original.posts.length + 1);
  assert.equal(original.posts[0].id, 'f1');
  assert.equal(demoReducer(changed, { type: 'reset' }).posts.length, original.posts.length);
});

test('post local duplicado, sem conteúdo ou fora dos limites é rejeitado', () => {
  const original = createDemoState();
  const changed = demoReducer(original, { type: 'addPost', post });
  assert.equal(demoReducer(changed, { type: 'addPost', post }), changed);
  assert.equal(demoReducer(original, { type: 'addPost', post: { ...post, id: 'f1' } }), original);
  assert.equal(
    demoReducer(original, { type: 'addPost', post: { ...post, title: 'a'.repeat(91) } }),
    original,
  );
  assert.equal(
    demoReducer(original, { type: 'addPost', post: { ...post, text: 'a'.repeat(1001) } }),
    original,
  );
  assert.equal(
    demoReducer(original, { type: 'addPost', post: { ...post, title: ' ', text: '', image: '' } }),
    original,
  );
});

test('ações sociais existentes funcionam em publicação local', () => {
  let state = demoReducer(createDemoState(), { type: 'addPost', post });
  state = demoReducer(state, { type: 'liked', id: post.id });
  state = demoReducer(state, { type: 'saved', id: post.id });
  state = demoReducer(state, {
    type: 'comment',
    id: post.id,
    text: '  Gostei! ',
    commentId: 'test-comment',
  });
  assert.ok(state.liked.includes(post.id));
  assert.ok(state.saved.includes(post.id));
  assert.equal(state.posts[0].comments[0].text, 'Gostei!');
});

test('Home não substitui anúncios públicos por posts falsamente persistidos', () => {
  const root = path.join(__dirname, '..', 'src');
  const home = fs.readFileSync(path.join(root, 'screens/HomeScreen.jsx'), 'utf8');
  const card = fs.readFileSync(path.join(root, 'components/FeedPost.jsx'), 'utf8');
  const compose = fs.readFileSync(path.join(root, 'components/FeedComposer.jsx'), 'utf8');
  assert.match(home, /useExplore\(/);
  assert.match(home, /source: 'explore'/);
  assert.match(card, /<ListingPhoto/);
  assert.match(card, /\/ad\/\$\{listing\.id\}/);
  assert.match(compose, /Prévia local:/);
  assert.doesNotMatch(compose, /\.from\(['"]posts['"]\)/);
});

test('favoritos remotos não entram no estado demonstrativo e favoritos locais seguem isolados', () => {
  const remoteId = 'deafbeef-1234-4567-89ab-abcdef123456';
  const initial = createDemoState();
  assert.equal(demoReducer(initial, { type: 'favorites', id: remoteId }), initial);
  const demoId = initial.listings[0].id;
  const favorited = demoReducer(initial, { type: 'favorites', id: demoId });
  assert.ok(favorited.favorites.includes(demoId));
  assert.ok(!initial.favorites.includes(demoId));
  const removed = demoReducer(favorited, { type: 'favorites', id: demoId });
  assert.ok(!removed.favorites.includes(demoId));
  assert.equal(demoReducer(initial, { type: 'favorites', id: 'caminho/incorreto' }), initial);
  const collection = fs.readFileSync(
    path.join(__dirname, '..', 'src/screens/SavedScreen.jsx'),
    'utf8',
  );
  assert.match(collection, /<MarketCard/);
  assert.match(collection, /favoritesOnly: true/);
  assert.match(collection, /favorites\.ids/);
});
