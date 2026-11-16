// Home social: API client backed by RLS. No private enterprise data is exposed here.
const BUCKET = 'social-post-images';
import { isUuid } from '../utils/identifiers.js';
import { socialAuthorName } from '../utils/postAttribution.js';
const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const POST_FIELDS =
  'id,user_id,author_name,title,body,image_path,listing_id,created_at,social_post_likes(count),social_post_comments(count)';

export function validateSocialPost(values) {
  const title = String(values?.title || '').trim();
  const body = String(values?.body || '').trim();
  const hasPhoto = Boolean(values?.photo?.uri || values?.image_path);
  if (title.length > 90) throw new Error('Use até 90 caracteres no título.');
  if (body.length > 1000) throw new Error('Use até 1.000 caracteres na legenda.');
  if (!title && !body && !hasPhoto) throw new Error('Adicione texto ou uma foto.');
  if (values?.listingId && !isUuid(values.listingId))
    throw new Error('O anúncio vinculado é inválido.');
  return { title, body, listingId: values?.listingId || null };
}

export function normalizeSocialPost(row, currentUserId, likes = [], saves = [], imageUrl) {
  const displayName = socialAuthorName(row.author_name, row.user_id);
  const initials = displayName
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word))
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toLocaleUpperCase('pt-BR');
  return {
    id: row.id,
    source: 'social',
    isRemote: true,
    author: displayName,
    displayName,
    initials: initials || 'MS',
    title: row.title || 'Publicação automotiva',
    text: row.body || '',
    image: row.image_path ? imageUrl(row.image_path) : '',
    tag: 'Comunidade',
    listingId: row.listing_id,
    userId: row.user_id,
    isMine: row.user_id === currentUserId,
    createdAt: row.created_at,
    likesCount: Number(row.social_post_likes?.[0]?.count || 0),
    commentsCount: Number(row.social_post_comments?.[0]?.count || 0),
    liked: likes.includes(row.id),
    saved: saves.includes(row.id),
  };
}

export function isSocialSchemaMissing(error) {
  return (
    ['42P01', 'PGRST205', 'PGRST204'].includes(error?.code) ||
    /could not find the table|relation .* does not exist/i.test(error?.message || '')
  );
}

