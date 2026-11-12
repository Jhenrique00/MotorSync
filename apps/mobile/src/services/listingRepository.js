import { taxonomy, fieldsFor } from '../data/taxonomy.js';
import { validateVehicle } from './vehicleRepository.js';
import { validateAttribute, validateFilters, photoPathPattern } from '../data/listingRules.js';
export function validateListing(values) {
  const base = validateVehicle(values);
  const category = taxonomy.find((c) => c.id === values.category);
  if (!category?.children.some((c) => c.id === values.subcategory))
    throw new Error('Escolha a categoria e o tipo do anúncio.');
  const location = String(values.location || '').trim();
  if (!location || location.length > 150) throw new Error('Informe cidade e estado.');
  const description = String(values.description || '').trim();
  if (description.length > 4000) throw new Error('A descrição pode ter até 4.000 caracteres.');
  const attributes = {};
  const allowed = fieldsFor(values.category, values.subcategory);
  if (Object.keys(values.attributes || {}).some((k) => !allowed.includes(k)))
    throw new Error('Característica incompatível com esta categoria.');
  for (const key of fieldsFor(values.category, values.subcategory)) {
    const value = validateAttribute(key, values.attributes?.[key]);
    if (value) {
      attributes[key] = value;
    }
  }
  const photo_paths = values.photo_paths || [];
  if (
    !Array.isArray(photo_paths) ||
    photo_paths.length > 6 ||
    new Set(photo_paths).size !== photo_paths.length ||
    photo_paths.some((p) => typeof p !== 'string' || !photoPathPattern.test(p))
  )
    throw new Error('Use até 6 fotos válidas, sem repetições.');
  if (!['draft', 'published', 'archived'].includes(values.publication_status))
    throw new Error('Estado de publicação inválido.');
  return {
    ...base,
    category: values.category,
    subcategory: values.subcategory,
    location,
    description,
    attributes,
    photo_paths,
    publication_status: values.publication_status,
  };
}
export function filterListings(
  rows,
  {
    query = '',
    category = '',
    subcategory = '',
    filters = {},
    sort = 'recent',
    favoritesOnly = false,
    favorites = [],
  } = {},
) {
  try {
    validateFilters(category, subcategory, filters);
  } catch {
    return [];
  }
  const normal = (s) =>
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const result = rows.filter(
    (row) =>
      (!category || row.category === category) &&
      (!subcategory || row.subcategory === subcategory) &&
      (!favoritesOnly || favorites.includes(row.id)) &&
      normal(
        [row.title, row.location, row.attributes?.brand, row.attributes?.model].join(' '),
      ).includes(normal(query)) &&
      Object.entries(filters).every(([key, value]) => {
        if (value === '') return true;
        const [field, limit] = key.split(':');
        const actual =
          field === 'price'
            ? row.price
            : field === 'location'
              ? row.location
              : row.attributes?.[field];
        if (actual === undefined || actual === null) return false;
        if (limit)
          return limit === 'min'
            ? Number(actual) >= Number(String(value).replace(',', '.'))
            : Number(actual) <= Number(String(value).replace(',', '.'));
        if (['fuel', 'transmission', 'condition'].includes(field)) return actual === value;
        if (
          ['year', 'mileage', 'displacement', 'axles', 'length', 'hours', 'quantity'].includes(
            field,
          )
        )
          return Number(actual) === Number(String(value).replace(',', '.'));
        return normal(actual).includes(normal(value));
      }),
  );
  return result.sort(
    sort === 'price-asc'
      ? (a, b) => Number(a.price) - Number(b.price)
      : sort === 'price-desc'
        ? (a, b) => Number(b.price) - Number(a.price)
        : (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );
}
export function createListingApi(client) {
  const unwrap = async (q) => {
    const { data, error } = await q;
    if (error) throw error;
    return data;
  };
  const user = async () => {
    if (!client) throw new Error('Serviço indisponível.');
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) throw new Error('Entre na sua conta.');
    return data.user.id;
  };
  return {
    catalog: () =>
      unwrap(
        client
          .from('listings')
          .select('*')
          .eq('publication_status', 'published')
          .order('created_at', { ascending: false })
          .limit(500),
      ),
    mine: async () =>
      unwrap(
        client
          .from('listings')
          .select('*')
          .eq('owner_user_id', await user())
          .order('created_at', { ascending: false }),
      ),
    organization: async (organizationId) => {
      await user();
      return unwrap(
        client
          .from('listings')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false }),
      );
    },
    get: (id) => unwrap(client.from('listings').select('*').eq('id', id).single()),
    forVehicle: (id) =>
      unwrap(client.from('listings').select('id').eq('vehicle_id', id).maybeSingle()),
    save: async (values, id, organizationId) => {
      const uid = await user();
      const payload = validateListing(values);
      return unwrap(
        id
          ? client.from('listings').update(payload).eq('id', id).select('*').single()
          : client
              .from('listings')
              .insert({
                ...payload,
                ...(values.vehicle_id ? { vehicle_id: values.vehicle_id } : {}),
                owner_user_id: organizationId ? null : uid,
                organization_id: organizationId || null,
              })
              .select('*')
              .single(),
      );
    },
    remove: async (id) => {
      await user();
      return unwrap(client.from('listings').delete().eq('id', id).select('id').single());
    },
  };
}
