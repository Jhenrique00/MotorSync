import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Copy, Icon, IconButton, styles } from './ui';
import { ListingPhoto } from './ListingPhoto';
import { moneyWithCents } from '../utils/catalog';
import { useListingFavorites } from '../contexts/ListingFavoritesContext';
import { useTheme } from '../contexts/ThemeContext';
import { categoryPath } from '../data/taxonomy';
export function MarketCard({ item, editable = false }) {
  const router = useRouter();
  const { colors } = useTheme();
  const favorites = useListingFavorites();
  const [favoriteError, setFavoriteError] = useState('');
  const saved = favorites.ids.includes(item.id);
  const toggleFavorite = async () => {
    if (favorites.busyIds.has(item.id)) return;
    setFavoriteError('');
    try {
      await favorites.toggle(item.id);
    } catch (error) {
      setFavoriteError(
        error?.message === 'Entre na sua conta para salvar anúncios.'
          ? error.message
          : 'Não foi possível salvar o favorito. Tente novamente.',
      );
    }
  };
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
            style={{ aspectRatio: 1.45 }}
          />
        </Pressable>
        {!editable && (
          <IconButton
            name={saved ? 'heart' : 'heart-outline'}
            label={saved ? `Remover ${item.title} dos favoritos` : `Favoritar ${item.title}`}
            selected={saved}
            style={{
              position: 'absolute',
              right: 12,
              top: 12,
              backgroundColor: colors.surface,
              borderRadius: 24,
              minWidth: 44,
              minHeight: 44,
            }}
            onPress={toggleFavorite}
          />
        )}
      </View>
      <View style={{ padding: 16, gap: 6 }}>
        {!!favoriteError && (
          <Copy size={12} tone="danger">
            {favoriteError}
          </Copy>
        )}
        <Copy size={11} tone="accentText" weight="600" style={{ letterSpacing: 1 }}>
          {categoryPath(item.category, item.subcategory).toUpperCase()}
        </Copy>
        <Copy size={18} weight="600">
          {item.title}
        </Copy>
        {!!specs.length && (
          <Copy tone="muted" size={14}>
            {specs.join(' · ')}
          </Copy>
        )}
        <Copy size={24} weight="700" style={{ letterSpacing: -0.6, marginTop: 2 }}>
          {moneyWithCents(item.price)}
        </Copy>
        <View
          style={[
            styles.row,
            { paddingTop: 6, marginTop: 6, borderTopWidth: 0.75, borderColor: colors.border },
          ]}
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
