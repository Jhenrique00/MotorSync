import React, { useState } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Brand, Copy, IconButton } from '../components/ui';
import { FeedPost } from '../components/FeedPost';
import { useDemo } from '../contexts/DemoContext';
import { useTheme } from '../contexts/ThemeContext';
export default function HomeScreen() {
  const { state } = useDemo();
  const { colors } = useTheme();
  const router = useRouter();
  const { fontScale } = useWindowDimensions();
  const [height, setHeight] = useState(600);
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 8,
          backgroundColor: colors.surface,
        }}
      >
        <View
          style={{
            minHeight: 48,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Brand />
          <IconButton
            name="search-outline"
            label="Buscar no Explorar"
            onPress={() => router.navigate('/explore')}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{ width: 18, height: 3, borderRadius: 2, backgroundColor: colors.accentText }}
          />
          <Copy size={14} weight="700">
            Para você
          </Copy>
          <Copy size={13} tone="muted">
            / Cultura em movimento
          </Copy>
        </View>
      </View>
      <View style={{ flex: 1 }} onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>
        <FlatList
          data={state.posts}
          keyExtractor={(post) => post.id}
          renderItem={({ item }) => (
            <FeedPost post={item} height={Math.max(height, 460 * fontScale)} />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          extraData={height}
          initialNumToRender={2}
        />
      </View>
    </SafeAreaView>
  );
}
