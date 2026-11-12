import React from 'react';
import { useRouter } from 'expo-router';
import { useRemoteVehicles } from '../hooks/useRemoteVehicles';
import { Screen, Header, Copy, Card, Button, Notice } from './ui';
import { moneyWithCents } from '../utils/catalog';
export function StockValue() {
  const remote = useRemoteVehicles();
  const router = useRouter();
  return (
    <Screen>
      <Header back title="Valor anunciado do estoque" />
      <Copy tone="muted">
        Detalhamento dos preços cadastrados. Não representa receita, custo de aquisição ou saldo.
      </Copy>
      {remote.loading ? (
        <Copy>Carregando…</Copy>
      ) : remote.error ? (
        <>
          <Notice error>{remote.error}</Notice>
          <Button title="Tentar novamente" onPress={remote.reload} />
        </>
      ) : (
        <>
          <Copy size={28} weight="700">
            {moneyWithCents((remote.data || []).reduce((s, r) => s + Number(r.price), 0))}
          </Copy>
          {(remote.data || []).map((r) => (
            <Card key={r.id}>
              <Copy weight="600">{r.title}</Copy>
              <Copy>{moneyWithCents(r.price)}</Copy>
            </Card>
          ))}
        </>
      )}
      <Button title="Consultar estoque" onPress={() => router.push('/vehicles')} />
    </Screen>
  );
}
