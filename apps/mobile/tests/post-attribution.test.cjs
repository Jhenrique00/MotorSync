const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  socialAuthorName,
  postAttribution,
  postDateLabel,
} = require('../src/utils/postAttribution.js');
const { normalizeSocialPost } = require('../src/services/socialRepository.js');
const uid = '12345678-1234-4234-8234-123456789abc';

test('feed authors: real social posts keep their public display name without exposing email', () => {
  const post = normalizeSocialPost(
    {
      id: 'post',
      user_id: uid,
      author_name: 'Ana Pereira',
      title: 'Meu Gol',
      body: '',
      social_post_likes: [],
      social_post_comments: [],
    },
    null,
    [],
    [],
    () => '',
  );
  const author = postAttribution({ ...post, source: 'social' });
  assert.equal(author.label, 'PUBLICADO POR');
  assert.equal(author.name, 'Ana Pereira');
  assert.equal(post.email, undefined);
});

test('feed authors: legacy generic author gets stable public account alias', () => {
  assert.equal(socialAuthorName('Motorista', uid), 'Motorista #12345678');
  assert.equal(socialAuthorName('', uid), 'Motorista #12345678');
  assert.equal(socialAuthorName('  Camila Martins  ', uid), 'Camila Martins');
  assert.equal(socialAuthorName(null, null), 'Autor não identificado');
});

test('feed authors: listings are attributed to advertisers, never to the MotorSync platform', () => {
  const personal = postAttribution({ source: 'explore', listing: { owner_user_id: uid } });
  assert.equal(personal.label, 'ANUNCIADO POR');
  assert.equal(personal.name, 'Anunciante #12345678');
  assert.match(personal.detail, /Anúncio pessoal/);
  const company = postAttribution({ source: 'explore', listing: { organization_id: uid } });
  assert.equal(company.name, 'Empresa #12345678');
  assert.doesNotMatch(JSON.stringify(personal), /MotorSync · Explorar|@/);
});

test('feed authors: publication dates and local previews are explicit', () => {
  assert.ok(postDateLabel('2026-11-11T12:00:00Z').includes('2026'));
  assert.equal(postDateLabel('not-a-date'), '');
  assert.equal(
    postAttribution({ displayName: 'Você · prévia', isLocal: true }).detail,
    'Prévia local',
  );
});

test('brand accents are orange in both themes without altering neutral surfaces', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../src/theme/tokens.js'), 'utf8');
  assert.equal((source.match(/accent: '#FF6B00'/g) || []).length, 2);
  assert.doesNotMatch(source, /#3B82F6|#78B3FF|#8DC0FF|#142743/);
  assert.match(source, /background: '#000000'/);
});

test('feed header prominently identifies the author and does not impersonate MotorSync', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../src/components/FeedPost.jsx'), 'utf8');
  assert.match(source, /attribution\.label/);
  assert.match(source, /attribution\.name/);
  assert.match(source, /postAttribution\(post\)/);
  assert.doesNotMatch(source, /MotorSync · Explorar/);
});
