const group = (id, title, children) => ({
  id,
  title,
  children: children.map(([id, title]) => ({ id, title })),
});
export const taxonomy = [
  group('vehicles', 'Veículos', [
    ['cars', 'Carros'],
    ['motorcycles', 'Motos'],
    ['trucks', 'Caminhões'],
    ['buses', 'Ônibus'],
    ['vans', 'Vans e utilitários'],
    ['boats', 'Embarcações'],
    ['motorhomes', 'Motorhomes'],
    ['other-vehicles', 'Outros veículos motorizados'],
  ]),
  group('parts', 'Peças', [
    ['engine', 'Motor e componentes'],
    ['transmission', 'Transmissão'],
    ['suspension', 'Suspensão'],
    ['brakes', 'Freios'],
    ['electrical', 'Sistema elétrico'],
    ['lighting', 'Iluminação'],
    ['cooling', 'Arrefecimento'],
    ['body', 'Carroceria'],
    ['other-parts', 'Outras peças'],
  ]),
  group('accessories', 'Acessórios', [
    ['wheels', 'Rodas e pneus'],
    ['audio', 'Som e multimídia'],
    ['interior', 'Acessórios internos'],
    ['exterior', 'Acessórios externos'],
    ['protection', 'Capacetes e proteção'],
    ['tools', 'Ferramentas e equipamentos'],
    ['care', 'Estética e cuidados'],
    ['other-accessories', 'Outros acessórios'],
  ]),
];
export const attributes = {
  brand: { label: 'Marca / fabricante' },
  model: { label: 'Modelo' },
  version: { label: 'Versão' },
  year: { label: 'Ano', numeric: true, range: true },
  mileage: { label: 'Quilometragem', numeric: true, range: true },
  fuel: {
    label: 'Combustível',
    options: ['Flex', 'Gasolina', 'Diesel', 'Etanol', 'Elétrico', 'Híbrido', 'Outro'],
  },
  transmission: {
    label: 'Câmbio',
    options: ['Manual', 'Automático', 'Automatizado', 'CVT', 'Outro'],
  },
  condition: { label: 'Condição', options: ['Novo', 'Usado', 'Recondicionado'] },
  displacement: { label: 'Cilindrada (cc)', numeric: true, range: true },
  body: { label: 'Carroceria' },
  axles: { label: 'Número de eixos', numeric: true },
  traction: { label: 'Tração' },
  length: { label: 'Comprimento (m)', numeric: true, range: true },
  engine: { label: 'Motorização' },
  hours: { label: 'Horas de motor', numeric: true, range: true },
  reference: { label: 'Código de referência' },
  compatibility: { label: 'Compatibilidade informada pelo vendedor' },
  specification: { label: 'Dimensões / especificações' },
  quantity: { label: 'Quantidade', numeric: true },
};
export function fieldsFor(category, subcategory) {
  if (category === 'parts') return ['brand', 'reference', 'condition', 'compatibility', 'quantity'];
  if (category === 'accessories')
    return ['brand', 'specification', 'compatibility', 'condition', 'quantity'];
  if (category !== 'vehicles') return [];
  if (subcategory === 'boats')
    return ['brand', 'model', 'year', 'length', 'engine', 'hours', 'condition'];
  if (subcategory === 'motorcycles')
    return ['brand', 'model', 'year', 'displacement', 'mileage', 'condition'];
  if (subcategory === 'trucks')
    return ['brand', 'model', 'year', 'mileage', 'body', 'axles', 'traction', 'condition'];
  return ['brand', 'model', 'version', 'year', 'mileage', 'fuel', 'transmission', 'condition'];
}
export function categoryPath(category, subcategory) {
  const c = taxonomy.find((x) => x.id === category);
  return [c?.title, c?.children.find((x) => x.id === subcategory)?.title]
    .filter(Boolean)
    .join(' › ');
}
