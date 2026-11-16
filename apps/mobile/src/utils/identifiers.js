// Shared identifier validation for public, commercial and demo records.
// UI validation improves feedback; authorization still belongs in Supabase RLS.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value) => typeof value === 'string' && UUID_PATTERN.test(value);
