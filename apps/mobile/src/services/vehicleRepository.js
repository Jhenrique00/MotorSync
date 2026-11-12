export function validateVehicle(values) {
  const title = String(values.title ?? '').trim();
  const raw = String(values.price ?? '')
    .trim()
    .replace(',', '.');
  if (!title || title.length > 150)
    throw new Error('Informe marca e modelo com até 150 caracteres.');
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(raw) || Number(raw) <= 0 || Number(raw) > 999999999999.99)
    throw new Error('Informe um preço maior que zero, com até duas casas decimais.');
  return { title, price: Number(raw) };
}
export function createVehicleApi(client) {
  const corporate = (org) => org && org !== 'personal';
  const scoped = (q, org) =>
    corporate(org) ? q.eq('organization_id', org) : q.is('organization_id', null);
  const unwrap = async (query) => {
    const { data, error } = await query;
    if (error) throw error;
    return data;
  };
  // The additive commercial_status column may not be deployed yet.
  const fields = '*';
  return {
    list: (org) =>
      unwrap(
        scoped(client.from('vehicles').select(fields), org).order('created_at', {
          ascending: false,
        }),
      ),
    catalog: () =>
      unwrap(client.from('vehicles').select(fields).order('created_at', { ascending: false })),
    get: (id) => unwrap(client.from('vehicles').select(fields).eq('id', id).single()),
    save: async (org, values, id) => {
      const payload = validateVehicle(values);
      for (const key of ['purchase_cost', 'preparation_cost'])
        if (key in values) {
          const raw = String(values[key] ?? '')
            .trim()
            .replace(',', '.');
          if (raw && (!/^\d{1,12}(\.\d{1,2})?$/.test(raw) || Number(raw) > 999999999999.99))
            throw new Error('Custo inválido.');
          payload[key] = raw ? Number(raw) : null;
        }
      let owner = { organization_id: org };
      if (!corporate(org)) {
        const { data, error } = await client.auth.getUser();
        if (error || !data.user) throw new Error('Entre na sua conta.');
        owner = { organization_id: null, owner_user_id: data.user.id };
      }
      return unwrap(
        id
          ? client
              .from('vehicles')
              .update(payload)
              .eq('id', id)
              [corporate(org) ? 'eq' : 'is']('organization_id', corporate(org) ? org : null)
              .select(fields)
              .single()
          : client
              .from('vehicles')
              .insert({ ...payload, ...owner })
              .select(fields)
              .single(),
      );
    },
    remove: (org, id) =>
      unwrap(
        client
          .from('vehicles')
          .delete()
          .eq('id', id)
          [corporate(org) ? 'eq' : 'is']('organization_id', corporate(org) ? org : null)
          .select('id')
          .single(),
      ),
    organizations: () =>
      unwrap(
        client.from('organization_members').select('organization_id,role,organizations(name)'),
      ),
  };
}
