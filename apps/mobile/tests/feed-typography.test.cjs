const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sourceRoot = path.resolve(__dirname, '../src');
const typographySource = fs.readFileSync(path.join(sourceRoot, 'theme/feedTypography.js'), 'utf8');

function configuredSize(role) {
  const escapedRole = role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const found = typographySource.match(
    new RegExp(`\\b${escapedRole}:\\s*\\{[^}]*?fontSize:\\s*(\\d+)`),
  );
  assert.ok(found, `Missing feed typography role: ${role}`);
  return Number(found[1]);
}

test('social feed typography is compact and keeps body text readable', () => {
  assert.equal(configuredSize('title'), 20);
  assert.equal(configuredSize('authorName'), 14);
  assert.equal(configuredSize('price'), 18);
  assert.equal(configuredSize('body'), 14);
  assert.ok(configuredSize('authorLabel') >= 10);
  assert.ok(configuredSize('composeTitle') <= 18);
  // Official typography: Playfair Display for editorial titles, Inter for functional text.
  assert.match(typographySource, /title: \{ fontFamily: families\.display/);
  assert.match(typographySource, /body: \{ \.\.\.inter\(families\.body\)/);
  assert.match(typographySource, /price: \{[^}]*tabular-nums/);
});

test('Home uses only scoped typography and preserves accessibility text scaling', () => {
  const files = [
    'screens/HomeScreen.jsx',
    'components/FeedPost.jsx',
    'components/FeedComposer.jsx',
    'components/FeedHighlights.jsx',
  ];
  for (const file of files) {
    const content = fs.readFileSync(path.join(sourceRoot, file), 'utf8');
    assert.match(content, /feedTypography/, file);
    assert.doesNotMatch(content, /allowFontScaling\s*=\s*\{false\}/, file);
  }
  const feedPost = fs.readFileSync(path.join(sourceRoot, 'components/FeedPost.jsx'), 'utf8');
  assert.match(feedPost, /style=\{feedTypography\.authorName\}/);
  assert.match(feedPost, /style=\{feedTypography\.body\}/);
  assert.match(feedPost, /style=\{feedTypography\.title\}/);
});

test('official fonts: Playfair Display only for headings, Inter for forms and buttons', () => {
  const fonts = fs.readFileSync(path.join(sourceRoot, 'theme/fonts.js'), 'utf8');
  const ui = fs.readFileSync(path.join(sourceRoot, 'components/ui.jsx'), 'utf8');
  assert.match(fonts, /Inter_500Medium/);
  assert.match(fonts, /PlayfairDisplay_700Bold/);
  assert.match(ui, /weight="500"\s+tone=\{primary/);
  const inputBlock = ui.slice(
    ui.indexOf('export function Field'),
    ui.indexOf('export function Chip'),
  );
  assert.doesNotMatch(inputBlock, /<Copy[^>]*\bdisplay\b/);
  assert.match(inputBlock, /families\.body/);
});
