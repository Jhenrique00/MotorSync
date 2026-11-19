// Public feed identity: show the recorded name, never expose a private email.
// An advertiser's name is not available in the public listings schema yet;
// use a consistent, honest account code rather than impersonating MotorSync.
export function accountCode(id) {
  const code = String(id || '')
    .replace(/[^a-f\d]/gi, '')
    .slice(0, 8)
    .toUpperCase();
  return code ? `#${code}` : '';
}

export function socialAuthorName(name, userId) {
  const value = String(name || '')
    .trim()
    .slice(0, 80);
  if (value && value.toLocaleLowerCase('pt-BR') !== 'motorista') return value;
  const code = accountCode(userId);
  return code ? `Motorista ${code}` : 'Autor não identificado';
}

export function postAttribution(post) {
  if (post?.source === 'explore') {
    const listing = post.listing || {};
    const business = Boolean(listing.organization_id);
    const code = accountCode(business ? listing.organization_id : listing.owner_user_id);
    return {
      label: 'ANUNCIADO POR',
      name: `${business ? 'Empresa' : 'Anunciante'}${code ? ` ${code}` : ' não identificado'}`,
      detail: business ? 'Anúncio empresarial · Explorar' : 'Anúncio pessoal · Explorar',
      initials: business ? 'EM' : 'AN',
    };
  }
  return {
    label: 'PUBLICADO POR',
    name: post?.isRemote
      ? socialAuthorName(post.displayName || post.author, post.userId)
      : String(post?.displayName || post?.author || 'Autor não identificado'),
    detail: post?.isRemote
      ? 'Comunidade MotorSync'
      : post?.isLocal
        ? 'Prévia local'
        : 'Publicação demonstrativa',
    initials: post?.initials || 'MS',
  };
}

export function postDateLabel(value) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
