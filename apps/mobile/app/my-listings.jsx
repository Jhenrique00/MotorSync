import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Header, Button, Copy, Notice, EmptyState } from '../src/components/ui';
import { MarketCard } from '../src/components/MarketCard';
import { useListings } from '../src/hooks/useListings';
import { useAuth } from '../src/contexts/AuthContext';
export default function MyListings() {
  const { organization } = useLocalSearchParams();
  const remote = useListings(organization ? 'organization' : 'mine', organization);
  const { session } = useAuth();
  const router = useRouter();
  return (
    <Screen>
      <Header back title={organization ? 'Anúncios da empresa' : 'Meus anúncios'} />
      <Button
        title={session ? 'Novo anúncio' : 'Entrar para anunciar'}
        onPress={() =>
          router.push(
            session
              ? organization
                ? `/ad/new?organization=${organization}`
                : '/ad/new'
              : '/login',
          )
        }
      />
      {session && (
        <>
          {remote.loading ? (
            <Copy>Carregando…</Copy>
          ) : remote.error ? (
            <>
              <Notice error>{remote.error}</Notice>
              <Button title="Tentar novamente" onPress={remote.reload} />
            </>
          ) : remote.data?.length ? (
            remote.data.map((item) => <MarketCard key={item.id} item={item} editable />)
          ) : (
            <EmptyState
              title={organization ? 'Nenhum anúncio da empresa' : 'Seu primeiro anúncio'}
              description={
                organization
                  ? 'Crie um anúncio para apresentar aos compradores. O estoque continua privado.'
                  : 'Venda como pessoa física. Você não precisa de uma empresa.'
              }
            />
          )}
        </>
      )}
    </Screen>
  );
}
