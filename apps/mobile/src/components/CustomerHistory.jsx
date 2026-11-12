import React, { useEffect, useState } from 'react';
import { Button, Copy, Notice } from './ui';
import { commercialApi } from '../hooks/useCommercial';
import { ProposalsPanel } from './ProposalsPanel';
import { moneyWithCents } from '../utils/catalog';
export function CustomerHistory({ customer, org, remote }) {
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [create, setCreate] = useState(false);
  useEffect(() => {
    let active = true;
    setData(null);
    setError('');
    Promise.all([
      commercialApi.proposals(org),
      commercialApi.sales(org),
      commercialApi.vehicles(org),
    ])
      .then(([proposals, sales, vehicles]) => {
        if (active)
          setData({
            proposals: proposals.filter((p) => p.customer_id === customer.id),
            sales: sales.filter((s) => s.customer_id === customer.id),
            vehicles,
          });
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar o histórico. Reabra a ficha.');
      });
    return () => {
      active = false;
    };
  }, [org, customer.id, remote.rows]);
  return (
    <>
      <Copy>{customer.phone || 'Telefone não informado'}</Copy>
      <Copy>{customer.email || 'E-mail não informado'}</Copy>
      <Copy>{customer.notes || 'Sem observações'}</Copy>
      {error ? (
        <Notice error>{error}</Notice>
      ) : !data ? (
        <Copy>Carregando histórico…</Copy>
      ) : (
        <>
          <Copy weight="700">Histórico comercial</Copy>
          {data.proposals.map((p) => (
            <Copy key={p.id}>
              {p.vehicles?.title || 'Sem veículo'} · {p.status} · {moneyWithCents(p.amount)}
            </Copy>
          ))}
          {data.sales.map((s) => (
            <Copy key={s.id}>
              Venda: {s.vehicle_title} · {moneyWithCents(s.amount)}
            </Copy>
          ))}
          {!data.proposals.length && !data.sales.length && (
            <Copy>Sem negociações. O cliente permanece cadastrado.</Copy>
          )}
          {!customer.archived && (
            <Button
              title="Fez uma proposta?"
              variant="secondary"
              onPress={() => setCreate((v) => !v)}
            />
          )}
          {create && (
            <>
              <Button
                title="Não, manter somente cliente"
                variant="text"
                onPress={() => setCreate(false)}
              />
              <ProposalsPanel
                org={org}
                initialCustomer={customer.id}
                remote={{ ...remote, rows: [], customers: [customer], vehicles: data.vehicles }}
              />
            </>
          )}
        </>
      )}
    </>
  );
}
