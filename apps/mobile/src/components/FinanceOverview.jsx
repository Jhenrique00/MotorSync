import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Card, Copy, Button, Notice } from './ui';
import { SelectField } from './SelectField';
import { FinancialChart } from './FinancialChart';
import { periodRange, periods } from '../services/financeApi';
import { useFinance } from '../hooks/useFinance';
import { moneyWithCents } from '../utils/catalog';
export function FinanceOverview() {
  const [period, setPeriod] = useState('30'),
    [org, setOrg] = useState('');
  const router = useRouter();
  const remote = useFinance({ ...periodRange(period), org });
  const href = `/finance?period=${period}${org ? `&organization=${org}` : ''}`;
  if (remote.login) return null;
  return (
    <Card style={{ gap: 14, padding: 20 }}>
      <Copy size={20} weight="700">
        Desempenho financeiro
      </Copy>
      {!remote.pending && (
        <>
          <SelectField
            label="Controle"
            allowEmpty={false}
            value={org || 'personal'}
            options={[
              { id: 'personal', title: 'Pessoal' },
              ...(remote.members || []).map((m) => ({
                id: m.organization_id,
                title: m.organizations?.name || 'Empresa',
              })),
            ]}
            onChange={(v) => setOrg(v === 'personal' ? '' : v)}
          />
          <SelectField
            label="Período financeiro"
            value={period}
            allowEmpty={false}
            options={periods}
            onChange={setPeriod}
          />
        </>
      )}
      {remote.loading ? (
        <Copy>Carregando…</Copy>
      ) : remote.error ? (
        <>
          <Notice error>{remote.error}</Notice>
          <Button title="Atualizar financeiro" variant="text" onPress={remote.reload} />
        </>
      ) : remote.pending ? (
        <>
          <Copy weight="600">Ainda sem controle financeiro ativo</Copy>
          <Copy tone="muted" size={13}>
            O serviço de receitas, despesas e histórico está sendo preparado.
          </Copy>
        </>
      ) : (
        <>
          <Button
            title={`Receita de vendas: ${remote.data.summary.n ? moneyWithCents(remote.data.summary.revenue) : '—'}`}
            variant="secondary"
            onPress={() => router.push(href)}
          />
          <Copy size={13}>
            Resultado dos registros:{' '}
            {remote.data.summary.result === null
              ? 'não calculável'
              : moneyWithCents(remote.data.summary.result)}
          </Copy>
          <FinancialChart
            buckets={remote.data.buckets}
            range={periodRange(period)}
            onSelect={(b) => router.push(href + `&day=${b.day}`)}
          />
        </>
      )}
      <Button title="Abrir Financeiro" icon="wallet-outline" onPress={() => router.push(href)} />
    </Card>
  );
}
