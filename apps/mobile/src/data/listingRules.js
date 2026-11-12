import { attributes, fieldsFor } from './taxonomy.js';
// Product validation limits, shared by forms and search (not technical compatibility claims).
export const numericRules = {
  price: { min: 0.01, max: 999999999999.99, decimals: 2 },
  year: { min: 1900, max: () => new Date().getFullYear() + 1, decimals: 0 },
  mileage: { min: 0, max: 10000000, decimals: 0 },
  displacement: { min: 1, max: 100000, decimals: 0 },
  axles: { min: 1, max: 20, decimals: 0 },
  length: { min: 0.01, max: 500, decimals: 2 },
  hours: { min: 0, max: 1000000, decimals: 0 },
  quantity: { min: 1, max: 1000000, decimals: 0 },
};
export function validateAttribute(key, input) {
  const raw = String(input ?? '').trim();
  const value = numericRules[key] ? raw.replace(',', '.') : raw;
  if (Array.from(value).length > 300)
    throw new Error('Uma característica ultrapassa 300 caracteres.');
  if (!value) return '';
  const rule = numericRules[key];
  if (rule) {
    const max = typeof rule.max === 'function' ? rule.max() : rule.max;
    const regex = rule.decimals ? new RegExp(`^\\d+(\\.\\d{1,${rule.decimals}})?$`) : /^\d+$/;
    if (!regex.test(value) || Number(value) < rule.min || Number(value) > max)
      throw new Error(
        `${attributes[key]?.label || 'Preço'}: informe ${rule.decimals ? 'um valor' : 'um inteiro'} entre ${rule.min} e ${max}.`,
      );
  }
  if (attributes[key]?.options && !attributes[key].options.includes(value))
    throw new Error(`${attributes[key].label}: opção inválida.`);
  return value;
}
export function validateFilters(category, subcategory, filters) {
  const allowed = new Set([
    'price',
    'location',
    ...(category === 'vehicles' && !subcategory ? [] : fieldsFor(category, subcategory)),
  ]);
  for (const [key, value] of Object.entries(filters)) {
    if (value === '' || value === undefined) continue;
    const [field, bound, extra] = key.split(':');
    if (
      !allowed.has(field) ||
      extra !== undefined ||
      (bound && (!['min', 'max'].includes(bound) || !numericRules[field]))
    )
      throw new Error('Filtro incompatível com a categoria.');
    validateAttribute(field, value);
  }
  for (const field of allowed) {
    const min = filters[`${field}:min`],
      max = filters[`${field}:max`];
    if (
      min !== undefined &&
      min !== '' &&
      max !== undefined &&
      max !== '' &&
      Number(String(min).replace(',', '.')) > Number(String(max).replace(',', '.'))
    )
      throw new Error('O mínimo não pode ser maior que o máximo.');
  }
}
export const photoPathPattern = /^(user|org)\/[0-9a-f-]{36}\/[0-9a-z-]+\.(jpg|png|webp)$/;
export const photoPrefix = (userId, organizationId) =>
  organizationId ? `org/${organizationId}/` : `user/${userId}/`;
