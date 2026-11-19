import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Copy, Icon, Media } from './ui';
import { ListingPhoto } from './ListingPhoto';
import { useTheme } from '../contexts/ThemeContext';
import { feedTypography } from '../theme/feedTypography';
import { hairline } from '../theme/tokens';

const circle = { width: 68, height: 68, borderRadius: 34 };

export function FeedHighlights({ posts, listings, onCreate, onOpenListing, onFocusPost }) {
  const { colors } = useTheme();
  const entries = [
    ...listings.slice(0, 3).map((item) => ({
      key: `listing-${item.id}`,
      label: item.title,
      path: item.photo_paths?.[0],
      onPress: () => onOpenListing(item.id),
    })),
    ...posts.slice(0, 3).map((post) => ({
      key: `post-${post.id}`,
      label: post.displayName || post.author || 'Publicação',
      uri: post.image,
      onPress: () => onFocusPost(post.id),
    })),
  ];
  return (
    <View
      style={{
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: hairline,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Copy style={feedTypography.highlightTitle}>Destaques automotivos</Copy>
        <Copy tone="muted" size={12}>
          Explorar e comunidade
        </Copy>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'flex-start', gap: 14, paddingBottom: 4 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Criar publicação automotiva"
          onPress={onCreate}
          style={{ alignItems: 'center', gap: 6, width: 78 }}
        >
          <View
            style={{
              ...circle,
              borderWidth: 1,
              borderColor: colors.accentText,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.accentSoft,
            }}
          >
            <Icon name="add" size={30} color={colors.accentText} />
          </View>
          <Copy size={12} weight="600" numberOfLines={1}>
            Publicar
          </Copy>
        </Pressable>
        {entries.map((entry) => (
          <Pressable
            key={entry.key}
            accessibilityRole="button"
            accessibilityLabel={`Abrir destaque ${entry.label}`}
            onPress={entry.onPress}
            style={{ alignItems: 'center', gap: 6, width: 78 }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                borderWidth: 2,
                borderColor: colors.accent,
                padding: 2,
              }}
            >
              {entry.path ? (
                <ListingPhoto
                  path={entry.path}
                  label={entry.label}
                  style={{ ...circle, overflow: 'hidden' }}
                />
              ) : (
                <Media
                  uri={entry.uri}
                  label={entry.label}
                  style={{ ...circle, overflow: 'hidden' }}
                />
              )}
            </View>
            <Copy size={12} numberOfLines={1} style={{ textAlign: 'center', width: 78 }}>
              {entry.label}
            </Copy>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
