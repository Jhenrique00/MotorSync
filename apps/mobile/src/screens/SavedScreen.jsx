import React, { useCallback, useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useDemo } from '../contexts/DemoContext';
import { useAuth } from '../contexts/AuthContext';
import { useListingFavorites } from '../contexts/ListingFavoritesContext';
import { socialApi } from '../services/socialApi';
import { Screen, Header, Section, EmptyState, RowLink, Copy, Notice } from '../components/ui';
import { ListingCard } from '../components/ListingCard';
import { MarketCard } from '../components/MarketCard';
import { useExplore } from '../hooks/useExplore';
export default function SavedScreen() {
  const { state } = useDemo();
  const favorites = useListingFavorites();
  const { session } = useAuth();
  useFocusEffect(
    useCallback(() => {
      favorites.reload();
    }, [favorites.reload]),
  );
  const [socialSaved, setSocialSaved] = useState([]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialError, setSocialError] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setSocialSaved([]);
      if (!socialApi || !session?.user?.id) return;
      let active = true;
      setSocialLoading(true);
      setSocialError(false);
      socialApi
        .savedPosts()
        .then((rows) => {
          if (active) setSocialSaved(rows);
        })
        .catch(() => {
          if (active) setSocialError(true);
        })
        .finally(() => {
          if (active) setSocialLoading(false);
        });
      return () => {
        active = false;
      };
    }, [session?.user?.id]),
  );
  const router = useRouter();
  const listings = state.listings.filter((x) => state.favorites.includes(x.id));
  const posts = state.posts.filter((x) => state.saved.includes(x.id));
  const remoteIds = favorites.ids;
  const remote = useExplore(
    {
      category: '',
      subcategory: '',
      filters: {},
      sort: 'recent',
      favoritesOnly: true,
      favorites: remoteIds,
    },
    0,
  );
  return (
    <Screen>
      <Header back title="Sua coleção" />

      <Copy tone="muted" size={13}>
        Anúncios reais e publicações sociais salvas ficam vinculados à sua conta, em coleções
        privadas. Os exemplos demonstrativos permanecem somente neste aparelho.
      </Copy>
      <Section title="Anúncios favoritos do Explorar">
        {favorites.loading ? (
          <Copy>Carregando favoritos privados…</Copy>
        ) : favorites.error ? (
          <Notice error>{favorites.error}</Notice>
        ) : remoteIds.length === 0 ? (
          <EmptyState
            title="Nenhum anúncio salvo"
            description="Favorite anúncios no Explorar ou no feed."
          />
        ) : remote.loading ? (
          <Copy>Carregando anúncios salvos…</Copy>
        ) : remote.error ? (
          <Notice error>
            Não foi possível carregar os favoritos do Explorar. Verifique sua conexão.
          </Notice>
        ) : remote.rows?.length ? (
          remote.rows.map((item) => <MarketCard key={item.id} item={item} />)
        ) : (
          <EmptyState
            title="Anúncios indisponíveis"
            description="Os anúncios podem ter sido vendidos ou arquivados."
          />
        )}
      </Section>
      <Section title="Anúncios de demonstração">
        {listings.length ? (
          listings.map((item) => <ListingCard key={item.id} item={item} />)
        ) : (
          <EmptyState
            title="Nenhum favorito"
            description="Toque no coração de um anúncio para guardar aqui."
          />
        )}
      </Section>
      <Section title="Publicações salvas na conta">
        {socialLoading ? (
          <Copy>Carregando publicações salvas…</Copy>
        ) : socialError ? (
          <Notice error>
            Não foi possível consultar as publicações salvas. O módulo social pode ainda não estar
            ativo.
          </Notice>
        ) : socialSaved.length ? (
          socialSaved.map((post) => (
            <RowLink
              key={post.id}
              title={post.title}
              subtitle={post.displayName}
              icon="bookmark-outline"
              onPress={() => router.push(`/comments/${post.id}`)}
            />
          ))
        ) : (
          <EmptyState
            title="Nenhuma publicação salva na conta"
            description="Use o marcador no feed para guardar uma publicação."
          />
        )}
      </Section>
      <Section title="Publicações de demonstração salvas neste aparelho">
        {posts.length ? (
          posts.map((post) => (
            <RowLink
              key={post.id}
              title={post.title}
              subtitle={post.author}
              icon="bookmark-outline"
              onPress={() => router.push(`/comments/${post.id}`)}
            />
          ))
        ) : (
          <EmptyState
            title="Nenhuma publicação salva"
            description="Use o marcador no feed para criar sua coleção."
          />
        )}
      </Section>
    </Screen>
  );
}
