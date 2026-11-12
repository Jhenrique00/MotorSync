import { commercialId, validateCustomer, validateProposal } from '../utils/commercial.js';
const corporate = (org) => org && org !== 'personal';
const scope = (query, org) =>
  corporate(org)
    ? query.eq('organization_id', commercialId(org))
    : query.is('organization_id', null);
export function createCommercialApi(client) {
  let schemaVersion = 1;
  async function ownership(org) {
    if (corporate(org)) return { organization_id: commercialId(org) };
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) throw new Error('Entre na sua conta.');
    return { owner_user_id: data.user.id, organization_id: null };
  }
  async function unwrap(query) {
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
  async function readRows(query) {
    const rows = [];
    // Read explicit pages so the API's default row limit never silently truncates history.
    query.order('id');
    for (let offset = 0; ; offset += 200) {
      const page = await unwrap(query.range(offset, offset + 199));
      rows.push(...page);
      if (page.length < 200) return rows;
    }
  }
  const organization = (table, org, fields = '*') => scope(client.from(table).select(fields), org);
  return {
    async ready() {
      if (!client) return false;
      const { data, error } = await client.rpc('commercial_ready');
      if (['PGRST202', '42883'].includes(error?.code)) return false;
      if (error) throw error;
      schemaVersion = data;
      return data >= 1;
    },
    async personalReady() {
      const { data, error } = await client.rpc('commercial_ready');
      if (error) throw error;
      schemaVersion = data;
      return data >= 2;
    },
    members: () =>
      unwrap(
        client.from('organization_members').select('organization_id,role,organizations(name)'),
      ),
    summary: () => unwrap(client.rpc('commercial_summary')),
    customers: (org) => readRows(organization('customers', org).order('name')),
    vehicles: (org) => readRows(organization('vehicles', org).order('title')),
    proposals: (org) =>
      readRows(
        organization(
          'proposals',
          org,
          schemaVersion >= 2
            ? '*,customers!proposals_customer_id_scope_fk(name),vehicles!proposals_vehicle_id_scope_fk(title)'
            : '*,customers(name),vehicles(title)',
        ).order('created_at', {
          ascending: false,
        }),
      ),
    sales: (org) => readRows(organization('sales', org).order('sold_at', { ascending: false })),
    async mine() {
      const { data, error } = await client.auth.getUser();
      if (error || !data.user) throw new Error('Entre na sua conta.');
      return readRows(
        client
          .from('proposals')
          .select(
            schemaVersion >= 2
              ? '*,listings!proposals_listing_id_scope_fk(title)'
              : '*,listings(title)',
          )
          .eq('buyer_user_id', data.user.id)
          .order('created_at', { ascending: false }),
      );
    },
    events: (id) =>
      readRows(
        client
          .from('proposal_events')
          .select('*')
          .eq('proposal_id', commercialId(id))
          .order('occurred_at'),
      ),
    async saveCustomer(org, values, id) {
      const payload = validateCustomer(values);
      return unwrap(
        id
          ? client
              .from('customers')
              .update(payload)
              .eq('id', commercialId(id))
              [corporate(org) ? 'eq' : 'is'](
                'organization_id',
                corporate(org) ? commercialId(org) : null,
              )
              .select('*')
              .single()
          : client
              .from('customers')
              .insert({ ...payload, ...(await ownership(org)) })
              .select('*')
              .single(),
      );
    },
    archiveCustomer: (org, id, archived) =>
      unwrap(
        client
          .from('customers')
          .update({ archived: Boolean(archived) })
          .eq('id', commercialId(id))
          [corporate(org) ? 'eq' : 'is'](
            'organization_id',
            corporate(org) ? commercialId(org) : null,
          )
          .select('id')
          .single(),
      ),
    deleteCustomer: (org, id) =>
      unwrap(
        client
          .from('customers')
          .delete()
          .eq('id', commercialId(id))
          [corporate(org) ? 'eq' : 'is'](
            'organization_id',
            corporate(org) ? commercialId(org) : null,
          )
          .select('id')
          .single(),
      ),
    createProposal(org, values) {
      const payload = validateProposal(values);
      return unwrap(
        client.rpc('commercial_create_proposal', {
          p_org: corporate(org) ? commercialId(org) : null,
          p_customer: commercialId(values.customer_id),
          p_vehicle: values.vehicle_id ? commercialId(values.vehicle_id) : null,
          p_amount: payload.amount,
          p_terms: payload.terms,
        }),
      );
    },
    updateProposal(id, values, status) {
      const payload = validateProposal(values);
      if (schemaVersion >= 2 && status === 'draft')
        return unwrap(
          client.rpc('commercial_edit_draft', {
            p_id: commercialId(id),
            p_vehicle: values.vehicle_id ? commercialId(values.vehicle_id) : null,
            p_amount: payload.amount,
            p_terms: payload.terms,
          }),
        );
      return unwrap(
        client.rpc('commercial_update_proposal', {
          p_id: commercialId(id),
          p_amount: payload.amount,
          p_terms: payload.terms,
          p_status: status,
        }),
      );
    },
    offer(listing, values) {
      const customer = validateCustomer(values),
        proposal = validateProposal(values);
      return unwrap(
        client.rpc('commercial_marketplace_offer', {
          p_listing: commercialId(listing),
          p_name: customer.name,
          p_phone: customer.phone,
          p_amount: proposal.amount,
          p_terms: proposal.terms,
        }),
      );
    },
    directSale(values) {
      const payload = validateProposal(values);
      const soldAt = new Date(values.sold_at);
      if (!Number.isFinite(soldAt.getTime()) || soldAt > new Date())
        throw new Error('Informe uma data de venda válida.');
      return unwrap(
        client.rpc('commercial_direct_sale', {
          p_vehicle: commercialId(values.vehicle_id),
          p_customer: commercialId(values.customer_id),
          p_amount: payload.amount,
          p_terms: payload.terms,
          p_sold_at: soldAt.toISOString(),
        }),
      );
    },
    completeSale: (id) =>
      unwrap(client.rpc('commercial_complete_sale', { p_proposal: commercialId(id) })),
    setVehicleState: (id, status, proposal = null) =>
      unwrap(
        client.rpc('commercial_set_vehicle_state', {
          p_vehicle: commercialId(id),
          p_status: status,
          p_proposal: proposal ? commercialId(proposal) : null,
        }),
      ),
  };
}