export function createSocialApi(client) {
  if (!client) throw new Error('Supabase não está configurado.');
  const unwrap = async (query) => {
    const { data, error } = await query;
    if (error) throw error;
    return data;
  };
  const user = async () => {
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user) throw new Error('Entre na sua conta para interagir.');
    return data.user;
  };
  const publicImageUrl = (path) => client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const authorName = async (account) => {
    // profiles is private by design. Fetch only our own display name and store a public snapshot.
    const { data } = await client
      .from('profiles')
      .select('display_name')
      .eq('id', account.id)
      .maybeSingle();
    return socialAuthorName(
      data?.display_name || account.user_metadata?.full_name || account.user_metadata?.name,
      account.id,
    );
  };
  async function selections(userId, ids) {
    if (!userId || !ids.length) return { likes: [], saves: [] };
    const [likes, saves] = await Promise.all([
      unwrap(
        client.from('social_post_likes').select('post_id').eq('user_id', userId).in('post_id', ids),
      ),
      unwrap(
        client.from('social_post_saves').select('post_id').eq('user_id', userId).in('post_id', ids),
      ),
    ]);
    return { likes: likes.map((r) => r.post_id), saves: saves.map((r) => r.post_id) };
  }
  async function rowsToPosts(rows) {
    const { data: auth } = await client.auth.getUser();
    const uid = auth?.user?.id || null;
    const { likes, saves } = await selections(
      uid,
      rows.map((r) => r.id),
    );
    return rows.map((row) => normalizeSocialPost(row, uid, likes, saves, publicImageUrl));
  }
  return {
    async list() {
      const rows = await unwrap(
        client
          .from('social_posts')
          .select(POST_FIELDS)
          .order('created_at', { ascending: false })
          .limit(35),
      );
      return rowsToPosts(rows);
    },
    async get(id) {
      if (!isUuid(id)) throw new Error('Publicação inválida.');
      const rows = await unwrap(
        client.from('social_posts').select(POST_FIELDS).eq('id', id).limit(1),
      );
      const posts = await rowsToPosts(rows);
      return posts[0] || null;
    },
    async create(values) {
      const validated = validateSocialPost(values);
      const account = await user();
      const displayName = await authorName(account);
      let path = null;
      if (values.photo?.uri) {
        const photo = values.photo;
        const mime = photo.mimeType || 'image/jpeg';
        const ext = MIME_EXT[mime];
        if (!ext) throw new Error('Use uma imagem JPG, PNG ou WebP.');
        if (!photo.base64) throw new Error('Não foi possível ler a foto. Selecione-a novamente.');
        // Guard before decoding, then enforce the exact byte limit.
        if (photo.base64.length > 7_000_000) throw new Error('A foto deve ter até 5 MB.');
        const bytes = Uint8Array.from(atob(photo.base64), (c) => c.charCodeAt(0));
        if (bytes.length > 5_242_880) throw new Error('A foto deve ter até 5 MB.');
        path = `user/${account.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await client.storage
          .from(BUCKET)
          .upload(path, bytes.buffer, { contentType: mime, upsert: false });
        if (error) throw error;
      }
      try {
        const row = await unwrap(
          client
            .from('social_posts')
            .insert({
              user_id: account.id,
              author_name: displayName,
              title: validated.title,
              body: validated.body,
              image_path: path,
              listing_id: validated.listingId,
            })
            .select(POST_FIELDS)
            .single(),
        );
        // A new post cannot have likes or saves yet. Avoid extra requests after
        // the write: a follow-up read failing must not turn a saved post into a false error.
        return normalizeSocialPost(row, account.id, [], [], publicImageUrl);
      } catch (error) {
        // Avoid orphan images when DB validation fails.
        if (path)
          await client.storage
            .from(BUCKET)
            .remove([path])
            .catch(() => {});
        throw error;
      }
    },
    async remove(id) {
      if (!isUuid(id)) throw new Error('Publicação inválida.');
      await user();
      // A successful HTTP response with zero rows means RLS blocked deletion
      // (or the post is already gone). Never report that as a completed deletion.
      // Images are not deleted to avoid races with clients.
      const deleted = await unwrap(client.from('social_posts').delete().eq('id', id).select('id'));
      if (deleted?.length !== 1)
        throw new Error('Publicação não encontrada ou sem permissão para excluir.');
    },
    async toggleLike(id, selected) {
      if (!isUuid(id)) throw new Error('Publicação inválida.');
      const uid = (await user()).id;
      await unwrap(
        selected
          ? client.from('social_post_likes').delete().eq('post_id', id).eq('user_id', uid)
          : client.from('social_post_likes').insert({ post_id: id, user_id: uid }),
      );
      return !selected;
    },
    async toggleSave(id, selected) {
      if (!isUuid(id)) throw new Error('Publicação inválida.');
      const uid = (await user()).id;
      await unwrap(
        selected
          ? client.from('social_post_saves').delete().eq('post_id', id).eq('user_id', uid)
          : client.from('social_post_saves').insert({ post_id: id, user_id: uid }),
      );
      return !selected;
    },
    async comments(postId) {
      if (!isUuid(postId)) throw new Error('Publicação inválida.');
      return unwrap(
        client
          .from('social_post_comments')
          .select('id,post_id,user_id,author_name,body,parent_id,created_at')
          .eq('post_id', postId)
          .order('created_at', { ascending: true })
          .limit(100),
      );
    },
    async addComment(postId, text, parentId = null) {
      if (!isUuid(postId) || (parentId && !isUuid(parentId)))
        throw new Error('Publicação inválida.');
      const body = String(text || '').trim();
      if (!body || body.length > 500) throw new Error('O comentário deve ter até 500 caracteres.');
      const account = await user();
      return unwrap(
        client
          .from('social_post_comments')
          .insert({
            post_id: postId,
            user_id: account.id,
            author_name: await authorName(account),
            body,
            parent_id: parentId,
          })
          .select('id,post_id,user_id,author_name,body,parent_id,created_at')
          .single(),
      );
    },
    async myListings() {
      const uid = (await user()).id;
      const personal = await unwrap(
        client
          .from('listings')
          .select('id,title,created_at')
          .eq('owner_user_id', uid)
          .eq('publication_status', 'published')
          .order('created_at', { ascending: false })
          .limit(30),
      );
      const memberships = await unwrap(
        client.from('organization_members').select('organization_id').eq('user_id', uid),
      );
      if (!memberships.length) return personal;
      const corporate = await unwrap(
        client
          .from('listings')
          .select('id,title,created_at')
          .in(
            'organization_id',
            memberships.map((m) => m.organization_id),
          )
          .eq('publication_status', 'published')
          .order('created_at', { ascending: false })
          .limit(30),
      );
      return [...personal, ...corporate].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
    },
    async savedPosts() {
      const uid = (await user()).id;
      const saved = await unwrap(
        client
          .from('social_post_saves')
          .select('post_id')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(100),
      );
      if (!saved.length) return [];
      const rows = await unwrap(
        client
          .from('social_posts')
          .select(POST_FIELDS)
          .in(
            'id',
            saved.map((r) => r.post_id),
          ),
      );
      const byId = new Map((await rowsToPosts(rows)).map((post) => [post.id, post]));
      return saved.map((item) => byId.get(item.post_id)).filter(Boolean);
    },
  };
}
