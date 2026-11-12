import { validateFilters, numericRules } from '../data/listingRules.js';
import { fieldsFor } from '../data/taxonomy.js';
export const PAGE_SIZE = 20;
export const missingFunction = (e) => ['PGRST202', '42883'].includes(e?.code);
const literal = (s) =>
  String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[%_*]/g, '\\$&');
export function adaptSelection(old, category, subcategory) {
  if (old.category === category && old.subcategory === subcategory) return old;
  return {
    category,
    subcategory,
    filters: Object.fromEntries(
      Object.entries(old.filters).filter(([k]) => k.startsWith('price:') || k === 'location'),
    ),
  };
}
export function createExploreApi(client) {
  let advanced;
  async function capabilities() {
    if (advanced !== undefined) return advanced;
    const { error } = await client.rpc('search_listings', {
      p_options: {},
      p_offset: 0,
      p_limit: 1,
    });
    if (error && !missingFunction(error)) throw error;
    advanced = !error;
    return advanced;
  }
  const validFavorites = (ids) =>
    (ids || [])
      .filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
      .slice(0, 1000);
  function rest(options, select = '*', count = true) {
    const {
      category = '',
      subcategory = '',
      filters = {},
      query = '',
      favoritesOnly,
      favorites = [],
    } = options;
    validateFilters(category, subcategory, filters);
    let q = client
      .from('listings')
      .select(select, count ? { count: 'exact' } : undefined)
      .eq('publication_status', 'published');
    if (category) q = q.eq('category', category);
    if (subcategory) q = q.eq('subcategory', subcategory);
    if (query.trim()) {
      const term = `"%${literal(query.trim().slice(0, 150))}%"`;
      q = q.or(
        ['title', 'location', 'attributes->>brand', 'attributes->>model']
          .map((k) => `${k}.ilike.${term}`)
          .join(','),
      );
    }
    // search normalizes favorites before either REST or RPC is selected.
    if (favoritesOnly)
      q = q.in('id', favorites.length ? favorites : ['00000000-0000-0000-0000-000000000000']);
    for (const [key, value] of Object.entries(filters)) {
      if (value === '') continue;
      const [field, bound] = key.split(':');
      if (numericRules[field] && field !== 'price')
        throw new Error('Os filtros numéricos avançados aguardam a atualização do serviço.');
      const column = ['price', 'location'].includes(field) ? field : `attributes->>${field}`;
      if (bound)
        q = q[bound === 'min' ? 'gte' : 'lte'](column, Number(String(value).replace(',', '.')));
      else if (['brand', 'model', 'version', 'fuel', 'transmission', 'condition'].includes(field))
        q = q.eq(column, value);
      else q = q.ilike(column, `%${literal(value)}%`);
    }
    return q;
  }
  return {
    capabilities,
    async search(options, page = 0) {
      options = { ...options, favorites: validFavorites(options.favorites) };
      validateFilters(options.category || '', options.subcategory || '', options.filters || {});
      if (await capabilities()) {
        const { data, error } = await client.rpc('search_listings', {
          p_options: options,
          p_offset: page * PAGE_SIZE,
          p_limit: PAGE_SIZE,
        });
        if (error) throw error;
        return { ...data, advanced: true };
      }
      const column = !options.sort || options.sort === 'recent' ? 'created_at' : 'price';
      const { data, count, error } = await rest(options)
        .order(column, { ascending: options.sort === 'price-asc' })
        .order('id')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (error) throw error;
      return { rows: data, count, advanced: false };
    },
    async choices(selection, field) {
      if (
        !['brand', 'model', 'version'].includes(field) ||
        !fieldsFor(selection.category, selection.subcategory).includes(field)
      )
        return [];
      if (await capabilities()) {
        const { data, error } = await client.rpc('listing_choices', {
          p_category: selection.category,
          p_subcategory: selection.subcategory,
          p_field: field,
          p_brand: selection.filters.brand || '',
          p_model: selection.filters.model || '',
        });
        if (error) throw error;
        return data;
      }
      const filters = {};
      if (field !== 'brand' && selection.filters.brand) filters.brand = selection.filters.brand;
      if (field === 'version' && selection.filters.model) filters.model = selection.filters.model;
      const values = new Set();
      for (let start = 0; start < 1000; start += 200) {
        const { data, error } = await rest({ ...selection, filters }, 'id,attributes', false)
          .order('id')
          .range(start, start + 199);
        if (error) throw error;
        data.forEach((row) => {
          const v = row.attributes?.[field];
          if (typeof v === 'string' && v.trim()) values.add(v);
        });
        if (data.length < 200) break;
      }
      return [...values].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    },
    async recent() {
      const { data, error } = await client
        .from('listings')
        .select('*')
        .eq('publication_status', 'published')
        .order('created_at', { ascending: false })
        .order('id')
        .limit(4);
      if (error) throw error;
      return data;
    },
  };
}
