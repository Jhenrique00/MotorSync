import { saleDay, saleResult } from './commercialResults.js';

const roundMoney = (value) => Math.round(value * 100) / 100;

function validMonth(value) {
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null;
  const year = Number(value.slice(0, 4));
  return year >= 1900 && year <= 9999 ? value : null;
}

function monthKey(year, monthIndex) {
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function labelMonth(key) {
  const [year, month] = key.split('-').map(Number);
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1)))
    .replace('.', '');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * The graph only compares completed sales with BOTH costs recorded.
 * Other completed sales remain visible in the existing overall financial summary.
 * The input must already be scoped to the signed-in user/organization by the API/RLS.
 */
export function monthlyFinancialPerformance(sales = [], { months = 6, endMonth } = {}) {
  const count = months === 12 ? 12 : 6;
  const dated = sales
    .map((sale) => ({ sale, month: validMonth(saleDay(sale.sold_at).slice(0, 7)) }))
    .filter((row) => row.month);
  const finalMonth =
    validMonth(endMonth) ||
    dated.reduce((latest, row) => (row.month > latest ? row.month : latest), '') ||
    saleDay(new Date()).slice(0, 7);
  const [year, month] = finalMonth.split('-').map(Number);
  const columns = Array.from({ length: count }, (_, index) => {
    const key = monthKey(year, month - 1 - (count - 1 - index));
    return {
      key,
      label: labelMonth(key),
      revenueCents: 0,
      costCents: 0,
      completeSales: 0,
      incompleteSales: 0,
      invalidSales: 0,
    };
  });
  const byMonth = new Map(columns.map((column) => [column.key, column]));
  for (const row of dated) {
    const target = byMonth.get(row.month);
    if (!target) continue;
    const result = saleResult(row.sale);
    if (result.amount === null) {
      target.invalidSales++;
    } else if (result.cost === null) {
      target.incompleteSales++;
    } else {
      target.completeSales++;
      target.revenueCents += Math.round(result.amount * 100);
      target.costCents += Math.round(result.cost * 100);
    }
  }
  const entries = columns.map(({ revenueCents, costCents, ...column }) => ({
    ...column,
    revenue: roundMoney(revenueCents / 100),
    costs: roundMoney(costCents / 100),
    profit: roundMoney((revenueCents - costCents) / 100),
  }));
  return {
    months: entries,
    endMonth: finalMonth,
    completeSales: entries.reduce((total, month) => total + month.completeSales, 0),
    incompleteSales: entries.reduce((total, month) => total + month.incompleteSales, 0),
    invalidSales: entries.reduce((total, month) => total + month.invalidSales, 0),
    maxValue: Math.max(0, ...entries.flatMap((month) => [month.revenue, month.costs])),
  };
}
