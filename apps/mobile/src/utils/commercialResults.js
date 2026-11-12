export function saleResult(sale) {
  const value = (v) =>
    v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0;
  const amount = value(sale.amount) && Number(sale.amount) > 0 ? Number(sale.amount) : null;
  const known = amount !== null && value(sale.purchase_cost) && value(sale.preparation_cost);
  const cost = known
    ? Math.round((Number(sale.purchase_cost) + Number(sale.preparation_cost)) * 100) / 100
    : null;
  const profit = known ? Math.round((amount - cost) * 100) / 100 : null;
  const recordedCosts = [sale.purchase_cost, sale.preparation_cost]
    .filter(value)
    .reduce((sum, v) => sum + Number(v), 0);
  return { amount, cost, recordedCosts, profit, margin: known ? (profit / amount) * 100 : null };
}
export function commercialResults(sales) {
  const summary = {
    count: sales.length,
    revenue: 0,
    knownCosts: 0,
    knownRevenue: 0,
    profit: 0,
    unknown: 0,
    invalid: 0,
  };
  for (const sale of sales) {
    const r = saleResult(sale);
    if (r.amount === null) {
      summary.invalid++;
      continue;
    }
    summary.revenue += r.amount;
    summary.knownCosts += r.recordedCosts;
    if (r.cost === null) {
      summary.unknown++;
      continue;
    }
    summary.knownRevenue += r.amount;
    summary.profit += r.profit;
  }
  summary.margin = summary.knownRevenue > 0 ? (summary.profit / summary.knownRevenue) * 100 : null;
  return summary;
}
export function saleDay(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bahia',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  return ['year', 'month', 'day'].map((type) => parts.find((p) => p.type === type).value).join('-');
}
