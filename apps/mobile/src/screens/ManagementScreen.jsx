import React from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Card, Copy, Button, Notice, RowLink } from '../components/ui';
import { useCommercial } from '../hooks/useCommercial';
import { moneyWithCents } from '../utils/catalog';
export default function ManagementScreen() {
  const router = useRouter(),
    remote = useCommercial('summary');
  return (
    <Screen>
      <Header title="Gestão" subtitle="Estoque, clientes e negociações em um só lugar." />
      {!remote.session ? (
        <Button title="Entrar na conta" onPress={() => router.push('/login')} />
      ) : (
        <>
          {remote.error && (
            <>
              <Notice error>{remote.error}</Notice>
              <Button title="Tentar novamente" onPress={remote.reload} />
            </>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Visão geral: resultados e vendas"
            onPress={() => router.push('/finance')}
          >
            <Card>
              <Copy weight="700" size={22}>
                Visão geral →
              </Copy>
              {remote.loading ? (
                <Copy>Carregando…</Copy>
              ) : remote.ready ? (
                <>
                  <Copy>
                    {remote.rows?.open_proposals || 0} propostas abertas ·{' '}
                    {remote.rows?.sales_count || 0} vendas concluídas
                  </Copy>
                  <Copy>Valor vendido: {moneyWithCents(remote.rows?.sales_amount || 0)}</Copy>
                </>
              ) : (
                <Copy>O serviço comercial aguarda atualização do banco.</Copy>
              )}
              <Copy size={12}>
                Consultar resultados e registrar vendas. Valor vendido não significa dinheiro
                recebido.
              </Copy>
            </Card>
          </Pressable>
        </>
      )}
      <RowLink
        title="Estoque"
        subtitle="Cadastrar, preparar e anunciar veículos"
        icon="car-outline"
        onPress={() => router.push('/management/inventory')}
      />
      <RowLink
        title="Clientes"
        subtitle="Contatos e histórico comercial"
        icon="people-outline"
        onPress={() => router.push('/management/clients')}
      />
      <RowLink
        title="Propostas"
        subtitle="Negociar e concluir vendas"
        icon="document-text-outline"
        onPress={() => router.push('/management/proposals')}
      />
    </Screen>
  );
}
