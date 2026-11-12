import { supabase } from './supabase';
function requireClient() {
  if (!supabase) throw new Error('Backend não configurado.');
  return supabase;
}
// These methods require the reviewed schema proposal to be applied first.
// Authorization is enforced by RLS, never by a role selected on the device.
export async function fetchMyProfile() {
  const client = requireClient();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('Autenticação necessária.');
  const { data, error } = await client
    .from('profiles')
    .select('id,display_name')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
export async function fetchMyOrganizations() {
  const { data, error } = await requireClient().from('organizations').select('id,name');
  if (error) throw error;
  return data;
}
