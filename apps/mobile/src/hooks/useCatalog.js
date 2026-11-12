import { useMemo } from 'react';
import { useDemo } from '../contexts/DemoContext';
import { filterListings } from '../utils/catalog';
export function useCatalog(query, category, favoritesOnly) {
  const { state } = useDemo();
  return useMemo(
    () =>
      filterListings(state.listings, {
        query,
        category,
        favorites: favoritesOnly ? state.favorites : null,
      }),
    [state.listings, state.favorites, query, category, favoritesOnly],
  );
}
