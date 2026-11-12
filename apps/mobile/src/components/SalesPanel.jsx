import React, { useState } from 'react';
import { Card, Copy, Field } from './ui';
import { moneyWithCents } from '../utils/catalog';
export function SalesPanel({ remote }) {
  const [query, setQuery] = useState('');
  const rows = (remote.rows || []).filter((s) =>
    `${s.customer_name} ${s.vehicle_title}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Field label="Pesquisar vendas" value={query} onChangeText={setQuery} />
      <Copy weight="700">
        {rows.length} vendas · {moneyWithCents(rows.reduce((sum, s) => sum + Number(s.amount), 0))}
      </Copy>
      <Copy size={12}>
        Valor efetivamente vendido nos registros exibidos. Não representa lucro.
      </Copy>
      {!rows.length && <Copy>Nenhuma venda concluída.</Copy>}
      {rows.map((sale) => (
        <Card key={sale.id}>
          <Copy weight="700">{sale.vehicle_title}</Copy>
          <Copy>{sale.customer_name}</Copy>
          <Copy>{moneyWithCents(sale.amount)}</Copy>
          <Copy>{sale.terms}</Copy>
          <Copy size={12}>{new Date(sale.sold_at).toLocaleString('pt-BR')}</Copy>
          <Copy size={12}>Venda {sale.id}</Copy>
        </Card>
      ))}
    </>
  );
}
