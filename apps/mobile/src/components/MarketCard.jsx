import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Copy, Icon, IconButton, styles } from './ui';
import { ListingPhoto } from './ListingPhoto';
import { moneyWithCents } from '../utils/catalog';
import { useDemo } from '../contexts/DemoContext';
import { useTheme } from '../contexts/ThemeContext';
import { categoryPath } from '../data/taxonomy';
export function MarketCard({ item, editable = false }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { state, dispatch } = useDemo();
  const saved = state.favorites.includes(item.id);
  const open = () => router.push(`/ad/${item.id}${editable ? '?edit=1' : ''}`);
  const specs = [
    item.attributes?.year,
    item.attributes?.mileage ? `${Number(item.attributes.mileage).toLocaleString('pt-BR')} km` : '',
    item.attributes?.fuel,
  ].filter(Boolean);
  return (
    <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Foto de ${item.title}`}
          onPress={open}
        >
          <ListingPhoto
            path={item.photo_paths?.[0]}
            label={item.title}
            style={{ aspectRatio: 1.65 }}
          />
        </Pressable>
        <IconButton
          name={saved ? 'heart' : 'heart-outline'}
          label={`Favoritar ${item.title}`}
          selected={saved}
          style={{
            position: 'absolute',
            right: 12,
            top: 12,
            backgroundColor: colors.surface,
            borderRadius: 24,
          }}
          onPress={() => dispatch({ type: 'favorites', id: item.id })}
        />
      </View>
      <View style={{ padding: 16, gap: 8 }}>
        <Copy size={13} tone="accentText" weight="600">
          {categoryPath(item.category, item.subcategory)}
        </Copy>
        <Copy size={18} weight="700">
          {item.title}
        </Copy>
        {!!specs.length && (
          <Copy tone="muted" size={14}>
            {specs.join(' · ')}
          </Copy>
        )}
        <Copy size={26} weight="700" style={{ letterSpacing: -0.6 }}>
          {moneyWithCents(item.price)}
        </Copy>
        <View
          style={[styles.row, { paddingTop: 8, borderTopWidth: 1, borderColor: colors.border }]}
        >
          <View style={{ flexDirection: 'row', gap: 6, flex: 1, alignItems: 'center' }}>
            <Icon name="location-outline" size={16} color={colors.muted} />
            <Copy tone="muted" size={13} style={{ flex: 1 }}>
              {item.location}
            </Copy>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={editable ? 'Editar anúncio' : `Ver ${item.title}`}
            onPress={open}
            style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 4 }}
          >
            <Copy tone="accentText" size={14} weight="700">
              {editable ? 'Editar anúncio' : 'Ver anúncio'} →
            </Copy>
          </Pressable>
        </View>
        {editable && (
          <Copy size={13} tone="muted">
            {
              { draft: 'Rascunho', published: 'Publicado', archived: 'Arquivado' }[
                item.publication_status
              ]
            }
          </Copy>
        )}
      </View>
    </Card>
  );
}
