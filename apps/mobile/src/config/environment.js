export function validateEnvironment(url, key) {
  if (!url && !key) return { configured: false, error: '' };
  if (!url || !key)
    return { configured: false, error: 'Preencha a URL e a chave publicável do Supabase no .env.' };
  if (!/^https:\/\/[^\s/]+\/?$/.test(url))
    return {
      configured: false,
      error: 'Use a URL HTTPS do projeto Supabase, sem caminhos adicionais.',
    };
  if (!key.startsWith('sb_publishable_'))
    return {
      configured: false,
      error:
        'Use somente uma chave sb_publishable_. Chaves administrativas não podem estar no app.',
    };
  return { configured: true, error: '' };
}
export const environment = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  key: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
};
export const backendStatus = validateEnvironment(environment.url, environment.key);
