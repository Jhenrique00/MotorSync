const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { monthlyFinancialPerformance } = require('../src/utils/monthlyFinancialPerformance.js');

const sale = (sold_at, amount, purchase_cost, preparation_cost) => ({
  sold_at,
  amount,
  purchase_cost,
  preparation_cost,
});

test('financial chart uses completed sales only when both costs are known', () => {
  const result = monthlyFinancialPerformance(
    [
      sale('2026-11-04T13:00:00Z', 1000, 600, 100),
      sale('2026-11-05T13:00:00Z', 100.25, 50.15, 10.1),
      sale('2026-11-06T13:00:00Z', 200, null, 30),
      sale('2026-11-07T13:00:00Z', '-15', 3, 5),
    ],
    { endMonth: '2026-11' },
  );
  const november = result.months.at(-1);
  assert.equal(november.key, '2026-11');
  assert.equal(november.completeSales, 2);
  assert.equal(november.incompleteSales, 1);
  assert.equal(november.invalidSales, 1);
  assert.equal(november.revenue, 1100.25);
  assert.equal(november.costs, 760.25);
  assert.equal(november.profit, 340);
  assert.equal(result.maxValue, 1100.25);
  assert.equal(result.months.length, 6);
});

test('financial chart respects local sale calendar at the UTC month boundary', () => {
  const result = monthlyFinancialPerformance([sale('2026-10-01T01:30:00Z', 120, 80, 10)], {
    endMonth: '2026-10',
  });
  assert.equal(result.months.find((m) => m.key === '2026-09').revenue, 120);
  assert.equal(result.months.find((m) => m.key === '2026-10').revenue, 0);
});

test('financial chart creates zero months across years and supports 12 months', () => {
  const result = monthlyFinancialPerformance([], { months: 12, endMonth: '2027-02' });
  assert.equal(result.months.length, 12);
  assert.equal(result.months[0].key, '2026-03');
  assert.equal(result.months.at(-1).key, '2027-02');
  assert.equal(result.maxValue, 0);
  assert.equal(result.completeSales, 0);
  assert.ok(result.months.every((month) => month.profit === 0));
});

test('financial chart keeps negative gross profit instead of calling costs losses', () => {
  const result = monthlyFinancialPerformance([sale('2026-11-10T12:00:00Z', 100, 120, 20)], {
    endMonth: '2026-11',
  });
  assert.equal(result.months.at(-1).profit, -40);
  assert.equal(result.months.at(-1).costs, 140);
});

test('financial chart is inside Financeiro and does not change main Gestão accesses', () => {
  const root = path.resolve(__dirname, '../src');
  const finance = fs.readFileSync(path.join(root, 'components/CommercialResultsPanel.jsx'), 'utf8');
  const management = fs.readFileSync(path.join(root, 'screens/ManagementScreen.jsx'), 'utf8');
  const chart = fs.readFileSync(path.join(root, 'components/MonthlyFinancialChart.jsx'), 'utf8');
  assert.match(finance, /<MonthlyFinancialChart sales=\{rows\} endDate=\{to\}/);
  assert.match(chart, /monthlyFinancialPerformance/);
  assert.match(chart, /useTheme/);
  assert.doesNotMatch(chart, /supabase|commercialApi|from\('sales'\)/);
  assert.doesNotMatch(management, /MonthlyFinancialChart/);
});
