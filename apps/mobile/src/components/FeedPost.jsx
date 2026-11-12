import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Copy, IconButton, Media } from './ui';
import { useTheme } from '../contexts/ThemeContext';
import { useDemo } from '../contexts/DemoContext';
export function FeedPost({ post, height }) {
  const { colors } = useTheme();
  const { state, dispatch } = useDemo();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const liked = state.liked.includes(post.id),
    saved = state.saved.includes(post.id),
    following = state.following.includes(post.author);
  return (
    <View style={{ height: Math.max(height, 460), backgroundColor: colors.hero }}>
      <Media
        uri={post.image}
        label={`${post.title} · fotografia ilustrativa`}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        pointerEvents="none"
        colors={colors.mediaGradient}
        locations={[0, 0.35, 0.75, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View
        style={{
          position: 'absolute',
          top: 16,
          left: 20,
          backgroundColor: colors.mediaControl,
          padding: 8,
          borderRadius: 20,
        }}
      >
        <Copy size={12} tone="onMedia">
          FOTO · {post.tag.toUpperCase()}
        </Copy>
      </View>
      <View style={{ position: 'absolute', bottom: 16, left: 20, right: 76, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Copy weight="700" tone="onMedia">
            {post.author}
          </Copy>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: following }}
            aria-pressed={following}
            onPress={() => dispatch({ type: 'following', id: post.author })}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Copy size={13} weight="700" tone="mediaAccent">
              {following ? 'Seguindo' : 'Seguir'}
            </Copy>
          </Pressable>
        </View>
        <Copy size={24} weight="700" tone="onMedia">
          {post.title}
        </Copy>
        {expanded ? (
          <ScrollView style={{ maxHeight: 100 }} nestedScrollEnabled>
            <Copy size={14} tone="mediaMuted">
              {post.text}
            </Copy>
          </ScrollView>
        ) : (
          <Copy size={14} tone="mediaMuted" numberOfLines={2}>
            {post.text}
          </Copy>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded(!expanded)}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Copy size={13} weight="600" tone="onMedia">
            {expanded ? 'Ver menos' : 'Ver mais'}
          </Copy>
        </Pressable>
        {post.listingId && (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/listing/${post.listingId}`)}
            style={{
              padding: 12,
              minHeight: 48,
              borderWidth: 1,
              borderColor: colors.mediaMuted,
              backgroundColor: colors.mediaControl,
              borderRadius: 12,
              alignSelf: 'flex-start',
            }}
          >
            <Copy size={14} weight="700" tone="onMedia">
              Ver anúncio →
            </Copy>
          </Pressable>
        )}
      </View>
      <View style={{ position: 'absolute', bottom: 28, right: 10, alignItems: 'center', gap: 12 }}>
        <View style={{ alignItems: 'center' }}>
          <IconButton
            name={liked ? 'heart' : 'heart-outline'}
            label={`Curtir ${post.title}`}
            color={liked ? colors.mediaAccent : colors.onMedia}
            selected={liked}
            onPress={() => dispatch({ type: 'liked', id: post.id })}
          />
          <Copy size={12} tone="onMedia">
            {post.likes + (liked ? 1 : 0)}
          </Copy>
        </View>
        <View style={{ alignItems: 'center' }}>
          <IconButton
            name="chatbubble-outline"
            label={`Comentários de ${post.title}`}
            color={colors.onMedia}
            onPress={() => router.push(`/comments/${post.id}`)}
          />
          <Copy size={12} tone="onMedia">
            {post.comments.length}
          </Copy>
        </View>
        <IconButton
          name={saved ? 'bookmark' : 'bookmark-outline'}
          label={`Salvar ${post.title}`}
          color={saved ? colors.mediaAccent : colors.onMedia}
          selected={saved}
          onPress={() => dispatch({ type: 'saved', id: post.id })}
        />
      </View>
    </View>
  );
}
