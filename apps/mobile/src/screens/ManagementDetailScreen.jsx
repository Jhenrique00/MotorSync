import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import VehiclesScreen from './VehiclesScreen';
import CommercialScreen from './CommercialScreen';
import { Screen, Header, EmptyState } from '../components/ui';
const names = { clients: 'Clientes', proposals: 'Propostas', sales: 'Vendas' };
export default function ManagementDetailScreen() {
  const { section } = useLocalSearchParams();
  if (section === 'inventory') return <VehiclesScreen />;
  if (['clients', 'proposals', 'sales', 'mine'].includes(section)) return <CommercialScreen />;
  return (
    <Screen>
      <Header back title={names[section] || 'Módulo indisponível'} />
      <EmptyState
        title="Em breve"
        description="Este módulo ainda não está disponível. Nenhum cadastro, proposta ou venda é registrado por esta tela."
      />
    </Screen>
  );
}
