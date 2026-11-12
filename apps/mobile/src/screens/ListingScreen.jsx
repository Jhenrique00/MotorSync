import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useDemo } from '../contexts/DemoContext';
import {
  Screen,
  Header,
  Media,
  Card,
  Copy,
  Notice,
  DemoNotice,
  Button,
  EmptyState,
} from '../components/ui';
import { money } from '../utils/catalog';
export default function ListingScreen() {
  const { id } = useLocalSearchParams();
  const { state, dispatch } = useDemo();
  const item = state.listings.find((x) => x.id === id);
  return (
    <Screen>
      <Header back title="Detalhes do anúncio" />
      {!item ? (
        <EmptyState
          title="Anúncio não encontrado"
          description="Volte para explorar outros itens."
        />
      ) : (
        <>
          <Media
            uri={item.image}
            label={`${item.title} · foto ilustrativa`}
            style={{ height: 280, borderRadius: 18 }}
          />
          <Copy size={28} weight="700">
            {item.title}
          </Copy>
          <Copy size={28} weight="700">
            {money(item.price)}
          </Copy>
          <Copy tone="muted">
            {item.city} · {item.status}
          </Copy>
          <Card>
            <Copy weight="600">{item.seller}</Copy>
            <Copy tone="muted">
              {item.year
                ? `${item.year} · ${item.mileage.toLocaleString('pt-BR')} km`
                : 'Peça ou acessório de demonstração'}
            </Copy>
          </Card>
          <DemoNotice />
          <Button
            title={state.favorites.includes(id) ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            variant="secondary"
            icon="heart-outline"
            onPress={() => dispatch({ type: 'favorites', id })}
          />
          <Notice>
            Envio de propostas e contato com vendedores serão conectados ao backend em uma próxima
            etapa. Nenhuma oferta real é enviada nesta versão.
          </Notice>
        </>
      )}
    </Screen>
  );
}
