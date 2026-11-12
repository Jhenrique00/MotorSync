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
export function demoReducer(state, action) {
  if (action.type === 'reset') return createDemoState();
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
