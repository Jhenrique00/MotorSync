import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { socialApi } from '../services/socialApi';
import { isSocialSchemaMissing } from '../services/socialRepository';

export function useSocialFeed() {
  const { session } = useAuth();
  const [state, setState] = useState({
    posts: [],
    loading: true,
    available: false,
    preview: false,
    error: '',
  });
  const [revision, setRevision] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setState((current) => ({ ...current, loading: true, error: '' }));
      (socialApi ? socialApi.list() : Promise.reject(new Error('Supabase indisponível.')))
        .then((posts) => {
          if (active)
            setState({ posts, loading: false, available: true, preview: false, error: '' });
        })
        .catch((error) => {
          const preview = isSocialSchemaMissing(error);
          if (active)
            setState({
              posts: [],
              loading: false,
              available: false,
              preview,
              error: preview
                ? 'A rede social não está disponível neste banco. Exibindo a prévia local.'
                : 'Não foi possível carregar a comunidade. Confira a conexão e tente novamente.',
            });
        });
      return () => {
        active = false;
      };
    }, [session?.user?.id, revision]),
  );
  const reload = () => setRevision((n) => n + 1);
  async function create(values) {
    if (!state.available || !socialApi)
      throw new Error('A publicação online ainda não está disponível.');
    const post = await socialApi.create(values);
    setState((current) => ({ ...current, posts: [post, ...current.posts] }));
    return post;
  }
  async function like(post) {
    const selected = await socialApi.toggleLike(post.id, post.liked);
    setState((current) => ({
      ...current,
      posts: current.posts.map((p) =>
        p.id === post.id
          ? { ...p, liked: selected, likesCount: Math.max(0, p.likesCount + (selected ? 1 : -1)) }
          : p,
      ),
    }));
  }
  async function save(post) {
    const selected = await socialApi.toggleSave(post.id, post.saved);
    setState((current) => ({
      ...current,
      posts: current.posts.map((p) => (p.id === post.id ? { ...p, saved: selected } : p)),
    }));
  }
  async function remove(post) {
    await socialApi.remove(post.id);
    setState((current) => ({ ...current, posts: current.posts.filter((p) => p.id !== post.id) }));
  }
  return { ...state, reload, create, like, save, remove };
}
