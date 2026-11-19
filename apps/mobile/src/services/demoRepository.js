import { initialPosts, listings, clients, proposals } from '../data/demo.js';
export function createDemoState() {
  return {
    posts: JSON.parse(JSON.stringify(initialPosts)),
    listings,
    clients,
    proposals,
    liked: [],
    saved: [],
    favorites: [],
    following: [],
  };
}
const toggle = (items, id) =>
  items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
// Este estado guarda apenas exemplos locais. Anúncios reais usam ListingFavoritesProvider,
// que persiste no Supabase e nunca mistura favoritos entre contas.
export function demoReducer(state, action) {
  if (action.type === 'reset') return createDemoState();
  if (
    action.type === 'addPost' &&
    action.post?.isLocal &&
    typeof action.post.id === 'string' &&
    action.post.id.startsWith('local-') &&
    !state.posts.some((post) => post.id === action.post.id) &&
    typeof action.post.title === 'string' &&
    action.post.title.length <= 90 &&
    typeof action.post.text === 'string' &&
    action.post.text.length <= 1000 &&
    (action.post.title.trim() || action.post.text.trim() || action.post.image)
  ) {
    return { ...state, posts: [action.post, ...state.posts] };
  }
  if (['liked', 'saved', 'favorites', 'following'].includes(action.type)) {
    const valid =
      action.type === 'favorites'
        ? state.listings.some((x) => x.id === action.id)
        : action.type === 'following'
          ? state.posts.some((x) => x.author === action.id)
          : state.posts.some((x) => x.id === action.id);
    return valid ? { ...state, [action.type]: toggle(state[action.type], action.id) } : state;
  }
  if (action.type === 'comment' && action.text?.trim() && action.text.trim().length <= 500) {
    return {
      ...state,
      posts: state.posts.map((post) =>
        post.id === action.id
          ? {
              ...post,
              comments: [
                ...post.comments,
                { id: action.commentId, author: '@visitante.demo', text: action.text.trim() },
              ],
            }
          : post,
      ),
    };
  }
  return state;
}
