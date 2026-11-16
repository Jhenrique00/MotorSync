const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  validateSocialPost,
  normalizeSocialPost,
  isSocialSchemaMissing,
  createSocialApi,
} = require('../src/services/socialRepository.js');

const uid = '12345678-1234-4234-8234-123456789abc';
const postId = 'abcdef12-1234-4234-8234-123456789abc';

function mockClient(options = {}) {
  const events = [];
  const post = {
    id: postId,
    user_id: uid,
    author_name: 'Motorista',
    title: 'Meu carro',
    body: 'Projeto do fim de semana',
    image_path: null,
    listing_id: null,
    social_post_likes: [{ count: 2 }],
    social_post_comments: [{ count: 3 }],
  };
  const returned = {
    social_posts: [post],
    social_post_likes: [{ post_id: postId }],
    social_post_saves: [{ post_id: postId }],
    profiles: [{ display_name: 'Motorista' }],
    organization_members: [],
    listings: [],
  };
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: uid, user_metadata: {} } } }) },
    storage: {
      from: () => ({
        getPublicUrl: (p) => ({ data: { publicUrl: `https://example.test/${p}` } }),
        upload: async (p, bytes, config) => {
          events.push(['storage', 'upload', p, bytes.byteLength, config.contentType]);
          return { error: null };
        },
        remove: async (paths) => {
          events.push(['storage', 'remove', paths]);
          return { data: {} };
        },
      }),
    },
    from: (table) => {
      const q = {
        select(...v) {
          events.push([table, 'select', ...v]);
          return this;
        },
        insert(...v) {
          events.push([table, 'insert', ...v]);
          return this;
        },
        delete() {
          events.push([table, 'delete']);
          this.deleting = true;
          return this;
        },
        order() {
          return this;
        },
        limit() {
          return this;
        },
        eq() {
          return this;
        },
        in() {
          return this;
        },
        single() {
          this.one = true;
          return this;
        },
        maybeSingle() {
          this.one = true;
          return this;
        },
        then(resolve, reject) {
          const data =
            this.deleting && table === 'social_posts' && 'deleted' in options
              ? options.deleted
              : this.one
                ? returned[table]?.[0] || null
                : returned[table] || [];
          const error =
            table === 'social_posts' &&
            this.one &&
            options.insertError &&
            events.some(
              ([origin, operation]) => origin === 'social_posts' && operation === 'insert',
            )
              ? new Error('Simulated row rejection')
              : null;
          return Promise.resolve({ data, error }).then(resolve, reject);
        },
      };
      return q;
    },
  };
  return { client, events };
}

test('social: validate accepts text, photo, optional listing and trims', () => {
  assert.deepEqual(validateSocialPost({ title: '  Porsche  ', body: '  Revisado  ' }), {
    title: 'Porsche',
    body: 'Revisado',
    listingId: null,
  });
  assert.equal(validateSocialPost({ photo: { uri: 'file:///a.jpg' } }).title, '');
  assert.equal(validateSocialPost({ body: 'test', listingId: postId }).listingId, postId);
});

test('social: rejects empty, excessive text and invalid listing', () => {
  assert.throws(() => validateSocialPost({}), /texto ou uma foto/);
  assert.throws(() => validateSocialPost({ title: 'a'.repeat(91) }), /90/);
  assert.throws(() => validateSocialPost({ body: 'a'.repeat(1001) }), /1.000/);
  assert.throws(() => validateSocialPost({ body: 'ok', listingId: 'falha' }), /inválido/);
});

test('social: maps counts and selections without exposing private profile data', () => {
  const row = {
    id: postId,
    user_id: uid,
    author_name: 'Jo',
    title: 'ABC',
    body: 'X',
    image_path: `user/${uid}/img.jpg`,
    social_post_likes: [{ count: 5 }],
    social_post_comments: [{ count: 2 }],
  };
  const post = normalizeSocialPost(row, uid, [postId], [postId], (p) => `public:${p}`);
  assert.equal(post.likesCount, 5);
  assert.equal(post.commentsCount, 2);
  assert.equal(post.isMine, true);
  assert.equal(post.liked, true);
  assert.equal(post.saved, true);
  assert.ok(post.image.startsWith('public:user/'));
  assert.equal(post.userId, uid);
  assert.equal(post.email, undefined);
});

test('social: recognizes absent schema without treating auth errors as absent schema', () => {
  assert.equal(isSocialSchemaMissing({ code: 'PGRST205' }), true);
  assert.equal(isSocialSchemaMissing({ code: '42P01' }), true);
  assert.equal(isSocialSchemaMissing({ code: '42501' }), false);
});

test('social: list reads server posts with current-user likes and saves', async () => {
  const { client, events } = mockClient();
  const api = createSocialApi(client);
  const rows = await api.list();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].liked, true);
  assert.equal(rows[0].saved, true);
  assert.equal(rows[0].commentsCount, 3);
  assert.ok(events.some((event) => event[0] === 'social_posts'));
  assert.ok(events.some((event) => event[0] === 'social_post_saves'));
});

