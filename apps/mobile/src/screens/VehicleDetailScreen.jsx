import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useRemoteVehicles } from '../hooks/useRemoteVehicles';
import { Screen, Header, Card, Copy, Button, Notice } from '../components/ui';
import { moneyWithCents } from '../utils/catalog';
export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const router = useRouter();
  const { data, error, loading, reload } = useRemoteVehicles(id);
  return (
    <Screen>
      <Header back title="Detalhes do veículo" />
      {!session ? (
        <Button title="Entrar na conta" onPress={() => router.push('/login')} />
      ) : loading ? (
        <Copy>Carregando…</Copy>
      ) : error ? (
        <>
          <Notice error>{error}</Notice>
          <Button title="Tentar novamente" onPress={reload} />
        </>
      ) : data ? (
        <Card>
          <Copy weight="700" size={28}>
            {data.title}
          </Copy>
          <Copy size={24}>{moneyWithCents(data.price)}</Copy>
          <Copy>Registro do estoque da sua empresa.</Copy>
          <Button title="Gerenciar estoque" onPress={() => router.push('/vehicles')} />
        </Card>
      ) : null}
    </Screen>
  );
}
