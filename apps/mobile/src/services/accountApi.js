// The server identifies the user; no user ID or role is accepted from a form.
export function createAccountApi(client) {
  async function userId() {
    if (!client) throw new Error('Backend não configurado.');
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('Autenticação necessária.');
    return data.user.id;
  }
  return {
    async load() {
      const id = await userId();
      const results = await Promise.all([
        client.from('profiles').select('id,display_name').eq('id', id).maybeSingle(),
        client
          .from('organization_members')
          .select('organization_id,role,organizations(id,name)')
          .eq('user_id', id),
      ]);
      for (const result of results) if (result.error) throw result.error;
      return { profile: results[0].data, memberships: results[1].data || [] };
    },
    async saveName(displayName) {
      const name = displayName.trim();
      if (!name || name.length > 100) throw new Error('Informe um nome com até 100 caracteres.');
      const id = await userId();
      const updated = await client
        .from('profiles')
        .update({ display_name: name })
        .eq('id', id)
        .select('id,display_name')
        .maybeSingle();
      if (updated.error) throw updated.error;
      if (updated.data) return updated.data;
      const created = await client
        .from('profiles')
        .insert({ id, display_name: name })
        .select('id,display_name')
        .single();
      if (created.error) throw created.error;
      return created.data;
    },
  };
}