test('social: likes and saves write under logged-in user, not arbitrary account', async () => {
  const { client, events } = mockClient();
  const api = createSocialApi(client);
  assert.equal(await api.toggleLike(postId, false), true);
  assert.equal(await api.toggleSave(postId, true), false);
  const like = events.find((item) => item[0] === 'social_post_likes' && item[1] === 'insert');
  assert.deepEqual(like[2], { post_id: postId, user_id: uid });
  assert.ok(events.some((item) => item[0] === 'social_post_saves' && item[1] === 'delete'));
});

test('social: migration defines ownership RLS for posts and saves', () => {
  const sql = fs.readFileSync(
    path.resolve(__dirname, '../../../supabase/migrations/20261110010000_social_feed.sql'),
    'utf8',
  );
  assert.match(sql, /alter table public\.social_posts enable row level security/i);
  assert.match(sql, /alter table public\.social_post_comments enable row level security/i);
  assert.match(sql, /alter table public\.social_post_saves enable row level security/i);
  assert.match(sql, /user_id = \(select auth\.uid\(\)\)/i);
  assert.match(sql, /social_image_upload/i);
  assert.doesNotMatch(sql, /service_role|\btruncate\b/i);
});

test('social: Home keeps marketplace publications separate from social posts', () => {
  const root = path.resolve(__dirname, '../src');
  const home = fs.readFileSync(path.join(root, 'screens/HomeScreen.jsx'), 'utf8');
  const comments = fs.readFileSync(path.join(root, 'screens/CommentsScreen.jsx'), 'utf8');
  assert.match(home, /useSocialFeed\(/);
  assert.match(home, /useExplore\(/);
  assert.match(home, /remoteMode=\{social\.available\}/);
  assert.match(comments, /socialApi\.addComment\(/);
  assert.match(comments, /replyTo/);
});

test('social: a saved post is returned without extra reads that could falsely report an insert failure', async () => {
  const { client, events } = mockClient();
  const created = await createSocialApi(client).create({
    title: 'Novo motor',
    body: 'Projeto pessoal',
  });
  assert.equal(created.id, postId);
  assert.equal(created.isMine, true);
  assert.deepEqual(
    events.find(([table, operation]) => table === 'social_posts' && operation === 'insert')[2],
    {
      user_id: uid,
      author_name: 'Motorista #12345678',
      title: 'Novo motor',
      body: 'Projeto pessoal',
      image_path: null,
      listing_id: null,
    },
  );
  assert.equal(events.filter(([table]) => table === 'social_post_likes').length, 0);
});

test('social: deletion confirms one affected row instead of silently ignoring a denied operation', async () => {
  const allowed = createSocialApi(mockClient({ deleted: [{ id: postId }] }).client);
  await allowed.remove(postId);
  const denied = createSocialApi(mockClient({ deleted: [] }).client);
  await assert.rejects(denied.remove(postId), /sem permissão/);
});

test('social: home does not fall back to demo after a network error', () => {
  const base = path.resolve(__dirname, '../src');
  const home = fs.readFileSync(path.join(base, 'screens/HomeScreen.jsx'), 'utf8');
  const composer = fs.readFileSync(path.join(base, 'components/FeedComposer.jsx'), 'utf8');
  assert.match(home, /social\.preview \? state\.posts : \[\]/);
  assert.match(home, /Tentar carregar a comunidade novamente/);
  assert.match(composer, /!remoteMode && !previewMode/);
});

test('social: photo upload uses account-scoped path and retains the published image', async () => {
  const { client, events } = mockClient();
  const created = await createSocialApi(client).create({
    title: 'Revisão de motor',
    photo: { uri: 'file:///test.png', base64: 'aGVsbG8=', mimeType: 'image/png' },
  });
  const upload = events.find(([name, action]) => name === 'storage' && action === 'upload');
  assert.match(upload[2], new RegExp(`^user/${uid}/[0-9]+-[a-z0-9]+\\.png$`));
  assert.equal(upload[3], 5);
  assert.equal(upload[4], 'image/png');
  const inserted = events.find(([name, action]) => name === 'social_posts' && action === 'insert');
  assert.equal(inserted[2].image_path, upload[2]);
  assert.equal(created.isRemote, true);
  assert.equal(
    events.filter(([name, action]) => name === 'storage' && action === 'remove').length,
    0,
  );
});

test('social: failed post insert rolls back its newly uploaded image', async () => {
  const { client, events } = mockClient({ insertError: true });
  await assert.rejects(
    createSocialApi(client).create({
      title: 'Erro remoto',
      photo: { uri: 'file:///test.png', base64: 'aGVsbG8=', mimeType: 'image/png' },
    }),
    /Simulated row rejection/,
  );
  const upload = events.find(([name, action]) => name === 'storage' && action === 'upload');
  const removal = events.find(([name, action]) => name === 'storage' && action === 'remove');
  assert.deepEqual(removal[2], [upload[2]]);
});
