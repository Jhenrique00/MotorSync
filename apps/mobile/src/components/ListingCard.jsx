import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDemo } from '../contexts/DemoContext';
import { Card, Copy, IconButton, Media, styles } from './ui';
import { money } from '../utils/catalog';
export function ListingCard({ item }) {
  const router = useRouter();
  const { state, dispatch } = useDemo();
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver ${item.title}`}
        onPress={() => router.push(`/listing/${item.id}`)}
      >
        <Media
          uri={item.image}
          label={`${item.title} · foto ilustrativa`}
          style={{ height: 200 }}
        />
      </Pressable>
      <View style={{ padding: 16, gap: 8 }}>
        <View style={styles.row}>
          <Copy size={18} weight="700" style={{ flex: 1 }}>
            {item.title}
          </Copy>
          <IconButton
            name={state.favorites.includes(item.id) ? 'heart' : 'heart-outline'}
            label={`Favoritar ${item.title}`}
            selected={state.favorites.includes(item.id)}
            onPress={() => dispatch({ type: 'favorites', id: item.id })}
          />
        </View>
        <Copy size={24} weight="700">
          {money(item.price)}
        </Copy>
        <Copy size={13} tone="muted">
          {item.year ? `${item.year} · ${item.mileage.toLocaleString('pt-BR')} km · ` : ''}
          {item.city}
        </Copy>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/listing/${item.id}`)}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Copy tone="accentText" weight="600">
            Ver detalhes →
          </Copy>
        </Pressable>
      </View>
    </Card>
  );
}
