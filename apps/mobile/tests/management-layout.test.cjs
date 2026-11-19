const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = (file) => fs.readFileSync(path.resolve(__dirname, '..', 'src', file), 'utf8');

const management = source('screens/ManagementScreen.jsx');
const customers = source('components/CustomersPanel.jsx');
const financeRoute = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'finance.jsx'), 'utf8');
const commercial = source('screens/CommercialScreen.jsx');

test('Gestão keeps exactly the three approved main accesses and routes', () => {
  const routes = [...management.matchAll(/route:\s*'(\/management\/[^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(routes, [
    '/management/inventory',
    '/management/clients',
    '/management/proposals',
  ]);
  assert.doesNotMatch(management, /Atividades recentes/);
  assert.doesNotMatch(management, /route:\s*'\/management\/sales'/);
});

test('summary stays clickable to Financeiro; sales remain inside Financeiro', () => {
  assert.match(management, /accessibilityLabel="Visão geral: resultados e vendas"/);
  assert.match(management, /router\.push\('\/finance'\)/);
  assert.match(financeRoute, /CommercialScreen sectionOverride="sales"/);
  assert.match(commercial, /CommercialResultsPanel/);
});

test('client form opens only from Adicionar cliente and actions stay inside selected sheet', () => {
  assert.match(customers, /title="Adicionar cliente"/);
  assert.match(customers, /setFormOpen\(true\)/);
  assert.match(customers, /\{formOpen && \(/);
  assert.match(customers, /\{selected === customer\.id && \(/);
  const selectedSheet = customers.slice(customers.indexOf('{selected === customer.id && ('));
  for (const label of ['Editar ', 'Arquivar cliente', 'Excluir cliente']) {
    assert.ok(selectedSheet.includes(label), label);
  }
});

test('Gestion panel only adjusts presentation and uses current semantic tokens', () => {
  assert.match(management, /useCommercial\('summary'\)/);
  assert.match(management, /useTheme\(\)/);
  assert.match(management, /space, type/);
  assert.doesNotMatch(management, /#[0-9a-fA-F]{6}/);
  assert.doesNotMatch(management, /commercialApi|supabase\.from|\.rpc\(/);
});

test('Gestão v2 uses a prominent summary and a visually distinct 2 + 1 access grid', () => {
  assert.match(management, /kicker="SUA OPERAÇÃO"/);
  assert.match(management, /overviewAccent/);
  assert.match(management, /styles\.summaryMetrics/);
  assert.match(management, /mainAccesses\.slice\(0, 2\)/);
  assert.match(management, /item=\{mainAccesses\[2\]\} wide/);
  assert.match(management, /Abrir Financeiro e registrar vendas/);
});

test('Gestão v2 reuses existing design tokens and does not add extra navigation', () => {
  assert.match(management, /radius, space, type/);
  assert.match(management, /backgroundColor: colors\.surface/);
  assert.match(management, /backgroundColor: colors\.accentSoft/);
  assert.doesNotMatch(management, /Atividades recentes|Todos os módulos|Novo cliente|Nova venda/);
  assert.doesNotMatch(management, /#[0-9a-fA-F]{6}/);
});
