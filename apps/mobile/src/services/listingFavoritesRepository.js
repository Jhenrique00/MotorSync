import { isUuid } from '../utils/identifiers.js';

// Favoritos são privados por usuário. O Postgres valida a posse via RLS;
// esta camada só consulta e envia mudanças confirmadas, sem cache local enganoso.
export function createListingFavoritesRepository(client) {
  function checkIds(userId, listingId) {
    if (!isUuid(userId) || (listingId !== undefined && !isUuid(listingId))) {
      throw new Error('Identificador de favorito inválido.');
    }
  }

  return {
    async list(userId) {
      checkIds(userId);
      const result = [];
      // A API REST limita o número de linhas por resposta. Paginar evita perder favoritos.
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await client
          .from('listing_favorites')
          .select('listing_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .order('listing_id', { ascending: true })
          .range(offset, offset + 499);
        if (error) throw error;
        const rows = data || [];
        result.push(...rows.map((item) => item.listing_id).filter(isUuid));
        if (rows.length < 500) break;
      }
      return result;
    },

    async set(userId, listingId, favorite) {
      checkIds(userId, listingId);
      if (favorite) {
        const { error } = await client
          .from('listing_favorites')
          .insert({ user_id: userId, listing_id: listingId });
        // Se o registro já existe, o estado desejado já está aplicado.
        if (error && error.code !== '23505') throw error;
      } else {
        const { error } = await client
          .from('listing_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('listing_id', listingId);
        if (error) throw error;
      }
      return favorite;
    },
  };
}
