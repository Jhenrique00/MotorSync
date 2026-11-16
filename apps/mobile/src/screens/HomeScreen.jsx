import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Brand, Copy, IconButton } from '../components/ui';
import { FeedPost } from '../components/FeedPost';
import { FeedComposer } from '../components/FeedComposer';
import { FeedHighlights } from '../components/FeedHighlights';
import { useDemo } from '../contexts/DemoContext';
import { useTheme } from '../contexts/ThemeContext';
import { useExplore } from '../hooks/useExplore';
import { useSocialFeed } from '../hooks/useSocialFeed';
import { feedTypography } from '../theme/feedTypography';
import { hairline, radius } from '../theme/tokens';

const filters = [
  { id: 'all', label: 'Para você' },
  { id: 'social', label: 'Comunidade' },
  { id: 'explore', label: 'Explorar' },
];
export default function HomeScreen() {
  const { state, dispatch } = useDemo();
  const { colors } = useTheme();
  const router = useRouter();
  const { compose } = useLocalSearchParams();
  const lastComposeRequest = useRef(null);
  const listRef = useRef(null);
  const [filter, setFilter] = useState('all');
  const [featuredId, setFeaturedId] = useState(null);
  const [composeRequest, setComposeRequest] = useState(0);
  useEffect(() => {
    const request = Array.isArray(compose) ? compose[0] : compose;
    if (!request || request === lastComposeRequest.current) return;
    lastComposeRequest.current = request;
    setComposeRequest((value) => value + 1);
  }, [compose]);
  const remote = useExplore({ category: '', subcategory: '', filters: {}, sort: 'recent' }, 0);
  const social = useSocialFeed();
  // A connection error must never silently replace real community data with demo posts.
  const socialPosts = social.available ? social.posts : social.preview ? state.posts : [];
  const published = remote.rows || [];
  const feed = useMemo(() => {
    const listings = published.slice(0, 6).map((listing) => ({
      id: `explore-${listing.id}`,
      source: 'explore',
      listing,
    }));
    const posts = socialPosts.map((post) => ({ ...post, source: 'social' }));
    if (featuredId) return posts.filter((post) => post.id === featuredId);
    if (filter === 'social') return posts;
    if (filter === 'explore') return listings;
    return posts
      .flatMap((post, index) => (index < listings.length ? [post, listings[index]] : [post]))
      .concat(listings.slice(posts.length));
  }, [published, socialPosts, filter, featuredId]);
  const jumpToTop = () => listRef.current?.scrollToOffset({ offset: 0, animated: true });
  const selectFilter = (next) => {
    setFeaturedId(null);
    setFilter(next);
    jumpToTop();
  };
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View
        style={{
          paddingHorizontal: 18,
          paddingVertical: 4,
          borderBottomWidth: hairline,
          borderColor: colors.border,
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
      </View>
      <FlatList
        ref={listRef}
        style={{ width: '100%', maxWidth: 720, alignSelf: 'center' }}
        data={feed}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FeedPost
            post={item}
            onLike={social.like}
            onSave={social.save}
            onDelete={async (post) => {
              await social.remove(post);
              setFeaturedId(null);
            }}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={3}
        windowSize={5}
        ListHeaderComponent={
          <View style={{ gap: 14, paddingBottom: 16 }}>
            <FeedHighlights
              posts={socialPosts}
              listings={published}
              onCreate={() => setComposeRequest((value) => value + 1)}
              onOpenListing={(id) => router.push(`/ad/${id}`)}
              onFocusPost={(id) => {
                setFeaturedId(id);
                setFilter('social');
                jumpToTop();
              }}
            />
            <FeedComposer
              requestOpen={composeRequest}
              remoteMode={social.available}
              previewMode={social.preview}
              loading={social.loading}
              onAddPost={async ({ title, body, photo, listingId }) => {
                if (social.loading) throw new Error('Aguarde a verificação da rede social.');
                if (social.available) {
                  const post = await social.create({ title, body, photo, listingId });
                  setFilter('social');
                  setFeaturedId(post.id);
                } else if (social.preview) {
                  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
                  dispatch({
                    type: 'addPost',
                    post: {
                      id,
                      author: '@voce',
                      displayName: 'Você · prévia',
                      initials: 'VC',
                      title: title || 'Registro automotivo',
                      text: body,
                      image: photo?.uri || '',
                      tag: 'Criado neste aparelho',
                      likes: 0,
                      comments: [],
                      isLocal: true,
                    },
                  });
                  setFilter('social');
                  setFeaturedId(id);
                } else {
                  throw new Error(
                    'Comunidade indisponível. Verifique a conexão e tente novamente.',
                  );
                }
                jumpToTop();
              }}
            />
            <View style={{ gap: 9 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Copy style={feedTypography.sectionTitle}>Publicações</Copy>
                {(remote.loading || social.loading) && (
                  <ActivityIndicator color={colors.accentText} size="small" />
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {filters.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: filter === item.id && !featuredId }}
                    onPress={() => selectFilter(item.id)}
                    style={{
                      minHeight: 40,
                      borderRadius: radius.pill,
                      paddingHorizontal: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor:
                        filter === item.id && !featuredId ? colors.accentSoft : colors.surface,
                      borderWidth: filter === item.id && !featuredId ? 1 : hairline,
                      borderColor:
                        filter === item.id && !featuredId ? colors.accentText : colors.border,
                    }}
                  >
                    <Copy
                      style={feedTypography.filter}
                      tone={filter === item.id && !featuredId ? 'accentText' : 'muted'}
                    >
                      {item.label}
                    </Copy>
                  </Pressable>
                ))}
                {featuredId && (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => selectFilter('all')}
                    style={{ minHeight: 42, justifyContent: 'center', paddingHorizontal: 6 }}
                  >
                    <Copy size={13} tone="accentText" weight="700">
                      Ver todos
                    </Copy>
                  </Pressable>
                )}
              </View>
              <Copy size={12} tone="muted">
                {social.available
                  ? 'Publicações da comunidade e anúncios públicos do Explorar.'
                  : social.preview
                    ? 'Prévia local da comunidade. Anúncios do Explorar são reais.'
                    : 'A comunidade online está indisponível. Não exibiremos posts fictícios como dados reais.'}
              </Copy>
              {!!social.error && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tentar carregar a comunidade novamente"
                  onPress={social.reload}
                  style={{ minHeight: 44, justifyContent: 'center' }}
                >
                  <Copy size={12} tone="accentText">
                    {social.error} · Tentar novamente
                  </Copy>
                </Pressable>
              )}
              {remote.error && filter === 'explore' && (
                <Copy size={13} tone="muted">
                  Não foi possível carregar os anúncios. Confira a conexão no Explorar.
                </Copy>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={{ padding: 28, alignItems: 'center', gap: 8 }}>
            <Copy weight="700">
              {social.available && filter === 'social'
                ? 'Ainda não há publicações'
                : 'Nada para mostrar nesta seleção'}
            </Copy>
            <Copy tone="muted" size={13}>
              {social.available && filter === 'social'
                ? 'Seja a primeira pessoa a publicar uma novidade automotiva.'
                : 'Escolha outra aba para continuar navegando.'}
            </Copy>
          </View>
        }
      />
    </SafeAreaView>
  );
}
