export const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
export const money = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value || 0);
// Persisted vehicle prices must retain the cents returned by PostgreSQL.
export const moneyWithCents = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
export function filterListings(
  listings,
  { query = '', category = 'Todos', favorites = null } = {},
) {
  const needle = normalize(query);
  return listings.filter(
    (item) =>
      item.published &&
      item.status !== 'Vendido' &&
      (category === 'Todos' || item.category === category) &&
      (!favorites || favorites.includes(item.id)) &&
      normalize(`${item.title} ${item.city} ${item.category}`).includes(needle),
  );
}
export function inventorySummary(listings) {
  const own = listings.filter(
    (item) => item.organizationId === 'org-demo' && item.kind === 'vehicle',
  );
  const active = own.filter((item) => item.status !== 'Vendido');
  return {
    available: active.filter((item) => item.status === 'Disponível').length,
    reserved: active.filter((item) => item.status === 'Reservado').length,
    cost: active.reduce((sum, item) => sum + item.acquisitionCost + item.preparationCost, 0),
    potential: active.reduce((sum, item) => sum + item.price, 0),
  };
}
