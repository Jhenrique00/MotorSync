export function createAuthApi(client) {
  function credentials(email, password, registering = false) {
    if (!client) throw new Error('Conexão indisponível.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      throw new Error('Informe um e-mail válido.');
    if (!password || (registering && password.length < 8))
      throw new Error('Use pelo menos 8 caracteres na senha para cadastrar.');
    return { email: email.trim(), password };
  }
  async function result(request) {
    const { data, error } = await request;
    if (error) throw error;
    return data;
  }
  return {
    signIn(email, password) {
      const input = credentials(email, password);
      return result(client.auth.signInWithPassword(input));
    },
    signUp(email, password) {
      const input = credentials(email, password, true);
      return result(client.auth.signUp(input));
    },
    async signOut() {
      if (client) await result(client.auth.signOut({ scope: 'local' }));
    },
  };
}
