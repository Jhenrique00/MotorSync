export const periods = [
  { id: '7', title: '7 dias' },
  { id: '30', title: '30 dias' },
  { id: '90', title: '90 dias' },
  { id: '12m', title: '12 meses' },
];
export function today(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bahia',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
export function periodRange(period, now = new Date()) {
  const end = today(now);
  const start = new Date(end + 'T12:00:00Z');
  if (period === '12m') {
    start.setUTCDate(1);
    start.setUTCMonth(start.getUTCMonth() - 11);
  } else start.setUTCDate(start.getUTCDate() - (Number(period) || 30) + 1);
  return { from: start.toISOString().slice(0, 10), to: end };
}
export function validateEntry(values) {
  const description = String(values.description || '').trim();
  const amount = String(values.amount || '')
    .trim()
    .replace(',', '.');
  const date = values.occurred_on;
  if (!description || description.length > 300)
    throw new Error('Informe uma descrição de até 300 caracteres.');
  if (
    !/^\d{1,12}(\.\d{1,2})?$/.test(amount) ||
    Number(amount) <= 0 ||
    Number(amount) > 999999999999.99
  )
    throw new Error('Informe um valor positivo, com até duas casas decimais.');
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date || '') ||
    isNaN(Date.parse(date)) ||
    new Date(date + 'T12:00:00Z').toISOString().slice(0, 10) !== date ||
    date < '2000-01-01' ||
    date > today()
  )
    throw new Error('Informe uma data válida, até hoje, no formato AAAA-MM-DD.');
  if (!['income', 'expense'].includes(values.kind)) throw new Error('Tipo de lançamento inválido.');
  return { description, amount: Number(amount), occurred_on: date, kind: values.kind };
}
export function createFinanceApi(client) {
  const unwrap = async (q) => {
    const { data, error } = await q;
    if (error) throw error;
    return data;
  };
  const user = async () => {
    const r = await client.auth.getUser();
    if (r.error || !r.data.user) throw new Error('Entre para acessar o financeiro.');
    return r.data.user.id;
  };
  return {
    report: async ({ from, to, org = null, kind = '', page = 0 }) => {
      await user();
      return unwrap(
        client.rpc('finance_report', {
          p_from: from,
          p_to: to,
          p_org: org || null,
          p_kind: kind,
          p_offset: page * 20,
        }),
      );
    },
    async save(values, org, key, expectedUser) {
      const uid = await user();
      if (expectedUser && uid !== expectedUser) throw new Error('A conta mudou. Reabra a tela.');
      const payload = {
        ...validateEntry(values),
        owner_user_id: org ? null : uid,
        organization_id: org || null,
        source_key: key,
      };
      const r = await client.from('financial_entries').insert(payload).select().single();
      if (!r.error) return r.data;
      if (r.error.code !== '23505') throw r.error;
      let query = client.from('financial_entries').select('*').eq('source_key', key);
      query = org ? query.eq('organization_id', org) : query.eq('owner_user_id', uid);
      const row = await unwrap(query.single());
      if (
        ['description', 'amount', 'occurred_on', 'kind'].some(
          (k) => String(row[k]) !== String(payload[k]),
        )
      )
        throw new Error('Este envio já foi registrado com outros dados. Reabra o formulário.');
      return row;
    },
    async cancel(row, org, reason, expectedUser) {
      const uid = await user();
      if (expectedUser && uid !== expectedUser) throw new Error('A conta mudou. Reabra a tela.');
      if (reason.trim().length < 3 || reason.trim().length > 300)
        throw new Error('Informe o motivo do cancelamento.');
      return unwrap(
        client
          .from('financial_cancellations')
          .insert({
            owner_user_id: org ? null : uid,
            organization_id: org || null,
            sale_id: row.kind === 'sale' ? row.id : null,
            entry_id: row.kind === 'sale' ? null : row.id,
            reason: reason.trim(),
          })
          .select()
          .single(),
      );
    },
  };
}

export function financialSeries(buckets, from, to) {
  if (!buckets?.length) return [];
  const start = new Date(from + 'T12:00:00Z'),
    end = new Date(to + 'T12:00:00Z');
  const monthly = (end - start) / 86400000 > 90;
  if (monthly) start.setUTCDate(1);
  const byDay = new Map(buckets.map((b) => [b.day, b]));
  const result = [];
  for (
    let day = start;
    day <= end;
    monthly ? day.setUTCMonth(day.getUTCMonth() + 1) : day.setUTCDate(day.getUTCDate() + 1)
  ) {
    const key = day.toISOString().slice(0, 10);
    result.push(
      byDay.get(key) || {
        day: key,
        revenue: 0,
        cost: 0,
        income: 0,
        expenses: 0,
        missing_cost: 0,
        noRecords: true,
      },
    );
  }
  return result;
}
