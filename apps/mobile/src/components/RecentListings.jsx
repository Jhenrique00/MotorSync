import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Copy } from './ui';
import { ListingPhoto } from './ListingPhoto';
import { useTheme } from '../contexts/ThemeContext';
import { moneyWithCents } from '../utils/catalog';
export function RecentListings({ rows }) {
  const router = useRouter();
  const { colors } = useTheme();
  if (!rows.length) return null;
  return (
    <View style={{ gap: 8 }}>
      <Copy display weight="600" size={22}>
        Acabaram de chegar
      </Copy>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
      >
        {rows.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`Recente: ${item.title}`}
            onPress={() => router.push(`/ad/${item.id}`)}
            style={{
              width: 208,
              borderRadius: 18,
              borderWidth: 0.75,
              borderColor: colors.border,
              overflow: 'hidden',
              backgroundColor: colors.surface,
            }}
          >
            <ListingPhoto path={item.photo_paths?.[0]} label={item.title} style={{ height: 110 }} />
            <View style={{ padding: 12, gap: 4 }}>
              <Copy size={14} numberOfLines={2}>
                {item.title}
              </Copy>
              <Copy size={15} weight="700">
                {moneyWithCents(item.price)}
              </Copy>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
