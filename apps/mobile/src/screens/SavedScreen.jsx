import React from 'react';
import { useRouter } from 'expo-router';
import { useDemo } from '../contexts/DemoContext';
import { Screen, Header, Section, EmptyState, RowLink, DemoNotice } from '../components/ui';
import { ListingCard } from '../components/ListingCard';
export default function SavedScreen() {
  const { state } = useDemo();
  const router = useRouter();
  const listings = state.listings.filter((x) => state.favorites.includes(x.id));
  const posts = state.posts.filter((x) => state.saved.includes(x.id));
  return (
    <Screen>
      <Header back title="Sua coleção" />

      <Section title="Anúncios favoritos">
        {listings.length ? (
          listings.map((item) => <ListingCard key={item.id} item={item} />)
        ) : (
          <EmptyState
            title="Nenhum favorito"
            description="Toque no coração de um anúncio para guardar aqui."
          />
        )}
      </Section>
      <Section title="Publicações salvas">
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
